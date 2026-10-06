const getToken = async () => {
  if (window.Clerk && window.Clerk.session) {
    try {
      return await window.Clerk.session.getToken();
    } catch (e) {
      console.warn("Failed to get Clerk token", e);
    }
  }
  return localStorage.getItem('token') || '';
};

export const api = {
  get: async (endpoint) => {
    const token = await getToken();
    const res = await fetch(`/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(errorData.error || 'API Request Failed');
      error.response = { data: errorData };
      throw error;
    }
    return res.json();
  },
  post: async (endpoint, data) => {
    const token = await getToken();
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(errorData.error || 'API Request Failed');
      error.response = { data: errorData };
      throw error;
    }
    return res.json();
  },
  put: async (endpoint, data) => {
    const token = await getToken();
    const res = await fetch(`/api${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(errorData.error || 'API Request Failed');
      error.response = { data: errorData };
      throw error;
    }
    return res.json();
  },
  delete: async (endpoint) => {
    const token = await getToken();
    const res = await fetch(`/api${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(errorData.error || 'API Request Failed');
      error.response = { data: errorData };
      throw error;
    }
    return res.json();
  }
};