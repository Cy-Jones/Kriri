const db = require("../config/database");
const { handleError } = require("../utils/errorHandler");

const { getIO } = require("../socket");

const generateSlug = async (name, workspace_id) => {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  if (!baseSlug) baseSlug = "project";

  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const res = await db.query(
      "SELECT 1 FROM projects WHERE workspace_id = $1 AND slug = $2",
      [workspace_id, slug],
    );
    if (res.rows.length === 0) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  return slug;
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
      WHERE p.id = $1 AND p.workspace_id = $2
    `,
      [id, req.workspace.id],
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
      const slug = await generateSlug(name, workspace_id);

      // Extract lead_id from lead object (if provided)
      const lead_id = lead && lead.id ? lead.id : null;

      const { rows } = await client.query(
        `INSERT INTO projects (
          workspace_id, owner_id, name, slug, description, short_summary, status, health, priority, start_date, due_date,
          lead_id, labels, progress, position
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
        [
          workspace_id,
          req.user.id,
          name,
          slug,
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
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             short_summary = COALESCE($3, short_summary),
             status = COALESCE($4, status),
             health = COALESCE($5, health),
             priority = COALESCE($6, priority),
             start_date = COALESCE($7, start_date),
             due_date = COALESCE($8, due_date),
             position = COALESCE($9, position),
             lead_id = CASE WHEN $10::boolean THEN $11 ELSE lead_id END,
             labels = COALESCE($12, labels),
             progress = COALESCE($13, progress),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $14 AND workspace_id = $15 RETURNING *`,
        [
          name,
          description,
          short_summary,
          status,
          health,
          priority,
          start_date,
          due_date,
          position,
          lead !== undefined,
          lead_id,
          labels ? JSON.stringify(labels) : null,
          progress,
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
