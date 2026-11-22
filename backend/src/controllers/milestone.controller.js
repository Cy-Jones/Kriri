const db = require("../config/database");
const { handleError } = require("../utils/errorHandler");

exports.createMilestone = async (req, res) => {
  try {
    const { milestoneSchema } = require("../validators");
    const validatedData = milestoneSchema.parse(req.body);
    const { project_id, name, due_date } = validatedData;
    const { description, status } = req.body;

    // Ensure project belongs to active workspace
    const projRes = await db.query(
      "SELECT id FROM projects WHERE id = $1 AND workspace_id = $2",
      [project_id, req.workspace.id],
    );
    if (projRes.rows.length === 0)
      return res
        .status(403)
        .json({ error: "Project not found in active workspace" });

    const { rows } = await db.query(
      "INSERT INTO milestones (project_id, name, description, due_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [project_id, name, description, due_date, status || "Pending"],
    );
    try {
      const { getIO } = require("../socket");
      getIO().to(`workspace_${req.workspace.id}`).emit("MILESTONE_CREATED", rows[0]);
    } catch (e) {}
    res.status(201).json(rows[0]);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getProjectMilestones = async (req, res) => {
  const { projectId } = req.params;
  try {
    const { rows } = await db.query(
      `
      SELECT m.* FROM milestones m
      JOIN projects p ON m.project_id = p.id
      WHERE m.project_id = $1 AND p.workspace_id = $2 
      ORDER BY m.due_date ASC
    `,
      [projectId, req.workspace.id],
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateMilestone = async (req, res) => {
  const { id } = req.params;
  try {
    const { milestoneSchema } = require("../validators");
    const validatedData = milestoneSchema.partial().parse(req.body);
    const { name, description, due_date, status } = validatedData;
    const { rows } = await db.query(
      `UPDATE milestones m
       SET name = COALESCE($1, m.name), 
           description = COALESCE($2, m.description), 
           due_date = COALESCE($3, m.due_date), 
           status = COALESCE($4, m.status) 
       FROM projects p
       WHERE m.id = $5 AND m.project_id = p.id AND p.workspace_id = $6
       RETURNING m.*`,
      [name, description, due_date, status, id, req.workspace.id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Milestone not found" });
    try {
      const { getIO } = require("../socket");
      getIO().to(`workspace_${req.workspace.id}`).emit("MILESTONE_UPDATED", rows[0]);
    } catch (e) {}
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteMilestone = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `
      DELETE FROM milestones m
      USING projects p
      WHERE m.id = $1 AND m.project_id = p.id AND p.workspace_id = $2
      RETURNING m.*
    `,
      [id, req.workspace.id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Milestone not found" });
    try {
      const { getIO } = require("../socket");
      getIO().to(`workspace_${req.workspace.id}`).emit("MILESTONE_DELETED", { id });
    } catch (e) {}
    res.json({ message: "Milestone deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
