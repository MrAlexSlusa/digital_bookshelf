async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getMe: () => request('/auth/me'),
  register: (email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  getSchema: () => request('/schema'),

  getBooks: () => request('/books'),
  getBook: (id) => request(`/books/${id}`),
  createBook: (data) => request('/books', { method: 'POST', body: JSON.stringify(data) }),
  updateBook: (id, data) => request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBook: (id) => request(`/books/${id}`, { method: 'DELETE' }),
  saveResponses: (id, responses) =>
    request(`/books/${id}/responses`, { method: 'PUT', body: JSON.stringify(responses) }),

  getCustomFields: () => request('/custom-fields'),
  createCustomField: (data) => request('/custom-fields', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomField: (id, data) => request(`/custom-fields/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomField: (id) => request(`/custom-fields/${id}`, { method: 'DELETE' }),
};
