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

    // Construct name and username from Clerk
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      "Unknown User";
    const avatarUrl = clerkUser.imageUrl || null;
    const username = clerkUser.username || null;

    let user;
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [clerkUserId]);

      // Check if user already exists by clerk_user_id
      const checkRes = await client.query(
        "SELECT id, name, email, username, role, avatar_url FROM users WHERE clerk_user_id = $1",
        [clerkUserId],
      );
      if (checkRes.rows.length > 0) {
        // Upsert name, avatar, and username
        const { rows } = await client.query(
          "UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url), username = COALESCE($3, username) WHERE clerk_user_id = $4 RETURNING id, name, email, username, role, avatar_url",
          [name, avatarUrl, username, clerkUserId],
        );
        user = rows[0];
      } else if (email) {
        // Check if user exists by email (for seeded users or previous local accounts)
        const emailRes = await client.query(
          "SELECT id FROM users WHERE email = $1",
          [email],
        );
        if (emailRes.rows.length > 0) {
          // Link the account by updating clerk_user_id and username
          const { rows } = await client.query(
            "UPDATE users SET clerk_user_id = $1, name = COALESCE($2, name), avatar_url = COALESCE($3, avatar_url), username = COALESCE($4, username) WHERE email = $5 RETURNING id, name, email, username, role, avatar_url",
            [clerkUserId, name, avatarUrl, username, email],
          );
          user = rows[0];
        }
      }

      if (!user) {
        const { rows } = await client.query(
          `INSERT INTO users (clerk_user_id, name, email, avatar_url, username)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (clerk_user_id) DO UPDATE SET
             name = COALESCE(EXCLUDED.name, users.name),
             avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
             username = COALESCE(EXCLUDED.username, users.username)
           RETURNING id, name, email, username, role, avatar_url`,
          [clerkUserId, name, email, avatarUrl, username],
        );
        user = rows[0];
      }

      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    res.json({ message: "User synced successfully", user });
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

/**
 * Check if a username is available or taken, and provide intelligent suggestions if taken.
 */
