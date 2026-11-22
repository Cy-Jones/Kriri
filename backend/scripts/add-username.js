require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../src/config/database');

async function migrate() {
  try {
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)');
    
    const users = await db.query('SELECT id, name, email FROM users');
    for (const u of users.rows) {
      let base = (u.email ? u.email.split('@')[0] : (u.name || 'user')).toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (u.id === 795) base = 'jones';
      if (u.id === 1024) base = 'mbarry';
      let candidate = base;
      let counter = 1;
      while (true) {
        const check = await db.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2', [candidate, u.id]);
        if (check.rows.length === 0) break;
        candidate = base + counter;
        counter++;
      }
      await db.query('UPDATE users SET username = $1 WHERE id = $2', [candidate, u.id]);
      console.log(`Set user ${u.id} (${u.name}) username to ${candidate}`);
    }

    await db.query('CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username))');
    
    const finalUsers = await db.query('SELECT id, name, email, username FROM users');
    console.log('Final users:', finalUsers.rows);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();

