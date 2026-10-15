const { getAuth } = require("@clerk/express");
const db = require("../config/database");

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
          const { clerkClient } = require("@clerk/express");
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const primaryEmailObj = clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId,
          );
          const email = primaryEmailObj ? primaryEmailObj.emailAddress : "";
          const name =
            [clerkUser.firstName, clerkUser.lastName]
              .filter(Boolean)
              .join(" ") || "Unknown User";
          const avatarUrl = clerkUser.imageUrl || null;

          await db.query(
            "INSERT INTO users (clerk_user_id, name, email, avatar_url) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
            [clerkUserId, name, email, avatarUrl],
          );
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

      // Check explicit workspace header first
      if (requestedWsId) {
        const headerWsRes = await db.query(
          `SELECT w.*, wm.role 
           FROM workspaces w
           JOIN workspace_members wm ON w.id = wm.workspace_id
           WHERE (w.id::text = $1 OR w.slug = $1 OR w.clerk_org_id = $1) AND wm.user_id = $2`,
          [requestedWsId, req.user.id],
        );
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

        // Provision personal workspace if it doesn't exist yet
        const personalSlug = `personal-${req.user.id}-${Date.now().toString(36)}`;
        const personalName = `${req.user.name || "Personal"}'s Workspace`;
        const newWs = await db.query(
          "INSERT INTO workspaces (name, slug, owner_id, clerk_org_id) VALUES ($1, $2, $3, NULL) RETURNING *",
          [personalName, personalSlug, req.user.id],
        );
        const ws = newWs.rows[0];
        await db.query(
          "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'Owner') ON CONFLICT DO NOTHING",
          [ws.id, req.user.id],
        );
        req.workspace = ws;
        req.workspaceRole = "Owner";
        return next();
      }

      const wsRes = await db.query(
        "SELECT * FROM workspaces WHERE clerk_org_id = $1",
        [clerkOrgId],
      );

      if (wsRes.rows.length === 0) {
        // JIT Provisioning (Fallback for missed webhooks in local dev)
        // Note: For a production app we'd fetch org details from Clerk API here.
        // For now, we'll create a placeholder to prevent the app from breaking.
        try {
          const { clerkClient } = require("@clerk/express");
          const clerkOrg = await clerkClient.organizations.getOrganization({
            organizationId: clerkOrgId,
          });
          const orgName = clerkOrg.name || "Synced Workspace";
          const fallbackSlug =
            clerkOrg.slug || `org-${clerkOrgId.toLowerCase()}`;

          const newWs = await db.query(
            "INSERT INTO workspaces (clerk_org_id, name, slug, owner_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [clerkOrgId, orgName, fallbackSlug, req.user.id],
          );
          workspace = newWs.rows[0];

          await db.query(
            "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)",
            [workspace.id, req.user.id, "Owner"],
          );
        } catch (e) {
          console.error("JIT Workspace creation failed:", e);
          req.workspace = null;
          req.workspaceRole = null;
          return next();
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
      } else {
        // JIT Provisioning for membership
        const newRole =
          getAuth(req).orgRole === "org:admin" ? "Admin" : "Member";
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
