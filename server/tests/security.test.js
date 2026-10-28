const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { app, resetDatabase, closeDatabase } = require("./helpers/testApp");

before(async () => {
  await resetDatabase();
});

after(async () => {
  await closeDatabase();
});

// Every route that needs a login. Ids are numbers so the request reaches the login check.
const privateRoutes = [
  ["get", "/topics"],
  ["post", "/topics"],
  ["put", "/topics/1"],
  ["patch", "/topics/1"],
  ["delete", "/topics/1"],
  ["get", "/projects"],
  ["post", "/projects"],
  ["put", "/projects/1"],
  ["patch", "/projects/1"],
  ["delete", "/projects/1"],
  ["get", "/tasks"],
  ["post", "/tasks"],
  ["put", "/tasks/1"],
  ["patch", "/tasks/1"],
  ["delete", "/tasks/1"],
  ["put", "/reorder/topics"],
  ["get", "/activity"],
  ["get", "/streak"],
];

describe("Every private route needs a login", () => {
  for (const [method, path] of privateRoutes) {
    it(`${method.toUpperCase()} ${path} refuses visitors without a token`, async () => {
      const res = await request(app)[method](path).send({});

      assert.equal(res.status, 401);
      assert.equal(res.body.error, "No token provided");
    });
  }
});

describe("Public routes", () => {
  it("the home route is open", async () => {
    const res = await request(app).get("/");
    assert.equal(res.status, 200);
  });

  it("registering needs no login, but does need details", async () => {
    const res = await request(app).post("/register").send({});
    assert.equal(res.status, 400);
  });

  it("logging in needs no login, but does need details", async () => {
    const res = await request(app).post("/login").send({});
    assert.equal(res.status, 400);
  });

  it("unknown addresses answer 404", async () => {
    const res = await request(app).get("/this-does-not-exist");
    assert.equal(res.status, 404);
  });
});

describe("Cross-origin rules", () => {
  it("allows the local frontend", async () => {
    const res = await request(app).get("/").set("Origin", "http://localhost:5173");
    assert.equal(res.headers["access-control-allow-origin"], "http://localhost:5173");
  });

  it("does not allow other websites", async () => {
    const res = await request(app).get("/").set("Origin", "https://evil.example");
    assert.equal(res.headers["access-control-allow-origin"], undefined);
  });
});