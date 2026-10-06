const db = require('../config/database');

exports.getTaskComments = async (req, res) => {
  const { taskId } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT c.*, u.name as user_name, u.avatar_url 
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN tasks t ON c.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE c.task_id = $1 AND p.workspace_id = $2
      ORDER BY c.created_at ASC
    `, [taskId, req.workspace.id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addComment = async (req, res) => {
  const { task_id, content } = req.body;
  const user_id = req.user.id;

  if (!task_id || !content) {
    return res.status(400).json({ error: 'task_id and content are required' });
  }

  try {
    // Verify task belongs to active workspace
    const taskRes = await db.query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND p.workspace_id = $2
    `, [task_id, req.workspace.id]);
    
    if (taskRes.rows.length === 0) {
      return res.status(403).json({ error: 'Task not found in active workspace' });
    }

    const { rows } = await db.query(
      'INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [task_id, user_id, content]
    );
    
    // Fetch user info to append to response
    const userRes = await db.query('SELECT name as user_name, avatar_url FROM users WHERE id = $1', [user_id]);
    const comment = { ...rows[0], ...userRes.rows[0] };
    
    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
