import api, { refreshApi } from '@/lib/api-client';
import type {
  AuthResponse,
  ChatMessage,
  CodeSnippet,
  CreateMemoRequest,
  CreateSnippetRequest,
  CreateWorkspaceRequest,
  DashboardResponse,
  LoginRequest,
  Memo,
  Notification,
  Page,
  RegisterRequest,
  SearchResponse,
  SearchType,
  SendMessageRequest,
  UpdateMemoRequest,
  UpdateProfileRequest,
  UpdateSettingsRequest,
  UpdateSnippetRequest,
  UpdateWorkspaceRequest,
  User,
  UserSettings,
  Workspace,
  WorkspaceMember,
} from '@/types';

export const authService = {
  register: (data: RegisterRequest) => api.post('/auth/register', data),
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  refresh: () => refreshApi.post<AuthResponse>('/auth/refresh'),
  logout: () => refreshApi.post('/auth/logout'),
  verifyEmail: (data: { email: string; code: string }) => api.post('/auth/verify-email', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  resendUnlockEmail: (email: string) => api.post('/auth/resend-unlock-email', { email }),
  getMe: () => api.get<User>('/users/me'),
};

export const workspaceService = {
  create: (data: CreateWorkspaceRequest) => api.post<Workspace>('/workspaces', data),
  getAll: () => api.get<Workspace[]>('/workspaces'),
  getById: (id: number) => api.get<Workspace>(`/workspaces/${id}`),
  update: (id: number, data: UpdateWorkspaceRequest) => api.put<Workspace>(`/workspaces/${id}`, data),
  delete: (id: number) => api.delete(`/workspaces/${id}`),
  getMembers: (workspaceId: number) => api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
  removeMember: (workspaceId: number, userId: number) =>
    api.delete(`/workspaces/${workspaceId}/members/${userId}`),
  leave: (workspaceId: number) => api.delete(`/workspaces/${workspaceId}/members/me`),
  join: (inviteCode: string) => api.post<Workspace>(`/workspaces/join/${inviteCode}`),
  regenerateInvite: (workspaceId: number) =>
    api.post<{ inviteCode: string }>(`/workspaces/${workspaceId}/invite`),
};

export const chatService = {
  getMessages: (workspaceId: number, page = 0, size = 50) =>
    api.get<ChatMessage[]>(`/workspaces/${workspaceId}/messages`, { params: { page, size } }),
  sendMessage: (workspaceId: number, data: SendMessageRequest) =>
    api.post<ChatMessage>(`/workspaces/${workspaceId}/messages`, data),
};

export const snippetService = {
  getAll: (workspaceId: number) => api.get<CodeSnippet[]>(`/workspaces/${workspaceId}/snippets`),
  getById: (workspaceId: number, snippetId: number) =>
    api.get<CodeSnippet>(`/workspaces/${workspaceId}/snippets/${snippetId}`),
  create: (workspaceId: number, data: CreateSnippetRequest) =>
    api.post<CodeSnippet>(`/workspaces/${workspaceId}/snippets`, data),
  update: (workspaceId: number, snippetId: number, data: UpdateSnippetRequest) =>
    api.put<CodeSnippet>(`/workspaces/${workspaceId}/snippets/${snippetId}`, data),
  delete: (workspaceId: number, snippetId: number) =>
    api.delete(`/workspaces/${workspaceId}/snippets/${snippetId}`),
};

export const memoService = {
  getAll: (workspaceId: number) => api.get<Memo[]>(`/workspaces/${workspaceId}/memos`),
  getById: (workspaceId: number, memoId: number) =>
    api.get<Memo>(`/workspaces/${workspaceId}/memos/${memoId}`),
  create: (workspaceId: number, data: CreateMemoRequest) =>
    api.post<Memo>(`/workspaces/${workspaceId}/memos`, data),
  update: (workspaceId: number, memoId: number, data: UpdateMemoRequest) =>
    api.put<Memo>(`/workspaces/${workspaceId}/memos/${memoId}`, data),
  delete: (workspaceId: number, memoId: number) =>
    api.delete(`/workspaces/${workspaceId}/memos/${memoId}`),
  search: (workspaceId: number, keyword: string) =>
    api.get<Memo[]>(`/workspaces/${workspaceId}/memos/search`, { params: { keyword } }),
};

export const userService = {
  getMe: () => api.get<User>('/users/me'),
  updateMe: (data: UpdateProfileRequest) => api.put<User>('/users/me', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<User>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAvatar: () => api.delete('/users/me/avatar'),
  getUserById: (id: number) => api.get<User>(`/users/${id}`),
  updateStatus: (status: string) => api.put<User>('/users/me/status', { status }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/me/password', { currentPassword, newPassword }),
};

export const settingsService = {
  getSettings: () => api.get<UserSettings>('/users/me/settings'),
  updateSettings: (data: UpdateSettingsRequest) => api.put<UserSettings>('/users/me/settings', data),
};

export const searchService = {
  search: (workspaceId: number, query: string, type: SearchType = 'ALL') =>
    api.get<SearchResponse>(`/workspaces/${workspaceId}/search`, { params: { query, type } }),
};

export const dashboardService = {
  get: (limit = 10) => api.get<DashboardResponse>('/dashboard', { params: { limit } }),
};

export const notificationService = {
  getAll: (page = 0, size = 20) =>
    api.get<Page<Notification>>('/notifications', { params: { page, size } }),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};
