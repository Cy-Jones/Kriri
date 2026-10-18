const { Server } = require("socket.io");
const { verifyToken } = require("@clerk/express");
const db = require("./config/database");

let io;

module.exports = {
  init: (httpServer, frontendUrl) => {
    io = new Server(httpServer, {
      cors: {
        origin: frontendUrl,
        credentials: true,
      },
    });

    io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace("Bearer ", "");
        if (token) {
          try {
            const payload = await verifyToken(token, {
              secretKey: process.env.CLERK_SECRET_KEY,
            });
            socket.userId = payload.sub;
            socket.orgId = payload.org_id;
          } catch (tokErr) {
            console.warn("Socket auth handshake token invalid:", tokErr.message);
          }
        }
        next();
      } catch (err) {
        next(err);
      }
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join_workspace", async (data) => {
        let workspaceId = data;
        let token = null;
        if (typeof data === "object" && data !== null) {
          workspaceId = data.workspaceId;
          token = data.token;
        }

        if (!workspaceId) return;

        try {
          let clerkUserId = socket.userId;
          if (!clerkUserId && token) {
            try {
              const payload = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
              });
              clerkUserId = payload.sub;
              socket.userId = clerkUserId;
              socket.orgId = payload.org_id;
            } catch (err) {
              console.warn(`Socket ${socket.id} invalid token on join_workspace:`, err.message);
            }
          }

          const wsRes = await db.query(
            "SELECT id, clerk_org_id FROM workspaces WHERE id::text = $1 OR clerk_org_id = $1",
            [String(workspaceId)],
          );
          if (wsRes.rows.length === 0) {
            console.warn(`Socket ${socket.id} denied access to unknown workspace ${workspaceId}`);
            return;
          }
          const ws = wsRes.rows[0];

          // Authorization: client must have a verified user identity
          if (!clerkUserId) {
            console.warn(`Socket ${socket.id} unauthenticated join attempt rejected for workspace ${ws.id}`);
            return;
          }

          // Check membership in workspace_members or active Clerk org
          const isOrgMatch = Boolean(ws.clerk_org_id && socket.orgId === ws.clerk_org_id);
          const memberRes = await db.query(
            `SELECT wm.role 
             FROM workspace_members wm 
             JOIN users u ON wm.user_id = u.id 
             WHERE wm.workspace_id = $1 AND u.clerk_user_id = $2`,
            [ws.id, clerkUserId],
          );

          if (memberRes.rows.length === 0 && !isOrgMatch) {
            console.warn(`Socket ${socket.id} (user ${clerkUserId}) unauthorized for workspace ${ws.id}`);
            return;
          }

          socket.join(`workspace_${ws.id}`);
          if (ws.clerk_org_id) {
            socket.join(`workspace_${ws.clerk_org_id}`);
          }
          console.log(`Socket ${socket.id} (user ${clerkUserId}) securely joined workspace_${ws.id}`);
        } catch (err) {
          console.error("Socket join_workspace error:", err);
        }
      });

      socket.on("leave_workspace", async (data) => {
        const workspaceId = typeof data === "object" && data !== null ? data.workspaceId : data;
        if (!workspaceId) return;
        try {
          const wsRes = await db.query(
            "SELECT id, clerk_org_id FROM workspaces WHERE id::text = $1 OR clerk_org_id = $1",
            [String(workspaceId)],
          );
          if (wsRes.rows.length > 0) {
            const ws = wsRes.rows[0];
            socket.leave(`workspace_${ws.id}`);
            if (ws.clerk_org_id) {
              socket.leave(`workspace_${ws.clerk_org_id}`);
            }
            console.log(`Socket ${socket.id} left workspace_${ws.id}`);
          }
        } catch (err) {
          console.error("Socket leave_workspace error:", err);
        }
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
