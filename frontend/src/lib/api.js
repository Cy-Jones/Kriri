const getToken = async () => {
  if (window.Clerk && !window.Clerk.session) {
    for (let i = 0; i < 15; i++) {
      if (window.Clerk?.session) break;
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  if (window.Clerk && window.Clerk.session) {
    try {
      return await window.Clerk.session.getToken();
    } catch (e) {
      console.warn("Failed to get Clerk token", e);
    }
  }
  return localStorage.getItem("token") || "";
};

const request = async (endpoint, options = {}) => {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || "API Request Failed");
    error.response = { data: errorData };
    throw error;
  }
  return res.json();
};

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: (endpoint, data) =>
    request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (endpoint) =>
    request(endpoint, {
      method: "DELETE",
    }),
};
