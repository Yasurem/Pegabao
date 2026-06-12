// Applies a .sql file to the database in DATABASE_URL.
// Usage: npx tsx scripts/run-sql.ts db/schema.sql
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/run-sql.ts <file.sql>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

const sql = readFileSync(file, "utf8");

pool
  .query(sql)
  .then(() => console.log(`Applied ${file}`))
  .catch((err) => {
    console.error(`Failed to apply ${file}:`, err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
