const db = require("../config/database");

exports.createWorkspace = async (req, res) => {
  const { name } = req.body;
  if (!name)
    return res.status(400).json({ error: "Workspace name is required" });

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const owner_id = req.user.id;

  const { getAuth } = require("@clerk/express");
  const { orgId: clerkOrgId } = getAuth(req);

  try {
    await db.query("BEGIN");

    let workspace;
    if (clerkOrgId) {
      // Upsert by clerk_org_id
      const workspaceRes = await db.query(
        "INSERT INTO workspaces (clerk_org_id, name, slug, owner_id) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO UPDATE SET clerk_org_id = $1, name = $2 RETURNING *",
        [clerkOrgId, name, slug, owner_id],
      );
      workspace = workspaceRes.rows[0];
    } else {
      // Create without clerk_org_id
      const workspaceRes = await db.query(
        "INSERT INTO workspaces (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING *",
        [name, slug, owner_id],
      );
      workspace = workspaceRes.rows[0];
    }

    // Add owner as Owner member
    await db.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [workspace.id, owner_id, "Owner"],
    );

    await db.query("COMMIT");
    res.status(201).json(workspace);
  } catch (error) {
    await db.query("ROLLBACK");
    console.error(error);
    if (error.constraint === "workspaces_slug_key") {
      return res.status(400).json({ error: "Workspace name already exists." });
    }
    res.status(500).json({ error: "Server error" });
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
  res.json(req.workspace);
};