exports.checkUsername = async (req, res) => {
  try {
    const raw = req.query.username;
    if (!raw || typeof raw !== "string") {
      return res.status(400).json({ error: "Username parameter is required." });
    }

    const cleanUsername = raw.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (cleanUsername.length < 5) {
      return res.status(400).json({
        available: false,
        error: "Username must be at least 5 characters long.",
        username: cleanUsername,
      });
    }
    if (cleanUsername.length > 64) {
      return res.status(400).json({
        available: false,
        error: "Username cannot exceed 64 characters.",
        username: cleanUsername,
      });
    }
    if (/^\d+$/.test(cleanUsername)) {
      return res.status(400).json({
        available: false,
        error: "Username cannot consist only of numbers.",
        username: cleanUsername,
      });
    }

    const currentUserId = req.user?.id || null;
    let isTaken = false;

    // 1. Check local DB if available
    try {
      const currentOwner = await db.query(
        "SELECT id, username FROM users WHERE LOWER(username) = LOWER($1)",
        [cleanUsername]
      );

      if (currentOwner.rows.length > 0 && currentUserId && currentOwner.rows[0].id === currentUserId) {
        return res.json({
          available: true,
          isCurrent: true,
          username: cleanUsername,
          message: "This is your current username.",
        });
      }

      if (currentOwner.rows.length > 0) {
        isTaken = true;
      }
    } catch (dbErr) {
      // Local database might be disconnected in some dev environments
      console.warn("DB check in checkUsername failed, continuing with Clerk check:", dbErr.message);
    }

    // 2. Also check Clerk user directory
    if (!isTaken) {
      try {
        const clerkMatches = await clerkClient.users.getUserList({
          username: [cleanUsername],
          limit: 1,
        });
        const usersList = clerkMatches.data || clerkMatches;
        if (Array.isArray(usersList) && usersList.length > 0) {
          const match = usersList[0];
          if (!req.user?.clerk_user_id || match.id !== req.user.clerk_user_id) {
            isTaken = true;
          }
        }
      } catch (cErr) {
        console.warn("Clerk check in checkUsername warning:", cErr.message);
      }
    }

    if (!isTaken) {
      return res.json({
        available: true,
        username: cleanUsername,
        message: `@${cleanUsername} is available!`,
      });
    }

    // Username is already taken! Generate intelligent suggestions with numbers/suffixes
    const base = cleanUsername.replace(/[0-9]+$/, "") || cleanUsername;
    const cleanBase = base.length >= 2 ? base : cleanUsername;
    const candidateSuffixes = [
      Math.floor(10 + Math.random() * 90), // e.g. 42
      Math.floor(100 + Math.random() * 900), // e.g. 789
      "_01",
      "dev",
      Math.floor(1000 + Math.random() * 9000),
    ];

    const suggestions = [];
    for (const suffix of candidateSuffixes) {
      let candidate = `${cleanBase}${suffix}`.slice(0, 64);
      while (candidate.length < 5) {
        candidate += Math.floor(1 + Math.random() * 9);
      }
      if (candidate === cleanUsername) continue;

      try {
        const dbCheck = await db.query(
          "SELECT id FROM users WHERE LOWER(username) = LOWER($1)",
          [candidate]
        );
        if (dbCheck.rows.length === 0 && !suggestions.includes(candidate)) {
          suggestions.push(candidate);
        }
      } catch (e) {
        if (!suggestions.includes(candidate)) {
          suggestions.push(candidate);
        }
      }
      if (suggestions.length >= 3) break;
    }

    if (suggestions.length < 3) {
      let fallback = `${cleanBase}${Date.now().toString().slice(-4)}`;
      while (fallback.length < 5) fallback += "1";
      suggestions.push(fallback.slice(0, 64));
    }

    return res.json({
      available: false,
      username: cleanUsername,
      message: `@${cleanUsername} is already taken.`,
      suggestions: suggestions.slice(0, 3),
    });
  } catch (err) {
    console.error("Check username error:", err);
    res.status(500).json({ error: err.message || "Failed to check username." });
  }
};

/**
 * Update username for the authenticated user.
 */
exports.updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username string is required." });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (cleanUsername.length < 5 || cleanUsername.length > 64) {
      return res.status(400).json({ error: "Username must be between 5 and 64 characters." });
    }
    if (/^\d+$/.test(cleanUsername)) {
      return res.status(400).json({ error: "Username cannot consist only of numbers." });
    }

    const userId = req.user.id;
    const clerkUserId = req.user.clerk_user_id || req.clerkAuth?.userId;

    // Check if taken by another user
    const check = await db.query(
      "SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2",
      [cleanUsername, userId]
    );

    if (check.rows.length > 0) {
      const base = cleanUsername.replace(/[0-9]+$/, "") || cleanUsername;
      const s1 = `${base}${Math.floor(10 + Math.random() * 90)}`;
      const s2 = `${base}_01`;
      const s3 = `${base}${Math.floor(100 + Math.random() * 900)}`;
      const suggestions = [s1, s2, s3].map((s) => (s.length < 5 ? s + "01" : s).slice(0, 64));
      return res.status(409).json({
        error: `Username @${cleanUsername} is already in use.`,
        available: false,
        suggestions,
      });
    }

    // Update in local DB
    const updateRes = await db.query(
      "UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, username, avatar_url, role",
      [cleanUsername, userId]
    );

    // Update in Clerk if configured
    if (clerkUserId) {
      try {
        await clerkClient.users.updateUser(clerkUserId, {
          username: cleanUsername,
        });
      } catch (cErr) {
        console.warn("Clerk updateUser username warning:", cErr.message);
      }
    }

    res.json({
      message: "Username updated successfully.",
      user: updateRes.rows[0],
      username: cleanUsername,
    });
  } catch (err) {
    console.error("Update username error:", err);
    res.status(500).json({ error: err.message || "Failed to update username." });
  }
};


