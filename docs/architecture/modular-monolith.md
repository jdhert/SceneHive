# SceneHive Modular Monolith Plan

SceneHive starts as a single Spring Boot application, but the codebase should now move toward a modular monolith before any service is split into a separate process. The goal of this stage is to make module ownership explicit while keeping one deployable backend.

## Target Modules

| Module | Owns | Current candidates | Later MSA target |
| --- | --- | --- | --- |
| `identity` | Authentication, OAuth, JWT, users, profiles, settings, password flows | `AuthService`, `UserService`, `UserSettingsService`, security classes, `User`, `UserSettings` | `identity-service` |
| `workspace` | Movie clubs, membership, invites, workspace roles, membership authorization | `WorkspaceService`, `Workspace`, `WorkspaceMember` | `workspace-service` |
| `content` | Reviews, memorable quotes/snippets, favorites | `MemoService`, `SnippetService`, `FavoriteService` | `content-service` |
| `chat` | Chat messages, STOMP endpoints, presence/session tracking | `ChatService`, `PresenceService`, WebSocket config | `chat-service` |
| `notification` | In-app notifications, notification delivery, chat notification listener | `NotificationService`, `ChatNotificationListener`, `Notification` | `notification-service` |
| `query` | Read aggregation for dashboard and integrated search | `DashboardService`, `SearchService` | `query-service` or BFF/read model |
| `platform` | Shared infrastructure, config, error handling, storage, Redis/mail adapters | `config`, `exception`, `FileStorageService`, `RedisService`, mail dispatch classes | shared library or platform service |

## Ownership Rules

1. A module owns its write model and repositories.
2. Other modules must not directly use another module's repository once an internal port exists.
3. Cross-module reads should move through small interfaces first, then remote clients after service extraction.
4. Cross-module side effects should move through domain events before any external broker is introduced.
5. Query aggregation can remain a read module while write modules are being separated.

## First Refactoring Path

1. Keep the current package layout compiling and add architecture tests that force every backend class into an explicit module owner.
2. Introduce internal ports for the heaviest shared dependencies:
   - `IdentityReader`: user lookup by email/id and display data.
   - `WorkspaceAccessChecker`: membership and role checks.
   - `NotificationPublisher`: notification creation/delivery.
3. Replace direct repository access across modules with those ports.
4. Move classes physically into module packages after dependencies point inward:
   - `com.example.auth.identity`
   - `com.example.auth.workspace`
   - `com.example.auth.content`
   - `com.example.auth.chat`
   - `com.example.auth.notification`
   - `com.example.auth.query`
   - `com.example.auth.platform`
5. Split the first external service only after module tests prove the boundary is stable.

## Refactoring Checkpoints

### Checkpoint 1 - Internal Ports

Implemented the first dependency-inversion pass while keeping the single Spring Boot deployable:

| Port | Adapter | Purpose |
| --- | --- | --- |
| `identity.IdentityReader` | `identity.PersistenceIdentityReader` | Allows chat, content, and query modules to resolve users without importing `UserRepository`. |
| `workspace.WorkspaceAccessChecker` | `workspace.PersistenceWorkspaceAccessChecker` | Centralizes workspace lookup, membership checks, role checks, and member/workspace reads. |
| `notification.NotificationPublisher` | `notification.NotificationServicePublisher` | Lets event listeners publish notifications without coupling directly to `NotificationService`. |

Updated consumers:
- `ChatService` now depends on `IdentityReader` and `WorkspaceAccessChecker`.
- `MemoService` and `SnippetService` now use workspace and identity ports for membership/role checks.
- `SearchService` and `DashboardService` now use identity/workspace ports instead of user/member/workspace repositories.
- `ChatNotificationListener` now uses `WorkspaceAccessChecker` and `NotificationPublisher`.

Architecture guardrails:
- `ModularMonolithBoundaryTest` verifies every backend class is assigned to a planned module owner.
- The same test now prevents the refactored cross-module services from re-importing `UserRepository`, `WorkspaceRepository`, `WorkspaceMemberRepository`, or `NotificationService`.

## Recommended Extraction Order

| Order | Extraction | Why |
| --- | --- | --- |
| 1 | `notification-service` | Already event-like, lower domain ownership risk, easy to make async. |
| 2 | `identity-service` | Central auth/user ownership becomes stable once other modules stop using `UserRepository`. |
| 3 | `workspace-service` | Membership checks are a clear domain boundary used by content and chat. |
| 4 | `chat-service` | Real-time workload and storage profile differ from ordinary CRUD. |
| 5 | `content-service` | Memo/snippet/favorite ownership is clean after identity/workspace references are ID based. |
| 6 | `query-service` | Should be extracted after read models or search indexes exist. |

## Current Risks

- `UserRepository`, `WorkspaceRepository`, and `WorkspaceMemberRepository` are used across multiple services.
- `DashboardService` and `SearchService` aggregate several repositories directly.
- `ChatNotificationListener` mixes chat events, workspace membership, presence, and notification creation.
- WebSocket presence currently updates user status directly.
- Entity relationships still point across future service boundaries.

The next code step is dependency inversion, not service extraction. Once cross-module calls go through ports, moving a module into its own Spring Boot application becomes mostly an infrastructure change rather than a domain rewrite.
