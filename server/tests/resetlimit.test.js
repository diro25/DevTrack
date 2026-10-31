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

test("too many reset-link requests get blocked", async () => {
  const ask = () =>
    request(app).post("/forgot-password").send({ email: "nobody@example.com" });

  // 15 requests are allowed
  for (let i = 0; i < 15; i++) {
    const res = await ask();
    assert.equal(res.status, 200, `request ${i + 1}`);
  }

  const blocked = await ask();
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error, /Too many reset requests/);
});

test("too many password-reset attempts get blocked", async () => {
  const attempt = () =>
    request(app)
      .post("/reset-password")
      .send({ token: "a".repeat(64), password: "valid-password" });

  // 30 attempts are allowed (each one fails, but each is counted)
  for (let i = 0; i < 30; i++) {
    const res = await attempt();
    assert.equal(res.status, 400, `attempt ${i + 1}`);
  }

  const blocked = await attempt();
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error, /Too many attempts/);
});