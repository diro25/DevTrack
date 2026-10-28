require("dotenv").config();
const { neon } = require("@neondatabase/serverless");
const statements = require("./schema");

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log("Tables created.");
}

setup().catch((err) => {
  console.error("Setup failed:", err.message);
});