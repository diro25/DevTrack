const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { app, resetDatabase, closeDatabase } = require("./helpers/testApp");

before(async () => {
  await resetDatabase();
});

after(async () => {
  await closeDatabase();
});

test("the home route answers", async () => {
  const res = await request(app).get("/");
  assert.equal(res.status, 200);
  assert.equal(res.text, "DevTrack backend is running");
});

test("private routes reject visitors without a token", async () => {
  const res = await request(app).get("/topics");
  assert.equal(res.status, 401);
  assert.equal(res.body.error, "No token provided");
});

test("registering works against the fake database", async () => {
  const res = await request(app)
    .post("/register")
    .send({ name: "Test User", email: "test@example.com", password: "secret123" });

  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.email, "test@example.com");
});