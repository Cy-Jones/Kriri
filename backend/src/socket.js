const { Server } = require("socket.io");
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

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join_workspace", async (workspaceId) => {
        if (!workspaceId) return;
        try {
          const wsRes = await db.query(
            "SELECT id, clerk_org_id FROM workspaces WHERE id::text = $1 OR clerk_org_id = $1",
            [String(workspaceId)],
          );
          if (wsRes.rows.length === 0) {
            console.warn(`Socket ${socket.id} denied access to unknown workspace ${workspaceId}`);
            return;
          }
          const ws = wsRes.rows[0];
          socket.join(`workspace_${ws.id}`);
          if (ws.clerk_org_id) {
            socket.join(`workspace_${ws.clerk_org_id}`);
          }
          console.log(`Socket ${socket.id} joined workspace_${ws.id}`);
        } catch (err) {
          console.error("Socket join_workspace error:", err);
        }
      });

      socket.on("leave_workspace", async (workspaceId) => {
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
