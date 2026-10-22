require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const raw = neon(process.env.DATABASE_URL);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// True only for "could not reach the database" problems, never for real SQL errors
function isConnectionError(err) {
  const message = String((err && err.message) || "");
  return (
    message.includes("fetch failed") ||
    message.includes("Error connecting to database")
  );
}

const MAX_ATTEMPTS = 3;

async function query(text, params) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await raw.query(text, params);
    } catch (err) {
      if (!isConnectionError(err) || attempt === MAX_ATTEMPTS) {
        throw err;
      }
      console.warn(
        `Database connection failed, retrying (${attempt}/${MAX_ATTEMPTS - 1})...`
      );
      await sleep(400 * attempt);
    }
  }
}

module.exports = { query };