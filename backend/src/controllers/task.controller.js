const db = require('../config/database');

exports.getAllTasks = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT t.*, u.name as assignee_name 
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE p.workspace_id = $1
      ORDER BY t.created_at DESC
    `, [req.workspace.id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createTask = async (req, res) => {
  const { project_id, title, status, priority, assignee_id } = req.body;
  try {
    // Ensure the project belongs to the active workspace
    const projRes = await db.query('SELECT id FROM projects WHERE id = $1 AND workspace_id = $2', [project_id, req.workspace.id]);
    if (projRes.rows.length === 0) {
      return res.status(403).json({ error: 'Project not found in active workspace' });
    }

    const { rows } = await db.query(
      'INSERT INTO tasks (project_id, title, status, priority, assignee_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [project_id, title, status || 'Todo', priority || 'Medium', assignee_id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { status, title, priority, assignee_id, description } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE tasks t 
       SET status = COALESCE($1, status), 
           title = COALESCE($2, title), 
           priority = COALESCE($3, priority), 
           assignee_id = COALESCE($4, assignee_id), 
           description = COALESCE($5, description) 
       FROM projects p
       WHERE t.id = $6 AND t.project_id = p.id AND p.workspace_id = $7 
       RETURNING t.*`,
      [status, title, priority, assignee_id, description, id, req.workspace.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found in active workspace' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT t.*, u.name as assignee_name 
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND p.workspace_id = $2
    `, [id, req.workspace.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found in active workspace' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
