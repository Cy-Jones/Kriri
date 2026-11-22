const db = require("../config/database");
const openRouterClient = require("../services/ai/openrouter.client");
const analyticsEngine = require("../services/ai/analytics.engine");
const agentService = require("../services/ai/agent.service");
const ragService = require("../services/ai/rag.service");
const usageService = require("../services/ai/usage.service");
const rateLimiter = require("../services/ai/rateLimiter.service");
const circuitBreaker = require("../services/ai/circuitBreaker.service");
const { MODEL_REGISTRY } = require("../services/ai/model.registry");

/**
 * Assemble grounding context from PostgreSQL (tasks, milestones, project state)
 */
/**
 * Assemble grounding context from PostgreSQL (tasks, milestones, project state, workspace telemetry)
 */
async function assembleProjectContext(projectId, workspaceId) {
  if (!workspaceId) return { text: "No active workspace context.", stats: {} };

  const now = new Date();
  const currentDateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentIsoDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // 1. Fetch workspace info
  const wsRes = await db.query(
    `SELECT id, name, slug FROM workspaces WHERE id = $1`,
    [workspaceId]
  );
  const workspaceName = wsRes.rows[0]?.name || "Workspace";

  // 2. Fetch workspace members
  const membersRes = await db.query(
    `SELECT u.id, u.name, u.email, wm.role
     FROM workspace_members wm
     JOIN users u ON wm.user_id = u.id
     WHERE wm.workspace_id = $1`,
    [workspaceId]
  );
  const membersList = membersRes.rows;

  // 3. Fetch ALL projects in the workspace ordered by created_at DESC (most recently created first)
  const projRes = await db.query(
    `SELECT 
       p.id, p.name, p.slug, p.identifier, p.status, p.priority, p.health,
       p.created_at, p.updated_at, p.start_date, p.due_date,
       p.description, p.short_summary,
       u.name as lead_name,
       (SELECT count(*)::int FROM tasks t WHERE t.project_id = p.id) as total_tasks,
       (SELECT count(*)::int FROM tasks t WHERE t.project_id = p.id AND t.status = 'Done') as completed_tasks
     FROM projects p
     LEFT JOIN users u ON p.lead_id = u.id
     WHERE p.workspace_id = $1
     ORDER BY p.created_at DESC`,
    [workspaceId]
  );
  const allProjects = projRes.rows;

  // 4. Fetch recent tasks across workspace
  const tasksRes = await db.query(
    `SELECT 
       t.id, t.title, t.status, t.priority, t.due_date, t.created_at,
       p.name as project_name, p.identifier as project_identifier,
       u.name as assignee_name
     FROM tasks t
     JOIN projects p ON t.project_id = p.id
     LEFT JOIN users u ON t.assignee_id = u.id
     WHERE p.workspace_id = $1
     ORDER BY t.created_at DESC
     LIMIT 40`,
    [workspaceId]
  );
  const allRecentTasks = tasksRes.rows;

  // 5. Fetch milestones
  const msRes = await db.query(
    `SELECT 
       m.id, m.name, m.status, m.due_date, m.created_at,
       p.name as project_name
     FROM milestones m
     JOIN projects p ON m.project_id = p.id
     WHERE p.workspace_id = $1
     ORDER BY m.due_date ASC NULLS LAST
     LIMIT 30`,
    [workspaceId]
  );
  const allMilestones = msRes.rows;

  // Specific project focused view if projectId is supplied
  let focusedProjectSection = "";
  if (projectId) {
    const p = allProjects.find((x) => x.id === parseInt(projectId, 10));
    if (p) {
      const projTasks = allRecentTasks.filter((t) => t.project_name === p.name);
      const projMilestones = allMilestones.filter((m) => m.project_name === p.name);
      focusedProjectSection = `
CURRENT FOCUSED PROJECT (Deep Dive):
- Name: "${p.name}" (Identifier: ${p.identifier || "N/A"}, ID: ${p.id})
- Status: ${p.status} | Priority: ${p.priority || "Medium"} | Health: ${p.health || "On Track"}
- Created: ${new Date(p.created_at).toISOString()} (${new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})
- Description: ${p.description || p.short_summary || "None"}
- Project Tasks (${projTasks.length}):
${projTasks.map((t) => `  * [${t.status}] "${t.title}" (Priority: ${t.priority}, Assignee: ${t.assignee_name || "Unassigned"}, Due: ${t.due_date ? new Date(t.due_date).toLocaleDateString() : "None"})`).join("\n") || "  * No tasks assigned"}
- Project Milestones:
${projMilestones.map((m) => `  * [${m.status}] "${m.name}" (Due: ${m.due_date ? new Date(m.due_date).toLocaleDateString() : "None"})`).join("\n") || "  * No milestones recorded"}
`;
    }
  }

  // Format full project inventory with timestamps
  const projectsListFormatted = allProjects.map((p, idx) => {
    const createdDate = new Date(p.created_at);
    return `${idx + 1}. **${p.name}**
   - Identifier: \`${p.identifier || "N/A"}\` | Database ID: ${p.id}
   - Created: ${createdDate.toISOString()} (${createdDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })})
   - Last Updated: ${new Date(p.updated_at).toISOString()}
   - Status: ${p.status} | Health: ${p.health || "On Track"} | Priority: ${p.priority || "Medium"}
   - Lead: ${p.lead_name || "Unassigned"}
   - Tasks: ${p.completed_tasks}/${p.total_tasks} completed
   - Description / Scope:
     ${(p.description || p.short_summary || "No description provided.").replace(/\n/g, "\n     ")}`;
  }).join("\n\n");

  const completedProjects = allProjects.filter((p) => p.status === "Done");
  const atRiskProjects = allProjects.filter((p) => p.health === "At Risk");
  const offTrackProjects = allProjects.filter((p) => p.health === "Off Track");

  const tasksListFormatted = allRecentTasks.map((t) => {
    const tCreated = new Date(t.created_at);
    return `- [ID: #${t.id}] [Status: ${t.status}] "${t.title}" (Project: ${t.project_name}, Assignee: ${t.assignee_name || "Unassigned"}, Priority: ${t.priority || "Medium"}, Created: ${tCreated.toISOString()}, Due: ${t.due_date ? new Date(t.due_date).toISOString() : "None"})`;
  }).join("\n");

  const text = `LIVE WORKSPACE DATA (Real-time Ground Truth from PostgreSQL):
Current Date & Time: ${now.toISOString()} (${currentDateStr})
Workspace: "${workspaceName}" (ID: ${workspaceId})
Workspace Members: ${membersList.map((m) => `${m.name} (User ID: ${m.id}, Role: ${m.role})`).join(", ") || "None"}
Total Projects in Workspace: ${allProjects.length}
${focusedProjectSection}
ALL PROJECTS IN THIS WORKSPACE (Listed from Most Recently Created to Oldest):
${projectsListFormatted || "No projects found in this workspace."}

RECENT WORKSPACE TASKS / ISSUES:
${tasksListFormatted || "No tasks currently recorded."}

ACTIVE MILESTONES:
${allMilestones.length === 0 ? "No milestones recorded." : allMilestones.map((m) => `- [${m.status}] "${m.name}" (Project: ${m.project_name}, Due: ${m.due_date ? new Date(m.due_date).toISOString() : "None"})`).join("\n")}`;

  return {
    text,
    stats: {
      workspaceName,
      projectName: projectId ? allProjects.find((x) => x.id === parseInt(projectId, 10))?.name || "Project" : workspaceName,
      totalProjectsCount: allProjects.length,
      allProjects: allProjects.map((p) => ({
        id: p.id,
        name: p.name,
        identifier: p.identifier,
        status: p.status,
        priority: p.priority,
        health: p.health,
        created_at: p.created_at,
        created_at_formatted: new Date(p.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        description: p.description,
      })),
      mostRecentProject: allProjects[0] || null,
      completedProjectsCount: completedProjects.length,
      completedProjectsList: completedProjects.map((p) => p.name),
      atRiskProjectsCount: atRiskProjects.length,
      offTrackProjectsCount: offTrackProjects.length,
      atRiskProjectsList: [...atRiskProjects, ...offTrackProjects].map((p) => `${p.name} (${p.health})`),
      openTasksCount: allRecentTasks.filter((t) => t.status !== "Done").length,
      overdueTasksCount: allRecentTasks.filter((t) => t.status !== "Done" && t.due_date && new Date(t.due_date) < now).length,
      recentTasks: allRecentTasks,
    },
  };
}

/**
 * Intelligent topic extractor fallback
 */
function extractHeuristicTopic(prompt) {
  if (!prompt || typeof prompt !== "string") return "New chat";

  let str = prompt.trim().replace(/\s+/g, " ");

  // High-value domain mappings
  if (/issues|tasks/i.test(str) && /workspace/i.test(str)) {
    return "Workspace Issues Summary";
  }
  if (/project/i.test(str) && /(just|recent|latest|new)/i.test(str)) {
    return "New Project Details";
  }
  if (/project/i.test(str) && /last\s+day|yesterday|today|recent/i.test(str)) {
    return "Recent Projects Overview";
  }
  if (/health|risk/i.test(str)) {
    return "Project Health & Risks";
  }
  if (/workload|team/i.test(str)) {
    return "Team Workload Analysis";
  }
  if (/create.*project/i.test(str)) {
    return "Project Creation";
  }

  // Strip conversational prefixes
  const prefixes = [
    /^basically\s+/i,
    /^(can|could|would)\s+you\s+(please\s+)?(help\s+me\s+with\s+|tell\s+me\s+about\s+|show\s+me\s+)?/i,
    /^please\s+/i,
    /^i\s+(want|need|would like)\s+to\s+(know\s+about\s+|see\s+)?/i,
    /^tell\s+me\s+(about\s+)?/i,
    /^what\s+(is|are|were)\s+(the\s+)?/i,
    /^which\s+/i,
  ];

  for (const p of prefixes) {
    str = str.replace(p, "");
  }

  // Handle "Summarize ..."
  const sumMatch = str.match(/^summarize\s+(?:the\s+)?(.+)/i);
  if (sumMatch) {
    const topicNoun = sumMatch[1].replace(/[.?]+$/, "").trim();
    const shortNoun = topicNoun.split(" ").slice(0, 3).join(" ");
    return toTitleCase(`${shortNoun} Summary`);
  }

  // Handle "Show me ..." / "List of ..."
  const listMatch = str.match(/^(?:show\s+me\s+)?(?:a\s+)?(?:list\s+of\s+)?(.+)/i);
  if (listMatch) {
    const topicNoun = listMatch[1].replace(/[.?]+$/, "").trim();
    const shortNoun = topicNoun.split(" ").slice(0, 3).join(" ");
    return toTitleCase(`${shortNoun} Overview`);
  }

  str = str.replace(/[.?!,]+$/, "").trim();
  const words = str.split(" ").filter(Boolean).slice(0, 4);
  if (words.length === 0) return "New chat";
  return toTitleCase(words.join(" "));
}

function toTitleCase(s) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 36)
    .trim();
}

