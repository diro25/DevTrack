require("dotenv").config();
const sql = require("./db");
const statements = require("./schema");

// Runs only the password-reset statements from schema.js on your existing database
async function migrate() {
  for (const statement of statements.filter((s) => s.includes("password_resets"))) {
    await sql.query(statement);
  }
  console.log("Done: password_resets table is ready.");
}

migrate().catch((err) => console.error("Failed:", err.message));