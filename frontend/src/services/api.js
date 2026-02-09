import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - JWT 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - 401 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = requestUrl.startsWith('/auth/');

    // 인증 관련 요청(로그인/회원가입 등)은 리다이렉트하지 않음
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  resendUnlockEmail: (email) => api.post('/auth/resend-unlock-email', { email }),
  getMe: () => api.get('/users/me'),
};

export const workspaceService = {
  // Workspace CRUD
  create: (data) => api.post('/workspaces', data),
  getAll: () => api.get('/workspaces'),
  getById: (id) => api.get(`/workspaces/${id}`),
  update: (id, data) => api.put(`/workspaces/${id}`, data),
  delete: (id) => api.delete(`/workspaces/${id}`),

  // Members
  getMembers: (workspaceId) => api.get(`/workspaces/${workspaceId}/members`),
  removeMember: (workspaceId, userId) => api.delete(`/workspaces/${workspaceId}/members/${userId}`),
  leave: (workspaceId) => api.delete(`/workspaces/${workspaceId}/members/me`),

  // Invite
  join: (inviteCode) => api.post(`/workspaces/join/${inviteCode}`),
  regenerateInvite: (workspaceId) => api.post(`/workspaces/${workspaceId}/invite`),
};

export const chatService = {
  getMessages: (workspaceId, page = 0, size = 50) =>
    api.get(`/workspaces/${workspaceId}/messages`, { params: { page, size } }),
  sendMessage: (workspaceId, data) =>
    api.post(`/workspaces/${workspaceId}/messages`, data),
};

export const snippetService = {
  getAll: (workspaceId) => api.get(`/workspaces/${workspaceId}/snippets`),
  getById: (workspaceId, snippetId) => api.get(`/workspaces/${workspaceId}/snippets/${snippetId}`),
  create: (workspaceId, data) => api.post(`/workspaces/${workspaceId}/snippets`, data),
  update: (workspaceId, snippetId, data) => api.put(`/workspaces/${workspaceId}/snippets/${snippetId}`, data),
  delete: (workspaceId, snippetId) => api.delete(`/workspaces/${workspaceId}/snippets/${snippetId}`),
};

export const memoService = {
  getAll: (workspaceId) => api.get(`/workspaces/${workspaceId}/memos`),
  getById: (workspaceId, memoId) => api.get(`/workspaces/${workspaceId}/memos/${memoId}`),
  create: (workspaceId, data) => api.post(`/workspaces/${workspaceId}/memos`, data),
  update: (workspaceId, memoId, data) => api.put(`/workspaces/${workspaceId}/memos/${memoId}`, data),
  delete: (workspaceId, memoId) => api.delete(`/workspaces/${workspaceId}/memos/${memoId}`),
  search: (workspaceId, keyword) => api.get(`/workspaces/${workspaceId}/memos/search`, { params: { keyword } }),
};

export const userService = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAvatar: () => api.delete('/users/me/avatar'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateStatus: (status) => api.put('/users/me/status', { status }),
};

export const settingsService = {
  getSettings: () => api.get('/users/me/settings'),
  updateSettings: (data) => api.put('/users/me/settings', data),
};

export default api;
