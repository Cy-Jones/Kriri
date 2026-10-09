import React, { createContext, useContext, useEffect } from "react";
import { io } from "socket.io-client";
import { useOrganization } from "@clerk/clerk-react";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Initialize outside of the component to prevent React Strict Mode
// from rapidly connecting and disconnecting, which throws console warnings.
const globalSocket = io(backendUrl, {
  withCredentials: true,
  transports: ["websocket"],
});

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { organization } = useOrganization();

  useEffect(() => {
    // Ensure the socket is connected when the provider mounts
    if (!globalSocket.connected) {
      globalSocket.connect();
    }
  }, []);

  useEffect(() => {
    if (globalSocket && organization?.id) {
      // Join workspace room when organization changes
      globalSocket.emit("join_workspace", organization.id);

      return () => {
        globalSocket.emit("leave_workspace", organization.id);
      };
    }
  }, [organization?.id]);

  return (
    <SocketContext.Provider value={globalSocket}>
      {children}
    </SocketContext.Provider>
  );
};
