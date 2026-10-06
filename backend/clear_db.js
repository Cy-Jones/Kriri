const db = require('./src/config/database');

async function clearDB() {
  try {
    console.log("Clearing DB...");
    await db.query('DELETE FROM tasks;');
    await db.query('DELETE FROM projects;');
    console.log("Projects and tasks deleted.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

clearDB();
