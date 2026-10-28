// Builds your real Express app, but wired to a fake in-memory database.
// Tests using this file can never reach your real database.

// These must be set BEFORE the app loads
process.env.JWT_SECRET = "test-secret-used-only-by-the-tests";
process.env.DATABASE_URL = "postgresql://nobody:nothing@127.0.0.1:1/never"; // never used
process.env.NODE_ENV = "test";

const jwt = require("jsonwebtoken");
const schema = require("../../schema");

let dbPromise;

// Starts one fresh in-memory Postgres the first time it is needed
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

// Empties every table and restarts the id numbers, so each test file starts clean
async function resetDatabase() {
  const db = await getDb();
  await db.query(
    "TRUNCATE users, topics, tasks, projects RESTART IDENTITY CASCADE"
  );
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

module.exports = {
  app,
  resetDatabase,
  closeDatabase,
  sql: fakeSql,
  createUser,
};