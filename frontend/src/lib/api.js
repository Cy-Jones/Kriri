let cachedToken = null;
let tokenExpiry = 0;
let clerkTokenGetter = null;
let activeAuthScope = "";

export const setClerkTokenGetter = (fn, scope = "") => {
  if (clerkTokenGetter !== fn || (scope && activeAuthScope !== scope)) {
    cachedToken = null;
    tokenExpiry = 0;
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
        tokenExpiry = now + 4000; // micro-cache for 4s to dedupe concurrent requests
        return token;
      }
    } catch (e) {
      // fallback to window.Clerk
    }
  }

  // 2. Fallback to window.Clerk if available
  if (typeof window !== "undefined") {
    // If Clerk is initializing, wait up to 1.5s for session
    if (!window.Clerk?.session) {
      for (let i = 0; i < 15; i++) {
        if (window.Clerk?.session) break;
        await new Promise((r) => setTimeout(r, 80));
      }
    }

    if (window.Clerk && window.Clerk.session) {
      try {
        const token = await window.Clerk.session.getToken(
          forceRefresh ? { skipCache: true } : undefined
        );
        if (token) {
          cachedToken = token;
          tokenExpiry = now + 4000; // micro-cache for 4s
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

const request = async (endpoint, options = {}) => {
  const token = await getToken(Boolean(options._forceFreshToken));
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    clearApiCache();
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
