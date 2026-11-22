const db = require("../config/database");
const { generateWorkspaceSlug } = require("../utils/slug");

exports.createWorkspace = async (req, res) => {
  const { name, slug: requestedSlug } = req.body;
  if (!name)
    return res.status(400).json({ error: "Workspace name is required" });

  const owner_id = req.user.id;

  const { getAuth } = require("@clerk/express");
  const { orgId: clerkOrgId } = getAuth(req);

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    let workspace;
    if (clerkOrgId) {
      // Check if this clerk_org_id already has a workspace
      const existingWs = await client.query(
        "SELECT * FROM workspaces WHERE clerk_org_id = $1",
        [clerkOrgId],
      );

      if (existingWs.rows.length > 0) {
        const updateRes = await client.query(
          "UPDATE workspaces SET name = $1 WHERE id = $2 RETURNING *",
          [name, existingWs.rows[0].id],
        );
        workspace = updateRes.rows[0];
      } else {
        const slug = await generateWorkspaceSlug(requestedSlug || name, client);
        const workspaceRes = await client.query(
          "INSERT INTO workspaces (clerk_org_id, name, slug, owner_id) VALUES ($1, $2, $3, $4) RETURNING *",
          [clerkOrgId, name, slug, owner_id],
        );
        workspace = workspaceRes.rows[0];
      }
    } else {
      const slug = await generateWorkspaceSlug(requestedSlug || name, client);
      const workspaceRes = await client.query(
        "INSERT INTO workspaces (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING *",
        [name, slug, owner_id],
      );
      workspace = workspaceRes.rows[0];
    }

    // Add owner as Owner member
    await client.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [workspace.id, owner_id, "Owner"],
    );

    await client.query("COMMIT");
    res.status(201).json(workspace);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rbErr) {
      console.error("Rollback error:", rbErr);
    }
    console.error(error);
    if (error.constraint === "workspaces_slug_key") {
      return res.status(400).json({ error: "Workspace name already exists." });
    }
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

exports.getUserWorkspaces = async (req, res) => {
  const user_id = req.user.id;
  try {
    const { rows } = await db.query(
      `
      SELECT w.*, wm.role 
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY w.name ASC
    `,
      [user_id],
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCurrentWorkspace = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });

  try {
    const wsId = req.workspace.id;
    const { rows } = await db.query(
      `SELECT 
        w.*,
        u.name as owner_name,
        u.email as owner_email,
        (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id)::int as member_count
       FROM workspaces w
       LEFT JOIN users u ON w.owner_id = u.id
       WHERE w.id = $1`,
      [wsId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const ws = rows[0];
    res.json({
      ...ws,
      role: req.workspaceRole,
      plan: ws.plan || "Free",
    });
  } catch (err) {
    console.error("getCurrentWorkspace error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.checkSlugAvailability = async (req, res) => {
  const { slug } = req.query;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Slug query parameter is required" });
  }

  const cleanSlug = slug.toLowerCase().trim();
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(cleanSlug) || cleanSlug.length < 2 || cleanSlug.length > 60) {
    return res.json({
      available: false,
      reason: "Slug must be 2-60 characters and contain only lowercase letters, numbers, and hyphens.",
      slug: cleanSlug,
    });
  }

  try {
    const currentWsId = req.workspace?.id;
    const { rows } = await db.query(
      "SELECT id FROM workspaces WHERE slug = $1 AND id != COALESCE($2, -1) LIMIT 1",
      [cleanSlug, currentWsId || -1],
    );

    res.json({
      available: rows.length === 0,
      slug: cleanSlug,
      reason: rows.length > 0 ? "This URL is already taken by another workspace." : null,
    });
  } catch (err) {
    console.error("checkSlugAvailability error:", err);
    res.status(500).json({ error: "Server error checking slug" });
  }
};

exports.uploadWorkspaceLogo = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });

  const { image } = req.body;
  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "Image data URI is required" });
  }

  // Validate base64 image data URI: data:image/(png|jpeg|jpg|webp);base64,...
  const match = image.match(/^data:image\/(png|jpeg|jpg|webp);base64,/i);
  if (!match) {
    return res.status(400).json({
      error: "Unsupported image format. Allowed formats: PNG, JPG, JPEG, WebP.",
    });
  }

  // Calculate approximate file size in bytes
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (sizeInBytes > maxSize) {
    return res.status(400).json({
      error: "Image size exceeds 5MB limit. Please choose a smaller file.",
    });
  }

  try {
    const { rows } = await db.query(
      "UPDATE workspaces SET logo_url = $1, updated_at = NOW() WHERE id = $2 RETURNING logo_url, updated_at",
      [image, req.workspace.id],
    );

    res.json({
      success: true,
      logo_url: rows[0].logo_url,
      updated_at: rows[0].updated_at,
    });
  } catch (err) {
    console.error("uploadWorkspaceLogo error:", err);
    res.status(500).json({ error: "Failed to upload workspace logo" });
  }
};

exports.removeWorkspaceLogo = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });

  try {
    const { rows } = await db.query(
      "UPDATE workspaces SET logo_url = NULL, updated_at = NOW() WHERE id = $1 RETURNING logo_url, updated_at",
      [req.workspace.id],
    );

    res.json({
      success: true,
      logo_url: null,
      updated_at: rows[0].updated_at,
    });
  } catch (err) {
    console.error("removeWorkspaceLogo error:", err);
    res.status(500).json({ error: "Failed to remove workspace logo" });
  }
};

