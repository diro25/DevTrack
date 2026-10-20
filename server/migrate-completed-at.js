require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  await sql.query(
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ"
  );
  await sql.query(
    "ALTER TABLE topics ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ"
  );
  console.log("Done: completed_at added to tasks and topics.");
}

migrate().catch((err) => console.error("Failed:", err.message));