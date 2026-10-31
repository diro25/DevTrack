// Builds your real Express app, but wired to a fake in-memory database and a
// fake mailer. Tests using this file can never reach your real database or
// send a real email.

// These must be set BEFORE the app loads
process.env.JWT_SECRET = "test-secret-used-only-by-the-tests";
process.env.DATABASE_URL = "postgresql://nobody:nothing@127.0.0.1:1/never"; // never used
process.env.FRONTEND_URL = "https://devtrack.test";
process.env.BREVO_API_KEY = ""; // blank, so a real email could never be sent
process.env.MAIL_FROM_EMAIL = "";
process.env.NODE_ENV = "test";

const jwt = require("jsonwebtoken");
const supertest = require("supertest");
const schema = require("../../schema");
const mailer = require("../../mailer");

// ---- Fake mailer: every "sent" email lands in this list instead ----
const mail = { outbox: [], attempts: 0, shouldFail: false };

mailer.sendMail = async (message) => {
  mail.attempts += 1;
  if (mail.shouldFail) {
    throw new Error("Email service is down (fake)");
  }
  mail.outbox.push(message);
};

function clearMail() {
  mail.outbox.length = 0;
  mail.attempts = 0;
  mail.shouldFail = false;
}

// ---- Fake database: a real Postgres engine that lives only in memory ----
let dbPromise;

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { PGlite } = await import("@electric-sql/pglite");
      const db = new PGlite();
      for (const statement of schema) {
        await db.query(statement);
      }
      return db;
    })();
  }
  return dbPromise;
}

// Same shape as the real db.js: sql.query(text, params) returns an array of rows
const fakeSql = {
  async query(text, params) {
    const db = await getDb();
    const result = await db.query(text, params);
    return result.rows;
  },
};

// Make "require('./db')" inside index.js return the fake instead of the real one
const dbPath = require.resolve("../../db");
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: fakeSql,
  children: [],
  paths: [],
};

const app = require("../../index");

// Empties every table and the fake mailbox, so each test file starts clean
async function resetDatabase() {
  const db = await getDb();
  await db.query(
    "TRUNCATE users, topics, tasks, projects, password_resets RESTART IDENTITY CASCADE"
  );
  clearMail();
}

async function closeDatabase() {
  if (dbPromise) {
    const db = await dbPromise;
    await db.close();
  }
}

// Adds a user straight into the database (no slow password hashing) and
// returns a ready-made login header: .set(user.auth)
async function createUser(name = "Tester") {
  const email = `${name.toLowerCase()}-${Math.random().toString(36).slice(2, 10)}@example.com`;
  const rows = await fakeSql.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
    [name, email, "not-a-real-hash"]
  );
  const id = rows[0].id;
  const token = jwt.sign({ userId: id }, process.env.JWT_SECRET);
  return { id, email, token, auth: { Authorization: `Bearer ${token}` } };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Checks again and again until check() is true, or the time runs out
async function waitFor(check, { timeout = 4000, interval = 25 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await check()) return true;
    await sleep(interval);
  }
  return false;
}

// Asks for a reset link and returns the token found in the email
async function requestResetToken(email) {
  const before = mail.outbox.length;
  const res = await supertest(app).post("/forgot-password").send({ email });
  if (res.status !== 200) {
    throw new Error(`forgot-password answered ${res.status}`);
  }

  const arrived = await waitFor(() => mail.outbox.length > before);
  if (!arrived) throw new Error("no reset email arrived");

  const message = mail.outbox[mail.outbox.length - 1];
  const match = message.text.match(/token=([0-9a-f]{64})/);
  if (!match) throw new Error("no token found in the email");
  return match[1];
}

module.exports = {
  app,
  resetDatabase,
  closeDatabase,
  sql: fakeSql,
  createUser,
  mail,
  clearMail,
  sleep,
  waitFor,
  requestResetToken,
};