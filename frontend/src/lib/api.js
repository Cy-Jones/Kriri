let cachedToken = null;
let tokenExpiry = 0;
let clerkTokenGetter = null;
let activeAuthScope = "";

export const clearUserSessionData = () => {
  cachedToken = null;
  tokenExpiry = 0;
  clerkTokenGetter = null;
  activeAuthScope = "";
  currentActiveWorkspaceId = null;
  clearApiCache();

  if (typeof window !== "undefined") {
    delete window.__KRIRI_ACTIVE_WORKSPACE_ID__;

    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (
        k.startsWith("kriri:cache:") ||
        k.startsWith("kriri-user-") ||
        k.startsWith("kriri_onboarded_") ||
        k === "kriri:active_workspace_id" ||
        k === "kriri_has_onboarded" ||
        k === "kriri_project_draft" ||
        k === "kriri-last-workspace-path" ||
        k === "kriri-session-active" ||
        k === "kriri_current_user_id" ||
        k === "kriri-default-view" ||
        k === "kriri-last-visited-page"
      ) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }
};

export const setClerkTokenGetter = (fn, scope = "") => {
  if (scope && activeAuthScope && activeAuthScope !== scope) {
    const prevUserId = activeAuthScope.split(":")[0];
    const newUserId = scope.split(":")[0];
    if (prevUserId && newUserId && prevUserId !== newUserId) {
      clearUserSessionData();
    }
  }
  clerkTokenGetter = fn;
  if (scope) activeAuthScope = scope;
};

export const resetAuthCache = () => {
  clearUserSessionData();
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

// In-memory cache & in-flight deduplication for fast, instant client navigation
const apiCache = new Map();
const inFlightRequests = new Map();

export const clearApiCache = (pattern = "") => {
  if (!pattern) {
    apiCache.clear();
    for (const entry of inFlightRequests.values()) {
      entry?.controller?.abort?.();
    }
    inFlightRequests.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
      }
    }
    for (const [key, entry] of inFlightRequests.entries()) {
      if (key.includes(pattern)) {
        entry?.controller?.abort?.();
        inFlightRequests.delete(key);
      }
    }
  }

  if (typeof window !== "undefined") {
    try {
      if (!pattern) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith("kriri:cache:")) localStorage.removeItem(k);
        }
      } else {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith("kriri:cache:") && k.includes(pattern)) localStorage.removeItem(k);
        }
      }
    } catch {}
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
  if (options.signal?.aborted) {
    throw (
      options.signal.reason ||
      new DOMException("The user aborted a request.", "AbortError")
    );
  }

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

    // Retry once with a forced fresh token if not already retrying and not aborted
    if (!options._isRetry && !options.signal?.aborted) {
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

const invalidateMutationCache = (endpoint) => {
  const parts = (endpoint || "").split("?")[0].split("/").filter(Boolean);
  const prefix = parts.length > 0 ? `/${parts[0]}` : "";
  if (prefix) clearApiCache(prefix);
  if (prefix === "/tasks" || prefix === "/projects") {
    clearApiCache("/workspaces/current/summary");
    clearApiCache("/workspaces/current/analytics");
  }
};

export const api = {
  getCached: (endpoint) => {
    const cacheKey = `${activeAuthScope}:${endpoint}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached.data;
    for (const [key, value] of apiCache.entries()) {
      if (key.endsWith(`:${endpoint}`)) {
        return value.data;
      }
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`kriri:cache:${cacheKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          apiCache.set(cacheKey, { timestamp: Date.now(), data: parsed });
          return parsed;
        }
      } catch {}
    }
    return null;
  },
  setCached: (endpoint, data) => {
    const now = Date.now();
    const cacheKey = `${activeAuthScope}:${endpoint}`;
    apiCache.set(cacheKey, { timestamp: now, data });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`kriri:cache:${cacheKey}`, JSON.stringify(data));
      } catch {}
    }
    for (const key of apiCache.keys()) {
      if (key.endsWith(`:${endpoint}`)) {
        apiCache.set(key, { timestamp: now, data });
      }
    }
  },
  get: async (endpoint, options = {}) => {
    const callerSignal = options.signal;
    if (callerSignal?.aborted) {
      return Promise.reject(
        callerSignal.reason ||
          new DOMException("The user aborted a request.", "AbortError")
      );
    }

    const ttl = options.ttl ?? 60000; // 60s cache for instantaneous, zero-lag page navigation
    const cacheKey = `${activeAuthScope}:${endpoint}`;
    const now = Date.now();
    const cached = apiCache.get(cacheKey);

    if (cached && now - cached.timestamp < ttl && !options.noCache) {
      return cached.data;
    }

    // Helper to tie a target promise to a specific caller's AbortSignal
    const attachCallerSignal = (targetPromise, signal, onConsumerAbort) => {
      if (!signal) return targetPromise;
      return new Promise((resolve, reject) => {
        const handleAbort = () => {
          if (onConsumerAbort) onConsumerAbort();
          reject(
            signal.reason ||
              new DOMException("The user aborted a request.", "AbortError")
          );
        };
        signal.addEventListener("abort", handleAbort, { once: true });
        targetPromise.then(
          (val) => {
            signal.removeEventListener("abort", handleAbort);
            resolve(val);
          },
          (err) => {
            signal.removeEventListener("abort", handleAbort);
            reject(err);
          }
        );
      });
    };

    if (!options.noCache && inFlightRequests.has(cacheKey)) {
      const entry = inFlightRequests.get(cacheKey);
      entry.consumers.add(callerSignal);
      return attachCallerSignal(entry.promise, callerSignal, () => {
        entry.consumers.delete(callerSignal);
        if (entry.consumers.size === 0) {
          entry.controller.abort();
        }
      });
    }

    const internalController = new AbortController();
    const consumers = new Set();
    consumers.add(callerSignal);

    const entry = {
      controller: internalController,
      consumers,
      promise: null,
    };

    const fetchPromise = (async () => {
      try {
        const data = await request(endpoint, {
          ...options,
          signal: internalController.signal,
        });
        if (apiCache.size > 200) {
          const oldestKey = apiCache.keys().next().value;
          apiCache.delete(oldestKey);
        }
        apiCache.set(cacheKey, { timestamp: Date.now(), data });
        return data;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();

    entry.promise = fetchPromise;

    if (!options.noCache) {
      inFlightRequests.set(cacheKey, entry);
    }

    return attachCallerSignal(fetchPromise, callerSignal, () => {
      entry.consumers.delete(callerSignal);
      if (entry.consumers.size === 0) {
        internalController.abort();
      }
    });
  },
  post: async (endpoint, data, options = {}) => {
    if (endpoint !== "/auth/sync") {
      invalidateMutationCache(endpoint);
    }
    return request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  put: async (endpoint, data, options = {}) => {
    invalidateMutationCache(endpoint);
    return request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  patch: async (endpoint, data, options = {}) => {
    invalidateMutationCache(endpoint);
    return request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  delete: async (endpoint, options = {}) => {
    invalidateMutationCache(endpoint);
    return request(endpoint, {
      ...options,
      method: "DELETE",
    });
  },
};
