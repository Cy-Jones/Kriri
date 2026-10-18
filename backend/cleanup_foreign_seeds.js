require('dotenv').config();
const db = require('./src/config/database');

async function cleanup() {
  console.log('Starting cleanup of non-smartjones07 workspaces...');

  const cyrusRes = await db.query(
    "SELECT id, clerk_user_id FROM users WHERE email = 'smartjones07@gmail.com'"
  );
  if (cyrusRes.rows.length === 0) {
    console.error('smartjones07@gmail.com user not found');
    process.exit(1);
  }
  const cyrusId = cyrusRes.rows[0].id;

  const seedUsersRes = await db.query(
    "SELECT id FROM users WHERE email IN ('alex@acme.com', 'sarah@acme.com', 'david@acme.com')"
  );
  const seedUserIds = seedUsersRes.rows.map((r) => r.id);
  const foreignMemberIds = [cyrusId, ...seedUserIds];

  // Workspaces NOT owned by smartjones07@gmail.com
  const nonCyrusWorkspacesRes = await db.query(
    'SELECT id, name, owner_id FROM workspaces WHERE owner_id != $1',
    [cyrusId]
  );
  console.log('Non-smartjones07 workspaces:', nonCyrusWorkspacesRes.rows);

  for (const ws of nonCyrusWorkspacesRes.rows) {
    const wsId = ws.id;

    // Delete notifications for non-cyrus workspaces
    const delNotif = await db.query(
      'DELETE FROM notifications WHERE workspace_id = $1',
      [wsId]
    );
    console.log(`Deleted ${delNotif.rowCount} notifications from workspace ${wsId} (${ws.name})`);

    // Delete seeded projects from this workspace (projects created during seed)
    const delProjects = await db.query(
      'DELETE FROM projects WHERE workspace_id = $1 AND id >= 93',
      [wsId]
    );
    console.log(`Deleted ${delProjects.rowCount} seeded projects from workspace ${wsId} (${ws.name})`);

    // Remove cyrus and seed bots from workspace_members
    const delMembers = await db.query(
      'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = ANY($2::int[])',
      [wsId, foreignMemberIds]
    );
    console.log(`Removed ${delMembers.rowCount} foreign members from workspace ${wsId} (${ws.name})`);
  }

  console.log('--- Verification After Cleanup ---');

  const wsMembers = await db.query(`
    SELECT wm.workspace_id, w.name as ws_name, u.email, wm.role
    FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    JOIN workspaces w ON wm.workspace_id = w.id
    ORDER BY wm.workspace_id, wm.user_id
  `);
  console.log('Remaining workspace members:');
  console.table(wsMembers.rows);

  const projectsPerWs = await db.query(`
    SELECT p.workspace_id, w.name as ws_name, COUNT(p.id) as count
    FROM projects p
    JOIN workspaces w ON p.workspace_id = w.id
    GROUP BY p.workspace_id, w.name
    ORDER BY p.workspace_id
  `);
  console.log('Remaining projects per workspace:');
  console.table(projectsPerWs.rows);

  process.exit(0);
}

cleanup().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