exports.updateCurrentWorkspace = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });

  const wsId = req.workspace.id;
  const updates = [];
  const values = [];
  let paramIdx = 1;

  const {
    name,
    description,
    slug,
    logo_url,
    default_language,
    default_timezone,
    date_format,
    time_format,
    first_day_of_week,
    default_project_view,
    default_task_view,
    default_task_priority,
    default_project_visibility,
    default_member_role,
    notify_new_members,
    notify_workspace_activity,
  } = req.body;

  // 1. Name validation
  if (name !== undefined) {
    if (typeof name !== "string") {
      return res.status(400).json({ error: "Workspace name must be a string" });
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return res.status(400).json({
        error: "Workspace name must be between 2 and 60 characters",
      });
    }
    updates.push(`name = $${paramIdx++}`);
    values.push(trimmedName);
  }

  // 2. Description validation
  if (description !== undefined) {
    if (description === null || description === "") {
      updates.push(`description = NULL`);
    } else {
      if (typeof description !== "string") {
        return res.status(400).json({ error: "Description must be a string" });
      }
      if (description.length > 250) {
        return res.status(400).json({
          error: "Workspace description cannot exceed 250 characters",
        });
      }
      updates.push(`description = $${paramIdx++}`);
      values.push(description.trim());
    }
  }

  // 3. Slug validation & uniqueness
  if (slug !== undefined) {
    if (typeof slug !== "string") {
      return res.status(400).json({ error: "Slug must be a string" });
    }
    const cleanSlug = slug.toLowerCase().trim();
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(cleanSlug) || cleanSlug.length < 2 || cleanSlug.length > 60) {
      return res.status(400).json({
        error: "Slug must be 2-60 characters and contain only lowercase letters, numbers, and hyphens.",
      });
    }

    const { rows: existingSlug } = await db.query(
      "SELECT id FROM workspaces WHERE slug = $1 AND id != $2 LIMIT 1",
      [cleanSlug, wsId],
    );
    if (existingSlug.length > 0) {
      return res.status(400).json({
        error: "This workspace URL/slug is already taken by another workspace",
      });
    }

    updates.push(`slug = $${paramIdx++}`);
    values.push(cleanSlug);
  }

  // 4. Logo URL
  if (logo_url !== undefined) {
    if (logo_url === null || logo_url === "") {
      updates.push(`logo_url = NULL`);
    } else {
      if (typeof logo_url !== "string") {
        return res.status(400).json({ error: "Invalid logo URL" });
      }
      updates.push(`logo_url = $${paramIdx++}`);
      values.push(logo_url);
    }
  }

  // 5. Default Language
  if (default_language !== undefined) {
    const supportedLangs = ["en", "en-US", "en-GB"];
    if (!supportedLangs.includes(default_language)) {
      return res.status(400).json({ error: "Unsupported language selection" });
    }
    updates.push(`default_language = $${paramIdx++}`);
    values.push("en");
  }

  // 6. Default Timezone
  if (default_timezone !== undefined) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: default_timezone });
    } catch {
      return res.status(400).json({ error: "Invalid IANA time zone identifier" });
    }
    updates.push(`default_timezone = $${paramIdx++}`);
    values.push(default_timezone);
  }

  // 7. Date Format
  if (date_format !== undefined) {
    const validDateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
    if (!validDateFormats.includes(date_format)) {
      return res.status(400).json({ error: "Invalid date format selection" });
    }
    updates.push(`date_format = $${paramIdx++}`);
    values.push(date_format);
  }

  // 8. Time Format
  if (time_format !== undefined) {
    const validTimeFormats = ["12h", "24h"];
    if (!validTimeFormats.includes(time_format)) {
      return res.status(400).json({ error: "Invalid time format selection" });
    }
    updates.push(`time_format = $${paramIdx++}`);
    values.push(time_format);
  }

  // 9. First Day of Week
  if (first_day_of_week !== undefined) {
    const cleanDay = String(first_day_of_week).toLowerCase().trim();
    const validDays = ["sunday", "monday", "saturday"];
    if (!validDays.includes(cleanDay)) {
      return res.status(400).json({ error: "Invalid first day of week selection" });
    }
    updates.push(`first_day_of_week = $${paramIdx++}`);
    values.push(cleanDay);
  }

  // 10. Default Project View
  if (default_project_view !== undefined) {
    const cleanProjectView = String(default_project_view).trim().toLowerCase();
    const validProjectViews = ["list", "board", "timeline"];
    if (!validProjectViews.includes(cleanProjectView)) {
      return res.status(400).json({ error: "Invalid default project view selection" });
    }
    updates.push(`default_project_view = $${paramIdx++}`);
    values.push(cleanProjectView);
  }

  // 11. Default Task View
  if (default_task_view !== undefined) {
    const cleanTaskView = String(default_task_view).trim().toLowerCase();
    const validTaskViews = ["list", "board"];
    if (!validTaskViews.includes(cleanTaskView)) {
      return res.status(400).json({ error: "Invalid default task view selection" });
    }
    updates.push(`default_task_view = $${paramIdx++}`);
    values.push(cleanTaskView);
  }

  // 12. Default Task Priority
  if (default_task_priority !== undefined) {
    const rawPriority = String(default_task_priority || "").trim().toLowerCase();
    const priorityMap = {
      "no priority": "No priority",
      "no_priority": "No priority",
      "no-priority": "No priority",
      "none": "No priority",
      "": "No priority",
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "urgent": "Urgent",
    };
    const normalizedPriority = priorityMap[rawPriority];
    if (!normalizedPriority) {
      return res.status(400).json({ error: "Invalid default task priority selection" });
    }
    updates.push(`default_task_priority = $${paramIdx++}`);
    values.push(normalizedPriority);
  }

  // 13. Default Project Visibility
  if (default_project_visibility !== undefined) {
    const cleanVisibility = String(default_project_visibility).trim().toLowerCase();
    const validVisibilities = ["private", "workspace"];
    if (!validVisibilities.includes(cleanVisibility)) {
      return res.status(400).json({ error: "Invalid project visibility selection" });
    }
    updates.push(`default_project_visibility = $${paramIdx++}`);
    values.push(cleanVisibility);
  }

  // 14. Default Member Role
  if (default_member_role !== undefined) {
    const cleanRole = String(default_member_role).trim().toLowerCase();
    const roleMap = { member: "Member", viewer: "Viewer", admin: "Admin" };
    if (!roleMap[cleanRole]) {
      return res.status(400).json({ error: "Invalid default member role selection" });
    }
    updates.push(`default_member_role = $${paramIdx++}`);
    values.push(roleMap[cleanRole]);
  }

  // 15. Notification Toggles
  if (notify_new_members !== undefined) {
    updates.push(`notify_new_members = $${paramIdx++}`);
    values.push(Boolean(notify_new_members));
  }
  if (notify_workspace_activity !== undefined) {
    updates.push(`notify_workspace_activity = $${paramIdx++}`);
    values.push(Boolean(notify_workspace_activity));
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No settings provided for update" });
  }

  updates.push(`updated_at = NOW()`);
  values.push(wsId);

  const queryText = `
    UPDATE workspaces
    SET ${updates.join(", ")}
    WHERE id = $${paramIdx}
    RETURNING *;
  `;

  try {
    const { rows } = await db.query(queryText, values);
    const updatedWs = rows[0];

    // Sync Clerk organization if linked
    if (updatedWs.clerk_org_id && (name || slug)) {
      try {
        const { clerkClient } = require("@clerk/express");
        const clerkUpdates = {};
        if (name) clerkUpdates.name = name.trim();
        if (slug) clerkUpdates.slug = slug.toLowerCase().trim();
        await clerkClient.organizations.updateOrganization(
          updatedWs.clerk_org_id,
          clerkUpdates,
        );
      } catch (clerkErr) {
        console.warn("Clerk organization sync warning:", clerkErr.message);
      }
    }

    res.json(updatedWs);
  } catch (err) {
    console.error("updateCurrentWorkspace error:", err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Slug is already in use by another workspace" });
    }
    res.status(500).json({ error: "Server error updating workspace" });
  }
};

