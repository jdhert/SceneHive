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
   - `NotificationCommandPublisher`: chat-to-notification command event.
   - `NotificationPublisher`: notification creation/delivery inside the notification module.
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
| `identity.IdentityPresenceUpdater` | `identity.PersistenceIdentityPresenceUpdater` | Lets chat presence update user status without importing `UserRepository`. |
| `workspace.WorkspaceAccessChecker` | `workspace.PersistenceWorkspaceAccessChecker` | Centralizes workspace lookup, membership checks, role checks, and member/workspace reads. |
| `notification.NotificationPublisher` | `notification.NotificationServicePublisher` | Lets the notification command handler create notifications without coupling directly to `NotificationService`. |
| `notification.NotificationCommandPublisher` | `notification.SpringNotificationCommandPublisher` | Turns chat-driven notification side effects into a versioned command event that can later become a Kafka producer. |
| `chat.ChatQueryReader` | `chat.PersistenceChatQueryReader` | Lets query services read chat messages without importing `ChatMessageRepository`. |
| `content.ContentQueryReader` | `content.PersistenceContentQueryReader` | Lets query services read snippets and memos without importing content repositories. |

Updated consumers:
- `ChatService` now depends on `IdentityReader` and `WorkspaceAccessChecker`.
- `MemoService` and `SnippetService` now use workspace and identity ports for membership/role checks.
- `SearchService` and `DashboardService` now use identity/workspace ports instead of user/member/workspace repositories.
- `ChatNotificationListener` now uses `WorkspaceAccessChecker` and `NotificationCommandPublisher`.

Architecture guardrails:
- `ModularMonolithBoundaryTest` verifies every backend class is assigned to a planned module owner.
- The same test now prevents the refactored cross-module services from re-importing `UserRepository`, `WorkspaceRepository`, `WorkspaceMemberRepository`, or `NotificationService`.

### Checkpoint 2 - Presence and Secondary Consumers

Extended the dependency-inversion boundary to services that were still crossing module ownership lines:

| Service | Previous coupling | New boundary |
| --- | --- | --- |
| `FavoriteService` | `UserRepository` | `IdentityReader` |
| `NotificationService` | `UserRepository`, `WorkspaceRepository` | `IdentityReader`, `WorkspaceAccessChecker` |
| `PresenceService` | `UserRepository`, `WorkspaceService` | `IdentityPresenceUpdater`, `WorkspaceAccessChecker` |

Architecture guardrails now include these services and block direct imports of `WorkspaceService` in refactored cross-module consumers. This keeps WebSocket presence, favorites, and notifications deployable in the monolith while shaping them like future service clients.

### Checkpoint 3 - Query Read Ports

Moved dashboard and integrated search reads behind module-owned read ports:

| Query consumer | Previous coupling | New boundary |
| --- | --- | --- |
| `SearchService` | `ChatMessageRepository`, `CodeSnippetRepository`, `MemoRepository` | `ChatQueryReader`, `ContentQueryReader` |
| `DashboardService` | `ChatMessageRepository`, `CodeSnippetRepository`, `MemoRepository` | `ChatQueryReader`, `ContentQueryReader` |

This keeps `query` as a read aggregation module while preventing it from reaching directly into chat/content persistence. When a real `query-service` or BFF is introduced, these ports can become HTTP clients, message-projected read models, or Elasticsearch adapters.

Architecture guardrails now also prevent query services from importing chat/content write-model repositories.

### Checkpoint 4 - Notification Command Contract

Prepared the first extraction candidate, `notification-service`, by adding an explicit command contract between chat notifications and notification creation:

| Flow step | Current implementation | Later MSA replacement |
| --- | --- | --- |
| Chat message persisted | `ChatService` publishes `ChatMessageCreatedEvent` after saving a message. | `chat-service` publishes a chat domain event. |
| Notification decision | `ChatNotificationListener` resolves workspace members, mentions, and active chat presence. | Can stay in chat or move to a notification policy consumer depending on ownership choice. |
| Notification command publish | `NotificationCommandPublisher` publishes `notification.contract.NotificationCommand` through Spring events. | Kafka producer to `scenehive.notification.command.v1`. |
| Notification command consume | `NotificationCommandHandler` maps the contract to `CreateNotificationRequest`. | Kafka consumer in `notification-service`. |
| Notification delivery | `NotificationPublisher` delegates to `NotificationService`. | Local notification application service in the extracted service. |

This keeps runtime behavior unchanged in the monolith, but the boundary is now shaped like an asynchronous message contract instead of a direct service call. The next Kafka step should replace `SpringNotificationCommandPublisher` and `NotificationCommandHandler`, not the chat or notification domain logic itself.

Contract shape:
- Package: `com.example.auth.notification.contract`
- Current schema version: `1`
- Required routing fields: `eventId`, `schemaVersion`, `occurredAt`, `recipientId`, `type`
- Optional context fields: `senderId`, `workspaceId`, `relatedUrl`
- Presentation fields: `title`, `message`

Architecture guardrails now prevent the command contract package from importing application DTOs, entities, repositories, or services.

Kafka topic, retry, DLQ, and idempotency policy is defined in [`notification-kafka-policy.md`](./notification-kafka-policy.md).

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

- Some owner services still use their own repositories directly; this is expected until physical package moves and service extraction start.
- Query aggregation is behind read ports, but the underlying adapters still use monolith JPA repositories until read models or indexes exist.
- Entity relationships still point across future service boundaries.
- `NotificationCommandHandler` still maps the contract type to the monolith `NotificationType`; when `notification-service` is physically extracted, that mapping should live inside the extracted service only.

The next code step is dependency inversion, not service extraction. Once cross-module calls go through ports, moving a module into its own Spring Boot application becomes mostly an infrastructure change rather than a domain rewrite.
