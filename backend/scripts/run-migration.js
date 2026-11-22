const fs = require("fs");
const path = require("path");
const db = require("../src/config/database");

async function runMigration() {
  const sqlFile = path.join(__dirname, "../migrations/003_ai_intelligence_engine.sql");
  const sql = fs.readFileSync(sqlFile, "utf-8");

  console.log("Applying AI Intelligence Engine Migration (003)...");
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Migration 003 applied successfully!");
    process.exit(0);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration 003 failed:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration();

