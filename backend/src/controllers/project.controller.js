const db = require("../config/database");
const { handleError } = require("../utils/errorHandler");

const { getIO } = require("../socket");

const generateSlug = async (name, workspace_id, client = db) => {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  if (!baseSlug) baseSlug = "project";

  const res = await client.query(
    "SELECT slug FROM projects WHERE workspace_id = $1 AND slug LIKE $2",
    [workspace_id, `${baseSlug}%`],
  );
  const existingSlugs = new Set(res.rows.map((r) => r.slug));
  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let counter = 1;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
};

const getUserIdentifierCode = (name) => {
  if (!name || typeof name !== "string") return "USR";
  const clean = name.trim();
  if (!clean) return "USR";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((p) => p[0].toUpperCase()).slice(0, 3).join("");
  }
  return clean.slice(0, 3).toUpperCase();
};

const generateProjectIdentifier = async (workspace_id, user_name, client = db) => {
  const userCode = getUserIdentifierCode(user_name);
  const prefix = `KRI-${userCode}-`;

  const res = await client.query(
    "SELECT identifier FROM projects WHERE workspace_id = $1 AND identifier LIKE $2",
    [workspace_id, `${prefix}%`],
  );

  let maxNum = 0;
  for (const row of res.rows) {
    if (row.identifier) {
      const match = row.identifier.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  return `${prefix}${maxNum + 1}`;
};

exports.getAllProjects = async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT 
        p.*,
        (
          SELECT row_to_json(u)
          FROM users u WHERE u.id = p.lead_id
        ) as lead,
        (
          SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'avatar_url', u.avatar_url, 'role', pm.role))
          FROM project_members pm
          JOIN users u ON pm.user_id = u.id
          WHERE pm.project_id = p.id
        ) as members,
        (
          SELECT json_agg(m)
          FROM milestones m WHERE m.project_id = p.id
        ) as milestones
      FROM projects p
      WHERE p.workspace_id = $1
      ORDER BY p.created_at DESC
    `,
      [req.workspace.id],
    );

    // Process JSON returns if null
    const processedRows = rows.map((row) => ({
      ...row,
      members: row.members || [],
      milestones: row.milestones || [],
      labels: row.labels || [],
    }));

    res.json(processedRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    const { rows } = await db.query(
      `
      SELECT 
        p.*,
        (
          SELECT row_to_json(u)
          FROM users u WHERE u.id = p.lead_id
        ) as lead,
        (
          SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'avatar_url', u.avatar_url, 'role', pm.role))
          FROM project_members pm
          JOIN users u ON pm.user_id = u.id
          WHERE pm.project_id = p.id
        ) as members,
        (
          SELECT json_agg(m)
          FROM milestones m WHERE m.project_id = p.id
        ) as milestones
      FROM projects p
      WHERE (p.id = $1 OR p.identifier = $2 OR p.slug = $2) AND p.workspace_id = $3
    `,
      [isNumeric ? parseInt(id, 10) : -1, id, req.workspace.id],
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Project not found" });

    const project = rows[0];
    project.members = project.members || [];
    project.milestones = project.milestones || [];
    project.labels = project.labels || [];

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const { projectSchema } = require("../validators");

exports.createProject = async (req, res) => {
  try {
    const validatedData = projectSchema.parse(req.body);
    const {
      name,
      description,
      short_summary,
      status,
      health,
      priority,
      start_date,
      due_date,
      lead,
      members,
      labels,
      progress,
      milestones,
      dependencies,
      position,
    } = validatedData;

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const workspace_id = req.workspace.id;
      const slug = await generateSlug(name, workspace_id, client);
      const identifier = await generateProjectIdentifier(
        workspace_id,
        req.user?.name,
        client,
      );

      // Extract lead_id from lead object (if provided)
      const lead_id = lead && lead.id ? lead.id : null;

      const { rows } = await client.query(
        `INSERT INTO projects (
          workspace_id, owner_id, name, slug, identifier, description, short_summary, status, health, priority, start_date, due_date,
          lead_id, labels, progress, position
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
        [
          workspace_id,
          req.user.id,
          name,
          slug,
          identifier,
          description,
          short_summary,
          status || "Planning",
          health || "On Track",
          priority || "Medium",
          start_date || null,
          due_date || null,
          lead_id,
          labels ? JSON.stringify(labels) : "[]",
          progress || 0,
          position || 1,
        ],
      );
      const newProject = rows[0];

      // Insert project members
      if (members && Array.isArray(members)) {
        for (const member of members) {
          // Assume member object has user id
          if (member.id) {
            await client.query(
              "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
              [newProject.id, member.id, member.role || "Member"],
            );
          }
        }
      }

      // Insert milestones
      if (milestones && Array.isArray(milestones)) {
        for (const m of milestones) {
          if (m.name || m.title) {
            await client.query(
              "INSERT INTO milestones (project_id, name, description, due_date) VALUES ($1, $2, $3, $4)",
              [
                newProject.id,
                m.name || m.title,
                m.desc || m.description || null,
                m.date || m.due_date || null,
              ],
            );
          }
        }
      }

      await client.query("COMMIT");

      try {
        getIO()
          .to(`workspace_${workspace_id}`)
          .emit("PROJECT_CREATED", newProject);
      } catch (e) {
        console.error("Socket error emitting PROJECT_CREATED:", e);
      }

      // Return created project (to avoid complex re-querying, we just respond with 201)
      res.status(201).json(newProject);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Server error" });
    } finally {
      client.release();
    }
  } catch (error) {
    return handleError(res, error);
  }
};

