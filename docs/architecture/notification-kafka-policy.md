# SceneHive Notification Kafka Policy

이 문서는 `notification-service` 분리 전에 고정해야 할 Kafka 운영 계약이다.
현재 런타임은 Spring event 기반 모듈러 모놀리스지만, `NotificationCommand`는 아래 정책을 기준으로 Kafka payload로 전환한다.

## Scope

In scope:
- 채팅에서 발생한 알림 command 전달
- `notification-service` 추출 시 producer/consumer 계약
- retry, DLQ, idempotency, observability 기준

Out of scope:
- Kafka broker Docker Compose 추가
- Spring Kafka 의존성/설정 추가
- 실제 `notification-service` 물리 분리
- 알림 저장소 DB 분리

## Topic Layout

| Purpose | Topic | Producer | Consumer | Message |
| --- | --- | --- | --- | --- |
| 알림 command 기본 처리 | `scenehive.notification.command.v1` | `chat` module, later `chat-service` | `notification` module, later `notification-service` | `notification.contract.NotificationCommand` |
| 재시도 1단계 | `scenehive.notification.command.retry.1m.v1` | notification consumer error handler | notification consumer | same payload + error headers |
| 재시도 2단계 | `scenehive.notification.command.retry.5m.v1` | retry consumer error handler | notification consumer | same payload + error headers |
| 최종 실패 | `scenehive.notification.command.dlq.v1` | retry consumer error handler | manual/admin reprocessor | same payload + error headers |

Topic naming rules:
- Prefix: `scenehive`
- Domain: `notification`
- Intent: `command`
- Version suffix: `v{schemaVersion}`
- Retry topics must encode delay in the topic name.
- Breaking payload changes create a new topic version instead of changing `v1` in place.

## Message Contract

Contract package:
- `com.example.auth.notification.contract`

Current payload:

```json
{
  "eventId": "uuid",
  "schemaVersion": 1,
  "occurredAt": "2026-04-28T08:00:00Z",
  "recipientId": 1,
  "senderId": 2,
  "workspaceId": 10,
  "type": "MENTION",
  "title": "sender님이 회원님을 멘션했습니다",
  "message": "preview",
  "relatedUrl": "/workspaces/10"
}
```

Required fields:
- `eventId`: idempotency key. Must be globally unique.
- `schemaVersion`: message schema version. Current value is `1`.
- `occurredAt`: producer-side event creation time in UTC.
- `recipientId`: notification owner.
- `type`: notification behavior category.
- `title`: notification title shown to the user.
- `message`: notification body/preview.

Nullable fields:
- `senderId`: can be null for system notifications.
- `workspaceId`: can be null for global notifications.
- `relatedUrl`: can be null when no deep link exists.

Compatibility rules:
- Consumers must ignore unknown fields.
- Producers must not remove or rename existing `v1` fields.
- New optional fields are allowed in `v1` only if old consumers can ignore them.
- Required field changes require `v2`.
- `NotificationCommandType` is the external contract enum. It must not depend on JPA `NotificationType`.

## Partitioning And Ordering

Message key:
- Primary key: `recipientId`
- Serialized form: string value of `recipientId`

Why:
- Ordering matters most per recipient, not per workspace.
- A user should see mention/chat notifications in a consistent order.
- Recipient-based partitioning distributes load better than a single workspace hot partition for large clubs.

Partition count:
- Local/dev: `1`
- Small staging/prod VM: `3`
- Larger production: start with `6`, increase only with a migration plan.

Ordering guarantee:
- Kafka guarantees order only within a partition.
- Per-recipient order is preserved as long as the key remains `recipientId`.
- Cross-recipient order is not guaranteed and should not be required by UI or business logic.

## Producer Policy

Producer reliability:
- Acknowledgement: `acks=all`
- Retries: enabled
- Idempotent producer: enabled when Spring Kafka is introduced
- Compression: `lz4` or `snappy` for production, optional locally

Producer behavior:
- Publish only after the chat message transaction commits.
- Current monolith already uses `@TransactionalEventListener(phase = AFTER_COMMIT)` before command creation.
- Producer must log `eventId`, `recipientId`, `workspaceId`, `type`, and topic.
- Producer must not block chat message persistence on long external retries.

Failure behavior:
- If Kafka is unavailable in the future implementation, chat message persistence should still succeed.
- Failed publish should be logged and counted as a metric.
- For production-grade reliability, add an outbox table before strict delivery guarantees are required.

