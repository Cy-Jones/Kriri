const db = require("../config/database");
const { clerkClient, getAuth } = require("@clerk/express");

exports.sync = async (req, res) => {
  const auth = req.clerkAuth || (typeof req.auth === "function" ? getAuth(req) : req.auth);
  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    return res.status(401).json({ error: "Unauthorized: missing user ID" });
  }

  try {
    // Fetch user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);

    // Get primary email
    const primaryEmailObj = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    );
    const email = primaryEmailObj ? primaryEmailObj.emailAddress : "";

    // Construct name
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      "Unknown User";
    const avatarUrl = clerkUser.imageUrl || null;

    // Check if user already exists by clerk_user_id
    const checkRes = await db.query(
      "SELECT * FROM users WHERE clerk_user_id = $1",
      [clerkUserId],
    );
    if (checkRes.rows.length > 0) {
      // Upsert name and avatar
      const { rows } = await db.query(
        "UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url) WHERE clerk_user_id = $3 RETURNING id, name, email, role, avatar_url",
        [name, avatarUrl, clerkUserId],
      );
      return res.json({ message: "User synced successfully", user: rows[0] });
    }

    // Check if user exists by email (for seeded users or previous local accounts)
    const emailRes = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (emailRes.rows.length > 0) {
      // Link the account by updating clerk_user_id
      const { rows } = await db.query(
        "UPDATE users SET clerk_user_id = $1, name = COALESCE($2, name), avatar_url = COALESCE($3, avatar_url) WHERE email = $4 RETURNING id, name, email, role, avatar_url",
        [clerkUserId, name, avatarUrl, email],
      );
      return res
        .status(200)
        .json({ message: "User linked successfully", user: rows[0] });
    }

    const { rows } = await db.query(
      "INSERT INTO users (clerk_user_id, name, email, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, avatar_url",
      [clerkUserId, name, email, avatarUrl],
    );

    res
      .status(201)
      .json({ message: "User synced successfully", user: rows[0] });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ error: "Server error while syncing user" });
  }
};

exports.me = async (req, res) => {
  try {
    // req.user is already populated by verifyToken middleware from local DB
    res.json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteAccount = async (req, res) => {
  const userId = req.user?.id;
  const clerkUserId = req.user?.clerk_user_id || req.clerkAuth?.userId;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: user context required" });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Delete personal workspaces owned by this user (where clerk_org_id IS NULL)
    // Deleting workspaces cascades to projects, tasks, comments, and milestones
    await client.query(
      "DELETE FROM workspaces WHERE owner_id = $1 AND clerk_org_id IS NULL",
      [userId],
    );

    // 2. Remove memberships from any shared workspaces & projects
    await client.query("DELETE FROM workspace_members WHERE user_id = $1", [
      userId,
    ]);
    await client.query("DELETE FROM project_members WHERE user_id = $1", [
      userId,
    ]);

    // 3. Delete comments posted by user
    await client.query("DELETE FROM comments WHERE user_id = $1", [userId]);

    // 4. Delete notifications involving the user
    if (clerkUserId) {
      await client.query(
        "DELETE FROM notifications WHERE user_id = $1 OR actor_id = $1",
        [clerkUserId],
      );
    }

    // 5. Unassign from tasks in remaining team projects
    await client.query(
      "UPDATE tasks SET assignee_id = NULL WHERE assignee_id = $1",
      [userId],
    );
    await client.query(
      "UPDATE tasks SET reporter_id = NULL WHERE reporter_id = $1",
      [userId],
    );

    // 6. Delete user record from database
    await client.query("DELETE FROM users WHERE id = $1", [userId]);

    await client.query("COMMIT");

    // 7. Remove user from Clerk if available
    if (clerkUserId) {
      try {
        await clerkClient.users.deleteUser(clerkUserId);
      } catch (clerkErr) {
        console.warn("Clerk deleteUser warning:", clerkErr.message);
      }
    }

    res.json({
      success: true,
      message: "Account and data deleted permanently",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rbErr) {
      console.error("Rollback error:", rbErr);
    }
    console.error("Error deleting user account:", error);
    res.status(500).json({ error: "Failed to delete user account" });
  } finally {
    client.release();
  }
};

