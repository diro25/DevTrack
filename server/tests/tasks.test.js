const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const {
  app,
  resetDatabase,
  closeDatabase,
  sql,
  createUser,
} = require("./helpers/testApp");

before(async () => {
  await resetDatabase();
});

after(async () => {
  await closeDatabase();
});

const addTask = (user, body) =>
  request(app).post("/tasks").set(user.auth).send(body);

const listTasks = (user) => request(app).get("/tasks").set(user.auth);

describe("Creating tasks", () => {
  let user;

  before(async () => {
    user = await createUser("TaskMaker");
  });

  it("creates a task with sensible defaults", async () => {
    const res = await addTask(user, { title: "  Practice JavaScript  " });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, "Practice JavaScript");
    assert.equal(res.body.done, false);
    assert.equal(res.body.due_date, null);
    assert.equal(res.body.user_id, user.id);
  });

  it("keeps the due date as plain text, with no time zone shift", async () => {
    const res = await addTask(user, { title: "Ship it", dueDate: "2026-12-31" });

    assert.equal(res.status, 201);
    assert.equal(res.body.due_date, "2026-12-31");

    const list = await listTasks(user);
    const saved = list.body.find((t) => t.title === "Ship it");
    assert.equal(saved.due_date, "2026-12-31");
  });

  it("rejects a blank title", async () => {
    for (const body of [{ title: "  " }, {}]) {
      const res = await addTask(user, body);
      assert.equal(res.status, 400);
      assert.equal(res.body.error, "Title is required");
    }
  });

  it("rejects dates that are not real dates", async () => {
    const badValues = ["2026-02-31", "tomorrow", "31-12-2026", "2026-13-01", 20261231];

    for (const dueDate of badValues) {
      const res = await addTask(user, { title: "Bad date", dueDate });
      assert.equal(res.status, 400, `dueDate ${dueDate}`);
      assert.equal(res.body.error, "Due date is not a valid date");
    }
  });

  it("treats an empty due date as no due date", async () => {
    const res = await addTask(user, { title: "No date", dueDate: "" });

    assert.equal(res.status, 201);
    assert.equal(res.body.due_date, null);
  });
});

describe("Completing tasks", () => {
  let user;

  before(async () => {
    user = await createUser("Completer");
  });

  it("toggles done on and off, and records the finish time", async () => {
    const task = (await addTask(user, { title: "Write tests" })).body;
    const finishTime = async () => {
      const rows = await sql.query(
        "SELECT completed_at FROM tasks WHERE id = $1",
        [task.id]
      );
      return rows[0].completed_at;
    };

    const done = await request(app).put(`/tasks/${task.id}`).set(user.auth);
    assert.equal(done.status, 200);
    assert.equal(done.body.done, true);
    assert.ok(await finishTime(), "should have a finish time");

    const undone = await request(app).put(`/tasks/${task.id}`).set(user.auth);
    assert.equal(undone.body.done, false);
    assert.equal(await finishTime(), null);
  });

  it("answers 404 for a task that does not exist", async () => {
    const res = await request(app).put("/tasks/999999").set(user.auth);
    assert.equal(res.status, 404);
  });
});

describe("Editing tasks", () => {
  let user;
  const make = async (body) => (await addTask(user, body)).body;
  const patch = (id, body) =>
    request(app).patch(`/tasks/${id}`).set(user.auth).send(body);

  before(async () => {
    user = await createUser("TaskEditor");
  });

  it("changes the title and keeps the due date", async () => {
    const task = await make({ title: "Old", dueDate: "2026-12-31" });
    const res = await patch(task.id, { title: "New" });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, "New");
    assert.equal(res.body.due_date, "2026-12-31");
  });

  it("changes the due date and keeps the title", async () => {
    const task = await make({ title: "Keep title", dueDate: "2026-12-31" });
    const res = await patch(task.id, { dueDate: "2027-01-15" });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, "Keep title");
    assert.equal(res.body.due_date, "2027-01-15");
  });

  it("removes the due date when sent an empty one", async () => {
    const task = await make({ title: "Clear me", dueDate: "2026-12-31" });
    const res = await patch(task.id, { dueDate: "" });

    assert.equal(res.status, 200);
    assert.equal(res.body.due_date, null);
    assert.equal(res.body.title, "Clear me");
  });

  it("rejects an update that changes nothing", async () => {
    const task = await make({ title: "Nothing" });
    const res = await patch(task.id, {});

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Nothing to update");
  });

  it("rejects a blank title", async () => {
    const task = await make({ title: "Keep me" });
    const res = await patch(task.id, { title: "   " });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Title is required");
  });

  it("rejects a date that is not a real date", async () => {
    const task = await make({ title: "Dated" });
    const res = await patch(task.id, { dueDate: "2026-02-31" });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Due date is not a valid date");
  });

  it("answers 404 for a task that does not exist", async () => {
    const res = await patch(999999, { title: "Ghost" });
    assert.equal(res.status, 404);
  });
});

describe("Deleting tasks", () => {
  let user;

  before(async () => {
    user = await createUser("TaskDeleter");
  });

  it("removes the task", async () => {
    const task = (await addTask(user, { title: "Temporary" })).body;

    const res = await request(app).delete(`/tasks/${task.id}`).set(user.auth);
    assert.equal(res.status, 204);

    const list = await listTasks(user);
    assert.equal(list.body.length, 0);
  });

  it("rejects ids that are not numbers", async () => {
    for (const method of ["put", "patch", "delete"]) {
      const res = await request(app)
        [method]("/tasks/abc")
        .set(user.auth)
        .send({ title: "x" });

      assert.equal(res.status, 400, method);
      assert.equal(res.body.error, "Invalid id");
    }
  });
});

describe("Privacy between accounts", () => {
  it("keeps one user's tasks out of reach of another", async () => {
    const alice = await createUser("Alice");
    const bob = await createUser("Bob");
    const task = (await addTask(alice, { title: "Alice's private task" })).body;

    const bobList = await listTasks(bob);
    assert.deepEqual(bobList.body, []);

    const toggle = await request(app).put(`/tasks/${task.id}`).set(bob.auth);
    assert.equal(toggle.status, 404);

    const edit = await request(app)
      .patch(`/tasks/${task.id}`)
      .set(bob.auth)
      .send({ title: "Hijacked" });
    assert.equal(edit.status, 404);

    // Deleting answers 204 either way, but it must not remove Alice's task
    const remove = await request(app).delete(`/tasks/${task.id}`).set(bob.auth);
    assert.equal(remove.status, 204);

    const aliceList = await listTasks(alice);
    assert.equal(aliceList.body.length, 1);
    assert.equal(aliceList.body[0].title, "Alice's private task");
    assert.equal(aliceList.body[0].done, false);
  });
});