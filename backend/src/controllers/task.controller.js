const db = require("../config/database");
const { handleError } = require("../utils/errorHandler");

const { getIO } = require("../socket");
const { taskSchema } = require("../validators");

exports.getAllTasks = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 200, 1),
      1000,
    );
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const { rows } = await db.query(
      `
      SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar_url, p.slug as project_slug, p.identifier as project_identifier, p.name as project_name 
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.workspace_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [req.workspace.id, limit, offset],
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createTask = async (req, res) => {
  try {
    const validatedData = taskSchema.parse(req.body);
    const {
      project_id,
      title,
      status,
      priority,
      assignee_id,
      description,
      due_date,
      start_date,
    } = validatedData;

    // Ensure the project belongs to the active workspace
    const projRes = await db.query(
      "SELECT id FROM projects WHERE id = $1 AND workspace_id = $2",
      [project_id, req.workspace.id],
    );
    if (projRes.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Project not found in active workspace" });
    }

    const { rows } = await db.query(
      "INSERT INTO tasks (project_id, title, status, priority, assignee_id, description, due_date, start_date, reporter_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        project_id,
        title,
        status || "Todo",
        priority || "Medium",
        assignee_id,
        description,
        due_date,
        start_date,
        req.user.id,
      ],
    );
    const newTask = rows[0];

    // Notification Logic
    if (assignee_id && assignee_id !== req.user.id) {
      try {
        const assigneeRes = await db.query(
          "SELECT clerk_user_id FROM users WHERE id = $1",
          [assignee_id],
        );
        if (assigneeRes.rows.length > 0) {
          const clerkUserId = assigneeRes.rows[0].clerk_user_id;
          await db.query(
            `INSERT INTO notifications 
             (workspace_id, user_id, actor_id, type, title, message, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              req.workspace.id,
              clerkUserId,
              req.auth?.userId || req.user?.clerk_user_id,
              "task_assigned",
              "New Issue Assigned",
              `${req.user.name} assigned issue "${title}" to you.`,
              "task",
              newTask.id,
            ],
          );
        }
      } catch (notifErr) {
        console.error("Error creating notification:", notifErr);
      }
    }

    try {
      getIO().to(`workspace_${req.workspace.id}`).emit("TASK_CREATED", newTask);
    } catch (e) {
      console.error("Socket error emitting TASK_CREATED:", e);
    }

    res.status(201).json(newTask);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  try {
    const validatedData = taskSchema.parse(req.body);
    const {
      status,
      title,
      priority,
      assignee_id,
      description,
      position,
      progress,
      due_date,
    } = validatedData;

    // Check existing task for assignee changes
    let existingAssigneeId = null;
    let oldTitle = "";
    try {
      const existingRes = await db.query(
        "SELECT assignee_id, title FROM tasks WHERE id = $1",
        [id],
      );
      if (existingRes.rows.length > 0) {
        existingAssigneeId = existingRes.rows[0].assignee_id;
        oldTitle = existingRes.rows[0].title;
      }
    } catch (e) {}

    const { rows } = await db.query(
      `UPDATE tasks t 
       SET status = CASE WHEN $1::boolean THEN $2 ELSE t.status END, 
           title = CASE WHEN $3::boolean THEN $4 ELSE t.title END, 
           priority = CASE WHEN $5::boolean THEN $6 ELSE t.priority END, 
           assignee_id = CASE WHEN $7::boolean THEN $8 ELSE t.assignee_id END, 
           description = CASE WHEN $9::boolean THEN $10 ELSE t.description END,
           position = CASE WHEN $11::boolean THEN $12 ELSE t.position END,
           progress = CASE WHEN $13::boolean THEN $14 ELSE t.progress END,
           due_date = CASE WHEN $15::boolean THEN $16 ELSE t.due_date END,
           completed_at = CASE WHEN $1::boolean AND $2 = 'Done' AND status != 'Done' THEN CURRENT_TIMESTAMP WHEN $1::boolean AND $2 != 'Done' THEN NULL ELSE completed_at END
       FROM projects p
       WHERE t.id = $17 AND t.project_id = p.id AND p.workspace_id = $18 
       RETURNING t.*`,
      [
        status !== undefined,
        status || null,
        title !== undefined,
        title || null,
        priority !== undefined,
        priority || null,
        assignee_id !== undefined,
        assignee_id !== undefined ? assignee_id : null,
        description !== undefined,
        description !== undefined ? description : null,
        position !== undefined,
        position !== undefined ? position : null,
        progress !== undefined,
        progress !== undefined ? progress : null,
        due_date !== undefined,
        due_date !== undefined ? due_date : null,
        id,
        req.workspace.id,
      ],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ error: "Task not found in active workspace" });

    const updatedTask = rows[0];

    // Notification Logic (Assignment change)
    if (
      assignee_id !== undefined &&
      assignee_id !== existingAssigneeId &&
      assignee_id !== req.user.id
    ) {
      if (assignee_id !== null) {
        try {
          const assigneeRes = await db.query(
            "SELECT clerk_user_id FROM users WHERE id = $1",
            [assignee_id],
          );
          if (assigneeRes.rows.length > 0) {
            const clerkUserId = assigneeRes.rows[0].clerk_user_id;
            await db.query(
              `INSERT INTO notifications 
               (workspace_id, user_id, actor_id, type, title, message, entity_type, entity_id) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                req.workspace.id,
                clerkUserId,
                req.auth?.userId || req.user?.clerk_user_id,
                "task_assigned",
                "Issue Reassigned",
                `${req.user.name} assigned issue "${updatedTask.title}" to you.`,
                "task",
                updatedTask.id,
              ],
            );
          }
        } catch (notifErr) {
          console.error("Error creating notification:", notifErr);
        }
      }
    }

    // Notification Logic (Status change to Done)
    if (
      status === "Done" &&
      updatedTask.status === "Done" &&
      updatedTask.reporter_id &&
      updatedTask.reporter_id !== req.user.id
    ) {
      try {
        const reporterRes = await db.query(
          "SELECT clerk_user_id FROM users WHERE id = $1",
          [updatedTask.reporter_id],
        );
        if (reporterRes.rows.length > 0) {
          const clerkUserId = reporterRes.rows[0].clerk_user_id;
          await db.query(
            `INSERT INTO notifications 
             (workspace_id, user_id, actor_id, type, title, message, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              req.workspace.id,
              clerkUserId,
              req.auth?.userId || req.user?.clerk_user_id,
              "task_completed",
              "Issue Completed",
              `${req.user.name} completed the issue "${updatedTask.title}" that you reported.`,
              "task",
              updatedTask.id,
            ],
          );
        }
      } catch (notifErr) {
        console.error("Error creating notification for completion:", notifErr);
      }
    }

    try {
      getIO()
        .to(`workspace_${req.workspace.id}`)
        .emit("TASK_UPDATED", updatedTask);
    } catch (e) {
      console.error("Socket error emitting TASK_UPDATED:", e);
    }

    res.json(updatedTask);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `
      SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar_url, p.slug as project_slug, p.identifier as project_identifier, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND p.workspace_id = $2
    `,
      [id, req.workspace.id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ error: "Task not found in active workspace" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `
      DELETE FROM tasks t
      USING projects p
      WHERE t.id = $1 AND t.project_id = p.id AND p.workspace_id = $2
      RETURNING t.*
    `,
      [id, req.workspace.id],
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Task not found" });

    try {
      getIO().to(`workspace_${req.workspace.id}`).emit("TASK_DELETED", id);
    } catch (e) {
      console.error("Socket error emitting TASK_DELETED:", e);
    }

    res.json({ message: "Task deleted successfully", task: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
