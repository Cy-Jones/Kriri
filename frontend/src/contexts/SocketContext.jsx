import React, { createContext, useContext, useEffect } from "react";
import { io } from "socket.io-client";
import { useOrganization, useAuth } from "@clerk/clerk-react";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Initialize outside of the component to prevent React Strict Mode
// from rapidly connecting and disconnecting, which throws console warnings.
const globalSocket = io(backendUrl, {
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: false,
});

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { organization } = useOrganization();
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    let active = true;

    const setupSocket = async () => {
      if (!isLoaded || !isSignedIn) return;
      try {
        const token = await getToken();
        if (!active) return;
        if (token) {
          globalSocket.auth = { token };
        }
        if (!globalSocket.connected) {
          globalSocket.connect();
        }
      } catch (err) {
        console.error("Socket auth setup failed:", err);
      }
    };

    setupSocket();

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (globalSocket && organization?.id && isSignedIn) {
      const join = async () => {
        try {
          const token = await getToken();
          globalSocket.emit("join_workspace", {
            workspaceId: organization.id,
            token,
          });
        } catch (e) {
          globalSocket.emit("join_workspace", organization.id);
        }
      };

      join();

      return () => {
        globalSocket.emit("leave_workspace", organization.id);
      };
    }
  }, [organization?.id, isSignedIn, getToken]);

  return (
    <SocketContext.Provider value={globalSocket}>
      {children}
    </SocketContext.Provider>
  );
};
