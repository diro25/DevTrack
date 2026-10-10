require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const url = process.env.DATABASE_URL || "";
console.log("DATABASE_URL check:", {
  present: url.length > 0,
  length: url.length,
  startsWithPostgresql: url.startsWith("postgresql://"),
  hasQuote: /["']/.test(url),
  hasWhitespace: /\s/.test(url),
  hasAtSign: url.includes("@"),
});

const sql = neon(url);

module.exports = sql;