require("dotenv").config();
const sql = require("./db");

sql
  .query("ALTER TABLE topics ADD COLUMN IF NOT EXISTS category TEXT")
  .then(() => console.log("Done: topics.category column added."))
  .catch((err) => console.error("Failed:", err.message));