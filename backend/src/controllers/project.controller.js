const db = require('../config/database');

exports.getAllProjects = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.* 
      FROM projects p
      WHERE p.workspace_id = $1
      ORDER BY p.created_at DESC
    `, [req.workspace.id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM projects WHERE id = $1 AND workspace_id = $2', [id, req.workspace.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createProject = async (req, res) => {
  const { name, description, status, health, priority, start_date, due_date, lead, members, labels, progress, milestones, dependencies, position } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  try {
    const workspace_id = req.workspace.id;

    const { rows } = await db.query(
      `INSERT INTO projects (
        workspace_id, owner_id, name, slug, description, status, health, priority, start_date, due_date,
        lead, members, labels, progress, milestones, dependencies, position
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        workspace_id, req.user.id, name, slug, description, 
        status || 'Planning', health || 'On Track', priority || 'Medium', 
        start_date || null, due_date || null,
        lead ? JSON.stringify(lead) : null,
        members ? JSON.stringify(members) : '[]',
        labels ? JSON.stringify(labels) : '[]',
        progress || 0,
        milestones ? JSON.stringify(milestones) : '[]',
        dependencies ? JSON.stringify(dependencies) : '[]',
        position || 1
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    if (error.constraint === 'projects_slug_key') {
      return res.status(400).json({ error: 'A project with a similar name already exists.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, status, health, priority, start_date, due_date, position, lead, members, labels, progress, dependencies, milestones } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           health = COALESCE($4, health),
           priority = COALESCE($5, priority),
           start_date = COALESCE($6, start_date),
           due_date = COALESCE($7, due_date),
           position = COALESCE($8, position),
           lead = COALESCE($9, lead),
           members = COALESCE($10, members),
           labels = COALESCE($11, labels),
           progress = COALESCE($12, progress),
           dependencies = COALESCE($13, dependencies),
           milestones = COALESCE($14, milestones),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $15 AND workspace_id = $16 RETURNING *`,
      [
        name, description, status, health, priority, start_date, due_date,
        position,
        lead ? JSON.stringify(lead) : null,
        members ? JSON.stringify(members) : null,
        labels ? JSON.stringify(labels) : null,
        progress,
        dependencies ? JSON.stringify(dependencies) : null,
        milestones ? JSON.stringify(milestones) : null,
        id, req.workspace.id
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('DELETE FROM projects WHERE id = $1 AND workspace_id = $2 RETURNING *', [id, req.workspace.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted successfully', project: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

