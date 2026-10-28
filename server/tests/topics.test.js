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

const addTopic = (user, body) =>
  request(app).post("/topics").set(user.auth).send(body);

const listTopics = (user) => request(app).get("/topics").set(user.auth);

describe("Creating topics", () => {
  let user;

  before(async () => {
    user = await createUser("Creator");
  });

  it("starts with an empty list", async () => {
    const res = await listTopics(user);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });

  it("creates a topic with sensible defaults", async () => {
    const res = await addTopic(user, { title: "HTML" });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, "HTML");
    assert.equal(res.body.status, "Not Started");
    assert.equal(res.body.category, null);
    assert.equal(res.body.user_id, user.id);
    assert.equal(res.body.position, 1);
  });

  it("trims extra spaces around the title", async () => {
    const res = await addTopic(user, { title: "   CSS   " });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, "CSS");
  });

  it("rejects a blank or missing title", async () => {
    for (const body of [{ title: "   " }, { title: "" }, {}]) {
      const res = await addTopic(user, body);
      assert.equal(res.status, 400);
      assert.equal(res.body.error, "Title is required");
    }
  });

  it("cleans up the category: trims it and collapses extra spaces", async () => {
    const res = await addTopic(user, {
      title: "Flexbox",
      category: "  CSS    Layout ",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.category, "CSS Layout");
  });

  it("treats an empty category as no category", async () => {
    const res = await addTopic(user, { title: "Grid", category: "" });

    assert.equal(res.status, 201);
    assert.equal(res.body.category, null);
  });

  it("allows a 30-character category but rejects 31", async () => {
    const exact = await addTopic(user, { title: "Edge", category: "x".repeat(30) });
    assert.equal(exact.status, 201);

    const tooLong = await addTopic(user, { title: "Edge", category: "x".repeat(31) });
    assert.equal(tooLong.status, 400);
    assert.equal(tooLong.body.error, "Category must be 30 characters or fewer");
  });

  it("numbers new topics 1, 2, 3... in the order they were added", async () => {
    const res = await listTopics(user);
    const positions = res.body.map((t) => t.position);

    assert.ok(positions.length >= 3);
    assert.deepEqual(
      positions,
      positions.map((_, i) => i + 1)
    );
  });
});

describe("Changing a topic's status", () => {
  let user;

  before(async () => {
    user = await createUser("Cycler");
  });

  it("cycles Not Started → In Progress → Done → Not Started", async () => {
    const topic = (await addTopic(user, { title: "SQL" })).body;
    const seen = [];

    for (let i = 0; i < 3; i++) {
      const res = await request(app).put(`/topics/${topic.id}`).set(user.auth);
      assert.equal(res.status, 200);
      seen.push(res.body.status);
    }

    assert.deepEqual(seen, ["In Progress", "Done", "Not Started"]);
  });

  it("records the finish time only while the topic is Done", async () => {
    const topic = (await addTopic(user, { title: "Git" })).body;
    const finishTime = async () => {
      const rows = await sql.query(
        "SELECT completed_at FROM topics WHERE id = $1",
        [topic.id]
      );
      return rows[0].completed_at;
    };

    await request(app).put(`/topics/${topic.id}`).set(user.auth); // In Progress
    assert.equal(await finishTime(), null);

    await request(app).put(`/topics/${topic.id}`).set(user.auth); // Done
    assert.ok(await finishTime(), "should have a finish time");

    await request(app).put(`/topics/${topic.id}`).set(user.auth); // Not Started
    assert.equal(await finishTime(), null);
  });

  it("answers 404 for a topic that does not exist", async () => {
    const res = await request(app).put("/topics/999999").set(user.auth);
    assert.equal(res.status, 404);
  });
});

describe("Editing topics", () => {
  let user;
  const make = async (body) => (await addTopic(user, body)).body;
  const patch = (id, body) =>
    request(app).patch(`/topics/${id}`).set(user.auth).send(body);

  before(async () => {
    user = await createUser("Editor");
  });

  it("changes the title and keeps the category", async () => {
    const topic = await make({ title: "JS", category: "JavaScript" });
    const res = await patch(topic.id, { title: "JavaScript Basics" });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, "JavaScript Basics");
    assert.equal(res.body.category, "JavaScript");
  });

  it("changes the category and keeps the title", async () => {
    const topic = await make({ title: "Flexbox", category: "CSS" });
    const res = await patch(topic.id, { category: "Layout" });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, "Flexbox");
    assert.equal(res.body.category, "Layout");
  });

  it("removes the category when sent an empty one", async () => {
    const topic = await make({ title: "Promises", category: "JavaScript" });
    const res = await patch(topic.id, { category: "" });

    assert.equal(res.status, 200);
    assert.equal(res.body.category, null);
    assert.equal(res.body.title, "Promises");
  });

  it("rejects an update that changes nothing", async () => {
    const topic = await make({ title: "Nothing" });
    const res = await patch(topic.id, {});

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Nothing to update");
  });

  it("rejects a blank title", async () => {
    const topic = await make({ title: "Keep me" });
    const res = await patch(topic.id, { title: "   " });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Title is required");
  });

  it("rejects a category longer than 30 characters", async () => {
    const topic = await make({ title: "Long" });
    const res = await patch(topic.id, { category: "y".repeat(31) });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Category must be 30 characters or fewer");
  });

  it("answers 404 for a topic that does not exist", async () => {
    const res = await patch(999999, { title: "Ghost" });
    assert.equal(res.status, 404);
  });
});

describe("Deleting topics", () => {
  let user;

  before(async () => {
    user = await createUser("Deleter");
  });

  it("removes the topic", async () => {
    const topic = (await addTopic(user, { title: "Temporary" })).body;

    const res = await request(app).delete(`/topics/${topic.id}`).set(user.auth);
    assert.equal(res.status, 204);

    const list = await listTopics(user);
    assert.equal(list.body.length, 0);
  });

  it("rejects ids that are not numbers", async () => {
    for (const method of ["put", "patch", "delete"]) {
      const res = await request(app)
        [method]("/topics/abc")
        .set(user.auth)
        .send({ title: "x" });

      assert.equal(res.status, 400, method);
      assert.equal(res.body.error, "Invalid id");
    }
  });
});

describe("Privacy between accounts", () => {
  it("keeps one user's topics out of reach of another", async () => {
    const alice = await createUser("Alice");
    const bob = await createUser("Bob");
    const topic = (await addTopic(alice, { title: "Alice's private topic" })).body;

    const bobList = await listTopics(bob);
    assert.deepEqual(bobList.body, []);

    const changeStatus = await request(app).put(`/topics/${topic.id}`).set(bob.auth);
    assert.equal(changeStatus.status, 404);

    const rename = await request(app)
      .patch(`/topics/${topic.id}`)
      .set(bob.auth)
      .send({ title: "Hijacked" });
    assert.equal(rename.status, 404);

    // Deleting answers 204 either way, but it must not remove Alice's topic
    const remove = await request(app).delete(`/topics/${topic.id}`).set(bob.auth);
    assert.equal(remove.status, 204);

    const aliceList = await listTopics(alice);
    assert.equal(aliceList.body.length, 1);
    assert.equal(aliceList.body[0].title, "Alice's private topic");
    assert.equal(aliceList.body[0].status, "Not Started");
  });
});