/**
 * Normalizes raw/squished pipe tables or markdown tables from LLMs
 * into clean, readable, structured executive bullet points.
 */
function normalizeAIContent(text) {
  if (!text || typeof text !== "string") return text;

  let processed = text.replace(/^(?:Project|Task|Issue):\s*([^\n]+)$/gm, "### $1");

  if (processed.includes("||")) {
    processed = processed.replace(/\|\|\s*/g, "\n");
  }

  if (processed.includes("|")) {
    const rawLines = processed.split("\n");
    const newLines = [];

    const isHeaderOrSeparator = (line, nextLine) => {
      const trimmed = line.trim();
      if (/^\|?[-:\s|]+\|?$/.test(trimmed) && trimmed.includes("-")) return true;
      if (nextLine && /^\|?[-:\s|]+\|?$/.test(nextLine.trim()) && nextLine.includes("-")) return true;
      if (/^\|?\s*(field|property|attribute|item|key|#|id|no\.?|task|project|issue)\s*\|\s*(details|value|description|info|name|title|assignee|status|priority)\s*(\|[^\n|]+)?\|?$/i.test(trimmed)) {
        return true;
      }
      return false;
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const nextLine = rawLines[i + 1];
      const trimmed = line.trim();

      if (isHeaderOrSeparator(line, nextLine)) {
        continue;
      }

      // Check for row with 2 columns: | Key | Value |
      const row2Match = trimmed.match(/^\|?\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|?$/);
      if (row2Match) {
        const key = row2Match[1].trim().replace(/^\*\*|\*\*$/g, "");
        let val = row2Match[2].trim().replace(/^\||\|$/g, "");
        if (key && val) {
          if (/^[A-Z]{2,}-[A-Z0-9-]+$/.test(val)) {
            val = `\`${val}\``;
          }
          newLines.push(`- **${key}:** ${val}`);
          continue;
        }
      }

      // Check for row with 3 columns: | Col1 | Col2 | Col3 |
      const row3Match = trimmed.match(/^\|?\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|?$/);
      if (row3Match) {
        const c1 = row3Match[1].trim().replace(/^\*\*|\*\*$/g, "");
        const c2 = row3Match[2].trim();
        const c3 = row3Match[3].trim();
        if (c1 && c2 && c3) {
          newLines.push(`- **${c1}:** ${c2} — *${c3}*`);
          continue;
        }
      }

      newLines.push(line);
    }
    processed = newLines.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  return processed;
}

/**
 * Use the AI model to analyze the initial prompt and assistant answer, generating a proper topic title.
 */
async function generateTopicTitle({ prompt, responseText, workspaceId, userId, userEmail }) {
  if (!prompt || typeof prompt !== "string") return "New chat";
  const cleanPrompt = prompt.trim();

  try {
    const titlePrompt = [
      {
        role: "system",
        content:
          "You are KRIRI Topic Classifier. Given a user query and the assistant response, generate a concise, professional title (2 to 4 words, maximum 32 characters) representing the conversation topic. Rules:\n- NEVER repeat the full prompt verbatim.\n- Do NOT use quotes, periods, or prefixes like Topic:.\n- Output ONLY the topic title in Title Case (e.g. Workspace Issues Summary, Recent Projects Overview, New Project Details).",
      },
      {
        role: "user",
        content: `Query: ${cleanPrompt.slice(0, 200)}\nAnswer: ${(responseText || "").slice(0, 200)}\n\nTopic title:`,
      },
    ];

    const modelRes = await openRouterClient.chatCompletion({
      feature: "assistant",
      messages: titlePrompt,
      workspaceId,
      userId,
      userEmail,
      temperature: 0.1,
      max_tokens: 700,
    });

    let generated = (modelRes?.content || "").trim();
    if (!generated && modelRes?.reasoning) {
      const match =
        modelRes.reasoning.match(/Possible titles:[\s\S]*?["“]([^"”\n]{3,35})["”]/i) ||
        modelRes.reasoning.match(/Let's go with\s+["“]?([^"”\n.]{3,35})["”]?/i);
      if (match) generated = match[1].trim();
    }

    generated = generated.replace(/^["'`“]+|["'`”]+$/g, "");
    generated = generated.replace(/^(topic|title|chat|subject):\s*/i, "");
    generated = generated.split("\n")[0].trim();
    generated = generated.replace(/[.]+$/, "");

    if (
      generated.length >= 3 &&
      generated.length <= 40 &&
      !generated.toLowerCase().includes("query:") &&
      !generated.toLowerCase().includes("answer:")
    ) {
      return generated;
    }
  } catch (err) {
    console.warn("[Topic Generation] Model call skipped or error:", err.message);
  }

  return extractHeuristicTopic(cleanPrompt);
}

/**
 * 1. AI Assistant Chat
 */
exports.chat = async (req, res) => {
  try {
    const { message, conversation_id, project_id, custom_instructions, tone, access_mode } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message string is required." });
    }

    const accessMode = access_mode === "read_only" ? "read_only" : "read_write";
    const workspaceId = req.workspace.id;
    const userId = req.user.id;

    // 1. Resolve or create conversation strictly scoped to user AND workspace
    let convId = conversation_id;
    if (convId) {
      const convCheck = await db.query(
        "SELECT id FROM ai_conversations WHERE id = $1 AND workspace_id = $2 AND user_id = $3",
        [convId, workspaceId, userId]
      );
      if (convCheck.rows.length === 0) {
        // Disallow accessing or posting into another member's conversation
        convId = null;
      }
    }

    const isNewConversation = !convId;
    if (isNewConversation) {
      const initialTopic = extractHeuristicTopic(message);
      const convRes = await db.query(
        `INSERT INTO ai_conversations (workspace_id, project_id, user_id, title)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [workspaceId, project_id || null, userId, initialTopic]
      );
      convId = convRes.rows[0].id;
    }

    // 2. Fetch conversation message history (retain full multi-turn context up to 30 messages)
    const histRes = await db.query(
      `SELECT role, content, metadata FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [convId]
    );

    // Extract historical actions and created entities from conversation metadata to maintain perfect retention
    const convCreatedItems = [];
    for (const r of histRes.rows) {
      let meta = r.metadata;
      if (typeof meta === "string") {
        try { meta = JSON.parse(meta); } catch {}
      }
      if (meta?.createdTask) {
        convCreatedItems.push(`- Created Issue #${meta.createdTask.id}: "${meta.createdTask.title}" (Status: ${meta.createdTask.status || "Todo"}, Project ID: ${meta.createdTask.project_id || "N/A"}, Assignee: ${meta.createdTask.assignee_name || "Unassigned"})`);
      }
      if (meta?.updatedTask) {
        convCreatedItems.push(`- Updated/Assigned Issue #${meta.updatedTask.id}: "${meta.updatedTask.title}" (Status: ${meta.updatedTask.status}, Assignee: ${meta.updatedTask.assignee_name || meta.assigned_to || "Assigned"})`);
      }
      if (meta?.createdProject) {
        convCreatedItems.push(`- Created Project: "${meta.createdProject.name}" (ID: ${meta.createdProject.id}, Status: ${meta.createdProject.status || "Planning"})`);
      }
    }
    const convMemorySection = convCreatedItems.length > 0
      ? `\n\nCONVERSATION ACTION MEMORY (ITEMS CREATED/MODIFIED IN THIS ACTIVE CHAT):\n${convCreatedItems.join("\n")}\n* Note: These items were successfully created or modified in this active conversation session. Never claim you haven't created them or ask the user to recreate them.`
      : "";

    const messages = histRes.rows.reverse().map((r) => ({
      role: r.role,
      content: r.content && r.content.length > 2500 ? r.content.slice(0, 2500) + "..." : r.content,
    }));

    // 3. Assemble live grounding context + RAG knowledge
    const { text: projectContext, stats: projectStats } = await assembleProjectContext(project_id, workspaceId);
    const retrievedDocs = await ragService.retrieveContext({ workspaceId, projectId: project_id, query: message, topK: 3 });
    const ragContext = retrievedDocs.length > 0
      ? `\n\nRELEVANT DOCUMENTATION CITATIONS:\n${retrievedDocs.map((d) => `[Source: ${d.filename}]: ${d.content}`).join("\n")}`
      : "";

    let personalizationPrompt = "";
    if (custom_instructions && typeof custom_instructions === "string" && custom_instructions.trim()) {
      personalizationPrompt += `\n\nUSER WORKSPACE CUSTOM INSTRUCTIONS (Apply these rules to your response):\n${custom_instructions.trim().slice(0, 1000)}`;
    }
    if (tone === "concise") {
      personalizationPrompt += `\n\nCOMMUNICATION STYLE: Concise & Direct. Minimal fluff, rapid answers, bulleted takeaways, and immediate action items.`;
    } else if (tone === "collaborative") {
      personalizationPrompt += `\n\nCOMMUNICATION STYLE: Collaborative & Detailed. Step-by-step thinking, contextual explanations, and alternative approaches.`;
    } else if (tone === "technical") {
      personalizationPrompt += `\n\nCOMMUNICATION STYLE: Technical & Rigorous. Architecture-first, deep edge-case analysis, strict type correctness, and database schema evaluation.`;
    }

    const accessPrompt = accessMode === "read_only"
      ? `5. AI ACCESS LEVEL: READ-ONLY MODE.
The user has configured the AI assistant in READ-ONLY mode.
- You can inspect, query, analyze, and report on workspace data using your read tools:
  - list_workspace_tasks: search or list tasks (supports created_today: true, status, assignee_name, query)
  - get_project_tasks: get tasks in a specific project
  - get_project_overview: get health and progress analytics
  - get_overdue_tasks: get overdue tasks
  - get_team_workload: check member capacity
- You MUST NOT create, modify, or delete projects, tasks, issues, or milestones.
- If the user asks you to create, modify, or delete items, inform them: "I am currently set to Read-only mode. Switch to Read & Write access using the access dropdown in the input box to perform modifications or deletions."`
      : `5. AI ACCESS LEVEL: READ & WRITE ACCESS (AUTONOMOUS AGENT WITH FUNCTION CALLING TOOLS).
You have FULL ACCESS and WRITE/DELETE PERMISSIONS in this workspace!
You are an autonomous AI Agent equipped with specialized function calling tools:
- create_task: Create a new issue/task linked to a project.
- assign_task: Assign an issue/task to a team member by task_id and assignee_name (e.g. Mariama Barry) or assignee_id. If the user refers to "it" or a recent task, pass the ID of the task discussed.
- update_task: Update status (Todo, In Progress, In Review, Done), priority, or details of a task.
- list_workspace_tasks: Query or list workspace tasks (supports created_today: true, status, assignee_name, query). Always use this when asked to check tasks created today or filter tasks!
- get_team_workload: Inspect member assignments and workload capacity.
- delete_task: Permanently delete a task by task_id or title.
- create_project / delete_project: Manage workspace projects.

AGENTIC TOOL EXECUTION RULES:
- When the user asks you to perform an action (create, assign, update, delete, search, or list issues/tasks), ALWAYS invoke the corresponding tool via tool_calls.
- NEVER claim you created, assigned, or updated something without actually invoking the tool.
- When you invoke a tool, the system executes it and returns the live output to you. Once you receive the tool output, report the results clearly, concisely, and factually to the user.
- If the user asks about tasks created today (e.g. "check the issues created today"), call list_workspace_tasks with { created_today: true } and summarize the findings.`;

    const systemPrompt = `You are KRIRI AI, a precision project assistant for team collaboration.
Your answers must be direct, helpful, concise, well-structured, factual, and strictly grounded in the live workspace context.
You have real-time access to the PostgreSQL database for the current workspace.

CRITICAL INSTRUCTIONS:
1. In KRIRI, "issues" and "tasks" refer to the exact same work items. NEVER give pedantic disclaimers like "The live workspace context does not include a separate issues entity; current work items are represented as tasks". If the user asks about issues, immediately summarize the workspace tasks directly and clearly.
2. Structure your answers cleanly using Markdown headings, concise bullet points, and bold project or task names. Avoid messy walls of text, repetitive lists, or triple asterisks.
3. The "ALL PROJECTS" and "RECENT WORKSPACE TASKS" lists in the context include exact ISO creation timestamps, database IDs, identifiers, statuses, priorities, and assignees.
4. If asked about what project or issue was created today, yesterday, or on a specific date (e.g. October 12), use the Current Date & Time and ISO timestamps to calculate the date and identify them accurately.
5. AUTONOMOUS ACTION & DIRECT ASSIGNMENT:
- When asked to assign a task/issue to a member (e.g. Mariama Barry), directly invoke \`assign_task({ task_id, assignee_name })\` immediately. You do NOT need to ask for user ID or check team workload first.
- If the user says "did you assign it?", "assign it", "go ahead", "do it", or refers to the task just discussed, immediately invoke \`assign_task\` for that task.
- NEVER say "I need to correct myself—I mentioned creating the task but didn't actually execute it". If an issue or project was created in this conversation, it exists in the database.
- NEVER return empty or placeholder responses like "Action completed successfully.". Always summarize the actual details, task ID, title, assignee, and project.
6. INTERACTIVE DECISION CARDS: Whenever the user needs to select between multiple options (such as updating task status: Todo, In Progress, In Review, Done; or priority: Low, Medium, High, Urgent; or picking a project), ask directly and concisely. An interactive decision card will be attached for the user to click.
7. ID FORMATTING: Always format task, issue, and project IDs in clean bold text directly without backticks or code blocks, e.g. (ID: **#1106**) or **#1106**. Never wrap single IDs in backticks.
8. FORMATTING & OVERVIEWS: NEVER use markdown tables (no pipe tables like | Field | Details | or ||). Tables are strictly forbidden. Present all project or task overviews, summaries, and attribute breakdowns as clean, organized bullet points with bold property labels (e.g. - **Status:** Done, - **Health:** On Track, - **Lead:** Cyrus Jones). Use clear Markdown headings (e.g. ### Project Name).
${accessPrompt}

${personalizationPrompt}
${convMemorySection}

${projectContext}
${ragContext}`;

    messages.unshift({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: message });

    // 4. Save user message to database
    await db.query(
      "INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, 'user', $2)",
      [convId, message]
    );

    // 5. Invoke OpenRouter Gateway with tools according to access mode
    const allTools = agentService.getToolDefinitions();
    const toolDefs = accessMode === "read_only"
      ? allTools.filter((t) => !agentService.isModifyingTool(t.function?.name))
      : allTools;

    let response = await openRouterClient.chatCompletion({
      feature: "assistant",
      messages,
      tools: toolDefs.length > 0 ? toolDefs : undefined,
      workspaceId,
      userId,
      userEmail: req.user?.email,
      demoContext: projectStats || { projectName: project_id ? "Current Project" : "Workspace" },
    });

    let createdProjectData = null;
    let createdTaskData = null;
    let updatedTaskData = null;
    let deletedTaskData = null;
    let deletedProjectData = null;
    let requiresProjectPrompt = false;
    let decisionCard = null;
    let lastListTasks = null;
    let lastTeamWorkload = null;

    // Helper to find most recently referenced task ID in message or conversation history
    const findRecentTaskId = () => {
      const mMatch = message.match(/(?:task|issue)\s*#?(\d+)/i) || message.match(/#(\d+)/);
      if (mMatch) return parseInt(mMatch[1], 10);
      for (let i = histRes.rows.length - 1; i >= 0; i--) {
        const text = histRes.rows[i]?.content || "";
        const hMatch = text.match(/(?:task|issue|ID:\s*)\**#?(\d+)\**/i) || text.match(/#(\d+)/);
        if (hMatch) return parseInt(hMatch[1], 10);
      }
      if (projectStats?.recentTasks && projectStats.recentTasks.length > 0) {
        return projectStats.recentTasks[0].id;
      }
      return null;
    };

    // ReAct multi-turn tool execution loop (up to 3 turns)
    if (response.tool_calls && Array.isArray(response.tool_calls) && response.tool_calls.length > 0) {
      let turns = 0;
      const maxTurns = 3;
      while (response.tool_calls && Array.isArray(response.tool_calls) && response.tool_calls.length > 0 && turns < maxTurns) {
        turns++;
        const toolOutputs = [];
        for (const tc of response.tool_calls) {
          const fnName = tc.function?.name;
          let fnArgs = {};
          try {
            fnArgs = typeof tc.function?.arguments === "string" ? JSON.parse(tc.function.arguments) : (tc.function?.arguments || {});
          } catch (pErr) {
            fnArgs = {};
          }
          try {
            const tRes = await agentService.executeTool(fnName, fnArgs, {
              workspaceId,
              userId,
              conversationId: convId,
              isApproved: true,
              accessMode,
            });
            if (tRes?.created_project) createdProjectData = tRes.created_project;
            if (tRes?.created_task) createdTaskData = tRes.created_task;
            if (tRes?.updated_task) {
              updatedTaskData = { ...tRes.updated_task, assigned_to: tRes.assigned_to };
            }
            if (tRes?.tasks && fnName === "list_workspace_tasks") {
              lastListTasks = tRes.tasks;
            }
            if (tRes?.members && fnName === "get_team_workload") {
              lastTeamWorkload = tRes;
            }
            if (tRes?.deleted_task) deletedTaskData = tRes.deleted_task;
            if (tRes?.deleted_project) deletedProjectData = tRes.deleted_project;
            if (tRes?.requires_project) requiresProjectPrompt = true;

            toolOutputs.push({
              tool_call_id: tc.id,
              name: fnName,
              content: JSON.stringify(tRes || { success: true }),
            });
          } catch (tErr) {
            console.warn("[Tool Execution Error]:", tErr.message);
            toolOutputs.push({
              tool_call_id: tc.id,
              name: fnName,
              content: JSON.stringify({ error: tErr.message }),
            });
          }
        }

        // Add assistant message with tool calls and tool responses to messages array
        messages.push({
          role: "assistant",
          content: response.content || "",
          tool_calls: response.tool_calls,
        });
        for (const to of toolOutputs) {
          messages.push({
            role: "tool",
            tool_call_id: to.tool_call_id,
            name: to.name,
            content: to.content,
          });
        }

        // Re-invoke OpenRouter Gateway so the model synthesizes the tool results
        try {
          const nextResponse = await openRouterClient.chatCompletion({
            feature: "assistant",
            messages,
            tools: toolDefs.length > 0 ? toolDefs : undefined,
            workspaceId,
            userId,
            userEmail: req.user?.email,
            demoContext: projectStats || { projectName: project_id ? "Current Project" : "Workspace" },
          });
          response = nextResponse;
        } catch (lErr) {
          console.warn("[ReAct Loop LLM Error]:", lErr.message);
          break;
        }
      }
    }

    // Auto-detect if the AI response is asking for status options without having attached a decision card
    if (!decisionCard && response.content) {
      if (/(?:what|which) status/i.test(response.content) && (/todo/i.test(response.content) || /in progress/i.test(response.content))) {
        const targetTaskId = findRecentTaskId();
        if (targetTaskId) {
          decisionCard = {
            id: `task-status-${targetTaskId}`,
            type: "single_choice",
            title: "Update Task Status",
            subtitle: `Select a status for Task #${targetTaskId}`,
            submitLabel: "Update Status",
            taskId: targetTaskId,
            options: [
              { id: "Todo", label: "Todo", description: "Not yet started" },
              { id: "In Progress", label: "In Progress", description: "Currently in active development" },
              { id: "In Review", label: "In Review", description: "Ready for testing, QA, or review" },
              { id: "Done", label: "Done", description: "Completed and delivered" },
            ],
            initialSelected: "In Progress",
          };
          response.content = response.content
            .replace(/#\d+\s*\n\s*\./g, "")
            .replace(/Options:\s*Todo,.*$/i, "")
            .trim();
        }
      }
    }

    // Guard against any leftover hallucinated "I don't have access" or "I cannot delete" disclaimer if in read_write mode
    if (accessMode === "read_write" && response.content) {
      if (/don't have access to create/i.test(response.content) && !createdProjectData) {
        response.content = response.content.replace(/I don't have access to create projects in your workspace\.\s*I can only read and report on live workspace data\./gi, "I have full access to create projects and tasks in your workspace.");
      }
      if (/don't have a delete task or issue tool/i.test(response.content) || /cannot delete them/i.test(response.content)) {
        if (deletedTaskData) {
          response.content = `I have permanently deleted the issue **"${deletedTaskData.title}"** (ID: **#${deletedTaskData.id}**) from your workspace.`;
        } else if (deletedProjectData) {
          response.content = `I have permanently deleted the project **"${deletedProjectData.name}"** and its associated tasks from your workspace.`;
        } else {
          response.content = "I have delete permissions enabled in your workspace. Please specify the task ID or name of the item you want me to delete.";
        }
      }
    }

    // Convert any code block / backtick task IDs into clean bold text (avoiding giant code boxes)
    if (response.content) {
      response.content = response.content.replace(/\(ID:\s*`#?(\d+)`\)/g, "(ID: **#$1**)");
      response.content = response.content.replace(/`#(\d+)`/g, "**#$1**");
    }

    // Guarantee that response.content is NEVER empty, whitespace, or a placeholder "Action completed successfully."
    const isGenericOrEmpty =
      !response.content ||
      !response.content.trim() ||
      /^action completed successfully\.?$/i.test(response.content.trim());

    if (isGenericOrEmpty) {
      if (updatedTaskData) {
        const assignedTo = updatedTaskData.assigned_to || updatedTaskData.assignee_name;
        if (assignedTo) {
          response.content = `I have assigned issue **"${updatedTaskData.title}"** (ID: **#${updatedTaskData.id}**) to **${assignedTo}** successfully.`;
        } else {
          response.content = `I have updated issue **"${updatedTaskData.title}"** (ID: **#${updatedTaskData.id}**) successfully.`;
        }
      } else if (createdTaskData) {
        response.content = `I have created the issue **"${createdTaskData.title}"** (ID: **#${createdTaskData.id}**) in your workspace under project status **${createdTaskData.status || "Todo"}**.`;
      } else if (lastListTasks) {
        if (lastListTasks.length === 0) {
          response.content = "I searched the workspace and found no tasks matching those criteria.";
        } else {
          const listStr = lastListTasks.map((t) => {
            return `- (ID: **#${t.id}**) **"${t.title}"** (Project: ${t.project_name || "N/A"}, Status: **${t.status}**, Priority: ${t.priority || "Medium"}, Assignee: ${t.assignee_name || "Unassigned"})`;
          }).join("\n");
          response.content = `I found **${lastListTasks.length}** issue${lastListTasks.length > 1 ? "s" : ""} in your workspace:\n\n${listStr}`;
        }
      } else if (lastTeamWorkload && lastTeamWorkload.members) {
        const mStr = lastTeamWorkload.members.map((m) => `- **${m.name}**: ${m.active_tasks_count || 0} active tasks`).join("\n");
        response.content = `### Current Team Workload\n\n${mStr}`;
      } else if (deletedTaskData) {
        response.content = `I have permanently deleted the issue **"${deletedTaskData.title}"** (ID: **#${deletedTaskData.id}**) from your workspace.`;
      } else if (deletedProjectData) {
        response.content = `I have permanently deleted the project **"${deletedProjectData.name}"** and its associated tasks from your workspace.`;
      } else if (createdProjectData) {
        response.content = `I have created the project **"${createdProjectData.name}"** in your workspace with status **${createdProjectData.status || "Planning"}**.`;
      } else if (projectStats?.recentTasks && projectStats.recentTasks.length > 0) {
        const recent = projectStats.recentTasks[0];
        response.content = `I have verified the workspace state. Most recent issue is **"${recent.title}"** (ID: **#${recent.id}**, Status: **${recent.status}**, Assignee: ${recent.assignee_name || "Unassigned"}).`;
      } else {
        response.content = "I have checked your workspace details. How can I assist you further with your projects or tasks?";
      }
    }

    // Ensure content is normalized and never empty
    response.content = normalizeAIContent(response.content || "I have verified your workspace details.");

    // 6. Save assistant response
    const insMsg = await db.query(
      `INSERT INTO ai_messages (conversation_id, role, content, model_id, token_usage, metadata)
       VALUES ($1, 'assistant', $2, $3, $4, $5) RETURNING *`,
      [
        convId,
        response.content,
        response.model,
        JSON.stringify(response.usage),
        JSON.stringify({
          is_demo: response.is_demo,
          citations: retrievedDocs.map((d) => d.filename),
          card: decisionCard,
          createdProject: createdProjectData,
          createdTask: createdTaskData,
          updatedTask: updatedTaskData,
          deletedTask: deletedTaskData,
          deletedProject: deletedProjectData,
          requiresProject: requiresProjectPrompt,
        }),
      ]
    );

    // 7. If this is a new conversation, use model to analyze and generate a proper topic
    let finalTopic = null;
    if (isNewConversation) {
      try {
        finalTopic = await generateTopicTitle({
          prompt: message,
          responseText: response.content,
          workspaceId,
          userId,
          userEmail: req.user?.email,
        });
        if (finalTopic) {
          await db.query(`UPDATE ai_conversations SET title = $1 WHERE id = $2`, [finalTopic, convId]);
        }
      } catch (topicErr) {
        console.warn("[Topic Generation] Update error:", topicErr);
      }
    }

    res.json({
      conversation_id: convId,
      conversation_title: finalTopic || (isNewConversation ? extractHeuristicTopic(message) : undefined),
      message: insMsg.rows[0],
      usage: response.usage,
      latency_ms: response.latencyMs,
      is_demo: response.is_demo,
      citations: retrievedDocs.map((d) => d.filename),
    });
  } catch (err) {
    console.error("AI Chat error:", err);
    res.status(500).json({ error: err.message || "AI Assistant processing error." });
  }
};

/**
 * 2. Streaming Chat (SSE)
 */
exports.streamChat = async (req, res) => {
  try {
    const { message, conversation_id, project_id } = req.body;
    const workspaceId = req.workspace.id;
    const userId = req.user.id;

    let convId = conversation_id;
    if (convId) {
      const convCheck = await db.query(
        "SELECT id FROM ai_conversations WHERE id = $1 AND workspace_id = $2 AND user_id = $3",
        [convId, workspaceId, userId]
      );
      if (convCheck.rows.length === 0) {
        convId = null;
      }
    }
    if (!convId) {
      const initialTopic = extractHeuristicTopic(message || "Assistant Chat");
      const convRes = await db.query(
        `INSERT INTO ai_conversations (workspace_id, project_id, user_id, title)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [workspaceId, project_id || null, userId, initialTopic]
      );
      convId = convRes.rows[0].id;
    }

    const { text: projectContext, stats: projectStats } = await assembleProjectContext(project_id, workspaceId);
    const systemPrompt = `You are KRIRI AI Assistant. Answer factually based on this live workspace context from PostgreSQL:\n${projectContext}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message || "Summarize current project status." },
    ];

    await openRouterClient.streamChatCompletion({
      feature: "assistant",
      messages,
      res,
      workspaceId,
      userId,
      userEmail: req.user?.email,
      demoContext: projectStats || { projectName: project_id ? "Active Project" : "Workspace" },
    });
  } catch (err) {
    console.error("Streaming error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
};

/**
 * 3. Smart Task Generator (Natural Language → Validated Proposal)
 */
exports.generateTask = async (req, res) => {
  try {
    const { prompt, project_id } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Task creation prompt is required." });
    }

    const workspaceId = req.workspace.id;
    const userId = req.user.id;

    // Fetch team members in project for assignee recommendations
    const membersRes = await db.query(
      `SELECT u.id, u.name, u.email FROM users u
       JOIN workspace_members wm ON u.id = wm.user_id
       WHERE wm.workspace_id = $1 LIMIT 10`,
      [workspaceId]
    );
    const teamMembers = membersRes.rows.map((m) => `${m.name} (id: ${m.id})`).join(", ");

    const systemPrompt = `You are KRIRI Smart Task Generator. Convert the user's natural language request into a single structured JSON object representing a task proposal.
Available team members: ${teamMembers || "None"}
Output strictly valid JSON with this exact schema:
{
  "title": "string (clear, concise title)",
  "description": "string (detailed description)",
  "priority": "Low" | "Medium" | "High" | "Urgent",
  "estimated_hours": number,
  "subtasks": ["string"],
  "acceptance_criteria": ["string"],
  "suggested_assignee_id": number or null,
  "complexity": "Low" | "Medium" | "High"
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];

    const response = await openRouterClient.chatCompletion({
      feature: "task_generator",
      messages,
      workspaceId,
      userId,
      userEmail: req.user?.email,
      response_format: { type: "json_object" },
      demoContext: { leadName: membersRes.rows[0]?.name || "Alex Rivera" },
    });

    let taskProposal = null;
    try {
      taskProposal = JSON.parse(response.content);
    } catch (parseErr) {
      // Regex recovery if wrapped in markdown code fence
      const match = response.content.match(/\{[\s\S]*\}/);
      if (match) {
        taskProposal = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse task proposal JSON.");
      }
    }

    res.json({
      proposal: taskProposal,
      is_demo: response.is_demo,
      model: response.model,
    });
  } catch (err) {
    console.error("Task generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate task proposal." });
  }
};

/**
 * 4. Project Health & Risk Intelligence
 */
exports.getProjectHealth = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ error: "projectId parameter is required." });
    }

    const workspaceId = req.workspace.id;
    const userId = req.user.id;

    // 1. Deterministic Calculation (authoritative numbers)
    const analytics = await analyticsEngine.computeProjectHealth(projectId, workspaceId);

    // 2. Synthesize AI narrative explanation
    const prompt = `Explain the following project health analysis in 2 concise paragraphs:
Health Score: ${analytics.healthScore}/100 (${analytics.healthStatus})
Risk Level: ${analytics.riskLevel}
Metrics: ${JSON.stringify(analytics.metrics)}
Detected Risks: ${JSON.stringify(analytics.risks)}
Give an executive summary and 2 specific recommendations.`;

    const response = await openRouterClient.chatCompletion({
      feature: "health_score",
      messages: [{ role: "user", content: prompt }],
      workspaceId,
      userId,
      userEmail: req.user?.email,
      demoContext: analytics,
    });

    // 3. Store insight in PostgreSQL
    await db.query(
      `INSERT INTO ai_insights (workspace_id, project_id, health_score, health_status, risk_level, metrics_breakdown, summary, risk_factors)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        workspaceId,
        projectId,
        analytics.healthScore,
        analytics.healthStatus,
        analytics.riskLevel,
        JSON.stringify(analytics.metrics),
        response.content,
        JSON.stringify(analytics.risks),
      ]
    );

    res.json({
      healthScore: analytics.healthScore,
      healthStatus: analytics.healthStatus,
      riskLevel: analytics.riskLevel,
      metrics: analytics.metrics,
      risks: analytics.risks,
      explanation: response.content,
      is_demo: response.is_demo,
      model: response.model,
    });
  } catch (err) {
    console.error("Health analysis error:", err);
    res.status(500).json({ error: err.message || "Failed to compute project health." });
  }
};

/**
 * 5. Team Workload Intelligence
 */
exports.getTeamWorkload = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const projectId = req.query.projectId || null;

    const workload = await analyticsEngine.computeTeamWorkload(workspaceId, projectId);
    res.json(workload);
  } catch (err) {
    console.error("Team workload error:", err);
    res.status(500).json({ error: err.message || "Failed to compute workload intelligence." });
  }
};

/**
 * 6. AI Status Report Generation
 */
exports.generateReport = async (req, res) => {
  try {
    const { project_id } = req.body;
    const workspaceId = req.workspace.id;
    const userId = req.user.id;

    const { text: projectContext, stats: projectStats } = await assembleProjectContext(project_id, workspaceId);
    const health = project_id ? await analyticsEngine.computeProjectHealth(project_id, workspaceId) : null;

    const prompt = `Generate a professional, structured executive project progress report in markdown.
Context:\n${projectContext}
Metrics:\n${JSON.stringify(health || {})}`;

    const response = await openRouterClient.chatCompletion({
      feature: "reporting",
      messages: [{ role: "user", content: prompt }],
      workspaceId,
      userId,
      userEmail: req.user?.email,
      demoContext: projectStats || { projectName: "Active Project" },
    });

    res.json({
      report: response.content,
      is_demo: response.is_demo,
      model: response.model,
    });
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate report." });
  }
};

/**
 * 7. Agentic Tool Execution
 */
exports.executeTool = async (req, res) => {
  try {
    const { tool_name, tool_args, conversation_id, is_approved } = req.body;
    if (!tool_name) {
      return res.status(400).json({ error: "tool_name is required." });
    }

    const currentRole = req.workspaceRole || "Guest";
    const ROLE_HIERARCHY = {
      Owner: 70,
      Admin: 60,
      "Project Manager": 50,
      "Team Lead": 40,
      Member: 30,
      Viewer: 20,
      Guest: 10,
    };
    const userLevel = ROLE_HIERARCHY[currentRole] || 0;

    // Viewers and Guests cannot execute state-modifying actions
    if (agentService.isModifyingTool(tool_name)) {
      if (tool_name === "delete_project") {
        if (userLevel < ROLE_HIERARCHY["Project Manager"]) {
          return res.status(403).json({ error: "Insufficient permissions: Project Manager role required to delete projects." });
        }
      } else if (userLevel < ROLE_HIERARCHY["Member"]) {
        return res.status(403).json({ error: "Insufficient permissions: Member role required to execute modifications." });
      }
    } else if (userLevel < ROLE_HIERARCHY["Viewer"]) {
      return res.status(403).json({ error: "Insufficient permissions: Viewer role required." });
    }

    const result = await agentService.executeTool(tool_name, tool_args || {}, {
      workspaceId: req.workspace.id,
      userId: req.user.id,
      userRole: currentRole,
      conversationId: conversation_id,
      isApproved: Boolean(is_approved),
    });

    res.json(result);
  } catch (err) {
    console.error("Tool execution controller error:", err);
    res.status(500).json({ error: err.message || "Tool execution failed." });
  }
};

/**
 * 8. Document Ingestion (RAG)
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { filename, content, mime_type, project_id } = req.body;
    if (!filename || !content) {
      return res.status(400).json({ error: "filename and content are required." });
    }

    const result = await ragService.ingestDocument({
      workspaceId: req.workspace.id,
      projectId: project_id || null,
      userId: req.user.id,
      filename,
      mimeType: mime_type || "text/plain",
      rawContent: content,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Document ingestion error:", err);
    res.status(500).json({ error: err.message || "Document indexing failed." });
  }
};

/**
 * 9. AI Usage Analytics, Daily Quota & Model Configuration (Role-Guarded)
 */
exports.getUsageStats = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const stats = await usageService.getWorkspaceUsageStats(workspaceId);
    const configRes = await db.query(
      "SELECT * FROM ai_model_configs WHERE workspace_id = $1",
      [workspaceId]
    );
    const configRow = configRes.rows[0];
    const isCustomKey = Boolean(configRow?.custom_api_key && configRow.custom_api_key.trim().length > 5);

    // Get daily quota tracking (50 requests/day free tier)
    const dailyQuota = await rateLimiter.checkMasterDailyQuota(isCustomKey);
    const circuit = circuitBreaker.getStatus();

    // Friendly, enterprise capability mapping (hides raw technical slugs)
    const capabilities = [
      { id: "assistant", title: "Core Assistant & Reasoning", model: "NVIDIA Nemotron 70B & Gemma 27B", tier: "Free Tier" },
      { id: "agent", title: "Autonomous Tool & Action Agent", model: "DeepSeek R1 & Nemotron Reasoner", tier: "Free Tier" },
      { id: "task_generator", title: "Smart Work Breakdown & Subtasks", model: "Recursive Flint v1.0", tier: "Free Tier" },
      { id: "rag", title: "Contextual Workspace Search", model: "NVIDIA Vision & Reasoning", tier: "Free Tier" },
      { id: "health_score", title: "Project Health & Predictive Insights", model: "Statistical ML & Llama 3.3", tier: "Free Tier" },
    ];

    res.json({
      stats,
      dailyQuota: {
        limit: dailyQuota.limit,
        usedToday: dailyQuota.usedToday,
        remainingToday: dailyQuota.remainingToday,
        percentUsed: dailyQuota.percentUsed,
        isCustomKey: dailyQuota.isCustomKey,
      },
      circuitStatus: circuit.state,
      cooldownRemainingSec: circuit.cooldownRemainingSec,
      config: {
        is_enabled: configRow ? configRow.is_enabled : true,
        daily_token_budget: configRow ? configRow.daily_token_budget : 250000,
        hasCustomKey: isCustomKey,
        maskedCustomKey: isCustomKey
          ? `${configRow.custom_api_key.slice(0, 7)}••••••••${configRow.custom_api_key.slice(-4)}`
          : null,
      },
      capabilities,
      isOpenRouterConfigured: openRouterClient.isConfigured || isCustomKey,
    });
  } catch (err) {
    console.error("Usage stats error:", err);
    res.status(500).json({ error: err.message || "Failed to load AI usage stats." });
  }
};

/**
 * 9b. Update Workspace AI Configuration (BYOK & Quota Management)
 */
exports.updateAIConfig = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { custom_api_key, is_enabled, daily_token_budget } = req.body;

    let cleanKey = null;
    if (typeof custom_api_key === "string" && custom_api_key.trim().length > 0) {
      cleanKey = custom_api_key.trim();
      // Validate key against OpenRouter auth endpoint
      try {
        const testRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: { Authorization: `Bearer ${cleanKey}` },
        });
        if (!testRes.ok) {
          return res.status(400).json({
            error: "The provided OpenRouter API key could not be verified. Please check your key at openrouter.ai/keys.",
          });
        }
      } catch (verifyErr) {
        return res.status(400).json({
          error: "Failed to connect to OpenRouter to verify API key: " + verifyErr.message,
        });
      }
    }

    // Upsert ai_model_configs
    const upsertRes = await db.query(
      `INSERT INTO ai_model_configs (
        workspace_id, is_enabled, daily_token_budget, custom_api_key, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (workspace_id) DO UPDATE SET
        is_enabled = COALESCE($2, ai_model_configs.is_enabled),
        daily_token_budget = COALESCE($3, ai_model_configs.daily_token_budget),
        custom_api_key = $4,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        workspaceId,
        typeof is_enabled === "boolean" ? is_enabled : true,
        daily_token_budget ? parseInt(daily_token_budget, 10) : 250000,
        cleanKey,
      ]
    );

    const saved = upsertRes.rows[0];
    const isCustomKey = Boolean(saved.custom_api_key);

    res.json({
      success: true,
      config: {
        is_enabled: saved.is_enabled,
        daily_token_budget: saved.daily_token_budget,
        hasCustomKey: isCustomKey,
        maskedCustomKey: isCustomKey
          ? `${saved.custom_api_key.slice(0, 7)}••••••••${saved.custom_api_key.slice(-4)}`
          : null,
      },
    });
  } catch (err) {
    console.error("Update AI config error:", err);
    res.status(500).json({ error: err.message || "Failed to update AI configuration." });
  }
};

/**
 * 10. Conversation History (Strictly Scoped by Workspace and User)
 */
exports.getConversations = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const userId = req.user.id;
    const projectId = req.query.projectId || null;

    let q = `SELECT c.*, COUNT(m.id) as message_count 
             FROM ai_conversations c
             LEFT JOIN ai_messages m ON c.id = m.conversation_id
             WHERE c.workspace_id = $1 AND c.user_id = $2`;
    const params = [workspaceId, userId];

    if (projectId) {
      q += ` AND (c.project_id = $3 OR c.project_id IS NULL)`;
      params.push(projectId);
    }

    q += ` GROUP BY c.id ORDER BY c.updated_at DESC LIMIT 50`;
    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const workspaceId = req.workspace.id;
    const userId = req.user.id;

    // Verify conversation ownership: Strictly scoped to workspace AND user
    const convCheck = await db.query(
      "SELECT id FROM ai_conversations WHERE id = $1 AND workspace_id = $2 AND user_id = $3",
      [conversationId, workspaceId, userId]
    );
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found or access denied." });
    }

    const msgs = await db.query(
      "SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [conversationId]
    );
    res.json(msgs.rows);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const workspaceId = req.workspace.id;
    const userId = req.user.id;

    // Verify conversation ownership before deleting
    const convCheck = await db.query(
      "SELECT id FROM ai_conversations WHERE id = $1 AND workspace_id = $2 AND user_id = $3",
      [conversationId, workspaceId, userId]
    );
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found or access denied." });
    }

    await db.query("DELETE FROM ai_messages WHERE conversation_id = $1", [conversationId]);
    await db.query(
      "DELETE FROM ai_conversations WHERE id = $1 AND workspace_id = $2 AND user_id = $3",
      [conversationId, workspaceId, userId]
    );
    res.json({ success: true, deletedId: conversationId });
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const workspaceId = req.workspace.id;
    const userId = req.user.id;
    const { title, project_id } = req.body;

    // Verify ownership
    const convCheck = await db.query(
      "SELECT id FROM ai_conversations WHERE id = $1 AND workspace_id = $2 AND user_id = $3",
      [conversationId, workspaceId, userId]
    );
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found or access denied." });
    }

    const updates = [];
    const params = [conversationId, workspaceId, userId];

    if (title !== undefined) {
      params.push(title);
      updates.push(`title = $${params.length}`);
    }
    if (project_id !== undefined) {
      params.push(project_id ? parseInt(project_id, 10) : null);
      updates.push(`project_id = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update." });
    }

    updates.push("updated_at = NOW()");

    const result = await db.query(
      `UPDATE ai_conversations 
       SET ${updates.join(", ")}
       WHERE id = $1 AND workspace_id = $2 AND user_id = $3
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update conversation error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 11. Create Conversation & Append Message (Persistence)
 */
exports.createConversation = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const userId = req.user.id;
    const { title = "New chat", project_id = null } = req.body;

    const result = await db.query(
      `INSERT INTO ai_conversations (workspace_id, project_id, user_id, title, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [workspaceId, project_id ? parseInt(project_id, 10) : null, userId, title]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.appendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const workspaceId = req.workspace.id;
    const userId = req.user.id;
    const { role, content, metadata = null, model_id = null } = req.body;

    const conv = await db.query(
      "SELECT id FROM ai_conversations WHERE id = $1 AND workspace_id = $2 AND user_id = $3",
      [conversationId, workspaceId, userId]
    );
    if (conv.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found or access denied." });
    }

    const result = await db.query(
      `INSERT INTO ai_messages (conversation_id, role, content, metadata, model_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        conversationId,
        role || "assistant",
        content || "",
        metadata ? (typeof metadata === "string" ? metadata : JSON.stringify(metadata)) : null,
        model_id || null,
      ]
    );

    await db.query(
      "UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1",
      [conversationId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Append message error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 12. AI Project Blueprint & Description Generator
 */
function generateDomainBlueprint(name, scope, priority, targetDate) {
  const cleanName = (name || "New Initiative").trim();
  const lower = cleanName.toLowerCase();
  let category = "Core Engineering";
  let labels = ["Engineering", "Platform"];

  if (
    lower.includes("design") ||
    lower.includes("ui") ||
    lower.includes("component") ||
    lower.includes("theme") ||
    lower.includes("style")
  ) {
    category = "Design System & UI";
    labels = ["Design System", "Frontend", "UI/UX"];
  } else if (
    lower.includes("api") ||
    lower.includes("backend") ||
    lower.includes("service") ||
    lower.includes("database") ||
    lower.includes("postgres")
  ) {
    category = "Backend & Infrastructure";
    labels = ["Backend", "API", "Infrastructure"];
  } else if (
    lower.includes("auth") ||
    lower.includes("security") ||
    lower.includes("audit") ||
    lower.includes("permission") ||
    lower.includes("access")
  ) {
    category = "Security & Governance";
    labels = ["Security", "Auth", "Compliance"];
  } else if (
    lower.includes("mobile") ||
    lower.includes("ios") ||
    lower.includes("android") ||
    lower.includes("app") ||
    lower.includes("react native")
  ) {
    category = "Mobile Application";
    labels = ["Mobile", "Cross-Platform", "App"];
  } else if (
    lower.includes("data") ||
    lower.includes("etl") ||
    lower.includes("warehouse") ||
    lower.includes("analytics") ||
    lower.includes("metrics")
  ) {
    category = "Data & Analytics";
    labels = ["Data", "Pipeline", "Analytics"];
  } else if (
    lower.includes("ai") ||
    lower.includes("agent") ||
    lower.includes("llm") ||
    lower.includes("bot") ||
    lower.includes("rag")
  ) {
    category = "AI & Autonomous Intelligence";
    labels = ["AI", "Agents", "Automation"];
  }

  const description = `${cleanName} establishes a high-performance ${category.toLowerCase()} foundation tailored for enterprise scale, velocity, and reliability. This initiative unifies architectural patterns, delivers automated workflows, and enforces rigorous quality standards across the workspace.`;
  const short_summary = `Enterprise ${category.toLowerCase()} initiative focused on delivering ${cleanName}.`;

  const milestones = [
    {
      name: "Phase 1: Architecture & Technical Blueprint",
      description: "Define specifications, interface schemas, and technical blueprint.",
    },
    {
      name: "Phase 2: Core Feature Implementation",
      description: "Deliver primary modules, operational endpoints, and automated tests.",
    },
    {
      name: "Phase 3: Hardening, Quality Gates & Launch",
      description: "Conduct security review, end-to-end verification, and release launch.",
    },
  ];

  return { description, short_summary, labels, milestones };
}

async function generateAIProjectBlueprint({ name, scope, priority, targetDate, workspaceId, userId }) {
  const cleanName = (name || "New Initiative").trim();

  try {
    const prompt = [
      {
        role: "system",
        content: `You are an elite Technical Product Architect. Given a project topic/title, priority, and timeline, generate a high-impact, professional project blueprint in JSON format.
Your output MUST be valid JSON with these exact keys:
{
  "description": "A comprehensive 2-3 sentence technical description of the project, its core objective, architecture, and value proposition.",
  "short_summary": "A punchy single-sentence summary (max 100 characters).",
  "labels": ["tag1", "tag2", "tag3"],
  "milestones": [
    { "name": "Milestone 1 Name", "description": "Brief deliverable" },
    { "name": "Milestone 2 Name", "description": "Brief deliverable" },
    { "name": "Milestone 3 Name", "description": "Brief deliverable" }
  ]
}
Return ONLY JSON, no markdown codeblocks.`,
      },
      {
        role: "user",
        content: `Project Topic: ${cleanName}\nScope: ${scope || "Standard"}\nPriority: ${priority || "High"}\nTarget Timeline: ${targetDate || "6-8 weeks"}`,
      },
    ];

    const modelRes = await openRouterClient.chatCompletion({
      feature: "assistant",
      messages: prompt,
      workspaceId,
      userId,
      userEmail: req.user?.email,
      temperature: 0.3,
      max_tokens: 1000,
    });

    let raw = (modelRes?.content || "").trim();
    if (!raw && modelRes?.reasoning) {
      const jsonMatch = modelRes.reasoning.match(/\{[\s\S]*"description"[\s\S]*\}/);
      if (jsonMatch) raw = jsonMatch[0];
    }

    const cleanJson = raw.replace(/^```(json)?\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleanJson);
    if (parsed.description && parsed.short_summary) {
      return parsed;
    }
  } catch (err) {
    console.warn("[Blueprint Generation] AI fallback to domain generator:", err.message);
  }

  return generateDomainBlueprint(cleanName, scope, priority, targetDate);
}

exports.generateProjectBlueprintEndpoint = async (req, res) => {
  try {
    const { name, scope, priority, targetDate } = req.body;
    const workspaceId = req.workspace.id;
    const userId = req.user?.id || null;

    const blueprint = await generateAIProjectBlueprint({
      name,
      scope,
      priority,
      targetDate,
      workspaceId,
      userId,
    });

    res.json({ success: true, blueprint });
  } catch (err) {
    console.error("Project blueprint error:", err);
    const fallback = generateDomainBlueprint(req.body.name, req.body.scope, req.body.priority, req.body.targetDate);
    res.json({ success: true, blueprint: fallback });
  }
};


