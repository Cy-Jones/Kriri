const db = require("../../config/database");
const analyticsEngine = require("./analytics.engine");
const { taskSchema, milestoneSchema } = require("../../validators");
const { getIO, safeGetIO } = require("../../socket");
const { generateProjectSlug, generateProjectIdentifier } = require("../../utils/slug");

function safeEmit(event, data, room) {
  try {
    const io = typeof safeGetIO === "function" ? safeGetIO() : null;
    if (io) {
      if (room) {
        io.to(room).emit(event, data);
      } else {
        io.emit(event, data);
      }
    }
  } catch (err) {
    // Non-fatal socket broadcast error
  }
}

/**
 * Agentic Tool Execution Service with Human-in-the-Loop Security Architecture
 */
class AgentService {
  constructor() {
    this.definitions = [
      {
        type: "function",
        function: {
          name: "create_project",
          description: "Create a new project in the active workspace with name, description, priority, dates, and optional lead.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Title/name of the project (e.g. Design System & UI Library)" },
              description: { type: "string", description: "Detailed project scope and requirements" },
              priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"], description: "Project priority" },
              status: { type: "string", enum: ["Planning", "Planned", "In Progress", "In Review", "Paused", "Done", "Completed", "Backlog", "Canceled"], description: "Initial status" },
              start_date: { type: "string", description: "YYYY-MM-DD start date" },
              due_date: { type: "string", description: "YYYY-MM-DD target delivery date" },
              labels: { type: "array", items: { type: "string" }, description: "Functional category labels" },
            },
            required: ["name"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_project_overview",
          description: "Get the current health, status, dates, and metrics for a project (or active project if project_id is omitted).",
          parameters: {
            type: "object",
            properties: {
              project_id: { type: "number", description: "The ID of the project (optional)" },
              project_name: { type: "string", description: "Optional name of the project" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_project_tasks",
          description: "Get all tasks for a project filtered by status or priority.",
          parameters: {
            type: "object",
            properties: {
              project_id: { type: "number", description: "The ID of the project" },
              status: { type: "string", enum: ["Todo", "In Progress", "In Review", "Done"], description: "Optional status filter" },
            },
            required: ["project_id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_overdue_tasks",
          description: "List all open tasks that have passed their scheduled due date.",
          parameters: {
            type: "object",
            properties: {
              project_id: { type: "number", description: "The ID of the project" },
            },
            required: ["project_id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_team_workload",
          description: "Get current workload, capacity, and active task distribution across team members.",
          parameters: {
            type: "object",
            properties: {
              project_id: { type: "number", description: "Optional project ID" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_task",
          description: "Propose creating a new task in the project. Requires user approval before database execution.",
          parameters: {
            type: "object",
            properties: {
              project_id: { type: "number", description: "The ID of the project" },
              title: { type: "string", description: "Title of the task" },
              description: { type: "string", description: "Detailed task description" },
              priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"], description: "Task priority" },
              due_date: { type: "string", description: "YYYY-MM-DD due date" },
              assignee_id: { type: "number", description: "User ID of the assignee" },
            },
            required: ["project_id", "title"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "update_task",
          description: "Propose updating an existing task status, priority, or assignee. Requires user approval.",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "number", description: "The ID of the task to update" },
              status: { type: "string", enum: ["Todo", "In Progress", "In Review", "Done"] },
              priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] },
              assignee_id: { type: "number", description: "User ID to assign to" },
              assignee_name: { type: "string", description: "Name of the team member to assign to (e.g. Mariama Barry)" },
            },
            required: ["task_id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "assign_task",
          description: "Assign an issue or task to a team member by task_id and assignee_id or assignee_name.",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "number", description: "The ID of the task to assign" },
              assignee_id: { type: "number", description: "The User ID of the team member" },
              assignee_name: { type: "string", description: "The name of the team member to assign to (e.g. Mariama Barry)" },
            },
            required: ["task_id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "list_workspace_tasks",
          description: "List or search issues/tasks in the workspace with optional filters (created_today, status, assignee_name, query).",
          parameters: {
            type: "object",
            properties: {
              created_today: { type: "boolean", description: "Filter only tasks created today" },
              status: { type: "string", enum: ["Todo", "In Progress", "In Review", "Done"] },
              assignee_name: { type: "string", description: "Filter by assignee name" },
              query: { type: "string", description: "Search keyword matching title or description" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "delete_task",
          description: "Permanently delete an issue/task from the workspace by numeric task_id or title.",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "number", description: "The numeric database ID of the task to delete" },
              task_title: { type: "string", description: "Optional title or name of the task to delete if task_id is unknown" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "delete_project",
          description: "Permanently delete a project and all associated tasks from the workspace by project_id or name.",
          parameters: {
            type: "object",
            properties: {
              project_id: { type: "number", description: "The numeric database ID of the project to delete" },
              project_name: { type: "string", description: "The name of the project to delete if project_id is unknown" },
            },
          },
        },
      },
    ];
  }

  getToolDefinitions() {
    return this.definitions;
  }

  /**
   * Determine if a tool modifies application state and requires user confirmation
   */
  isModifyingTool(toolName) {
    const modifyingTools = [
      "create_project",
      "create_task",
      "update_task",
      "delete_task",
      "delete_project",
      "create_milestone",
      "assign_task",
    ];
    return modifyingTools.includes(toolName);
  }

  /**
   * Execute a verified read tool or execute an approved write tool
   */
  async executeTool(toolName, args = {}, { workspaceId, userId, userRole, conversationId, isApproved = false, accessMode = "read_write" }) {
    const startTime = Date.now();
    let result = null;
    let executionStatus = "success";
    let errorMessage = null;

    try {
      // 1. Check workspace permissions
      if (!workspaceId) {
        throw new Error("Active workspace context required.");
      }

      const ROLE_HIERARCHY = {
        Owner: 70,
        Admin: 60,
        "Project Manager": 50,
        "Team Lead": 40,
        Member: 30,
        Viewer: 20,
        Guest: 10,
      };
      if (userRole && this.isModifyingTool(toolName)) {
        const userLevel = ROLE_HIERARCHY[userRole] || 0;
        if (toolName === "delete_project" && userLevel < 50) {
          throw new Error("Insufficient permissions: Project Manager role required to delete projects.");
        }
        if (userLevel < 30) {
          throw new Error("Insufficient permissions: Member role required to execute modifications.");
        }
      }

      // Check access mode: If read_only, block modifying tools immediately
      if (accessMode === "read_only" && this.isModifyingTool(toolName)) {
        return {
          blocked: true,
          access_denied: true,
          message: `Action blocked: AI access is currently set to Read-only. Switch to "Read & Write" access to create or modify workspace items.`,
        };
      }

      // 2. Modifying tool guard: If not approved, return a pending proposal card
      if (this.isModifyingTool(toolName) && !isApproved) {
        // Record pending proposal in audit log
        await db.query(
          `INSERT INTO ai_action_logs (workspace_id, project_id, user_id, conversation_id, tool_name, tool_args, approval_required, approval_status, execution_status)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'pending', 'blocked')`,
          [workspaceId, args.project_id || null, userId, conversationId || null, toolName, JSON.stringify(args)]
        );

        return {
          requires_approval: true,
          tool_name: toolName,
          tool_args: args,
          message: `Action requires user confirmation: ${toolName}`,
        };
      }

      // 3. Dispatch tool execution
      switch (toolName) {
        case "get_project_overview": {
          let targetProjectId = args.project_id;
          if (!targetProjectId && args.project_name) {
            const pMatch = await db.query(
              `SELECT id FROM projects WHERE workspace_id = $1 AND (name ILIKE $2 OR slug ILIKE $2) LIMIT 1`,
              [workspaceId, `%${args.project_name}%`]
            );
            if (pMatch.rows.length > 0) targetProjectId = pMatch.rows[0].id;
          }
          if (!targetProjectId) {
            const pRecent = await db.query(
              `SELECT id FROM projects WHERE workspace_id = $1 ORDER BY updated_at DESC, created_at DESC LIMIT 1`,
              [workspaceId]
            );
            if (pRecent.rows.length > 0) targetProjectId = pRecent.rows[0].id;
          }
          if (!targetProjectId) {
            throw new Error("No projects found in active workspace to inspect.");
          }
          const health = await analyticsEngine.computeProjectHealth(targetProjectId, workspaceId);
          result = health;
          break;
        }

        case "get_project_tasks": {
          let q = `SELECT t.id, t.title, t.status, t.priority, t.due_date, u.name as assignee_name
                   FROM tasks t
                   JOIN projects p ON t.project_id = p.id
                   LEFT JOIN users u ON t.assignee_id = u.id
                   WHERE p.id = $1 AND p.workspace_id = $2`;
          const params = [args.project_id, workspaceId];
          if (args.status) {
            q += ` AND t.status = $3`;
            params.push(args.status);
          }
          q += ` ORDER BY t.created_at DESC LIMIT 50`;
          const res = await db.query(q, params);
          result = { tasks: res.rows };
          break;
        }

        case "get_overdue_tasks": {
          const res = await db.query(
            `SELECT t.id, t.title, t.status, t.priority, t.due_date, u.name as assignee_name
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             LEFT JOIN users u ON t.assignee_id = u.id
             WHERE p.id = $1 AND p.workspace_id = $2 AND t.status != 'Done' AND t.due_date < CURRENT_DATE
             ORDER BY t.due_date ASC`,
            [args.project_id, workspaceId]
          );
          result = { overdue_tasks: res.rows };
          break;
        }

        case "get_team_workload": {
          result = await analyticsEngine.computeTeamWorkload(workspaceId, args.project_id || null);
          break;
        }

        case "create_project": {
          const { name, description, short_summary, priority, status, start_date, due_date, labels } = args;
          if (!name || typeof name !== "string") {
            throw new Error("Project name is required.");
          }

          const client = await db.pool.connect();
          try {
            await client.query("BEGIN");
            await client.query("SELECT pg_advisory_xact_lock(hashtext('project_create_' || $1))", [workspaceId]);
            const slug = await generateProjectSlug(name, workspaceId, client);

            const userRes = await client.query("SELECT name FROM users WHERE id = $1", [userId]);
            const userName = userRes.rows[0]?.name || "USR";
            const identifier = await generateProjectIdentifier(workspaceId, userName, client);

            const pRes = await client.query(
              `INSERT INTO projects (
                workspace_id, owner_id, name, slug, identifier, description, short_summary, status, health, priority, start_date, due_date, lead_id, labels, progress
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
              [
                workspaceId,
                userId,
                name,
                slug,
                identifier,
                description || `${name} initiative`,
                short_summary || name,
                status || "Planning",
                "On Track",
                priority || "Medium",
                start_date || new Date().toISOString().split("T")[0],
                due_date || null,
                userId,
                JSON.stringify(labels || ["Engineering"]),
                0,
              ]
            );
            await client.query("COMMIT");
            const createdProj = pRes.rows[0];

            safeEmit("PROJECT_CREATED", createdProj);
            safeEmit("PROJECT_CREATED", createdProj, `workspace_${workspaceId}`);

            result = { success: true, created_project: createdProj };
          } catch (e) {
            await client.query("ROLLBACK");
            throw e;
          } finally {
            client.release();
          }
          break;
        }

        case "create_task": {
          let targetProjectId = args.project_id;
          if (!targetProjectId) {
            if (args.project_name) {
              const pByName = await db.query(
                "SELECT id FROM projects WHERE workspace_id = $1 AND name ILIKE $2 LIMIT 1",
                [workspaceId, `%${args.project_name}%`]
              );
              if (pByName.rows.length > 0) targetProjectId = pByName.rows[0].id;
            }
            if (!targetProjectId) {
              const pRecent = await db.query(
                "SELECT id FROM projects WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1",
                [workspaceId]
              );
              if (pRecent.rows.length > 0) {
                targetProjectId = pRecent.rows[0].id;
              }
            }
          }

          // When target project is missing: Issues MUST be linked to a project
          if (!targetProjectId) {
            const projCountRes = await db.query(
              "SELECT count(*)::int as count FROM projects WHERE workspace_id = $1",
              [workspaceId]
            );
            const totalProj = projCountRes.rows[0]?.count || 0;
            if (totalProj === 0) {
              return {
                requires_project: true,
                error: "No active projects found in workspace.",
                message: "Issues must be linked to a project, but there are currently no projects in this workspace.",
                suggested_action: "create_project",
                pending_task: {
                  title: args.title,
                  description: args.description || null,
                  priority: args.priority || "Medium",
                },
              };
            }
            throw new Error("Please specify which project to link this issue to.");
          }

          const validated = taskSchema.parse({
            ...args,
            project_id: targetProjectId,
          });
          const insRes = await db.query(
            `INSERT INTO tasks (project_id, title, description, priority, due_date, assignee_id, reporter_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
              validated.project_id,
              validated.title,
              validated.description || null,
              validated.priority || "Medium",
              validated.due_date || null,
              validated.assignee_id || null,
              userId,
              validated.status || "Todo",
            ]
          );
          const createdTask = insRes.rows[0];

          // Broadcast real-time socket event
          safeEmit("TASK_CREATED", createdTask);
          safeEmit("TASK_CREATED", createdTask, `workspace_${workspaceId}`);

          result = { success: true, created_task: createdTask };
          break;
        }

        case "update_task": {
          // Verify task in workspace
          const taskRes = await db.query(
            `SELECT t.* FROM tasks t
             JOIN projects p ON t.project_id = p.id
             WHERE t.id = $1 AND p.workspace_id = $2`,
            [args.task_id, workspaceId]
          );
          if (taskRes.rows.length === 0) {
            throw new Error("Task not found in active workspace.");
          }

          const updates = [];
          const values = [args.task_id];
          let idx = 2;

          if (args.status) {
            updates.push(`status = $${idx++}`);
            values.push(args.status);
            if (args.status === "Done") {
              updates.push(`completed_at = CURRENT_TIMESTAMP`);
            }
          }
          if (args.priority) {
            updates.push(`priority = $${idx++}`);
            values.push(args.priority);
          }

          let resolvedAssigneeId = args.assignee_id;
          if (resolvedAssigneeId === undefined && args.assignee_name) {
            const mMatch = await db.query(
              `SELECT u.id, u.name FROM workspace_members wm
               JOIN users u ON wm.user_id = u.id
               WHERE wm.workspace_id = $1 AND (u.name ILIKE $2 OR u.email ILIKE $2)
               LIMIT 1`,
              [workspaceId, `%${args.assignee_name}%`]
            );
            if (mMatch.rows.length > 0) {
              resolvedAssigneeId = mMatch.rows[0].id;
            }
          }

          if (resolvedAssigneeId !== undefined) {
            updates.push(`assignee_id = $${idx++}`);
            values.push(resolvedAssigneeId);
          }

          if (updates.length === 0) {
            throw new Error("No update fields provided.");
          }

          const updateQ = `UPDATE tasks SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
          const upRes = await db.query(updateQ, values);
          const updatedTask = upRes.rows[0];

          // Broadcast real-time update
          safeEmit("TASK_UPDATED", updatedTask);
          safeEmit("TASK_UPDATED", updatedTask, `workspace_${workspaceId}`);

          result = { success: true, updated_task: updatedTask };
          break;
        }

        case "assign_task": {
          let targetTaskId = args.task_id;
          if (!targetTaskId) {
            const recent = await db.query(
              `SELECT t.id FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.workspace_id = $1 ORDER BY t.created_at DESC LIMIT 1`,
              [workspaceId]
            );
            if (recent.rows.length > 0) targetTaskId = recent.rows[0].id;
          }
          if (!targetTaskId) throw new Error("Task ID required.");

          let targetUserId = args.assignee_id;
          let assigneeName = args.assignee_name;
          if (!targetUserId && assigneeName) {
            const clean = assigneeName.replace(/^@/, "").trim();
            // 1. Try exact username or email match first
            let uRes = await db.query(
              `SELECT u.id, u.name FROM workspace_members wm
               JOIN users u ON wm.user_id = u.id
               WHERE wm.workspace_id = $1 AND (u.username ILIKE $2 OR u.email ILIKE $2)
               LIMIT 1`,
              [workspaceId, clean]
            );
            // 2. Try contains match on username/email or name
            if (uRes.rows.length === 0) {
              uRes = await db.query(
                `SELECT u.id, u.name FROM workspace_members wm
                 JOIN users u ON wm.user_id = u.id
                 WHERE wm.workspace_id = $1 AND (u.username ILIKE $2 OR u.email ILIKE $2 OR u.name ILIKE $2)
                 ORDER BY (CASE WHEN u.username ILIKE $2 OR u.email ILIKE $2 THEN 0 ELSE 1 END) ASC
                 LIMIT 1`,
                [workspaceId, `%${clean}%`]
              );
            }
            if (uRes.rows.length > 0) {
              targetUserId = uRes.rows[0].id;
              assigneeName = uRes.rows[0].name;
            } else {
              // Direct lookup in users table
              const directUser = await db.query(
                `SELECT id, name FROM users WHERE username ILIKE $1 OR email ILIKE $1 OR name ILIKE $1 ORDER BY (CASE WHEN username ILIKE $1 OR email ILIKE $1 THEN 0 ELSE 1 END) ASC LIMIT 1`,
                [`%${clean}%`]
              );
              if (directUser.rows.length > 0) {
                targetUserId = directUser.rows[0].id;
                assigneeName = directUser.rows[0].name;
              }
            }
          }
          if (!targetUserId) throw new Error(`Could not find team member "${assigneeName || 'unspecified'}" in workspace.`);

          const upRes = await db.query(
            `UPDATE tasks SET assignee_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [targetUserId, targetTaskId]
          );
          if (upRes.rows.length === 0) throw new Error("Task not found.");
          const updatedTask = upRes.rows[0];

          // Fetch project name for richer context
          const pLookup = await db.query(`SELECT name FROM projects WHERE id = $1`, [updatedTask.project_id]);
          if (pLookup.rows.length > 0) {
            updatedTask.project_name = pLookup.rows[0].name;
          }

          safeEmit("TASK_UPDATED", updatedTask);
          safeEmit("TASK_UPDATED", updatedTask, `workspace_${workspaceId}`);

          result = { success: true, updated_task: updatedTask, assigned_to: assigneeName || `User #${targetUserId}` };
          break;
        }

        case "list_workspace_tasks": {
          let q = `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.created_at,
                          p.name as project_name, u.name as assignee_name
                   FROM tasks t
                   JOIN projects p ON t.project_id = p.id
                   LEFT JOIN users u ON t.assignee_id = u.id
                   WHERE p.workspace_id = $1`;
          const params = [workspaceId];
          let pIdx = 2;

          if (args.created_today) {
            // Include tasks created in the last 24 hours or today to handle timezone boundaries smoothly
            q += ` AND (t.created_at >= CURRENT_DATE OR t.created_at >= (NOW() - INTERVAL '24 hours'))`;
          }
          if (args.status) {
            q += ` AND t.status = $${pIdx++}`;
            params.push(args.status);
          }
          if (args.assignee_name) {
            q += ` AND u.name ILIKE $${pIdx++}`;
            params.push(`%${args.assignee_name}%`);
          }
          if (args.query) {
            q += ` AND (t.title ILIKE $${pIdx} OR t.description ILIKE $${pIdx})`;
            params.push(`%${args.query}%`);
            pIdx++;
          }
          q += ` ORDER BY t.created_at DESC LIMIT 50`;

          const tRows = await db.query(q, params);
          result = { tasks: tRows.rows, count: tRows.rows.length };
          break;
        }

        case "delete_task": {
          let targetTaskId = args.task_id;
          if (!targetTaskId && args.task_title) {
            const cleanTitle = String(args.task_title).replace(/^#/, "").trim();
            const numericId = parseInt(cleanTitle, 10);
            if (!isNaN(numericId) && String(numericId) === cleanTitle) {
              targetTaskId = numericId;
            } else {
              const tMatch = await db.query(
                `SELECT t.id, t.title FROM tasks t
                 JOIN projects p ON t.project_id = p.id
                 WHERE p.workspace_id = $1 AND t.title ILIKE $2
                 ORDER BY t.created_at DESC LIMIT 1`,
                [workspaceId, `%${cleanTitle}%`]
              );
              if (tMatch.rows.length > 0) {
                targetTaskId = tMatch.rows[0].id;
              }
            }
          }

          if (!targetTaskId) {
            throw new Error("Please specify the task ID or task title to delete.");
          }

          const delRes = await db.query(
            `DELETE FROM tasks t
             USING projects p
             WHERE t.id = $1 AND t.project_id = p.id AND p.workspace_id = $2
             RETURNING t.*`,
            [targetTaskId, workspaceId]
          );

          if (delRes.rows.length === 0) {
            throw new Error(`Task #${targetTaskId} not found in active workspace.`);
          }

          const deletedTask = delRes.rows[0];
          safeEmit("TASK_DELETED", targetTaskId);
          safeEmit("TASK_DELETED", targetTaskId, `workspace_${workspaceId}`);

          result = { success: true, deleted_task: deletedTask };
          break;
        }

        case "delete_project": {
          let targetProjectId = args.project_id;
          if (!targetProjectId && args.project_name) {
            const cleanName = String(args.project_name).trim();
            const pMatch = await db.query(
              `SELECT id, name FROM projects
               WHERE workspace_id = $1 AND (name ILIKE $2 OR slug ILIKE $2 OR identifier ILIKE $2)
               ORDER BY created_at DESC LIMIT 1`,
              [workspaceId, `%${cleanName}%`]
            );
            if (pMatch.rows.length > 0) {
              targetProjectId = pMatch.rows[0].id;
            }
          }

          if (!targetProjectId) {
            throw new Error("Please specify the project ID or name to delete.");
          }

          const delProj = await db.query(
            "DELETE FROM projects WHERE id = $1 AND workspace_id = $2 RETURNING *",
            [targetProjectId, workspaceId]
          );

          if (delProj.rows.length === 0) {
            throw new Error(`Project #${targetProjectId} not found in active workspace.`);
          }

          const deletedProject = delProj.rows[0];
          safeEmit("PROJECT_DELETED", targetProjectId);
          safeEmit("PROJECT_DELETED", targetProjectId, `workspace_${workspaceId}`);

          result = { success: true, deleted_project: deletedProject };
          break;
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      // Record successful execution in audit log
      await db.query(
        `INSERT INTO ai_action_logs (workspace_id, project_id, user_id, conversation_id, tool_name, tool_args, approval_required, approved_by, approval_status, execution_status, result_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'success', $10)`,
        [
          workspaceId,
          args.project_id || null,
          userId,
          conversationId || null,
          toolName,
          JSON.stringify(args),
          this.isModifyingTool(toolName),
          isApproved ? userId : null,
          isApproved ? "approved" : "auto",
          JSON.stringify(result).slice(0, 500),
        ]
      );

      return result;
    } catch (err) {
      console.error(`Tool execution failed [${toolName}]:`, err.message);
      executionStatus = "failed";
      errorMessage = err.message;

      // Log failure in audit trail
      await db.query(
        `INSERT INTO ai_action_logs (workspace_id, project_id, user_id, conversation_id, tool_name, tool_args, approval_required, execution_status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE, 'failed', $7)`,
        [workspaceId, args.project_id || null, userId, conversationId || null, toolName, JSON.stringify(args), err.message]
      );

      throw err;
    }
  }
}

module.exports = new AgentService();

