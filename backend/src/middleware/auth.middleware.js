const { getAuth } = require("@clerk/express");
const db = require("../config/database");
const { generateWorkspaceSlug } = require("../utils/slug");

const requireAuth = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth || !auth.userId) {
    return res.status(401).json({ error: "Unauthorized: Authentication required" });
  }
  if (typeof req.auth === "function") {
    Object.assign(req.auth, auth);
  } else {
    req.auth = auth;
  }
  req.clerkAuth = auth;
  next();
};

exports.requireAuth = requireAuth;

const optionalAuth = (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (auth && auth.userId) {
      if (typeof req.auth === "function") {
        Object.assign(req.auth, auth);
      } else {
        req.auth = auth;
      }
      req.clerkAuth = auth;
    }
  } catch (err) {
    // Non-blocking for optional auth
  }
  next();
};

exports.optionalAuth = optionalAuth;

const jitProvisioningPromises = new Map();

exports.verifyToken = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Unauthorized: Authentication required" });
    }
    if (typeof req.auth === "function") {
      Object.assign(req.auth, auth);
    } else {
      req.auth = auth;
    }
    req.clerkAuth = auth;

    const { userId: clerkUserId, orgId } = auth;

      let userRes = await db.query(
        "SELECT * FROM users WHERE clerk_user_id = $1",
        [clerkUserId],
      );

      if (userRes.rows.length === 0) {
        // JIT User Provisioning to handle race condition with /auth/sync
        try {
          if (!jitProvisioningPromises.has(clerkUserId)) {
            const p = (async () => {
              const { clerkClient } = require("@clerk/express");
              const clerkUser = await clerkClient.users.getUser(clerkUserId);
              const primaryEmailObj = clerkUser.emailAddresses.find(
                (e) => e.id === clerkUser.primaryEmailAddressId,
              );
              const email = primaryEmailObj ? primaryEmailObj.emailAddress : "";
              const name =
                [clerkUser.firstName, clerkUser.lastName]
                  .filter(Boolean)
                  .join(" ") || clerkUser.username || "Unknown User";
              const avatarUrl = clerkUser.imageUrl || null;
              const username = clerkUser.username || null;

              if (email) {
                const existingByEmail = await db.query(
                  "SELECT id FROM users WHERE email = $1",
                  [email],
                );
                if (existingByEmail.rows.length > 0) {
                  await db.query(
                    "UPDATE users SET clerk_user_id = $1, name = COALESCE($2, name), avatar_url = COALESCE($3, avatar_url), username = COALESCE($4, username) WHERE email = $5",
                    [clerkUserId, name, avatarUrl, username, email],
                  );
                  return;
                }
              }

              await db.query(
                "INSERT INTO users (clerk_user_id, name, email, avatar_url, username) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (clerk_user_id) DO UPDATE SET name = $2, email = $3, avatar_url = $4, username = COALESCE($5, users.username)",
                [clerkUserId, name, email, avatarUrl, username],
              );
            })();
            jitProvisioningPromises.set(clerkUserId, p);
            p.finally(() => jitProvisioningPromises.delete(clerkUserId));
          }

          await jitProvisioningPromises.get(clerkUserId);

          userRes = await db.query(
            "SELECT * FROM users WHERE clerk_user_id = $1",
            [clerkUserId],
          );
        } catch (e) {
          console.error("JIT User Sync failed:", e);
          return res
            .status(401)
            .json({ error: "User profile not found in local database." });
        }
      }

      req.user = userRes.rows[0];

      // 2. Resolve Active Organization / Workspace
      const requestedWsId = req.headers["x-workspace-id"];
      const clerkOrgId = orgId;

      let workspace = null;

      // Check explicit workspace header within the active org/personal scope
      if (requestedWsId) {
        const queryText = clerkOrgId
          ? `SELECT w.*, wm.role 
             FROM workspaces w
             JOIN workspace_members wm ON w.id = wm.workspace_id
             WHERE (w.id::text = $1 OR w.slug = $1 OR w.clerk_org_id = $1) AND wm.user_id = $2 AND w.clerk_org_id = $3`
          : `SELECT w.*, wm.role 
             FROM workspaces w
             JOIN workspace_members wm ON w.id = wm.workspace_id
             WHERE (w.id::text = $1 OR w.slug = $1) AND wm.user_id = $2 AND w.clerk_org_id IS NULL`;
        const params = clerkOrgId
          ? [requestedWsId, req.user.id, clerkOrgId]
          : [requestedWsId, req.user.id];

        const headerWsRes = await db.query(queryText, params);
        if (headerWsRes.rows.length > 0) {
          req.workspace = headerWsRes.rows[0];
          req.workspaceRole = headerWsRes.rows[0].role;
          return next();
        }
      }

      if (!clerkOrgId) {
        // Resolve user's personal workspace (where clerk_org_id IS NULL)
        const personalWsRes = await db.query(
          `SELECT w.*, wm.role 
           FROM workspaces w
           JOIN workspace_members wm ON w.id = wm.workspace_id
           WHERE wm.user_id = $1 AND w.clerk_org_id IS NULL
           ORDER BY w.id ASC LIMIT 1`,
          [req.user.id],
        );
        if (personalWsRes.rows.length > 0) {
          req.workspace = personalWsRes.rows[0];
          req.workspaceRole = personalWsRes.rows[0].role;
          return next();
        }

        // Provision personal workspace if it doesn't exist yet with advisory lock
        const client = await db.pool.connect();
        try {
          await client.query("BEGIN");
          await client.query("SELECT pg_advisory_xact_lock($1)", [req.user.id]);

          // Re-check after lock
          const checkRes = await client.query(
            `SELECT w.*, wm.role 
             FROM workspaces w
             JOIN workspace_members wm ON w.id = wm.workspace_id
             WHERE wm.user_id = $1 AND w.clerk_org_id IS NULL
             ORDER BY w.id ASC LIMIT 1`,
            [req.user.id],
          );
          if (checkRes.rows.length > 0) {
            await client.query("COMMIT");
            req.workspace = checkRes.rows[0];
            req.workspaceRole = checkRes.rows[0].role;
            return next();
          }

          const personalName = `${req.user.name || "Personal"}'s Workspace`;
          const personalSlug = await generateWorkspaceSlug(personalName, client);
          const newWs = await client.query(
            "INSERT INTO workspaces (name, slug, owner_id, clerk_org_id) VALUES ($1, $2, $3, NULL) RETURNING *",
            [personalName, personalSlug, req.user.id],
          );
          const ws = newWs.rows[0];
          await client.query(
            "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'Owner') ON CONFLICT DO NOTHING",
            [ws.id, req.user.id],
          );
          await client.query("COMMIT");
          req.workspace = ws;
          req.workspaceRole = "Owner";
          return next();
        } catch (lockErr) {
          await client.query("ROLLBACK");
          throw lockErr;
        } finally {
          client.release();
        }
      }

      const wsRes = await db.query(
        "SELECT * FROM workspaces WHERE clerk_org_id = $1",
        [clerkOrgId],
      );

      if (wsRes.rows.length === 0) {
        // JIT Provisioning (Fallback for missed webhooks in local dev)
        const jitClient = await db.pool.connect();
        try {
          await jitClient.query("BEGIN");
          await jitClient.query("SELECT pg_advisory_xact_lock(hashtext($1))", [clerkOrgId]);

          // Re-check after acquiring lock in case another request completed it
          const recheck = await jitClient.query(
            "SELECT * FROM workspaces WHERE clerk_org_id = $1",
            [clerkOrgId],
          );

          if (recheck.rows.length > 0) {
            await jitClient.query("COMMIT");
            workspace = recheck.rows[0];
          } else {
            const { clerkClient } = require("@clerk/express");
            const clerkOrg = await clerkClient.organizations.getOrganization({
              organizationId: clerkOrgId,
            });
            const orgName = clerkOrg.name || "Organization Workspace";
            let fallbackSlug = await generateWorkspaceSlug(
              clerkOrg.slug || clerkOrg.name || clerkOrgId,
              jitClient,
            );

            // Double check fallbackSlug uniqueness before insert
            const slugCheck = await jitClient.query(
              "SELECT id FROM workspaces WHERE slug = $1",
              [fallbackSlug],
            );
            if (slugCheck.rows.length > 0) {
              fallbackSlug = `${fallbackSlug}-${Date.now().toString(36)}`;
            }

            const newWs = await jitClient.query(
              "INSERT INTO workspaces (clerk_org_id, name, slug, owner_id) VALUES ($1, $2, $3, $4) ON CONFLICT (clerk_org_id) DO UPDATE SET name = EXCLUDED.name RETURNING *",
              [clerkOrgId, orgName, fallbackSlug, req.user.id],
            );
            workspace = newWs.rows[0];

            await jitClient.query(
              "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
              [workspace.id, req.user.id, "Owner"],
            );
            await jitClient.query("COMMIT");
          }
        } catch (e) {
          await jitClient.query("ROLLBACK").catch(() => {});
          console.error("JIT Workspace creation failed:", e);
          req.workspace = null;
          req.workspaceRole = null;
          return next();
        } finally {
          jitClient.release();
        }
      } else {
        workspace = wsRes.rows[0];
      }

      req.workspace = workspace;

      // 3. Resolve Workspace Role
      const memberRes = await db.query(
        "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
        [req.workspace.id, req.user.id],
      );

      if (memberRes.rows.length > 0) {
        req.workspaceRole = memberRes.rows[0].role;
        if (req.workspace.owner_id === req.user.id && req.workspaceRole !== "Owner") {
          req.workspaceRole = "Owner";
        }
      } else {
        // JIT Provisioning for membership
        const isOwner = req.workspace.owner_id === req.user.id;
        const newRole = isOwner
          ? "Owner"
          : getAuth(req).orgRole === "org:admin"
            ? "Admin"
            : "Member";
        try {
          await db.query(
            "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)",
            [req.workspace.id, req.user.id, newRole],
          );
          req.workspaceRole = newRole;
        } catch (e) {
          console.error("JIT Member creation failed:", e);
          req.workspaceRole = "Guest";
        }
      }

      next();
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Server error during authentication" });
  }
};

const WORKSPACE_ROLE_HIERARCHY = {
  Owner: 70,
  Admin: 60,
  "Project Manager": 50,
  "Team Lead": 40,
  Member: 30,
  Viewer: 20,
  Guest: 10,
};

exports.requireMinimumRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.workspace) {
      return res
        .status(403)
        .json({ error: "Active workspace context required" });
    }

    const currentRole = req.workspaceRole || "Guest";
    const userLevel = WORKSPACE_ROLE_HIERARCHY[currentRole] || 0;
    const requiredLevel = WORKSPACE_ROLE_HIERARCHY[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return res
        .status(403)
        .json({ error: "Insufficient permissions within this workspace" });
    }
    next();
  };
};

exports.requireExactRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.workspace) {
      return res
        .status(403)
        .json({ error: "Active workspace context required" });
    }

    const currentRole = req.workspaceRole || "Guest";

    // Owner can bypass exact role checks within the workspace
    if (currentRole === "Owner") {
      return next();
    }

    if (!allowedRoles.includes(currentRole)) {
      return res
        .status(403)
        .json({ error: "Insufficient permissions within this workspace" });
    }
    next();
  };
};
