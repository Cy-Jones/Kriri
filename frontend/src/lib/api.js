let cachedToken = null;
let tokenExpiry = 0;
let clerkTokenGetter = null;
let activeAuthScope = "";

export const setClerkTokenGetter = (fn, scope = "") => {
  if (scope && activeAuthScope && activeAuthScope !== scope) {
    cachedToken = null;
    tokenExpiry = 0;
    currentActiveWorkspaceId = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("kriri:active_workspace_id");
      delete window.__KRIRI_ACTIVE_WORKSPACE_ID__;
    }
    clearApiCache();
  }
  clerkTokenGetter = fn;
  if (scope) activeAuthScope = scope;
};

export const resetAuthCache = () => {
  cachedToken = null;
  tokenExpiry = 0;
  clearApiCache();
};

const getToken = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedToken && tokenExpiry > now) {
    return cachedToken;
  }

  // 1. Try React-registered token getter first
  if (clerkTokenGetter) {
    try {
      const token = await clerkTokenGetter(forceRefresh ? { skipCache: true } : undefined);
      if (token) {
        cachedToken = token;
        tokenExpiry = now + 45000; // cache for 45s (Clerk tokens are valid for 60s)
        return token;
      }
    } catch (e) {
      // fallback to window.Clerk
    }
  }

  // 2. Fallback to window.Clerk if available
  if (typeof window !== "undefined" && window.Clerk) {
    if (window.Clerk.loaded && !window.Clerk.session) {
      return localStorage.getItem("token") || "";
    }

    if (!window.Clerk.loaded && !window.Clerk.session) {
      for (let i = 0; i < 4; i++) {
        if (window.Clerk.loaded || window.Clerk.session) break;
        await new Promise((r) => setTimeout(r, 40));
      }
    }

    if (window.Clerk.session) {
      try {
        const token = await window.Clerk.session.getToken(
          forceRefresh ? { skipCache: true } : undefined
        );
        if (token) {
          cachedToken = token;
          tokenExpiry = now + 45000;
          return token;
        }
      } catch (e) {
        console.warn("Failed to get Clerk token", e);
      }
    }
  }

  return localStorage.getItem("token") || "";
};

// In-memory cache for fast, instant client navigation
const apiCache = new Map();

export const clearApiCache = (pattern = "") => {
  if (!pattern) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
      }
    }
  }
};

let currentActiveWorkspaceId = null;

export const setActiveWorkspaceId = (id) => {
  currentActiveWorkspaceId = id ? String(id) : null;
  if (typeof window !== "undefined") {
    if (id) {
      localStorage.setItem("kriri:active_workspace_id", String(id));
      window.__KRIRI_ACTIVE_WORKSPACE_ID__ = String(id);
    } else {
      localStorage.removeItem("kriri:active_workspace_id");
      delete window.__KRIRI_ACTIVE_WORKSPACE_ID__;
    }
  }
};

export const getActiveWorkspaceId = () => {
  if (currentActiveWorkspaceId) return currentActiveWorkspaceId;
  if (typeof window !== "undefined") {
    return (
      window.__KRIRI_ACTIVE_WORKSPACE_ID__ ||
      localStorage.getItem("kriri:active_workspace_id") ||
      null
    );
  }
  return null;
};

const request = async (endpoint, options = {}) => {
  const token = await getToken(Boolean(options._forceFreshToken));
  const activeWsId = getActiveWorkspaceId();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(activeWsId ? { "x-workspace-id": activeWsId } : {}),
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Invalidate cached token immediately
    cachedToken = null;
    tokenExpiry = 0;

    // Retry once with a forced fresh token if not already retrying
    if (!options._isRetry) {
      try {
        const freshToken = await getToken(true);
        if (freshToken) {
          return request(endpoint, {
            ...options,
            _isRetry: true,
            _forceFreshToken: true,
          });
        }
      } catch (retryErr) {
        // Fall through to error handler
      }
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || "API Request Failed");
    error.status = res.status;
    error.response = { data: errorData, status: res.status };
    throw error;
  }
  return res.json();
};

export const api = {
  getCached: (endpoint) => {
    const cacheKey = `${activeAuthScope}:${endpoint}`;
    const cached = apiCache.get(cacheKey);
    return cached ? cached.data : null;
  },
  get: async (endpoint, options = {}) => {
    const ttl = options.ttl ?? 15000; // 15s cache for lightning-fast tab navigation
    const cacheKey = `${activeAuthScope}:${endpoint}`;
    const now = Date.now();
    const cached = apiCache.get(cacheKey);

    if (cached && now - cached.timestamp < ttl && !options.noCache) {
      return cached.data;
    }

    const data = await request(endpoint, options);
    apiCache.set(cacheKey, { timestamp: Date.now(), data });
    return data;
  },
  post: async (endpoint, data) => {
    if (endpoint !== "/auth/sync") {
      clearApiCache();
    }
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  put: async (endpoint, data) => {
    clearApiCache();
    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  patch: async (endpoint, data) => {
    clearApiCache();
    return request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  delete: async (endpoint) => {
    clearApiCache();
    return request(endpoint, {
      method: "DELETE",
    });
  },
};
