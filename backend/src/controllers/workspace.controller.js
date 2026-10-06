const db = require('../config/database');

exports.createWorkspace = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Workspace name is required' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const owner_id = req.user.id;

  try {
    await db.query('BEGIN');
    
    // Create workspace
    const workspaceRes = await db.query(
      'INSERT INTO workspaces (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, owner_id]
    );
    const workspace = workspaceRes.rows[0];

    // Add owner as Owner member
    await db.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspace.id, owner_id, 'Owner']
    );

    await db.query('COMMIT');
    res.status(201).json(workspace);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    if (error.constraint === 'workspaces_slug_key') {
      return res.status(400).json({ error: 'Workspace name already exists.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserWorkspaces = async (req, res) => {
  const user_id = req.user.id;
  try {
    const { rows } = await db.query(`
      SELECT w.*, wm.role 
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY w.name ASC
    `, [user_id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getWorkspaceDetails = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  try {
    // Check if user is member
    const memberCheck = await db.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [id, user_id]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await db.query('SELECT * FROM workspaces WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Workspace not found' });
    
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getWorkspaceMembers = async (req, res) => {
  try {
      // --- JIT Sync from Clerk to handle local dev webhook failures ---
      try {
        const { clerkClient } = require('@clerk/express');
        const memberships = await clerkClient.organizations.getOrganizationMembershipList({ 
          organizationId: req.workspace.clerk_org_id,
          limit: 100
        });
        
        for (const membership of memberships.data) {
          const clerkUser = membership.publicUserData;
          const clerkUserId = clerkUser.userId;
          const email = clerkUser.identifier || ''; // identifier often holds the email
          const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'Unknown';
          const avatarUrl = clerkUser.imageUrl || null;
          
          // Upsert User
          const userRes = await db.query(
            `INSERT INTO users (clerk_user_id, name, email, avatar_url) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (clerk_user_id) DO UPDATE SET name = $2, avatar_url = $4
             RETURNING id`,
            [clerkUserId, name, email, avatarUrl]
          );
          
          if (userRes.rows.length > 0) {
            const localUserId = userRes.rows[0].id;
            // Upsert Workspace Member (Default to Member, don't overwrite existing roles)
            await db.query(
              `INSERT INTO workspace_members (workspace_id, user_id, role)
               VALUES ($1, $2, $3)
               ON CONFLICT (workspace_id, user_id) DO NOTHING`,
              [req.workspace.id, localUserId, 'Member']
            );
          }
        }
      } catch (syncError) {
        console.error("Failed to sync members from Clerk:", syncError);
      }
      // ----------------------------------------------------------------

      const { rows } = await db.query(`
        SELECT u.id, u.name, u.email, u.avatar_url, wm.role, wm.created_at as joined_at
        FROM workspace_members wm
        JOIN users u ON wm.user_id = u.id
        WHERE wm.workspace_id = $1
        ORDER BY wm.created_at ASC
      `, [req.workspace.id]);
      res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateWorkspaceMemberRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  
  // Validate role
  const validRoles = ['Owner', 'Admin', 'Project Manager', 'Team Lead', 'Member', 'Viewer', 'Guest'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Prevent modifying the Owner's role (or perhaps only Owner can do it, but let's keep it simple)
  // Prevent removing the last Admin/Owner - we can skip this check for a simple MVP or add it if needed.

  try {
    const { rows } = await db.query(`
      UPDATE workspace_members
      SET role = $1
      WHERE workspace_id = $2 AND user_id = $3
      RETURNING *
    `, [role, req.workspace.id, userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found in workspace' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.removeWorkspaceMember = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // We get the user to find their clerk_user_id
    const userRes = await db.query('SELECT clerk_user_id FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const clerkUserId = userRes.rows[0].clerk_user_id;

    // Check if the user is the owner
    const memberCheck = await db.query('SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2', [req.workspace.id, userId]);
    if (memberCheck.rows.length === 0) return res.status(404).json({ error: 'Member not found in workspace' });
    if (memberCheck.rows[0].role === 'Owner') {
      return res.status(400).json({ error: 'Cannot remove the owner of the workspace' });
    }

    // Attempt to remove from Clerk if it's a Clerk organization
    if (req.workspace.clerk_org_id) {
      try {
        const { clerkClient } = require('@clerk/express');
        await clerkClient.organizations.deleteOrganizationMembership({
          organizationId: req.workspace.clerk_org_id,
          userId: clerkUserId
        });
      } catch (clerkErr) {
        console.error("Failed to remove user from Clerk Organization:", clerkErr);
        // Continue to remove from DB even if Clerk fails (or maybe it was already removed)
      }
    }

    // Remove from our DB
    await db.query('DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2', [req.workspace.id, userId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
