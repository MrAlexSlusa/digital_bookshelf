const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'bookshelf.token';

// Safari blocks the session cookie across origins (this app's frontend and
// API are on different domains), so auth also travels as a bearer token
// kept here as a fallback.
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage unavailable (private mode, etc) — cookie auth still applies where it works
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function authenticate(path, email, password) {
  const result = await request(path, { method: 'POST', body: JSON.stringify({ email, password }) });
  setToken(result.token);
  return result;
}

export const api = {
  register: (email, password) => authenticate('/auth/register', email, password),
  login: (email, password) => authenticate('/auth/login', email, password),
  logout: () => request('/auth/logout', { method: 'POST' }).finally(() => setToken(null)),
  me: () => request('/auth/me'),

  updateAccount: (data) => request('/account', { method: 'PATCH', body: JSON.stringify(data) }),
  updateEmail: (email, currentPassword) =>
    request('/account/email', { method: 'PATCH', body: JSON.stringify({ email, currentPassword }) }),
  updatePassword: (currentPassword, newPassword) =>
    request('/account/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }),

  getItems: () => request('/items'),
  createItem: (data) => request('/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id, data) => request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE' }),
};
