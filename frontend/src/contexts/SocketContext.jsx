import React, { createContext, useContext, useEffect } from "react";
import { io } from "socket.io-client";
import { useOrganization, useAuth } from "@clerk/react";
import { getActiveWorkspaceId } from "../lib/api";
import { dataStore } from "../lib/dataStore";

const getSocketBaseUrl = () => {
  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isLocal) {
      // In remote, mobile, or network environments (e.g. 192.168.1.7), connect through current origin
      return window.location.origin;
    }
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  return "http://localhost:5001";
};

const socketBaseUrl = getSocketBaseUrl();

let currentGetToken = null;

// Initialize outside of the component to prevent React Strict Mode
// from rapidly connecting and disconnecting, which throws console warnings.
const globalSocket = io(socketBaseUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  path: "/socket.io",
  autoConnect: false,
  auth: async (cb) => {
    try {
      if (currentGetToken) {
        const token = await currentGetToken().catch(() => null);
        if (token) return cb({ token });
      }
    } catch {}
    cb({});
  },
});

// Provide compatibility for callers doing either `const socket = useSocket()`
// or destructuring `const { socket } = useSocket()` (LEAK-02 resolution)
try {
  globalSocket.socket = globalSocket;
} catch {}

// Centralized real-time server-state synchronization (DataStore)
dataStore.attachSocket(globalSocket);

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { organization } = useOrganization();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const targetWorkspace = organization?.id || getActiveWorkspaceId();

  useEffect(() => {
    currentGetToken = getToken;
  }, [getToken]);

  useEffect(() => {
    let isSubscribed = true;

    if (!isLoaded || !isSignedIn) {
      if (globalSocket.connected) {
        globalSocket.disconnect();
      }
      return;
    }

    const performJoin = async (forceFresh = false) => {
      if (!isSubscribed || !targetWorkspace) return;
      try {
        const token = await getToken({ skipCache: forceFresh }).catch(() => getToken());
        if (!isSubscribed) return;
        if (token) {
          globalSocket.auth = { token };
        }
        globalSocket.emit("join_workspace", {
          workspaceId: targetWorkspace,
          token,
        });
      } catch (e) {
        globalSocket.emit("join_workspace", targetWorkspace);
      }
    };

    const handleConnect = () => {
      performJoin(true);
    };

    const handleJoinRejected = async (data) => {
      if (data?.reason === "TOKEN_EXPIRED" || data?.reason === "UNAUTHENTICATED") {
        try {
          const freshToken = await getToken({ skipCache: true });
          if (freshToken && isSubscribed) {
            globalSocket.auth = { token: freshToken };
            globalSocket.emit("join_workspace", {
              workspaceId: targetWorkspace,
              token: freshToken,
            });
          }
        } catch (err) {
          console.warn("[Socket] Failed refreshing token on join rejected:", err);
        }
      }
    };

    globalSocket.on("connect", handleConnect);
    globalSocket.on("workspace_join_rejected", handleJoinRejected);

    if (!globalSocket.connected) {
      globalSocket.connect();
    } else {
      performJoin(false);
    }

    // Refresh on tab visibility/focus (after sleep/backgrounding)
    const handleResume = () => {
      if (document.visibilityState === "visible") {
        if (!globalSocket.connected) {
          globalSocket.connect();
        } else {
          performJoin(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    return () => {
      isSubscribed = false;
      globalSocket.off("connect", handleConnect);
      globalSocket.off("workspace_join_rejected", handleJoinRejected);
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
      globalSocket.emit("leave_workspace", targetWorkspace);
    };
  }, [targetWorkspace, isSignedIn, isLoaded, getToken]);

  return (
    <SocketContext.Provider value={globalSocket}>
      {children}
    </SocketContext.Provider>
  );
};
