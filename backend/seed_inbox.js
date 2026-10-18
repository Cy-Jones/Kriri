const db = require("./src/config/database");

async function seedInbox() {
  console.log("Seeding inbox notifications for smartjones07@gmail.com...");
  const userRes = await db.query(
    "SELECT id, clerk_user_id FROM users WHERE email = 'smartjones07@gmail.com'"
  );
  if (userRes.rows.length === 0) {
    console.error("User smartjones07@gmail.com not found");
    process.exit(1);
  }
  const cyrusClerkId = userRes.rows[0].clerk_user_id;

  const wsRes = await db.query(
    "SELECT id FROM workspaces WHERE owner_id = $1 AND name = 'Software Development' LIMIT 1",
    [userRes.rows[0].id]
  );
  const targetWorkspaces = wsRes.rows.length > 0
    ? [wsRes.rows[0].id]
    : [];

  for (const wsId of targetWorkspaces) {
    // Clear existing for idempotency
    await db.query(
      "DELETE FROM notifications WHERE workspace_id = $1 AND user_id = $2",
      [wsId, cyrusClerkId]
    );

    const wsTasks = await db.query(
      "SELECT t.id, t.title, p.name as project_name FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.workspace_id = $1 LIMIT 12",
      [wsId]
    );

    const tasks = wsTasks.rows.length > 0 ? wsTasks.rows : [
      { id: null, title: "Implement core handler and API endpoints", project_name: "Core API Gateway" },
      { id: null, title: "Review security boundaries and audit events", project_name: "Security" },
      { id: null, title: "Benchmark load and latency thresholds", project_name: "Infra" }
    ];

    const notifications = [
      {
        actor: "user_seed_alex",
        type: "assignment",
        title: "Alex Rivera assigned you to an issue",
        message: "Implement core handler and API endpoints for real-time stream",
        taskIdx: 0,
        isRead: false,
        hoursAgo: 1
      },
      {
        actor: "user_seed_sarah",
        type: "comment",
        title: "Sarah Chen commented on your issue",
        message: "Added the audit event logging format to the spec. Ready for review.",
        taskIdx: 1,
        isRead: false,
        hoursAgo: 3
      },
      {
        actor: "user_seed_david",
        type: "mention",
        title: "David Kim mentioned you in a comment",
        message: "@cyruskjones We noticed a 15% latency reduction in staging benchmark.",
        taskIdx: 2,
        isRead: false,
        hoursAgo: 5
      },
      {
        actor: "user_seed_alex",
        type: "status_change",
        title: "Alex Rivera changed status to In Progress",
        message: "Sprint milestone updated to active execution",
        taskIdx: 3,
        isRead: true,
        hoursAgo: 9
      },
      {
        actor: "user_seed_sarah",
        type: "assignment",
        title: "Sarah Chen assigned you to an issue",
        message: "Review security boundaries and OAuth2 token rotation",
        taskIdx: 4,
        isRead: true,
        hoursAgo: 14
      },
      {
        actor: "user_3KQ4o9qmvxK2ZorznZTKoNqsuTC",
        type: "comment",
        title: "Mariama Barry commented on your issue",
        message: "Updated the Figma mockups for the new workspace onboarding flow.",
        taskIdx: 5,
        isRead: true,
        hoursAgo: 22
      },
      {
        actor: "user_seed_david",
        type: "status_change",
        title: "David Kim completed an issue",
        message: "Benchmark load and latency thresholds passed QA",
        taskIdx: 6,
        isRead: true,
        hoursAgo: 30
      },
      {
        actor: "user_seed_alex",
        type: "mention",
        title: "Alex Rivera mentioned you in a comment",
        message: "@cyruskjones Checked the deployment logs, everything looks clean.",
        taskIdx: 7,
        isRead: true,
        hoursAgo: 48
      }
    ];

    for (const n of notifications) {
      const task = tasks[n.taskIdx % tasks.length];
      const taskId = task.id;
      const created = new Date(Date.now() - n.hoursAgo * 3600 * 1000);

      await db.query(
        `INSERT INTO notifications (
          workspace_id, user_id, actor_id, type, title, message, entity_type, entity_id, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          wsId,
          cyrusClerkId,
          n.actor,
          n.type,
          n.title,
          n.message,
          taskId ? "task" : null,
          taskId,
          n.isRead,
          created
        ]
      );
    }
    console.log(`Seeded ${notifications.length} notifications in workspace ${wsId}`);
  }

  console.log("Seeding inbox completed successfully!");
  process.exit(0);
}

seedInbox().catch((err) => {
  console.error("Error seeding inbox:", err);
  process.exit(1);
});
