const { Server } = require("socket.io");

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

      socket.on("join_workspace", (workspaceId) => {
        if (workspaceId) {
          socket.join(`workspace_${workspaceId}`);
          console.log(`Socket ${socket.id} joined workspace_${workspaceId}`);
        }
      });

      socket.on("leave_workspace", (workspaceId) => {
        if (workspaceId) {
          socket.leave(`workspace_${workspaceId}`);
          console.log(`Socket ${socket.id} left workspace_${workspaceId}`);
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
