const { requireAuth, getAuth } = require("@clerk/express");
const db = require("../config/database");

exports.verifyToken = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const { userId: clerkUserId, orgId } = getAuth(req);

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
      // Clerk sets orgId when an organization is active in the session
      const clerkOrgId = orgId;

      if (!clerkOrgId) {
        // Some routes might not need an active org (e.g. user profile fetch),
        // but for workspace routes, they will fail later if req.workspace is not set.
        req.workspace = null;
        req.workspaceRole = null;
        return next();
      }

      let workspace;
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
  },
];

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