exports.updateCurrentWorkspace = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const { rows } = await db.query(
      "UPDATE workspaces SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [name, req.workspace.id],
    );

    // Keep Clerk in sync if it's a Clerk org
    if (req.workspace.clerk_org_id) {
      try {
        const { clerkClient } = require("@clerk/express");
        await clerkClient.organizations.updateOrganization(
          req.workspace.clerk_org_id,
          {
            name: name,
          },
        );
      } catch (err) {
        console.error("Clerk organization name sync failed:", err);
      }
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCurrentWorkspaceSummary = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });

  try {
    const wsId = req.workspace.id;
    const userId = req.user.id;

    const [projRes, statsRes, myIssuesRes, recentProjectsRes] =
      await Promise.all([
        db.query(
          `SELECT COUNT(*) FROM projects WHERE workspace_id = $1 AND status != 'Archived'`,
          [wsId],
        ),
        db.query(
          `SELECT 
           COUNT(*) FILTER (WHERE t.status = 'Todo' OR t.status = 'In Progress' OR t.status = 'In Review') as "inProgress",
           COUNT(*) FILTER (WHERE t.status = 'Done' AND t.updated_at >= NOW() - INTERVAL '7 days') as "completedLast7Days",
           COUNT(*) FILTER (WHERE t.due_date < NOW() AND t.status != 'Done') as "overdue",
           COUNT(*) FILTER (WHERE t.due_date::date = NOW()::date AND t.status != 'Done') as "dueToday"
         FROM tasks t
         JOIN projects p ON t.project_id = p.id
         WHERE p.workspace_id = $1`,
          [wsId],
        ),
        db.query(
          `SELECT t.id, t.title, t.status, t.priority, t.due_date, p.slug as project_slug
         FROM tasks t
         JOIN projects p ON t.project_id = p.id
         WHERE p.workspace_id = $1 AND t.assignee_id = $2 AND t.status != 'Done'
         ORDER BY t.priority DESC, t.due_date ASC NULLS LAST
         LIMIT 10`,
          [wsId, userId],
        ),
        db.query(
          `SELECT p.id, p.name, p.slug, p.status, p.health, p.updated_at
         FROM projects p
         WHERE p.workspace_id = $1
         ORDER BY p.updated_at DESC
         LIMIT 4`,
          [wsId],
        ),
      ]);

    const payload = {
      activeProjectCount: parseInt(projRes.rows[0].count),
      stats: {
        inProgress: parseInt(statsRes.rows[0].inProgress),
        completedLast7Days: parseInt(statsRes.rows[0].completedLast7Days),
        overdue: parseInt(statsRes.rows[0].overdue),
        dueToday: parseInt(statsRes.rows[0].dueToday),
      },
      myIssues: myIssuesRes.rows,
      recentProjects: recentProjectsRes.rows,
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
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await db.query(
      `SELECT 
         n.*,
         u.name as actor_name,
         u.avatar_url as actor_avatar,
         p.name as project_name,
         p.identifier as project_identifier,
         t.title as task_title
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
  const userId = req.auth?.userId;

  try {
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = $1 AND user_id = $2 AND workspace_id = $3
       RETURNING *`,
      [id, userId, req.workspace.id],
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
  const userId = req.auth?.userId;

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

exports.getCurrentWorkspaceAnalytics = async (req, res) => {
  if (!req.workspace)
    return res.status(404).json({ error: "No active workspace context" });

  try {
    const wsId = req.workspace.id;

    // 1. Completion rate & total stats
    const statsRes = await db.query(
      `SELECT 
         COUNT(*) as "totalIssues",
         COUNT(*) FILTER (WHERE t.status = 'Done') as "completedIssues",
         COUNT(*) FILTER (WHERE t.status != 'Done' AND t.status != 'Canceled') as "activeIssues"
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.workspace_id = $1`,
      [wsId],
    );

    // 2. Issue completion over time (last 30 days)
    const trendRes = await db.query(
      `SELECT 
         DATE(t.updated_at) as date,
         COUNT(*) as count
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.workspace_id = $1 AND t.status = 'Done' AND t.updated_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(t.updated_at)
       ORDER BY date ASC`,
      [wsId],
    );

    // 3. Workload by user
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

    const payload = {
      stats: {
        totalIssues: parseInt(statsRes.rows[0].totalIssues),
        completedIssues: parseInt(statsRes.rows[0].completedIssues),
        activeIssues: parseInt(statsRes.rows[0].activeIssues),
        completionRate:
          statsRes.rows[0].totalIssues > 0
            ? Math.round(
                (parseInt(statsRes.rows[0].completedIssues) /
                  parseInt(statsRes.rows[0].totalIssues)) *
                  100,
              )
            : 0,
      },
      completionTrend: trendRes.rows,
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
  try {
    const { rows } = await db.query(
      `
        SELECT u.id, u.name, u.email, u.avatar_url, wm.role, wm.created_at as joined_at
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
  const { userId } = req.params;
  const { role } = req.body;

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

  try {
    const memberCheck = await db.query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [req.workspace.id, userId],
    );
    if (memberCheck.rows.length === 0)
      return res.status(404).json({ error: "Member not found in workspace" });
    const currentRole = memberCheck.rows[0].role;

    // Block Owner changes except by Owner
    if (
      (currentRole === "Owner" || role === "Owner") &&
      req.workspaceRole !== "Owner"
    ) {
      return res
        .status(403)
        .json({ error: "Only Owners can modify Owner roles" });
    }

    // Block last-Owner demotion
    if (currentRole === "Owner" && role !== "Owner") {
      const ownerCount = await db.query(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND role = $2",
        [req.workspace.id, "Owner"],
      );
      if (parseInt(ownerCount.rows[0].count) <= 1) {
        return res
          .status(400)
          .json({ error: "Cannot demote the last Owner of the workspace" });
      }
    }

    const { rows } = await db.query(
      `
      UPDATE workspace_members
      SET role = $1
      WHERE workspace_id = $2 AND user_id = $3
      RETURNING *
    `,
      [role, req.workspace.id, userId],
    );

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.removeWorkspaceMember = async (req, res) => {
  const { userId } = req.params;

  try {
    const userRes = await db.query(
      "SELECT clerk_user_id FROM users WHERE id = $1",
      [userId],
    );
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    const clerkUserId = userRes.rows[0].clerk_user_id;

    const memberCheck = await db.query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [req.workspace.id, userId],
    );
    if (memberCheck.rows.length === 0)
      return res.status(404).json({ error: "Member not found in workspace" });

    if (memberCheck.rows[0].role === "Owner") {
      const ownerCount = await db.query(
        "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND role = $2",
        [req.workspace.id, "Owner"],
      );
      if (parseInt(ownerCount.rows[0].count) <= 1) {
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

    await db.query(
      "DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [req.workspace.id, userId],
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
