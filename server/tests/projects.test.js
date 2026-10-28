const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const {
  app,
  resetDatabase,
  closeDatabase,
  createUser,
} = require("./helpers/testApp");

before(async () => {
  await resetDatabase();
});

after(async () => {
  await closeDatabase();
});

const addProject = (user, body) =>
  request(app).post("/projects").set(user.auth).send(body);

const listProjects = (user) => request(app).get("/projects").set(user.auth);

describe("Creating projects", () => {
  let user;

  before(async () => {
    user = await createUser("Builder");
  });

  it("creates a project with defaults and trims the text", async () => {
    const res = await addProject(user, {
      name: "  Portfolio  ",
      description: "  My personal site  ",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.name, "Portfolio");
    assert.equal(res.body.description, "My personal site");
    assert.equal(res.body.status, "Not Started");
    assert.equal(res.body.user_id, user.id);
    assert.equal(res.body.position, 1);
  });

  it("needs both a name and a description", async () => {
    const bodies = [
      { name: "Only a name" },
      { description: "Only a description" },
      { name: "  ", description: "Blank name" },
      { name: "Blank description", description: "  " },
      {},
    ];

    for (const body of bodies) {
      const res = await addProject(user, body);
      assert.equal(res.status, 400);
      assert.equal(res.body.error, "Name and description are required");
    }
  });
});

describe("Changing a project's status", () => {
  let user;

  before(async () => {
    user = await createUser("StatusChanger");
  });

  it("cycles Not Started → In Progress → Done → Not Started", async () => {
    const project = (
      await addProject(user, { name: "Weather App", description: "Uses an API" })
    ).body;
    const seen = [];

    for (let i = 0; i < 3; i++) {
      const res = await request(app).put(`/projects/${project.id}`).set(user.auth);
      assert.equal(res.status, 200);
      seen.push(res.body.status);
    }

    assert.deepEqual(seen, ["In Progress", "Done", "Not Started"]);
  });

  it("answers 404 for a project that does not exist", async () => {
    const res = await request(app).put("/projects/999999").set(user.auth);
    assert.equal(res.status, 404);
  });
});

describe("Editing projects", () => {
  let user;
  const patch = (id, body) =>
    request(app).patch(`/projects/${id}`).set(user.auth).send(body);

  before(async () => {
    user = await createUser("ProjectEditor");
  });

  it("changes the name and the description", async () => {
    const project = (await addProject(user, { name: "Old", description: "Old text" })).body;
    const res = await patch(project.id, { name: "New", description: "New text" });

    assert.equal(res.status, 200);
    assert.equal(res.body.name, "New");
    assert.equal(res.body.description, "New text");
  });

  it("needs both fields on every edit", async () => {
    const project = (await addProject(user, { name: "Keep", description: "Keep text" })).body;

    for (const body of [{ name: "Only name" }, { description: "Only text" }, {}]) {
      const res = await patch(project.id, body);
      assert.equal(res.status, 400);
      assert.equal(res.body.error, "Name and description are required");
    }
  });

  it("answers 404 for a project that does not exist", async () => {
    const res = await patch(999999, { name: "Ghost", description: "Nothing here" });
    assert.equal(res.status, 404);
  });
});

describe("Deleting projects", () => {
  let user;

  before(async () => {
    user = await createUser("ProjectDeleter");
  });

  it("removes the project", async () => {
    const project = (
      await addProject(user, { name: "Temporary", description: "Short lived" })
    ).body;

    const res = await request(app).delete(`/projects/${project.id}`).set(user.auth);
    assert.equal(res.status, 204);

    const list = await listProjects(user);
    assert.equal(list.body.length, 0);
  });

  it("rejects ids that are not numbers", async () => {
    for (const method of ["put", "patch", "delete"]) {
      const res = await request(app)
        [method]("/projects/abc")
        .set(user.auth)
        .send({ name: "x", description: "y" });

      assert.equal(res.status, 400, method);
      assert.equal(res.body.error, "Invalid id");
    }
  });
});

describe("Privacy between accounts", () => {
  it("keeps one user's projects out of reach of another", async () => {
    const alice = await createUser("Alice");
    const bob = await createUser("Bob");
    const project = (
      await addProject(alice, { name: "Alice's project", description: "Private" })
    ).body;

    const bobList = await listProjects(bob);
    assert.deepEqual(bobList.body, []);

    const changeStatus = await request(app).put(`/projects/${project.id}`).set(bob.auth);
    assert.equal(changeStatus.status, 404);

    const edit = await request(app)
      .patch(`/projects/${project.id}`)
      .set(bob.auth)
      .send({ name: "Hijacked", description: "Hijacked" });
    assert.equal(edit.status, 404);

    // Deleting answers 204 either way, but it must not remove Alice's project
    const remove = await request(app).delete(`/projects/${project.id}`).set(bob.auth);
    assert.equal(remove.status, 204);

    const aliceList = await listProjects(alice);
    assert.equal(aliceList.body.length, 1);
    assert.equal(aliceList.body[0].name, "Alice's project");
    assert.equal(aliceList.body[0].status, "Not Started");
  });
});