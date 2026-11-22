const db = require("../config/database");
const { handleError } = require("../utils/errorHandler");
const { getIO } = require("../socket");
const {
  generateProjectSlug,
  generateProjectIdentifier,
} = require("../utils/slug");

exports.getAllProjects = async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      WITH ws_projects AS (
        SELECT p.*
        FROM projects p
        WHERE p.workspace_id = $1
      ),
      task_counts AS (
        SELECT t.project_id, COUNT(*)::int as issue_count
        FROM tasks t
        JOIN ws_projects wp ON t.project_id = wp.id
        GROUP BY t.project_id
      ),
      member_stats AS (
        SELECT 
          pm.project_id, 
          json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'avatar_url', u.avatar_url, 'role', pm.role)) as members
        FROM project_members pm
        JOIN ws_projects wp ON pm.project_id = wp.id
        JOIN users u ON pm.user_id = u.id
        GROUP BY pm.project_id
      ),
      milestone_stats AS (
        SELECT 
          m.project_id, 
          json_agg(m) as milestones
        FROM milestones m
        JOIN ws_projects wp ON m.project_id = wp.id
        GROUP BY m.project_id
      )
      SELECT 
        wp.*,
        row_to_json(u) as lead,
        COALESCE(ms.members, '[]'::json) as members,
        COALESCE(mls.milestones, '[]'::json) as milestones,
        COALESCE(tc.issue_count, 0) as issue_count
      FROM ws_projects wp
      LEFT JOIN users u ON wp.lead_id = u.id
      LEFT JOIN task_counts tc ON wp.id = tc.project_id
      LEFT JOIN member_stats ms ON wp.id = ms.project_id
      LEFT JOIN milestone_stats mls ON wp.id = mls.project_id
      ORDER BY wp.created_at DESC
    `,
      [req.workspace.id],
    );

    // Process JSON returns if null
    const processedRows = rows.map((row) => ({
      ...row,
      members: row.members || [],
      milestones: row.milestones || [],
      labels: row.labels || [],
      issue_count: parseInt(row.issue_count || 0, 10),
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
        row_to_json(u) as lead,
        (
          SELECT json_agg(json_build_object('id', u2.id, 'name', u2.name, 'email', u2.email, 'avatar_url', u2.avatar_url, 'role', pm.role))
          FROM project_members pm
          JOIN users u2 ON pm.user_id = u2.id
          WHERE pm.project_id = p.id
        ) as members,
        (
          SELECT json_agg(m)
          FROM milestones m WHERE m.project_id = p.id
        ) as milestones,
        (
          SELECT COUNT(*)::int
          FROM tasks t WHERE t.project_id = p.id
        ) as issue_count
      FROM projects p
      LEFT JOIN users u ON p.lead_id = u.id
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
    project.issue_count = parseInt(project.issue_count || 0, 10);

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
      await client.query("SELECT pg_advisory_xact_lock(hashtext('project_create_' || $1))", [workspace_id]);
      const slug = await generateProjectSlug(name, workspace_id, client);
      const identifier = await generateProjectIdentifier(
        workspace_id,
        req.user?.name,
        client,
      );

      // Extract lead_id from lead object (if provided)
      const lead_id = lead && lead.id ? lead.id : (lead && lead.assign_current ? req.user.id : null);

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
      try {
        await client.query("ROLLBACK");
      } catch (rbErr) {
        console.error("Rollback error:", rbErr);
      }
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
    const validatedData = projectSchema.partial().parse(req.body);
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
        try {
          await client.query("ROLLBACK");
        } catch (rbErr) {
          console.error("Rollback error:", rbErr);
        }
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

      // Sync milestones safely: update existing, insert new, delete removed
      if (milestones && Array.isArray(milestones)) {
        const incomingIds = milestones.map((m) => m.id).filter(Boolean);
        if (incomingIds.length > 0) {
          const placeholders = incomingIds.map((_, i) => `$${i + 2}`).join(", ");
          await client.query(
            `DELETE FROM milestones WHERE project_id = $1 AND id NOT IN (${placeholders})`,
            [id, ...incomingIds],
          );
        } else if (milestones.length === 0 && req.body.clear_milestones === true) {
          await client.query("DELETE FROM milestones WHERE project_id = $1", [
            id,
          ]);
        }

        for (const m of milestones) {
          const name = m.name || m.title;
          const desc = m.desc || m.description || null;
          const dueDate = m.date || m.due_date || null;
          if (!name) continue;

          if (m.id) {
            await client.query(
              "UPDATE milestones SET name = $1, description = $2, due_date = $3 WHERE id = $4 AND project_id = $5",
              [name, desc, dueDate, m.id, id],
            );
          } else {
            await client.query(
              "INSERT INTO milestones (project_id, name, description, due_date) VALUES ($1, $2, $3, $4)",
              [id, name, desc, dueDate],
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
      try {
        await client.query("ROLLBACK");
      } catch (rbErr) {
        console.error("Rollback error:", rbErr);
      }
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
      getIO().to(`workspace_${req.workspace.id}`).emit("PROJECT_DELETED", { id: rows[0].id });
    } catch (e) {
      console.error("Socket error emitting PROJECT_DELETED:", e);
    }

    res.json({ message: "Project deleted successfully", project: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
