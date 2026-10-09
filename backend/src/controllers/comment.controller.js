const db = require("../config/database");
const { handleError } = require("../utils/errorHandler");

exports.getTaskComments = async (req, res) => {
  const { taskId } = req.params;
  try {
    const { rows } = await db.query(
      `
      SELECT c.*, u.name as user_name, u.avatar_url 
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN tasks t ON c.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE c.task_id = $1 AND p.workspace_id = $2
      ORDER BY c.created_at ASC
    `,
      [taskId, req.workspace.id],
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { commentSchema } = require("../validators");
    const validatedData = commentSchema.parse(req.body);
    const { task_id, content } = validatedData;
    const user_id = req.user.id;

    // Verify task belongs to active workspace
    const taskRes = await db.query(
      `
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND p.workspace_id = $2
    `,
      [task_id, req.workspace.id],
    );

    if (taskRes.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Task not found in active workspace" });
    }

    const { rows } = await db.query(
      "INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *",
      [task_id, user_id, content],
    );

    // Notification Logic (Comment added)
    try {
      const taskDetailsRes = await db.query(
        `SELECT t.title, u.clerk_user_id as assignee_clerk_id, t.assignee_id 
         FROM tasks t 
         LEFT JOIN users u ON t.assignee_id = u.id 
         WHERE t.id = $1`,
        [task_id],
      );
      if (taskDetailsRes.rows.length > 0) {
        const taskInfo = taskDetailsRes.rows[0];
        // Notify Assignee if the commenter is not the assignee
        if (
          taskInfo.assignee_id &&
          taskInfo.assignee_id !== user_id &&
          taskInfo.assignee_clerk_id
        ) {
          await db.query(
            `INSERT INTO notifications 
             (workspace_id, user_id, actor_id, type, title, message, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              req.workspace.id,
              taskInfo.assignee_clerk_id,
              req.auth?.userId,
              "task_comment",
              "New Comment",
              `${req.user.name} commented on issue "${taskInfo.title}".`,
              "task",
              task_id,
            ],
          );
        }
      }
    } catch (notifErr) {
      console.error("Error creating notification for comment:", notifErr);
    }

    // Fetch user info to append to response
    const userRes = await db.query(
      "SELECT name as user_name, avatar_url FROM users WHERE id = $1",
      [user_id],
    );
    const comment = { ...rows[0], ...userRes.rows[0] };

    res.status(201).json(comment);
  } catch (error) {
    return handleError(res, error);
  }
};