exports.updateProject = async (req, res) => {
  const { id } = req.params;

  try {
    const validatedData = projectSchema.parse(req.body);
    const {
      name,
      description,
      short_summary,
      status,
      health,
      priority,
      start_date,
      due_date,
      position,
      lead,
      members,
      labels,
      progress,
      milestones,
    } = validatedData;

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Extract lead_id
      let lead_id = undefined;
      if (lead !== undefined) {
        lead_id = lead && lead.id ? lead.id : null;
      }

      const { rows } = await client.query(
        `UPDATE projects 
         SET name = CASE WHEN $1::boolean THEN $2 ELSE name END,
             description = CASE WHEN $3::boolean THEN $4 ELSE description END,
             short_summary = CASE WHEN $5::boolean THEN $6 ELSE short_summary END,
             status = CASE WHEN $7::boolean THEN $8 ELSE status END,
             health = CASE WHEN $9::boolean THEN $10 ELSE health END,
             priority = CASE WHEN $11::boolean THEN $12 ELSE priority END,
             start_date = CASE WHEN $13::boolean THEN $14 ELSE start_date END,
             due_date = CASE WHEN $15::boolean THEN $16 ELSE due_date END,
             position = CASE WHEN $17::boolean THEN $18 ELSE position END,
             lead_id = CASE WHEN $19::boolean THEN $20 ELSE lead_id END,
             labels = CASE WHEN $21::boolean THEN $22 ELSE labels END,
             progress = CASE WHEN $23::boolean THEN $24 ELSE progress END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $25 AND workspace_id = $26 RETURNING *`,
        [
          name !== undefined,
          name || null,
          description !== undefined,
          description !== undefined ? description : null,
          short_summary !== undefined,
          short_summary !== undefined ? short_summary : null,
          status !== undefined,
          status || null,
          health !== undefined,
          health || null,
          priority !== undefined,
          priority || null,
          start_date !== undefined,
          start_date !== undefined ? start_date : null,
          due_date !== undefined,
          due_date !== undefined ? due_date : null,
          position !== undefined,
          position !== undefined ? position : null,
          lead !== undefined,
          lead_id,
          labels !== undefined,
          labels ? JSON.stringify(labels) : null,
          progress !== undefined,
          progress !== undefined ? progress : null,
          id,
          req.workspace.id,
        ],
      );
      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Project not found" });
      }

      // Sync members if provided
      if (members && Array.isArray(members)) {
        await client.query(
          "DELETE FROM project_members WHERE project_id = $1",
          [id],
        );
        for (const member of members) {
          if (member.id) {
            await client.query(
              "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)",
              [id, member.id, member.role || "Member"],
            );
          }
        }
      }

      // Sync milestones if provided
      if (milestones && Array.isArray(milestones)) {
        await client.query("DELETE FROM milestones WHERE project_id = $1", [
          id,
        ]);
        for (const m of milestones) {
          if (m.name || m.title) {
            await client.query(
              "INSERT INTO milestones (project_id, name, description, due_date) VALUES ($1, $2, $3, $4)",
              [
                id,
                m.name || m.title,
                m.desc || m.description || null,
                m.date || m.due_date || null,
              ],
            );
          }
        }
      }

      await client.query("COMMIT");

      try {
        getIO()
          .to(`workspace_${req.workspace.id}`)
          .emit("PROJECT_UPDATED", rows[0]);
      } catch (e) {
        console.error("Socket error emitting PROJECT_UPDATED:", e);
      }

      res.json(rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Server error" });
    } finally {
      client.release();
    }
  } catch (error) {
    return handleError(res, error);
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      "DELETE FROM projects WHERE id = $1 AND workspace_id = $2 RETURNING *",
      [id, req.workspace.id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Project not found" });

    try {
      getIO().to(`workspace_${req.workspace.id}`).emit("PROJECT_DELETED", id);
    } catch (e) {
      console.error("Socket error emitting PROJECT_DELETED:", e);
    }

    res.json({ message: "Project deleted successfully", project: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
