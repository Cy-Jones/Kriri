const db = require("../../config/database");

/**
 * Deterministic Project & Team Intelligence Engine
 * Computes exact statistical metrics from PostgreSQL data,
 * preventing LLM hallucination of numerical facts.
 */
class AnalyticsEngine {
  /**
   * Calculate deterministic health score (0-100) and risk factors for a project
   */
  async computeProjectHealth(projectId, workspaceId) {
    // 1. Fetch project metadata
    const projRes = await db.query(
      "SELECT * FROM projects WHERE id = $1 AND workspace_id = $2",
      [projectId, workspaceId]
    );
    if (projRes.rows.length === 0) {
      throw new Error("Project not found in active workspace");
    }
    const project = projRes.rows[0];

    // 2. Fetch all tasks for this project
    const tasksRes = await db.query(
      `SELECT id, status, priority, due_date, start_date, assignee_id, completed_at, created_at 
       FROM tasks 
       WHERE project_id = $1`,
      [projectId]
    );
    const tasks = tasksRes.rows;
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
      return {
        healthScore: 100,
        healthStatus: "On Track",
        riskLevel: "Low",
        metrics: {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          unassignedTasks: 0,
          completionRate: 0,
          overdueRatio: 0,
        },
        risks: [],
      };
    }

    const now = new Date();
    const completedTasks = tasks.filter((t) => t.status === "Done" || t.status === "Completed").length;
    const inProgressTasks = tasks.filter((t) => t.status === "In Progress" || t.status === "In Review").length;
    
    const overdueTasks = tasks.filter((t) => {
      if (t.status === "Done" || t.status === "Completed") return false;
      if (!t.due_date) return false;
      return new Date(t.due_date) < now;
    }).length;

    const unassignedTasks = tasks.filter((t) => !t.assignee_id && t.status !== "Done").length;
    const highPriorityOpen = tasks.filter(
      (t) => (t.priority === "High" || t.priority === "Urgent") && t.status !== "Done"
    ).length;

    // Metric Calculations
    const completionRate = Math.round((completedTasks / totalTasks) * 100);
    const overdueRatio = Math.round((overdueTasks / totalTasks) * 100);
    const unassignedRatio = Math.round((unassignedTasks / totalTasks) * 100);

    // Deterministic Deductions
    // Base score: 100
    // Deductions:
    // - Overdue tasks: -10 points each (max -40)
    // - Unassigned open high-priority tasks: -8 points each (max -25)
    // - High overdue ratio (> 20%): -15 points
    // - Milestone deadline proximity without completion: -10 points
    let deductions = 0;
    deductions += Math.min(overdueTasks * 10, 40);
    deductions += Math.min(unassignedTasks * 5, 20);
    if (overdueRatio > 25) deductions += 15;

    // Check project target date
    let deadlineRisk = false;
    if (project.due_date) {
      const targetDate = new Date(project.due_date);
      const daysRemaining = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 7 && completionRate < 70) {
        deductions += 15;
        deadlineRisk = true;
      }
    }

    const healthScore = Math.max(10, Math.min(100, 100 - deductions));

    let healthStatus = "On Track";
    let riskLevel = "Low";

    if (healthScore < 60) {
      healthStatus = "Off Track";
      riskLevel = "Critical";
    } else if (healthScore < 80) {
      healthStatus = "At Risk";
      riskLevel = "Medium";
    }

    // Identify deterministic risks
    const risks = [];
    if (overdueTasks > 0) {
      risks.push({
        type: "Overdue Accumulation",
        severity: overdueTasks > 3 ? "High" : "Medium",
        message: `${overdueTasks} task(s) are past their scheduled due date.`,
      });
    }
    if (unassignedTasks > 2) {
      risks.push({
        type: "Unassigned Backlog",
        severity: "Medium",
        message: `${unassignedTasks} active tasks currently have no assigned team member.`,
      });
    }
    if (deadlineRisk) {
      risks.push({
        type: "Approaching Deadline",
        severity: "High",
        message: `Project target date is within 7 days with ${100 - completionRate}% of work remaining.`,
      });
    }

    return {
      healthScore,
      healthStatus,
      riskLevel,
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        unassignedTasks,
        highPriorityOpen,
        completionRate,
        overdueRatio,
        unassignedRatio,
      },
      risks,
    };
  }

  /**
   * Compute Team Workload distribution across a workspace or project
   */
  async computeTeamWorkload(workspaceId, projectId = null) {
    let query = `
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        u.avatar_url,
        COUNT(t.id) as total_assigned,
        COUNT(t.id) FILTER (WHERE t.status IN ('Todo', 'In Progress', 'In Review')) as active_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'Done') as completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status != 'Done' AND t.due_date < CURRENT_DATE) as overdue_tasks,
        COUNT(t.id) FILTER (WHERE t.priority IN ('High', 'Urgent') AND t.status != 'Done') as urgent_tasks
      FROM users u
      JOIN workspace_members wm ON u.id = wm.user_id
      LEFT JOIN (
        tasks t
        JOIN projects p ON t.project_id = p.id
      ) ON u.id = t.assignee_id AND p.workspace_id = $1
      WHERE wm.workspace_id = $1
    `;
    const params = [workspaceId];

    if (projectId) {
      query += ` AND (p.id = $2 OR p.id IS NULL)`;
      params.push(projectId);
    }

    query += ` GROUP BY u.id, u.name, u.email, u.avatar_url ORDER BY active_tasks DESC`;

    const res = await db.query(query, params);
    const members = res.rows.map((row) => {
      const activeTasks = parseInt(row.active_tasks, 10) || 0;
      let capacityStatus = "Optimal"; // 'Underallocated', 'Optimal', 'Overloaded'
      if (activeTasks >= 6) capacityStatus = "Overloaded";
      else if (activeTasks <= 1) capacityStatus = "Underallocated";

      return {
        userId: row.user_id,
        name: row.name,
        email: row.email,
        avatarUrl: row.avatar_url,
        totalAssigned: parseInt(row.total_assigned, 10) || 0,
        activeTasks,
        completedTasks: parseInt(row.completed_tasks, 10) || 0,
        overdueTasks: parseInt(row.overdue_tasks, 10) || 0,
        urgentTasks: parseInt(row.urgent_tasks, 10) || 0,
        capacityStatus,
      };
    });

    const overloadedCount = members.filter((m) => m.capacityStatus === "Overloaded").length;
    const underallocatedCount = members.filter((m) => m.capacityStatus === "Underallocated").length;

    return {
      members,
      summary: {
        totalMembers: members.length,
        overloadedCount,
        underallocatedCount,
        balanceIndex: members.length > 0 ? Math.round((1 - overloadedCount / members.length) * 100) : 100,
      },
    };
  }
}

module.exports = new AnalyticsEngine();

