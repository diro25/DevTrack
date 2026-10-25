require("dotenv").config();
const sql = require("./db");

async function migrate() {
  // Each table gets a "position" number; existing rows keep their current order
  for (const table of ["topics", "projects", "tasks"]) {
    await sql.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS position INTEGER`);
    await sql.query(
      `UPDATE ${table} t SET position = r.rn
       FROM (
         SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id) AS rn
         FROM ${table}
       ) r
       WHERE t.id = r.id AND t.position IS NULL`
    );
    console.log(`Done: ${table}.position added and filled.`);
  }
}

migrate().catch((err) => console.error("Failed:", err.message));