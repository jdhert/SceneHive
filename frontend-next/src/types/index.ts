// === Enums ===
export type Role = 'USER' | 'ADMIN';
export type MessageType = 'TEXT' | 'CODE';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type UserStatus = 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
export type Theme = 'LIGHT' | 'DARK' | 'SYSTEM';
export type NotificationType =
  | 'NEW_CHAT_MESSAGE'
  | 'MENTION'
  | 'WORKSPACE_INVITE'
  | 'WORKSPACE_JOIN'
  | 'WORKSPACE_LEAVE'
  | 'SNIPPET_CREATED'
  | 'MEMO_CREATED';

// === Entities ===
export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  profilePictureUrl?: string;
  bio?: string;
  jobTitle?: string;
  company?: string;
  status: UserStatus;
  isVerified: boolean;
  provider?: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string;
  failedLoginAttempts?: number;
  accountLockedUntil?: string;
}

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  inviteCode: string;
  owner: User;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: number;
  user: User;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  type: MessageType;
  sender: User;
  workspaceId: number;
  createdAt: string;
}

export interface CodeSnippet {
  id: number;
  title: string;
  code: string;
  language: string;
  description?: string;
  author: User;
  workspaceId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Memo {
  id: number;
  title: string;
  content: string;
  author: User;
  workspaceId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
  isRead: boolean;
  sender?: User;
  workspace?: Workspace;
  relatedUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface UserSettings {
  id: number;
  theme: Theme;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  mentionNotifications: boolean;
}

// === API Request Types ===
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
}

export interface SendMessageRequest {
  content: string;
  type: MessageType;
}

export interface CreateSnippetRequest {
  title: string;
  code: string;
  language: string;
  description?: string;
}

export interface UpdateSnippetRequest {
  title?: string;
  code?: string;
  language?: string;
  description?: string;
}

export interface CreateMemoRequest {
  title: string;
  content: string;
}

export interface UpdateMemoRequest {
  title?: string;
  content?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  jobTitle?: string;
  company?: string;
}

export interface UpdateSettingsRequest {
  theme?: Theme;
  language?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  mentionNotifications?: boolean;
}

export interface SearchResponse {
  messages: ChatMessage[];
  snippets: CodeSnippet[];
  memos: Memo[];
  totalCount: number;
}

export type SearchType = 'ALL' | 'CHAT' | 'SNIPPET' | 'MEMO';

export interface DashboardResponse {
  workspaces: Workspace[];
  recentMessages: ChatMessage[];
  recentSnippets: CodeSnippet[];
  recentMemos: Memo[];
}

// === API Pagination ===
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
