import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://almujam-alshamil-api.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Send the httpOnly auth cookie with every request. The session token is no
  // longer kept in localStorage (where any XSS could read it).
  withCredentials: true,
});

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
};

export const wordsAPI = {
  search: (params) => api.get('/api/search', { params }),
  suggest: (q) => api.get('/api/search/suggest', { params: { q } }),
  get: (word) => api.get(`/api/words/${encodeURIComponent(word)}`),
  create: (data) => api.post('/api/words', data),
};

export const moderationAPI = {
  pending: () => api.get('/api/moderation/pending'),
  review: (id, action) => api.put(`/api/moderation/${id}`, { action }),
};

export default api;
