const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { app, resetDatabase, closeDatabase, sql } = require("./helpers/testApp");

// The test secret is set by testApp.js before the app loads
const SECRET = process.env.JWT_SECRET;

before(async () => {
  await resetDatabase();
});

after(async () => {
  await closeDatabase();
});

function register(user) {
  return request(app).post("/register").send(user);
}

function login(credentials) {
  return request(app).post("/login").send(credentials);
}

describe("Registration", () => {
  it("creates an account and returns a token", async () => {
    const res = await register({
      name: "Alice",
      email: "alice@example.com",
      password: "secret123",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.name, "Alice");
    assert.equal(res.body.email, "alice@example.com");
    assert.equal(res.body.password, undefined, "the password must never be sent back");

    const decoded = jwt.verify(res.body.token, SECRET);
    assert.ok(Number.isInteger(decoded.userId), "the token should hold the user's id");
  });

  it("stores only a hash of the password", async () => {
    await register({
      name: "Bob",
      email: "bob@example.com",
      password: "plain-text-password",
    });

    const rows = await sql.query("SELECT password FROM users WHERE email = $1", [
      "bob@example.com",
    ]);

    assert.equal(rows.length, 1);
    assert.notEqual(rows[0].password, "plain-text-password");
    assert.ok(rows[0].password.startsWith("$2"), "should be a bcrypt hash");
  });

  it("rejects missing fields", async () => {
    const res = await register({ name: "No Email", password: "secret123" });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "All fields are required");
  });

  it("rejects a password shorter than 6 characters", async () => {
    const res = await register({
      name: "Shorty",
      email: "shorty@example.com",
      password: "12345",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Password must be at least 6 characters");
  });

  it("rejects an email that is already registered", async () => {
    const user = { name: "Carol", email: "carol@example.com", password: "secret123" };

    const first = await register(user);
    const second = await register(user);

    assert.equal(first.status, 201);
    assert.equal(second.status, 409);
    assert.equal(second.body.error, "Email already registered");
  });

  it("cleans up the email: trims spaces and lowercases it", async () => {
    const res = await register({
      name: "Dave",
      email: "  Dave@Example.COM  ",
      password: "secret123",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.email, "dave@example.com");

    // The same address in another spelling counts as a duplicate
    const again = await register({
      name: "Dave Again",
      email: "DAVE@example.com",
      password: "secret123",
    });
    assert.equal(again.status, 409);
  });
});

describe("Login", () => {
  before(async () => {
    await register({ name: "Erin", email: "erin@example.com", password: "right-password" });
  });

  it("logs in with the right password", async () => {
    const res = await login({ email: "erin@example.com", password: "right-password" });

    assert.equal(res.status, 200);
    assert.equal(res.body.name, "Erin");
    assert.equal(res.body.email, "erin@example.com");
    assert.equal(res.body.password, undefined);
    assert.ok(res.body.token);
  });

  it("ignores capital letters in the email", async () => {
    const res = await login({ email: "ERIN@Example.com", password: "right-password" });

    assert.equal(res.status, 200);
  });

  it("rejects a wrong password", async () => {
    const res = await login({ email: "erin@example.com", password: "wrong-password" });

    assert.equal(res.status, 401);
    assert.equal(res.body.error, "Invalid email or password");
  });

  it("rejects an unknown email with the same message", async () => {
    const res = await login({ email: "ghost@example.com", password: "whatever123" });

    // The message must not reveal whether the email exists
    assert.equal(res.status, 401);
    assert.equal(res.body.error, "Invalid email or password");
  });

  it("rejects missing fields", async () => {
    const res = await login({ email: "erin@example.com" });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Email and password are required");
  });
});

describe("Tokens", () => {
  it("a login token opens private routes", async () => {
    const signup = await register({
      name: "Frank",
      email: "frank@example.com",
      password: "secret123",
    });

    const res = await request(app)
      .get("/topics")
      .set("Authorization", `Bearer ${signup.body.token}`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });

  it("rejects a made-up token", async () => {
    const res = await request(app)
      .get("/topics")
      .set("Authorization", "Bearer abc.def.ghi");

    assert.equal(res.status, 401);
    assert.equal(res.body.error, "Invalid or expired token");
  });

  it("rejects a token signed with another secret", async () => {
    const forged = jwt.sign({ userId: 1 }, "some-other-secret");

    const res = await request(app)
      .get("/topics")
      .set("Authorization", `Bearer ${forged}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.error, "Invalid or expired token");
  });

  it("rejects an expired token", async () => {
    const expired = jwt.sign(
      { userId: 1, exp: Math.floor(Date.now() / 1000) - 60 },
      SECRET
    );

    const res = await request(app)
      .get("/topics")
      .set("Authorization", `Bearer ${expired}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.error, "Invalid or expired token");
  });

  it("rejects a header without the Bearer word", async () => {
    const token = jwt.sign({ userId: 1 }, SECRET);

    const res = await request(app).get("/topics").set("Authorization", token);

    assert.equal(res.status, 401);
    assert.equal(res.body.error, "No token provided");
  });
});