exports.getCurrentWorkspaceSummary = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });

  try {
    const wsId = req.workspace.id;
    const userId = req.user.id;

    const [
      projectSummaryRes,
      taskSummaryRes,
      myIssuesRes,
      recentProjectsRes,
      upcomingMilestonesRes,
      milestoneStatsRes,
    ] = await Promise.all([
      db.query(
        `SELECT 
             COUNT(*) as "count",
             COUNT(*) as "total",
             COUNT(*) FILTER (WHERE status = 'Done') as "completed",
             COUNT(*) FILTER (WHERE status = 'In Progress') as "inProgress",
             COUNT(*) FILTER (WHERE status = 'Planned' OR (status != 'Done' AND status != 'In Progress')) as "pending",
             COUNT(*) FILTER (WHERE health = 'On Track') as "onTrack",
             COUNT(*) FILTER (WHERE health = 'At Risk') as "atRisk",
             COUNT(*) FILTER (WHERE health = 'Off Track') as "offTrack"
           FROM projects WHERE workspace_id = $1 AND status != 'Archived'`,
        [wsId],
      ),
      db.query(
        `SELECT 
            COUNT(*) FILTER (WHERE t.status = 'Todo' OR t.status = 'In Progress' OR t.status = 'In Review') as "inProgress",
            COUNT(*) FILTER (WHERE t.status = 'Done' AND t.updated_at >= NOW() - INTERVAL '7 days') as "completedLast7Days",
            COUNT(*) FILTER (WHERE t.due_date < NOW() AND t.status != 'Done') as "overdue",
            COUNT(*) FILTER (WHERE t.due_date::date = NOW()::date AND t.status != 'Done') as "dueToday",
            COUNT(*) FILTER (WHERE t.status != 'Done' AND t.status != 'Canceled') as "totalActive",
            COUNT(*) FILTER (WHERE t.priority = 'Urgent' AND t.status != 'Done' AND t.status != 'Canceled') as "urgent",
            COUNT(*) FILTER (WHERE t.priority = 'High' AND t.status != 'Done' AND t.status != 'Canceled') as "high",
            COUNT(*) FILTER (WHERE t.priority = 'Medium' AND t.status != 'Done' AND t.status != 'Canceled') as "medium",
            COUNT(*) FILTER (WHERE (t.priority = 'Low' OR (t.priority != 'Urgent' AND t.priority != 'High' AND t.priority != 'Medium')) AND t.status != 'Done' AND t.status != 'Canceled') as "low"
          FROM tasks t
          JOIN projects p ON t.project_id = p.id
          WHERE p.workspace_id = $1`,
        [wsId],
      ),
      db.query(
        `SELECT t.id, t.title, t.status, t.priority, t.due_date, p.slug as project_slug, p.identifier as project_identifier
          FROM tasks t
          JOIN projects p ON t.project_id = p.id
          WHERE p.workspace_id = $1 AND t.assignee_id = $2 AND t.status != 'Done'
          ORDER BY (CASE t.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 ELSE 5 END) ASC, t.due_date ASC NULLS LAST
          LIMIT 10`,
        [wsId, userId],
      ),
      db.query(
        `SELECT p.id, p.name, p.slug, p.identifier, p.status, p.health, p.progress, p.due_date, p.priority, p.updated_at
          FROM projects p
          WHERE p.workspace_id = $1
          ORDER BY (CASE WHEN p.status = 'In Progress' THEN 1 WHEN p.status = 'Planned' THEN 2 ELSE 3 END) ASC, p.updated_at DESC
          LIMIT 4`,
        [wsId],
      ),
      db.query(
        `SELECT m.id, m.name, m.description, m.status, m.due_date,
                p.id as project_id, p.name as project_name, p.identifier as project_identifier, p.slug as project_slug
         FROM milestones m
         JOIN projects p ON m.project_id = p.id
         WHERE p.workspace_id = $1 AND p.status != 'Archived'
         ORDER BY (CASE WHEN m.status = 'In Progress' THEN 1 WHEN m.status = 'Pending' THEN 2 ELSE 3 END) ASC,
                  m.due_date ASC NULLS LAST
         LIMIT 6`,
        [wsId],
      ),
      db.query(
        `SELECT 
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE m.status = 'Completed') as completed,
           COUNT(*) FILTER (WHERE m.status = 'In Progress') as in_progress,
           COUNT(*) FILTER (WHERE m.status = 'Pending' OR (m.status != 'Completed' AND m.status != 'In Progress')) as pending
         FROM milestones m
         JOIN projects p ON m.project_id = p.id
         WHERE p.workspace_id = $1 AND p.status != 'Archived'`,
        [wsId],
      ),
    ]);

    const projStats = projectSummaryRes.rows[0] || {};
    const taskStats = taskSummaryRes.rows[0] || {};

    const totalMilestones = parseInt(milestoneStatsRes.rows[0]?.total || 0);
    const completedMilestones = parseInt(milestoneStatsRes.rows[0]?.completed || 0);
    const inProgressMilestones = parseInt(milestoneStatsRes.rows[0]?.in_progress || 0);
    const pendingMilestones = parseInt(milestoneStatsRes.rows[0]?.pending || 0);

    const totalProjectsCount = parseInt(projStats.total || projStats.count) || 0;
    const onTrackCount = parseInt(projStats.onTrack || 0);
    const atRiskCount = parseInt(projStats.atRisk || 0);
    const offTrackCount = parseInt(projStats.offTrack || 0);
    const onTrackRate = totalProjectsCount > 0 ? Math.round((onTrackCount / totalProjectsCount) * 100) : 100;

    const totalActiveTasks = parseInt(taskStats.totalActive || 0);
    const urgentTasks = parseInt(taskStats.urgent || 0);
    const highTasks = parseInt(taskStats.high || 0);
    const mediumTasks = parseInt(taskStats.medium || 0);
    const lowTasks = parseInt(taskStats.low || 0);

    const payload = {
      activeProjectCount: parseInt(projStats.count || 0),
      stats: {
        inProgress: parseInt(taskStats.inProgress || 0),
        completedLast7Days: parseInt(taskStats.completedLast7Days || 0),
        overdue: parseInt(taskStats.overdue || 0),
        dueToday: parseInt(taskStats.dueToday || 0),
        totalProjects: parseInt(projStats.count || 0),
        completedProjects: parseInt(projStats.completed || 0),
        inProgressProjects: parseInt(projStats.inProgress || 0),
        pendingProjects: parseInt(projStats.pending || 0),
      },
      myIssues: myIssuesRes.rows,
      recentProjects: recentProjectsRes.rows,
      upcomingMilestones: upcomingMilestonesRes.rows,
      milestoneStats: {
        total: totalMilestones,
        completed: completedMilestones,
        inProgress: inProgressMilestones,
        pending: pendingMilestones,
        completionRate:
          totalMilestones > 0
            ? Math.round((completedMilestones / totalMilestones) * 100)
            : 0,
      },
      priorityDistribution: {
        totalActive: totalActiveTasks,
        urgent: urgentTasks,
        high: highTasks,
        medium: mediumTasks,
        low: lowTasks,
      },
      healthDistribution: {
        total: totalProjectsCount,
        onTrack: onTrackCount,
        atRisk: atRiskCount,
        offTrack: offTrackCount,
        onTrackRate,
      },
    };
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCurrentWorkspaceNotifications = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });
  const wsId = req.workspace.id;
  const userId = req.auth?.userId || req.user?.clerk_user_id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await db.query(
      `SELECT 
         n.*,
         u.name as actor_name,
         u.avatar_url as actor_avatar,
         p.name as project_name,
         p.slug as project_identifier,
         t.title as task_title,
         t.project_id as project_id
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.clerk_user_id
       LEFT JOIN tasks t ON n.entity_type = 'task' AND n.entity_id = t.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE n.workspace_id = $1 AND n.user_id = $2 
       ORDER BY n.created_at DESC 
       LIMIT 50`,
      [wsId, userId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });
  const { id } = req.params;
  const userId = req.auth?.userId || req.user?.clerk_user_id;
  const isRead = req.body?.is_read !== undefined ? Boolean(req.body.is_read) : true;

  try {
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = $4 
       WHERE id = $1 AND user_id = $2 AND workspace_id = $3
       RETURNING *`,
      [id, userId, req.workspace.id, isRead],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });
  const userId = req.auth?.userId || req.user?.clerk_user_id;

  try {
    await db.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE workspace_id = $1 AND user_id = $2 AND is_read = FALSE`,
      [req.workspace.id, userId],
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteNotification = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM notifications 
       WHERE id = $1 AND workspace_id = $2
       RETURNING id`,
      [id, req.workspace.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCurrentWorkspaceAnalytics = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });

  try {
    const wsId = req.workspace.id;

    // 1. Completion rate, on-time delivery & total stats
    const statsRes = await db.query(
      `SELECT 
         COUNT(*) as "totalIssues",
         COUNT(*) FILTER (WHERE t.status = 'Done') as "completedIssues",
         COUNT(*) FILTER (WHERE t.status != 'Done' AND t.status != 'Canceled') as "activeIssues",
         COUNT(*) FILTER (WHERE t.status != 'Done' AND t.status != 'Canceled' AND t.due_date IS NOT NULL AND t.due_date < NOW()) as "overdueIssues",
         COALESCE(ROUND((COUNT(*) FILTER (WHERE t.status = 'Done' AND (t.completed_at <= t.due_date OR t.updated_at <= t.due_date))::numeric / NULLIF(COUNT(*) FILTER (WHERE t.status = 'Done'), 0)) * 100, 1), 0) as "onTimeDelivery",
         COUNT(*) FILTER (WHERE t.status = 'Done' AND t.updated_at >= NOW() - INTERVAL '30 days') as "completedThisPeriod",
         COUNT(*) FILTER (WHERE t.status = 'Done' AND t.updated_at >= NOW() - INTERVAL '60 days' AND t.updated_at < NOW() - INTERVAL '30 days') as "completedPriorPeriod"
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.workspace_id = $1`,
      [wsId],
    );

    // 2. Project Health breakdown
    const pStatsRes = await db.query(
      `SELECT 
         COUNT(*) as "totalProjects",
         COUNT(*) FILTER (WHERE status = 'Done') as "completedProjects",
         COUNT(*) FILTER (WHERE status = 'In Progress') as "inProgressProjects",
         COUNT(*) FILTER (WHERE status = 'Planned' OR (status != 'Done' AND status != 'In Progress')) as "pendingProjects",
         COUNT(*) FILTER (WHERE status != 'Done' AND status != 'Canceled') as "activeProjects",
         COUNT(*) FILTER (WHERE health = 'On Track') as "onTrackProjects",
         COUNT(*) FILTER (WHERE health = 'At Risk') as "atRiskProjects",
         COUNT(*) FILTER (WHERE health = 'Off Track') as "offTrackProjects",
         ROUND(AVG(COALESCE(progress, 0))) as "overallCompletion",
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as "newProjectsThisPeriod"
       FROM projects
       WHERE workspace_id = $1`,
      [wsId],
    );

    // 3. Projects to watch and all projects for bracket drilldowns
    const pAllRes = await db.query(
      `SELECT 
         p.id, p.name, p.identifier, p.health, p.status, p.progress, p.labels,
         (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status != 'Done' AND t.status != 'Canceled') as "remainingTasks",
         u.name as "leadName"
       FROM projects p
       LEFT JOIN users u ON p.lead_id = u.id
       WHERE p.workspace_id = $1
       ORDER BY p.position ASC, p.id ASC`,
      [wsId],
    );

    const formatProjectRow = (r) => {
      const labels = Array.isArray(r.labels) ? r.labels : [];
      const category = labels[0] ? labels[0].charAt(0).toUpperCase() + labels[0].slice(1) : "General";
      const tasksLeft = parseInt(r.remainingTasks) || 0;
      return {
        id: r.id,
        name: r.name,
        identifier: r.identifier,
        health: r.health || "On Track",
        status: r.status,
        progress: r.progress || 0,
        category,
        leadName: r.leadName,
        subtitle: `${category} · ${tasksLeft} tasks left`,
      };
    };

    const allFormattedProjects = pAllRes.rows.map(formatProjectRow);

    const pWatchList = [...allFormattedProjects]
      .sort((a, b) => {
        const score = (p) => (p.health === "At Risk" || p.health === "Off Track" ? 1 : p.status === "In Progress" ? 2 : 3);
        return score(a) - score(b);
      })
      .slice(0, 4);

    // 4. Real Velocity Buckets Generator for 7d, 30d, 90d (Optimized & Trimmed)
    const tVelocityRows = await db.query(
      `SELECT 
         DATE(t.updated_at) as update_date,
         DATE(t.created_at) as create_date,
         t.status,
         p.id as project_id,
         p.name as project_name,
         p.identifier as project_identifier,
         p.progress as project_progress,
         p.health as project_health
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.workspace_id = $1 AND (t.updated_at >= NOW() - INTERVAL '90 days' OR t.created_at >= NOW() - INTERVAL '90 days')
       ORDER BY t.updated_at DESC LIMIT 5000`,
      [wsId],
    );

    const pVelocityRows = await db.query(
      `SELECT 
         DATE(p.updated_at) as update_date,
         p.id as project_id,
         p.name as project_name,
         p.identifier as project_identifier,
         p.progress as project_progress,
         p.health as project_health,
         p.status
       FROM projects p
       WHERE p.workspace_id = $1 AND p.updated_at >= NOW() - INTERVAL '90 days' AND p.status = 'Done'
       ORDER BY p.updated_at DESC LIMIT 1000`,
      [wsId],
    );

    const parsedTasks = tVelocityRows.rows.map((r) => ({
      ...r,
      updateTime: r.update_date ? new Date(r.update_date).getTime() : 0,
      createTime: r.create_date ? new Date(r.create_date).getTime() : 0,
    }));

    const parsedProjects = pVelocityRows.rows.map((r) => ({
      ...r,
      updateTime: r.update_date ? new Date(r.update_date).getTime() : 0,
    }));

    const computeVelocityBuckets = (days, bucketCount) => {
      const now = new Date();
      const buckets = [];
      const stepDays = days / bucketCount;

      for (let i = 0; i < bucketCount; i++) {
        const startMs = now.getTime() - (days - i * stepDays) * 86400000;
        const endMs = now.getTime() - (days - (i + 1) * stepDays) * 86400000;

        const bucketEnd = new Date(endMs);
        const dateLabel = bucketEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        const completedTaskRows = parsedTasks.filter((r) => {
          return r.status === "Done" && r.updateTime >= startMs && r.updateTime <= endMs;
        });

        const createdTaskRows = parsedTasks.filter((r) => {
          return r.createTime >= startMs && r.createTime <= endMs;
        });

        const shippedProjectRows = parsedProjects.filter((r) => {
          return r.updateTime >= startMs && r.updateTime <= endMs;
        });

        const aggregateProjects = (rows) => {
          const m = new Map();
          rows.forEach((r) => {
            if (!m.has(r.project_id)) {
              m.set(r.project_id, {
                id: r.project_id,
                name: r.project_name,
                identifier: r.project_identifier,
                progress: r.project_progress || 0,
                health: r.project_health || "On Track",
                count: 0,
              });
            }
            m.get(r.project_id).count++;
          });
          return Array.from(m.values()).sort((a, b) => b.count - a.count);
        };

        const completedProjects = aggregateProjects(completedTaskRows);
        const createdProjects = aggregateProjects(createdTaskRows);
        const shippedProjects = shippedProjectRows.map((r) => ({
          id: r.project_id,
          name: r.project_name,
          identifier: r.project_identifier,
          progress: 100,
          health: r.project_health || "On Track",
          status: "Done",
          count: 1,
        }));

        buckets.push({
          date: dateLabel,
          completed: completedTaskRows.length,
          created: createdTaskRows.length,
          shipped: shippedProjectRows.length,
          isCurrent: i === bucketCount - 1,
          details: {
            completed: completedProjects,
            created: createdProjects,
            shipped: shippedProjects,
            completedTasks: [],
            createdTasks: [],
          },
        });
      }
      return buckets;
    };

    const velocitySeries = {
      "7 days": computeVelocityBuckets(7, 7),
      "30 days": computeVelocityBuckets(30, 10),
      "90 days": computeVelocityBuckets(90, 10),
    };

    // 5. Workload by user
    const workloadRes = await db.query(
      `SELECT 
         u.name as user,
         COUNT(t.id) as "openIssues"
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN users u ON t.assignee_id = u.id
       WHERE p.workspace_id = $1 AND t.status != 'Done' AND t.status != 'Canceled'
       GROUP BY u.name
       ORDER BY "openIssues" DESC`,
      [wsId],
    );

    const stats = statsRes.rows[0] || {};
    const totalIssues = parseInt(stats.totalIssues) || 0;
    const completedIssues = parseInt(stats.completedIssues) || 0;
    const activeIssues = parseInt(stats.activeIssues) || 0;
    const overdueIssues = parseInt(stats.overdueIssues) || 0;
    const onTimeDelivery = parseFloat(stats.onTimeDelivery) || 0;
    const completedThisPeriod = parseInt(stats.completedThisPeriod) || completedIssues;
    const completedPriorPeriod = parseInt(stats.completedPriorPeriod) || 0;
    const taskChangePct = completedPriorPeriod > 0 
      ? Math.round(((completedThisPeriod - completedPriorPeriod) / completedPriorPeriod) * 100) 
      : 0;

    const pStats = pStatsRes.rows[0] || {};
    const totalProjects = parseInt(pStats.totalProjects) || 0;
    const completedProjects = parseInt(pStats.completedProjects) || 0;
    const inProgressProjects = parseInt(pStats.inProgressProjects) || 0;
    const activeProjects = parseInt(pStats.activeProjects) || 0;
    const onTrackProjects = parseInt(pStats.onTrackProjects) || 0;
    const atRiskProjects = parseInt(pStats.atRiskProjects) || 0;
    const offTrackProjects = parseInt(pStats.offTrackProjects) || 0;
    const overallCompletion = parseInt(pStats.overallCompletion) || 0;
    const newProjectsThisPeriod = parseInt(pStats.newProjectsThisPeriod) || 0;

    const payload = {
      stats: {
        totalIssues,
        completedIssues,
        activeIssues,
        overdueIssues,
        totalProjects,
        completedProjects,
        inProgressProjects,
        pendingProjects:
          parseInt(pStats.pendingProjects) ||
          Math.max(0, totalProjects - completedProjects - inProgressProjects),
        activeProjects,
        atRiskProjects,
        onTimeDelivery,
        overallCompletion,
        completionRate:
          totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0,
        taskChangePct,
        newProjectsThisPeriod,
      },
      velocity: velocitySeries,
      projectHealth: {
        totalProjects,
        onTrack: onTrackProjects,
        atRisk: atRiskProjects,
        offTrack: offTrackProjects,
        completed: completedProjects,
        inProgress: inProgressProjects,
        overallCompletion,
        brackets: {
          onTrack: allFormattedProjects.filter((p) => p.health === "On Track"),
          atRisk: allFormattedProjects.filter((p) => p.health === "At Risk"),
          offTrack: allFormattedProjects.filter((p) => p.health === "Off Track"),
          completed: allFormattedProjects.filter((p) => p.status === "Done"),
          inProgress: allFormattedProjects.filter(
            (p) =>
              p.status !== "Done" &&
              p.health !== "At Risk" &&
              p.health !== "Off Track",
          ),
        },
      },
      projectsToWatch: pWatchList,
      workload: workloadRes.rows,
    };

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getWorkspaceDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      "SELECT * FROM workspaces WHERE id::text = $1 OR clerk_org_id = $1",
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Workspace not found" });

    const workspace = rows[0];

    // Enforce matching with session workspace
    if (req.workspace && req.workspace.id !== workspace.id) {
      return res
        .status(403)
        .json({
          error: "Workspace ID does not match active session organization",
        });
    }

    res.json(workspace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getWorkspaceMembers = async (req, res) => {
  const { id } = req.params;
  if (
    id &&
    String(id) !== String(req.workspace.id) &&
    id !== req.workspace.clerk_org_id
  ) {
    return res
      .status(403)
      .json({ error: "Workspace ID does not match active workspace context" });
  }

  try {
    const { rows } = await db.query(
      `
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.username,
          u.avatar_url, 
          wm.role, 
          wm.created_at as joined_at,
          (
            SELECT json_build_object('id', t.id, 'title', t.title, 'status', t.status, 'priority', t.priority)
            FROM tasks t
            WHERE t.assignee_id = u.id AND t.project_id IN (SELECT id FROM projects WHERE workspace_id = $1)
            ORDER BY CASE WHEN t.status = 'In Progress' THEN 1 WHEN t.status = 'Todo' THEN 2 ELSE 3 END, t.updated_at DESC
            LIMIT 1
          ) as current_task,
          (
            SELECT COUNT(*)::int
            FROM tasks t
            WHERE t.assignee_id = u.id AND t.project_id IN (SELECT id FROM projects WHERE workspace_id = $1) AND t.status != 'Done'
          ) as active_tasks_count
        FROM workspace_members wm
        JOIN users u ON wm.user_id = u.id
        WHERE wm.workspace_id = $1
        ORDER BY wm.created_at ASC
      `,
      [req.workspace.id],
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateWorkspaceMemberRole = async (req, res) => {
  const { id, userId } = req.params;
  const { role } = req.body;

  if (
    id &&
    String(id) !== String(req.workspace.id) &&
    id !== req.workspace.clerk_org_id
  ) {
    return res
      .status(403)
      .json({ error: "Workspace ID does not match active workspace context" });
  }

  // Validate role
  const validRoles = [
    "Owner",
    "Admin",
    "Project Manager",
    "Team Lead",
    "Member",
    "Viewer",
    "Guest",
  ];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('ws_members_' || $1))", [req.workspace.id]);

    const memberCheck = await client.query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [req.workspace.id, userId],
    );
    if (memberCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Member not found in workspace" });
    }
    const currentRole = memberCheck.rows[0].role;

    // Block Owner changes except by Owner
    if (
      (currentRole === "Owner" || role === "Owner") &&
      req.workspaceRole !== "Owner"
    ) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "Only Owners can modify Owner roles" });
    }

    // Block last-Owner demotion
    if (currentRole === "Owner" && role !== "Owner") {
      const ownerCount = await client.query(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND role = $2",
        [req.workspace.id, "Owner"],
      );
      if (parseInt(ownerCount.rows[0].count, 10) <= 1) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Cannot demote the last Owner of the workspace" });
      }
    }

    const { rows } = await client.query(
      `UPDATE workspace_members
       SET role = $1
       WHERE workspace_id = $2 AND user_id = $3
       RETURNING *`,
      [role, req.workspace.id, userId],
    );

    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(error);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

exports.removeWorkspaceMember = async (req, res) => {
  const { id, userId } = req.params;

  if (
    id &&
    String(id) !== String(req.workspace.id) &&
    id !== req.workspace.clerk_org_id
  ) {
    return res
      .status(403)
      .json({ error: "Workspace ID does not match active workspace context" });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('ws_members_' || $1))", [req.workspace.id]);

    const userRes = await client.query(
      "SELECT clerk_user_id FROM users WHERE id = $1",
      [userId],
    );
    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }
    const clerkUserId = userRes.rows[0].clerk_user_id;

    const memberCheck = await client.query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [req.workspace.id, userId],
    );
    if (memberCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Member not found in workspace" });
    }

    if (memberCheck.rows[0].role === "Owner") {
      const ownerCount = await client.query(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND role = $2",
        [req.workspace.id, "Owner"],
      );
      if (parseInt(ownerCount.rows[0].count, 10) <= 1) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Cannot remove the last Owner of the workspace" });
      }
    }

    if (req.workspace.clerk_org_id) {
      try {
        const { clerkClient } = require("@clerk/express");
        await clerkClient.organizations.deleteOrganizationMembership({
          organizationId: req.workspace.clerk_org_id,
          userId: clerkUserId,
        });
      } catch (clerkErr) {
        // handle clerk-already-gone
        if (clerkErr.status === 404) {
          console.log(
            "User already removed from Clerk organization, proceeding to remove from local DB.",
          );
        } else {
          console.error(
            "Failed to remove user from Clerk Organization:",
            clerkErr,
          );
        }
      }
    }

    // 1. Clean up project memberships for this workspace
    await client.query(
      `DELETE FROM project_members pm
       USING projects p
       WHERE pm.project_id = p.id AND p.workspace_id = $1 AND pm.user_id = $2`,
      [req.workspace.id, userId],
    );

    // 2. Unassign tasks in this workspace
    await client.query(
      `UPDATE tasks t
       SET assignee_id = NULL
       FROM projects p
       WHERE t.project_id = p.id AND p.workspace_id = $1 AND t.assignee_id = $2`,
      [req.workspace.id, userId],
    );

    // 3. Clear project lead in this workspace
    await client.query(
      "UPDATE projects SET lead_id = NULL WHERE workspace_id = $1 AND lead_id = $2",
      [req.workspace.id, userId],
    );

    // 4. Remove from workspace_members
    await client.query(
      "DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [req.workspace.id, userId],
    );

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(error);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

exports.transferWorkspaceOwnership = async (req, res) => {
  if (!req.workspace) {
    return res.status(404).json({ error: "No active workspace context" });
  }

  // Personal workspaces cannot be transferred
  if (!req.workspace.clerk_org_id) {
    return res
      .status(400)
      .json({ error: "Personal workspaces cannot be transferred" });
  }

  const { newOwnerId, leaveWorkspace } = req.body;
  if (!newOwnerId) {
    return res.status(400).json({ error: "newOwnerId is required" });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('ws_members_' || $1))",
      [req.workspace.id],
    );

    // Verify current user is owner/admin
    const isOwner =
      req.workspace.owner_id === req.user.id ||
      req.workspaceRole === "Owner" ||
      req.auth?.orgRole === "org:admin";

    if (!isOwner) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "Only the workspace owner can transfer ownership" });
    }

    // Verify target member is in workspace
    const memberCheck = await client.query(
      "SELECT user_id, role FROM workspace_members WHERE workspace_id = $1 AND (user_id = $2 OR user_id = (SELECT id FROM users WHERE clerk_user_id = $2))",
      [req.workspace.id, String(newOwnerId)],
    );

    if (memberCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Target team member not found in workspace" });
    }

    const targetUserId = memberCheck.rows[0].user_id;

    if (targetUserId === req.user.id) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Cannot transfer ownership to yourself" });
    }

    // 1. Demote any existing owners in this workspace to 'Admin'
    await client.query(
      "UPDATE workspace_members SET role = 'Admin' WHERE workspace_id = $1 AND role = 'Owner'",
      [req.workspace.id],
    );

    // 2. Promote new owner to Owner in workspace_members
    await client.query(
      "UPDATE workspace_members SET role = 'Owner' WHERE workspace_id = $1 AND user_id = $2",
      [req.workspace.id, targetUserId],
    );

    // 3. Update workspace owner_id in workspaces table
    await client.query(
      "UPDATE workspaces SET owner_id = $1, updated_at = NOW() WHERE id = $2",
      [targetUserId, req.workspace.id],
    );

    // 4. Remove current user if leaveWorkspace requested
    if (leaveWorkspace) {
      await client.query(
        "DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
        [req.workspace.id, req.user.id],
      );
    }

    await client.query("COMMIT");
    res.json({
      success: true,
      message: "Workspace ownership transferred successfully",
      newOwnerId: targetUserId,
      leftWorkspace: Boolean(leaveWorkspace),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error transferring workspace ownership:", error);
    res.status(500).json({ error: "Server error transferring ownership" });
  } finally {
    client.release();
  }
};

exports.deleteCurrentWorkspace = async (req, res) => {
  if (!req.workspace) {
    return res.status(404).json({ error: "No active workspace context" });
  }

  // Personal workspaces cannot be deleted
  if (!req.workspace.clerk_org_id) {
    return res
      .status(400)
      .json({ error: "Personal workspaces cannot be deleted" });
  }

  try {
    await db.query("DELETE FROM workspaces WHERE id = $1", [req.workspace.id]);
    res.json({
      success: true,
      message: "Workspace deleted successfully",
      deletedId: req.workspace.id,
    });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    res.status(500).json({ error: "Server error deleting workspace" });
  }
};

