import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from '../lib/accessToken'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

const refreshApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    const requestUrl = originalRequest.url || ''
    const isAuthEndpoint = requestUrl.startsWith('/auth/')

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = refreshApi.post('/auth/refresh')
        }
        const refreshResponse = await refreshPromise
        const newAccessToken = refreshResponse.data?.accessToken
        if (!newAccessToken) {
          throw new Error('Refresh did not return access token')
        }
        setAccessToken(newAccessToken)
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newAccessToken}`,
        }
        return api(originalRequest)
      } catch (refreshError) {
        clearAccessToken()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
        refreshPromise = null
      }
    }

    return Promise.reject(error)
  }
)

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: () => refreshApi.post('/auth/refresh'),
  logout: () => refreshApi.post('/auth/logout'),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  resendUnlockEmail: (email) => api.post('/auth/resend-unlock-email', { email }),
  getMe: () => api.get('/users/me'),
}

export const workspaceService = {
  create: (data) => api.post('/workspaces', data),
  getAll: () => api.get('/workspaces'),
  getById: (id) => api.get(`/workspaces/${id}`),
  update: (id, data) => api.put(`/workspaces/${id}`, data),
  delete: (id) => api.delete(`/workspaces/${id}`),

  getMembers: (workspaceId) => api.get(`/workspaces/${workspaceId}/members`),
  removeMember: (workspaceId, userId) => api.delete(`/workspaces/${workspaceId}/members/${userId}`),
  leave: (workspaceId) => api.delete(`/workspaces/${workspaceId}/members/me`),

  join: (inviteCode) => api.post(`/workspaces/join/${inviteCode}`),
  regenerateInvite: (workspaceId) => api.post(`/workspaces/${workspaceId}/invite`),
}

export const chatService = {
  getMessages: (workspaceId, page = 0, size = 50) =>
    api.get(`/workspaces/${workspaceId}/messages`, { params: { page, size } }),
  sendMessage: (workspaceId, data) =>
    api.post(`/workspaces/${workspaceId}/messages`, data),
}

export const snippetService = {
  getAll: (workspaceId) => api.get(`/workspaces/${workspaceId}/snippets`),
  getById: (workspaceId, snippetId) => api.get(`/workspaces/${workspaceId}/snippets/${snippetId}`),
  create: (workspaceId, data) => api.post(`/workspaces/${workspaceId}/snippets`, data),
  update: (workspaceId, snippetId, data) => api.put(`/workspaces/${workspaceId}/snippets/${snippetId}`, data),
  delete: (workspaceId, snippetId) => api.delete(`/workspaces/${workspaceId}/snippets/${snippetId}`),
}

export const memoService = {
  getAll: (workspaceId) => api.get(`/workspaces/${workspaceId}/memos`),
  getById: (workspaceId, memoId) => api.get(`/workspaces/${workspaceId}/memos/${memoId}`),
  create: (workspaceId, data) => api.post(`/workspaces/${workspaceId}/memos`, data),
  update: (workspaceId, memoId, data) => api.put(`/workspaces/${workspaceId}/memos/${memoId}`, data),
  delete: (workspaceId, memoId) => api.delete(`/workspaces/${workspaceId}/memos/${memoId}`),
  search: (workspaceId, keyword) => api.get(`/workspaces/${workspaceId}/memos/search`, { params: { keyword } }),
}

export const userService = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteAvatar: () => api.delete('/users/me/avatar'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateStatus: (status) => api.put('/users/me/status', { status }),
}

export const settingsService = {
  getSettings: () => api.get('/users/me/settings'),
  updateSettings: (data) => api.put('/users/me/settings', data),
}

export const searchService = {
  search: (workspaceId, query, type = 'ALL') =>
    api.get(`/workspaces/${workspaceId}/search`, { params: { query, type } }),
}

export const notificationService = {
  getAll: (page = 0, size = 20) =>
    api.get('/notifications', { params: { page, size } }),
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),
  markAsRead: (id) =>
    api.put(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
  delete: (id) =>
    api.delete(`/notifications/${id}`),
}

export default api
