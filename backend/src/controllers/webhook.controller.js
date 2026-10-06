const { Webhook } = require('svix');
const db = require('../config/database');

exports.handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return res.status(500).send('Webhook secret missing');
  }

  const payload = req.body;
  const headers = req.headers;

  const svix_id = headers['svix-id'];
  const svix_timestamp = headers['svix-timestamp'];
  const svix_signature = headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).send('Error occurred -- no svix headers');
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err.message);
    return res.status(400).json({ error: 'Error verifying webhook' });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`);

  try {
    if (eventType === 'organization.created') {
      const { id: clerkOrgId, name, slug, created_by } = evt.data;
      
      let ownerId = null;
      if (created_by) {
        const ownerRes = await db.query('SELECT id FROM users WHERE clerk_user_id = $1', [created_by]);
        if (ownerRes.rows.length > 0) ownerId = ownerRes.rows[0].id;
      }
      
      await db.query(
        'INSERT INTO workspaces (clerk_org_id, name, slug, owner_id) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO UPDATE SET clerk_org_id = $1, name = $2',
        [clerkOrgId, name, slug, ownerId]
      );
    }
    else if (eventType === 'organization.updated') {
      const { id: clerkOrgId, name, slug } = evt.data;
      await db.query(
        'UPDATE workspaces SET name = $1, slug = $2 WHERE clerk_org_id = $3',
        [name, slug, clerkOrgId]
      );
    }
    else if (eventType === 'organization.deleted') {
      const { id: clerkOrgId } = evt.data;
      await db.query(
        'DELETE FROM workspaces WHERE clerk_org_id = $1',
        [clerkOrgId]
      );
    }
    else if (eventType === 'organizationMembership.created') {
      const { organization, public_user_data, role } = evt.data;
      const clerkOrgId = organization.id;
      const clerkUserId = public_user_data.user_id;
      
      const wsRes = await db.query('SELECT id FROM workspaces WHERE clerk_org_id = $1', [clerkOrgId]);
      const userRes = await db.query('SELECT id FROM users WHERE clerk_user_id = $1', [clerkUserId]);
      
      if (wsRes.rows.length > 0 && userRes.rows.length > 0) {
        const workspaceId = wsRes.rows[0].id;
        const userId = userRes.rows[0].id;
        
        // Map base Clerk roles to KRIRI roles. Ignore custom Clerk roles.
        let formattedRole = 'Member';
        if (role === 'org:admin') {
          formattedRole = 'Admin';
        }
        
        await db.query(
          'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [workspaceId, userId, formattedRole]
        );
      }
    }
    else if (eventType === 'organizationMembership.deleted') {
      const { organization, public_user_data } = evt.data;
      const clerkOrgId = organization.id;
      const clerkUserId = public_user_data.user_id;

      const wsRes = await db.query('SELECT id FROM workspaces WHERE clerk_org_id = $1', [clerkOrgId]);
      const userRes = await db.query('SELECT id FROM users WHERE clerk_user_id = $1', [clerkUserId]);
      
      if (wsRes.rows.length > 0 && userRes.rows.length > 0) {
        const workspaceId = wsRes.rows[0].id;
        const userId = userRes.rows[0].id;
        
        await db.query(
          'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
          [workspaceId, userId]
        );
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Database error' });
  }
};
