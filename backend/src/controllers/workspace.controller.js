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

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    let workspace;
    if (clerkOrgId) {
      // Upsert by clerk_org_id
      const workspaceRes = await client.query(
        "INSERT INTO workspaces (clerk_org_id, name, slug, owner_id) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO UPDATE SET clerk_org_id = $1, name = $2 RETURNING *",
        [clerkOrgId, name, slug, owner_id],
      );
      workspace = workspaceRes.rows[0];
    } else {
      // Create without clerk_org_id
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

    const [
      projRes,
      statsRes,
      myIssuesRes,
      recentProjectsRes,
      upcomingMilestonesRes,
      milestoneStatsRes,
      priorityRes,
      healthRes,
    ] = await Promise.all([
      db.query(
        `SELECT 
             COUNT(*) as "count",
             COUNT(*) FILTER (WHERE status = 'Done') as "completed",
             COUNT(*) FILTER (WHERE status = 'In Progress') as "inProgress",
             COUNT(*) FILTER (WHERE status = 'Planned' OR (status != 'Done' AND status != 'In Progress')) as "pending"
           FROM projects WHERE workspace_id = $1 AND status != 'Archived'`,
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
        `SELECT t.id, t.title, t.status, t.priority, t.due_date, p.slug as project_slug, p.identifier as project_identifier
          FROM tasks t
          JOIN projects p ON t.project_id = p.id
          WHERE p.workspace_id = $1 AND t.assignee_id = $2 AND t.status != 'Done'
          ORDER BY t.priority DESC, t.due_date ASC NULLS LAST
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
      db.query(
        `SELECT 
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
        `SELECT 
           COUNT(*) as "total",
           COUNT(*) FILTER (WHERE health = 'On Track') as "onTrack",
           COUNT(*) FILTER (WHERE health = 'At Risk') as "atRisk",
           COUNT(*) FILTER (WHERE health = 'Off Track') as "offTrack"
         FROM projects
         WHERE workspace_id = $1 AND status != 'Archived'`,
        [wsId],
      ),
    ]);

    const totalMilestones = parseInt(milestoneStatsRes.rows[0]?.total || 0);
    const completedMilestones = parseInt(milestoneStatsRes.rows[0]?.completed || 0);
    const inProgressMilestones = parseInt(milestoneStatsRes.rows[0]?.in_progress || 0);
    const pendingMilestones = parseInt(milestoneStatsRes.rows[0]?.pending || 0);

    const totalProjectsCount = parseInt(healthRes.rows[0]?.total || projRes.rows[0].count) || 0;
    const onTrackCount = parseInt(healthRes.rows[0]?.onTrack || 0);
    const atRiskCount = parseInt(healthRes.rows[0]?.atRisk || 0);
    const offTrackCount = parseInt(healthRes.rows[0]?.offTrack || 0);
    const onTrackRate = totalProjectsCount > 0 ? Math.round((onTrackCount / totalProjectsCount) * 100) : 100;

    const totalActiveTasks = parseInt(priorityRes.rows[0]?.totalActive || 0);
    const urgentTasks = parseInt(priorityRes.rows[0]?.urgent || 0);
    const highTasks = parseInt(priorityRes.rows[0]?.high || 0);
    const mediumTasks = parseInt(priorityRes.rows[0]?.medium || 0);
    const lowTasks = parseInt(priorityRes.rows[0]?.low || 0);

    const payload = {
      activeProjectCount: parseInt(projRes.rows[0].count),
      stats: {
        inProgress: parseInt(statsRes.rows[0].inProgress),
        completedLast7Days: parseInt(statsRes.rows[0].completedLast7Days),
        overdue: parseInt(statsRes.rows[0].overdue),
        dueToday: parseInt(statsRes.rows[0].dueToday),
        totalProjects: parseInt(projRes.rows[0].count) || 0,
        completedProjects: parseInt(projRes.rows[0].completed) || 0,
        inProgressProjects: parseInt(projRes.rows[0].inProgress) || 0,
        pendingProjects: parseInt(projRes.rows[0].pending) || 0,
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

    // 4. Real Velocity Buckets Generator for 7d, 30d, 90d
    const tVelocityRows = await db.query(
      `SELECT 
         t.id as task_id,
         t.title as task_title,
         t.priority as task_priority,
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
       WHERE p.workspace_id = $1 AND (t.updated_at >= NOW() - INTERVAL '90 days' OR t.created_at >= NOW() - INTERVAL '90 days')`,
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
       WHERE p.workspace_id = $1 AND p.updated_at >= NOW() - INTERVAL '90 days' AND p.status = 'Done'`,
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

        const mapTask = (r) => ({
          id: r.task_id,
          title: r.task_title,
          priority: r.task_priority || "Medium",
          status: r.status,
          projectId: r.project_id,
          projectName: r.project_name,
          projectIdentifier: r.project_identifier,
          taskIdentifier: r.project_identifier ? `${r.project_identifier}-${r.task_id}` : `TASK-${r.task_id}`,
        });

        const completedTasks = completedTaskRows.map(mapTask);
        const createdTasks = createdTaskRows.map(mapTask);

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
            completedTasks,
            createdTasks,
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
