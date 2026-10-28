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

test("successful logins never count toward the failed-login limit", async () => {
  await request(app)
    .post("/register")
    .send({ name: "Grace", email: "grace@example.com", password: "right-password" });

  // More successful logins than the failed-login limit of 20
  for (let i = 0; i < 22; i++) {
    const ok = await request(app)
      .post("/login")
      .send({ email: "grace@example.com", password: "right-password" });
    assert.equal(ok.status, 200, `successful login ${i + 1}`);
  }

  // A wrong password right afterwards is a normal failure, not a block
  const bad = await request(app)
    .post("/login")
    .send({ email: "grace@example.com", password: "wrong-password" });
  assert.equal(bad.status, 401);
});

test("too many failed logins get blocked", async () => {
  const attempt = () =>
    request(app)
      .post("/login")
      .send({ email: "nobody@example.com", password: "wrong-password" });

  // 20 failed attempts are allowed (one already used above)
  for (let i = 0; i < 19; i++) {
    const res = await attempt();
    assert.equal(res.status, 401, `failed attempt ${i + 2}`);
  }

  const blocked = await attempt();
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error, /Too many login attempts/);
});