Outbox note:
- Current target is "good enough async notification" for portfolio/staging deployment.
- If notification loss becomes unacceptable, introduce a transactional outbox before physical MSA extraction.

## Consumer Retry Policy

Processing target:
- `NotificationCommandHandler` maps the external contract to internal notification creation.
- Later `KafkaNotificationCommandConsumer` should call the same application path.

Retry classification:

| Error type | Retry? | Destination |
| --- | --- | --- |
| Temporary DB/network error | Yes | retry topic |
| WebSocket delivery error after DB save | No message retry | log only; DB notification is already persisted |
| Unknown `type` | No | DLQ |
| Missing required field | No | DLQ |
| Recipient not found | No by default | DLQ or discard after policy review |
| Duplicate `eventId` | No | acknowledge and skip |

Retry schedule:
- Attempt 1: immediate consumer attempt on base topic
- Attempt 2: `retry.1m`
- Attempt 3: `retry.5m`
- Final: `dlq`

Headers to preserve:
- `x-scenehive-event-id`
- `x-scenehive-schema-version`
- `x-scenehive-original-topic`
- `x-scenehive-attempt`
- `x-scenehive-error-class`
- `x-scenehive-error-message`
- `x-scenehive-failed-at`

Consumer acknowledgement:
- Ack after DB notification transaction commits.
- Do not ack before idempotency check and save complete.
- DLQ publish must happen before acknowledging a poison message.

## DLQ Policy

DLQ topic:
- `scenehive.notification.command.dlq.v1`

DLQ payload:
- Original `NotificationCommand` unchanged.
- Failure metadata should live in headers, not mutate the payload.

Operational handling:
- DLQ is not automatically replayed.
- Admin/manual reprocessor should inspect, fix cause, then replay to base topic.
- Replaying must preserve `eventId` unless intentionally creating a new notification.

Retention:
- Base topic: `7 days`
- Retry topics: `3 days`
- DLQ: `30 days`

For the current OCI single-VM deployment, these are target policies. Actual retention can be lower if disk is constrained, but DLQ should outlive ordinary retry topics.

## Idempotency Policy

Idempotency key:
- `eventId`

Required storage:
- Add `event_id` to notification persistence before Kafka consumer goes live.
- Unique constraint: `notifications.event_id`

Consumer behavior:
- If `eventId` already exists, skip notification creation and ack.
- Duplicate detection must happen inside the same transaction as notification creation.
- If two consumers race, the unique constraint is the final guard.

Current monolith transition:
- `NotificationCommand` already has `eventId`.
- `Notification` entity does not yet persist it.
- Before replacing Spring event with Kafka, add the field and unique index.

## Observability

Logs:
- Include `eventId`, `recipientId`, `workspaceId`, `type`, `topic`, `attempt`.
- Never log full JWT, email secrets, or SMTP credentials.

Metrics:
- `notification_command_published_total`
- `notification_command_consumed_total`
- `notification_command_failed_total`
- `notification_command_dlq_total`
- `notification_command_duplicate_total`
- `notification_command_processing_seconds`

Alerts:
- DLQ count > 0 for more than 10 minutes
- Consumer lag continuously increasing for 10 minutes
- Publish failure rate > 5% over 5 minutes

## Implementation Checklist

1. Add Kafka broker to local/OCI Docker Compose. Done as an optional `kafka` profile.
2. Add Spring Kafka dependency and JSON serializer/deserializer configuration.
3. Add `eventId` column and unique index to `Notification`.
4. Replace `SpringNotificationCommandPublisher` with `KafkaNotificationCommandPublisher`.
5. Replace `NotificationCommandHandler` event listener with `KafkaNotificationCommandConsumer`.
6. Add retry topic and DLQ routing.
7. Add idempotency tests for duplicate `eventId`.
8. Run Java 17 backend tests and deployment smoke test.

## Docker Compose Profile

Kafka is optional until the producer/consumer implementation is merged.
This keeps the current OCI single-VM deployment from paying the memory cost before it is needed.

Local run:

```bash
docker compose --profile kafka up -d kafka kafka-init
```

Production compose run:

```bash
docker compose -f docker-compose.prod.yml --profile kafka up -d kafka kafka-init
```

Container-to-container bootstrap server:
- `kafka:9092`

Local host debugging endpoint:
- `localhost:9094` in `docker-compose.yml`
- No host port is exposed in `docker-compose.prod.yml`
