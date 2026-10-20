require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

sql
  .query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE")
  .then(() => console.log("Done: tasks.due_date column added."))
  .catch((err) => console.error("Failed:", err.message));