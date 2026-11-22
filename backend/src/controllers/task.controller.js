const db = require("../config/database");
const { handleError } = require("../utils/errorHandler");

const { getIO } = require("../socket");
const { taskSchema, taskUpdateSchema } = require("../validators");

exports.getAllTasks = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 200, 1),
      1000,
    );
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const queryParams = [req.workspace.id];
    let whereClause = `WHERE p.workspace_id = $1`;

    if (req.query.project_id) {
      const isNumeric = /^\d+$/.test(req.query.project_id);
      if (isNumeric) {
        queryParams.push(parseInt(req.query.project_id, 10));
        whereClause += ` AND t.project_id = $${queryParams.length}`;
      } else {
        queryParams.push(req.query.project_id);
        whereClause += ` AND (p.identifier = $${queryParams.length} OR p.slug = $${queryParams.length})`;
      }
    }

    queryParams.push(limit, offset);
    const limitPlaceholder = `$${queryParams.length - 1}`;
    const offsetPlaceholder = `$${queryParams.length}`;

    const { rows } = await db.query(
      `
      WITH subtask_stats AS (
        SELECT 
          t.parent_task_id,
          COUNT(*)::int as subtask_count,
          COUNT(*) FILTER (WHERE t.status = 'Done')::int as completed_subtask_count
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE p.workspace_id = $1 AND t.parent_task_id IS NOT NULL
        GROUP BY t.parent_task_id
      ),
      blocked_stats AS (
        SELECT 
          td.task_id,
          COUNT(*)::int as blocked_by_count
        FROM task_dependencies td
        JOIN tasks bt ON td.depends_on_task_id = bt.id
        WHERE td.workspace_id = $1 AND bt.status != 'Done'
        GROUP BY td.task_id
      )
      SELECT 
        t.id, t.project_id, t.title, t.status, t.priority, t.position, t.progress,
        t.start_date, t.due_date, t.estimated_hours, t.actual_hours,
        t.parent_task_id, t.assignee_id, t.reporter_id, t.created_at, t.updated_at, t.completed_at,
        u.name as assignee_name, u.avatar_url as assignee_avatar_url, u.username as assignee_username, 
        r.name as reporter_name, r.username as reporter_username,
        p.slug as project_slug, p.identifier as project_identifier, p.name as project_name,
        COALESCE(ss.subtask_count, 0) as subtask_count,
        COALESCE(ss.completed_subtask_count, 0) as completed_subtask_count,
        COALESCE(bs.blocked_by_count, 0) as blocked_by_count
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users r ON t.reporter_id = r.id
      LEFT JOIN subtask_stats ss ON t.id = ss.parent_task_id
      LEFT JOIN blocked_stats bs ON t.id = bs.task_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
    `,
      queryParams,
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
      parent_task_id,
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

    if (parent_task_id) {
      const parentRes = await db.query(
        "SELECT t.id FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = $1 AND p.workspace_id = $2",
        [parent_task_id, req.workspace.id],
      );
      if (parentRes.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Parent task not found in active workspace" });
      }
    }

    const { rows } = await db.query(
      "INSERT INTO tasks (project_id, title, status, priority, assignee_id, description, due_date, start_date, reporter_id, parent_task_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
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
        parent_task_id || null,
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
    const validatedData = (taskUpdateSchema || taskSchema.partial()).parse(req.body);
    const {
      status,
      title,
      priority,
      assignee_id,
      description,
      position,
      progress,
      due_date,
      parent_task_id,
    } = validatedData;

    if (parent_task_id !== undefined && parent_task_id !== null && parseInt(parent_task_id, 10) === parseInt(id, 10)) {
      return res.status(400).json({ error: "Task cannot be its own parent" });
    }

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
           parent_task_id = CASE WHEN $17::boolean THEN $18 ELSE t.parent_task_id END,
           completed_at = CASE WHEN $1::boolean AND $2 = 'Done' AND t.status != 'Done' THEN CURRENT_TIMESTAMP WHEN $1::boolean AND $2 != 'Done' THEN NULL ELSE t.completed_at END
       FROM projects p
       WHERE t.id = $19 AND t.project_id = p.id AND p.workspace_id = $20 
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
        parent_task_id !== undefined,
        parent_task_id !== undefined ? parent_task_id : null,
        id,
        req.workspace.id,
      ],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ error: "Task not found in active workspace" });

    const updatedTask = rows[0];

    // Automatic rollup of progress to parent task if this is a subtask
    if (updatedTask.parent_task_id) {
      try {
        const { rows: subRows } = await db.query(
          "SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = 'Done')::int as completed FROM tasks WHERE parent_task_id = $1",
          [updatedTask.parent_task_id],
        );
        if (subRows.length > 0 && subRows[0].total > 0) {
          const parentProgress = Math.round(
            (subRows[0].completed / subRows[0].total) * 100,
          );
          await db.query(
            "UPDATE tasks SET progress = $1, updated_at = NOW() WHERE id = $2",
            [parentProgress, updatedTask.parent_task_id],
          );
        }
      } catch (rollupErr) {
        console.error("Error rolling up subtask progress:", rollupErr);
      }
    }

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
      SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar_url, u.username as assignee_username, p.slug as project_slug, p.identifier as project_identifier, p.name as project_name
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

    const task = rows[0];

    // Fetch subtasks
    const { rows: subtasks } = await db.query(
      `SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar_url, u.username as assignee_username,
              p.identifier as project_identifier
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.parent_task_id = $1 AND p.workspace_id = $2
       ORDER BY t.position ASC, t.created_at ASC`,
      [id, req.workspace.id],
    );

    // Fetch blocked_by (tasks that must finish before this task)
    const { rows: blockedBy } = await db.query(
      `SELECT d.id as dependency_id, d.type, d.created_at as dependency_created_at,
              t.id, t.title, t.status, t.priority, t.due_date,
              p.identifier as project_identifier, u.name as assignee_name, u.avatar_url as assignee_avatar_url, u.username as assignee_username
       FROM task_dependencies d
       JOIN tasks t ON d.depends_on_task_id = t.id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE d.task_id = $1 AND d.workspace_id = $2
       ORDER BY d.created_at ASC`,
      [id, req.workspace.id],
    );

    // Fetch blocking (tasks waiting on this task)
    const { rows: blocking } = await db.query(
      `SELECT d.id as dependency_id, d.type, d.created_at as dependency_created_at,
              t.id, t.title, t.status, t.priority, t.due_date,
              p.identifier as project_identifier, u.name as assignee_name, u.avatar_url as assignee_avatar_url, u.username as assignee_username
       FROM task_dependencies d
       JOIN tasks t ON d.task_id = t.id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE d.depends_on_task_id = $1 AND d.workspace_id = $2
       ORDER BY d.created_at ASC`,
      [id, req.workspace.id],
    );

    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter((s) => s.status === "Done").length;

    res.json({
      ...task,
      subtasks,
      subtask_summary: {
        total: totalSubtasks,
        completed: completedSubtasks,
        progress: totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0,
      },
      dependencies: {
        blocked_by: blockedBy,
        blocking: blocking,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getSubtasks = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar_url, u.username as assignee_username,
              p.identifier as project_identifier
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.parent_task_id = $1 AND p.workspace_id = $2
       ORDER BY t.position ASC, t.created_at ASC`,
      [id, req.workspace.id],
    );
    res.json(rows);
  } catch (error) {
    console.error("getSubtasks error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createSubtask = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Verify parent task exists and belongs to active workspace
    const parentRes = await db.query(
      `SELECT t.id, t.project_id FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1 AND p.workspace_id = $2`,
      [id, req.workspace.id],
    );
    if (parentRes.rows.length === 0) {
      return res.status(404).json({ error: "Parent task not found in active workspace" });
    }
    const parentTask = parentRes.rows[0];

    const { title, priority, assignee_id, due_date } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Subtask title is required" });
    }

    const { rows } = await db.query(
      `INSERT INTO tasks (project_id, parent_task_id, title, status, priority, assignee_id, due_date, reporter_id)
       VALUES ($1, $2, $3, 'Todo', $4, $5, $6, $7)
       RETURNING *`,
      [
        parentTask.project_id,
        parentTask.id,
        title.trim(),
        priority || "Medium",
        assignee_id || null,
        due_date || null,
        req.user.id,
      ],
    );

    const subtask = rows[0];

    // Roll up parent task progress
    const { rows: countRows } = await db.query(
      "SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = 'Done')::int as completed FROM tasks WHERE parent_task_id = $1",
      [parentTask.id],
    );
    if (countRows.length > 0 && countRows[0].total > 0) {
      const parentProgress = Math.round((countRows[0].completed / countRows[0].total) * 100);
      await db.query("UPDATE tasks SET progress = $1, updated_at = NOW() WHERE id = $2", [
        parentProgress,
        parentTask.id,
      ]);
    }

    try {
      getIO().to(`workspace_${req.workspace.id}`).emit("TASK_CREATED", subtask);
    } catch (e) {}

    res.status(201).json(subtask);
  } catch (error) {
    console.error("createSubtask error:", error);
    res.status(500).json({ error: "Server error creating subtask" });
  }
};

exports.getTaskDependencies = async (req, res) => {
  const { id } = req.params;
  try {
    const checkRes = await db.query(
      `SELECT t.id FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = $1 AND p.workspace_id = $2`,
      [id, req.workspace.id],
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Task not found in active workspace" });
    }

    const { rows: blockedBy } = await db.query(
      `SELECT d.id as dependency_id, d.type, d.created_at as dependency_created_at,
              t.id, t.title, t.status, t.priority, t.due_date,
              p.identifier as project_identifier, u.name as assignee_name, u.avatar_url as assignee_avatar_url, u.username as assignee_username
       FROM task_dependencies d
       JOIN tasks t ON d.depends_on_task_id = t.id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE d.task_id = $1 AND d.workspace_id = $2
       ORDER BY d.created_at ASC`,
      [id, req.workspace.id],
    );

    const { rows: blocking } = await db.query(
      `SELECT d.id as dependency_id, d.type, d.created_at as dependency_created_at,
              t.id, t.title, t.status, t.priority, t.due_date,
              p.identifier as project_identifier, u.name as assignee_name, u.avatar_url as assignee_avatar_url, u.username as assignee_username
       FROM task_dependencies d
       JOIN tasks t ON d.task_id = t.id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE d.depends_on_task_id = $1 AND d.workspace_id = $2
       ORDER BY d.created_at ASC`,
      [id, req.workspace.id],
    );

    res.json({
      blocked_by: blockedBy,
      blocking: blocking,
    });
  } catch (error) {
    console.error("getTaskDependencies error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.addTaskDependency = async (req, res) => {
  const { id } = req.params;
  const taskId = parseInt(id, 10);
  const dependsOnTaskId = parseInt(req.body.depends_on_task_id, 10);
  const type = req.body.type || "blocks";

  if (!dependsOnTaskId || isNaN(dependsOnTaskId)) {
    return res.status(400).json({ error: "Valid depends_on_task_id is required" });
  }

  if (taskId === dependsOnTaskId) {
    return res.status(400).json({ error: "A task cannot depend on itself" });
  }

  try {
    const { rows: taskCheck } = await db.query(
      `SELECT t.id, t.title, p.identifier as project_identifier 
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.id IN ($1, $2) AND p.workspace_id = $3`,
      [taskId, dependsOnTaskId, req.workspace.id],
    );

    if (taskCheck.length < 2) {
      return res.status(404).json({
        error: "One or both tasks not found in the active workspace",
      });
    }

    // Cycle detection
    const { rows: cycleCheck } = await db.query(
      `WITH RECURSIVE dep_chain AS (
         SELECT depends_on_task_id, task_id
         FROM task_dependencies
         WHERE workspace_id = $1 AND task_id = $2
         UNION ALL
         SELECT td.depends_on_task_id, td.task_id
         FROM task_dependencies td
         JOIN dep_chain dc ON td.task_id = dc.depends_on_task_id
         WHERE td.workspace_id = $1
       )
       SELECT 1 FROM dep_chain WHERE depends_on_task_id = $3 LIMIT 1`,
      [req.workspace.id, dependsOnTaskId, taskId],
    );

    if (cycleCheck.length > 0) {
      return res.status(400).json({
        error: "Circular dependency detected. This task already blocks the selected task.",
      });
    }

    const { rows: inserted } = await db.query(
      `INSERT INTO task_dependencies (workspace_id, task_id, depends_on_task_id, type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (task_id, depends_on_task_id) DO UPDATE SET type = EXCLUDED.type
       RETURNING *`,
      [req.workspace.id, taskId, dependsOnTaskId, type],
    );

    const { rows: depDetails } = await db.query(
      `SELECT d.id as dependency_id, d.type, d.created_at as dependency_created_at,
              t.id, t.title, t.status, t.priority, t.due_date,
              p.identifier as project_identifier, u.name as assignee_name, u.avatar_url as assignee_avatar_url, u.username as assignee_username
       FROM task_dependencies d
       JOIN tasks t ON d.depends_on_task_id = t.id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE d.id = $1`,
      [inserted[0].id],
    );

    try {
      getIO().to(`workspace_${req.workspace.id}`).emit("TASK_DEPENDENCY_ADDED", {
        task_id: taskId,
        dependency: depDetails[0],
      });
    } catch (e) {}

    res.status(201).json(depDetails[0]);
  } catch (error) {
    console.error("addTaskDependency error:", error);
    res.status(500).json({ error: "Server error adding dependency" });
  }
};

exports.removeTaskDependency = async (req, res) => {
  const { id, depId } = req.params;
  const taskId = parseInt(id, 10);
  const dependencyId = parseInt(depId, 10);

  try {
    const { rows } = await db.query(
      `DELETE FROM task_dependencies
       WHERE (id = $1 OR (task_id = $2 AND depends_on_task_id = $1)) AND workspace_id = $3
       RETURNING *`,
      [dependencyId, taskId, req.workspace.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Dependency link not found" });
    }

    try {
      getIO().to(`workspace_${req.workspace.id}`).emit("TASK_DEPENDENCY_REMOVED", {
        id: rows[0].id,
        task_id: rows[0].task_id,
        depends_on_task_id: rows[0].depends_on_task_id,
      });
    } catch (e) {}

    res.json({ success: true, message: "Dependency removed", dependency: rows[0] });
  } catch (error) {
    console.error("removeTaskDependency error:", error);
    res.status(500).json({ error: "Server error removing dependency" });
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
      getIO().to(`workspace_${req.workspace.id}`).emit("TASK_DELETED", { id: rows[0].id });
    } catch (e) {
      console.error("Socket error emitting TASK_DELETED:", e);
    }

    res.json({ message: "Task deleted successfully", task: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
