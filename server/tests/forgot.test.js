const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const {
  app,
  resetDatabase,
  closeDatabase,
  sql,
  createUser,
  mail,
  clearMail,
  sleep,
  waitFor,
  requestResetToken,
} = require("./helpers/testApp");

// This file makes 14 calls to /forgot-password; the limit is 15 per hour.

before(async () => {
  await resetDatabase();
});

after(async () => {
  await closeDatabase();
});

beforeEach(() => {
  clearMail();
});

const forgot = (email) => request(app).post("/forgot-password").send({ email });

describe("Asking for a reset link", () => {
  it("answers the same way for known and unknown emails", async () => {
    const user = await createUser("Known");

    const known = await forgot(user.email);
    const unknown = await forgot("nobody-here@example.com");

    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.deepEqual(known.body, unknown.body);
    assert.match(known.body.message, /If that email belongs to an account/);

    await waitFor(() => mail.outbox.length >= 1);
    await sleep(300);
    assert.equal(mail.outbox.length, 1, "only the real account gets an email");
    assert.equal(mail.outbox[0].to, user.email);
  });

  it("emails a one-hour link and stores only a hash of its token", async () => {
    const user = await createUser("Linker");
    const token = await requestResetToken(user.email);
    const message = mail.outbox[0];

    assert.equal(message.to, user.email);
    assert.match(message.subject, /Reset your DevTrack password/);
    assert.ok(
      message.text.includes(`https://devtrack.test/reset-password?token=${token}`)
    );
    assert.ok(message.html.includes(`token=${token}`));

    const rows = await sql.query(
      `SELECT token_hash, used_at,
              expires_at > NOW() + INTERVAL '59 minutes'
                AND expires_at < NOW() + INTERVAL '61 minutes' AS one_hour
       FROM password_resets WHERE user_id = $1`,
      [user.id]
    );

    assert.equal(rows.length, 1);
    assert.notEqual(rows[0].token_hash, token);
    assert.match(rows[0].token_hash, /^[0-9a-f]{64}$/);
    assert.equal(rows[0].used_at, null);
    assert.equal(rows[0].one_hour, true);

    // The token itself must not be anywhere in the table
    const leaked = await sql.query(
      "SELECT 1 FROM password_resets WHERE token_hash = $1",
      [token]
    );
    assert.equal(leaked.length, 0);
  });

  it("escapes the account name in the HTML email", async () => {
    await sql.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      ["<b>Eve</b>", "eve-html@example.com", "not-a-real-hash"]
    );

    await requestResetToken("eve-html@example.com");
    const html = mail.outbox[0].html;

    assert.ok(!html.includes("<b>Eve</b>"), "raw HTML must not get through");
    assert.ok(html.includes("&lt;b&gt;Eve&lt;/b&gt;"));
  });

  it("ignores capital letters and spaces around the email", async () => {
    const user = await createUser("Casey");

    await requestResetToken(`   ${user.email.toUpperCase()}   `);

    assert.equal(mail.outbox[0].to, user.email);
  });

  it("rejects a missing or invalid email", async () => {
    const bodies = [undefined, {}, { email: "   " }, { email: 123 }];

    for (const body of bodies) {
      const req = request(app).post("/forgot-password");
      const res = body === undefined ? await req : await req.send(body);

      assert.equal(res.status, 400);
      assert.equal(res.body.error, "Email is required");
    }

    await sleep(100);
    assert.equal(mail.outbox.length, 0);
  });

  it("sends at most one email every 2 minutes per account", async () => {
    const user = await createUser("Eager");

    await forgot(user.email);
    await waitFor(() => mail.outbox.length >= 1);
    await forgot(user.email); // too soon after the first one
    await sleep(300);

    assert.equal(mail.outbox.length, 1);
  });

  it("a newer link replaces the older one", async () => {
    const user = await createUser("Replacer");

    const first = await requestResetToken(user.email);

    // Pretend the first request happened 5 minutes ago, so the throttle allows another
    await sql.query(
      "UPDATE password_resets SET created_at = NOW() - INTERVAL '5 minutes' WHERE user_id = $1",
      [user.id]
    );
    const second = await requestResetToken(user.email);

    assert.notEqual(first, second);

    const rows = await sql.query(
      "SELECT COUNT(*)::int AS n FROM password_resets WHERE user_id = $1",
      [user.id]
    );
    assert.equal(rows[0].n, 1);

    const oldLink = await request(app)
      .post("/reset-password")
      .send({ token: first, password: "brand-new-password" });
    assert.equal(oldLink.status, 400);
  });

  it("keeps the same answer and removes the link if the email service is down", async () => {
    const user = await createUser("Unlucky");
    mail.shouldFail = true;

    // The server logs the failure; keep the test output clean
    const originalError = console.error;
    console.error = () => {};

    try {
      const res = await forgot(user.email);

      assert.equal(res.status, 200);
      assert.match(res.body.message, /If that email belongs to an account/);

      const cleaned = await waitFor(async () => {
        const rows = await sql.query(
          "SELECT 1 FROM password_resets WHERE user_id = $1",
          [user.id]
        );
        return mail.attempts >= 1 && rows.length === 0;
      });

      assert.ok(cleaned, "a link that was never emailed should be removed");
      await sleep(100);
    } finally {
      console.error = originalError;
    }
  });
});