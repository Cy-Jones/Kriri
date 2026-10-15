const db = require("../src/config/database");

function getUserIdentifierCode(name) {
  if (!name || typeof name !== "string") return "USR";
  const clean = name.trim();
  if (!clean) return "USR";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((p) => p[0].toUpperCase()).slice(0, 3).join("");
  }
  return clean.slice(0, 3).toUpperCase();
}

async function migrate() {
  console.log("Running migration: 002_add_project_identifier...");
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Add identifier column if it doesn't exist
    await client.query(
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS identifier VARCHAR(50);",
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_projects_identifier ON projects(identifier);",
    );

    // 2. Fetch all projects joined with user info
    const res = await client.query(`
      SELECT p.id, p.workspace_id, p.owner_id, u.name as user_name
      FROM projects p
      LEFT JOIN users u ON u.id = p.owner_id
      ORDER BY p.workspace_id ASC, p.id ASC
    `);

    // Group projects by workspace_id and owner_id so project numbers run 1..N
    const groups = {};
    for (const p of res.rows) {
      const key = `${p.workspace_id || "none"}_${p.owner_id || "none"}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }

    let updatedCount = 0;
    for (const group of Object.values(groups)) {
      for (let i = 0; i < group.length; i++) {
        const p = group[i];
        const code = getUserIdentifierCode(p.user_name);
        const ident = `KRI-${code}-${i + 1}`;
        await client.query("UPDATE projects SET identifier = $1 WHERE id = $2", [
          ident,
          p.id,
        ]);
        updatedCount++;
      }
    }

    await client.query("COMMIT");
    console.log(`Migration complete! Successfully assigned identifiers to ${updatedCount} projects.`);

    // Display sample
    const sample = await db.query(
      "SELECT id, name, workspace_id, identifier FROM projects WHERE workspace_id = 11 ORDER BY id ASC LIMIT 5;",
    );
    console.log("Sample projects in workspace 11 (Software Development):", sample.rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
