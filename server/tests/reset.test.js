const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const {
  app,
  resetDatabase,
  closeDatabase,
  sql,
  createUser,
  clearMail,
  requestResetToken,
} = require("./helpers/testApp");

// This file makes 5 calls to /forgot-password (limit 15 per hour)
// and 15 calls to /reset-password (limit 30 per 15 minutes).

before(async () => {
  await resetDatabase();
});

after(async () => {
  await closeDatabase();
});

beforeEach(() => {
  clearMail();
});

const BAD_LINK = "This reset link is invalid or has expired. Please ask for a new one.";

const reset = (token, password) =>
  request(app).post("/reset-password").send({ token, password });

const passwordOf = async (userId) =>
  (await sql.query("SELECT password FROM users WHERE id = $1", [userId]))[0].password;

describe("Resetting a password", () => {
  it("sets the new password and the old one stops working", async () => {
    const signup = await request(app).post("/register").send({
      name: "Old Pass",
      email: "oldpass@example.com",
      password: "old-password-1",
    });
    assert.equal(signup.status, 201);

    const token = await requestResetToken("oldpass@example.com");
    const res = await reset(token, "new-password-2");

    assert.equal(res.status, 200);
    assert.match(res.body.message, /password has been reset/i);

    const oldLogin = await request(app)
      .post("/login")
      .send({ email: "oldpass@example.com", password: "old-password-1" });
    assert.equal(oldLogin.status, 401);

    const newLogin = await request(app)
      .post("/login")
      .send({ email: "oldpass@example.com", password: "new-password-2" });
    assert.equal(newLogin.status, 200);
    assert.ok(newLogin.body.token);
  });

  it("a link works only once", async () => {
    const user = await createUser("Once");
    const token = await requestResetToken(user.email);

    const first = await reset(token, "first-new-password");
    assert.equal(first.status, 200);

    const second = await reset(token, "second-new-password");
    assert.equal(second.status, 400);
    assert.equal(second.body.error, BAD_LINK);

    const left = await sql.query(
      "SELECT COUNT(*)::int AS n FROM password_resets WHERE user_id = $1",
      [user.id]
    );
    assert.equal(left[0].n, 0, "used links should be cleaned up");
  });

  it("refuses an expired link and leaves the password alone", async () => {
    const user = await createUser("Late");
    const token = await requestResetToken(user.email);
    const before = await passwordOf(user.id);

    await sql.query(
      "UPDATE password_resets SET expires_at = NOW() - INTERVAL '1 minute' WHERE user_id = $1",
      [user.id]
    );

    const res = await reset(token, "too-late-password");

    assert.equal(res.status, 400);
    assert.equal(res.body.error, BAD_LINK);
    assert.equal(await passwordOf(user.id), before);
  });

  it("refuses tokens that are missing, malformed, or made up", async () => {
    const tokens = [
      undefined,
      null,
      123,
      "",
      "abc",
      "g".repeat(64), // right length, not hexadecimal
      "A".repeat(64), // capital letters are never issued
      "a".repeat(64), // right format, but nobody was ever given it
    ];

    for (const token of tokens) {
      const res = await reset(token, "valid-password");
      assert.equal(res.status, 400, `token ${String(token)}`);
      assert.equal(res.body.error, BAD_LINK);
    }
  });

  it("rejects a too-short password without using up the link", async () => {
    const user = await createUser("Shorty");
    const token = await requestResetToken(user.email);

    const tooShort = await reset(token, "12345");
    assert.equal(tooShort.status, 400);
    assert.equal(tooShort.body.error, "Password must be at least 6 characters");

    // The same link still works afterwards
    const good = await reset(token, "good-password");
    assert.equal(good.status, 200);
  });

  it("never touches another account", async () => {
    const owner = await createUser("Owner");
    const bystander = await createUser("Bystander");
    const bystanderBefore = await passwordOf(bystander.id);
    const token = await requestResetToken(owner.email);

    const res = await reset(token, "owner-new-password");

    assert.equal(res.status, 200);
    assert.notEqual(await passwordOf(owner.id), "not-a-real-hash");
    assert.equal(await passwordOf(bystander.id), bystanderBefore);
  });
});