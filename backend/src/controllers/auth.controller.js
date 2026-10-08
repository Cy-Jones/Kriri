const db = require('../config/database');
const { clerkClient, getAuth } = require('@clerk/express');

exports.sync = async (req, res) => {
  const { userId: clerkUserId } = getAuth(req);
  
  if (!clerkUserId) {
    return res.status(401).json({ error: 'Unauthorized: missing user ID' });
  }

  try {
    // Fetch user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    
    // Get primary email
    const primaryEmailObj = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId);
    const email = primaryEmailObj ? primaryEmailObj.emailAddress : '';
    
    // Construct name
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'Unknown User';
    const avatarUrl = clerkUser.imageUrl || null;

    // Check if user already exists by clerk_user_id
    const checkRes = await db.query('SELECT * FROM users WHERE clerk_user_id = $1', [clerkUserId]);
    if (checkRes.rows.length > 0) {
      // Upsert name and avatar
      const { rows } = await db.query(
        'UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url) WHERE clerk_user_id = $3 RETURNING id, name, email, role, avatar_url',
        [name, avatarUrl, clerkUserId]
      );
      return res.json({ message: 'User synced successfully', user: rows[0] });
    }

    // Check if user exists by email (for seeded users or previous local accounts)
    const emailRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailRes.rows.length > 0) {
       // Link the account by updating clerk_user_id
       const { rows } = await db.query(
         'UPDATE users SET clerk_user_id = $1, name = COALESCE($2, name), avatar_url = COALESCE($3, avatar_url) WHERE email = $4 RETURNING id, name, email, role, avatar_url',
         [clerkUserId, name, avatarUrl, email]
       );
       return res.status(200).json({ message: 'User linked successfully', user: rows[0] });
    }

    const { rows } = await db.query(
      'INSERT INTO users (clerk_user_id, name, email, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, avatar_url',
      [clerkUserId, name, email, avatarUrl]
    );

    res.status(201).json({ message: 'User synced successfully', user: rows[0] });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Server error while syncing user' });
  }
};

exports.me = async (req, res) => {
  try {
    // req.user is already populated by verifyToken middleware from local DB
    res.json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
