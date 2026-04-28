# SceneHive - Project Guide

> 이 문서는 AI 에이전트(Claude, Codex, Gemini 등)가 프로젝트를 이해하고 개발을 이어갈 수 있도록 작성되었습니다.

---

## 1. 프로젝트 개요

**SceneHive**는 영화 팬을 위한 커뮤니티 플랫폼입니다.
클럽(워크스페이스) 기반으로 실시간 토론, 명대사 아카이브(코드 스니펫), 리뷰·감상문(메모), 통합 검색 등의 기능을 제공합니다.

**핵심 컨셉:**
- 워크스페이스 = **영화 클럽**: 특정 영화/시리즈/감독 테마의 토론 공간
- 코드 스니펫 → **명대사 아카이브**: 기억에 남는 대사 저장/공유
- 메모 → **리뷰 & 감상문**: 마크다운 기반 심층 감상 기록
- TMDB API 연동 진행 중: 홈 트렌딩/상영작/예정작/평점 상위, 영화 검색, 영화 상세(출연진/트레일러/추천) 데이터 제공

**색상 테마:** Dark Cinema (배경 `#0B0B14`) + Amber/Gold 포인트 (`#F59E0B`)

---

## 2. 기술 스택

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| Java | 17+ | 언어 |
| Spring Boot | 3.2.1 | 프레임워크 |
| Spring Security 6 | - | 인증/인가 (JWT + OAuth2) |
| Spring Data JPA | - | ORM |
| Spring WebSocket | - | 실시간 통신 (STOMP) |
| Spring Mail | - | 이메일 발송 |
| PostgreSQL | 15 | 메인 DB |
| Redis | Alpine | 캐싱 (인증 코드, 세션) |
| Lombok | 1.18.30 | 보일러플레이트 제거 |
| JJWT | 0.12.3 | JWT 토큰 |
| Gradle | Kotlin DSL | 빌드 도구 |

### Frontend (Next.js — Phase 5 마이그레이션 완료)
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14.2 | App Router 프레임워크 |
| React | 18 | UI 라이브러리 |
| TypeScript | 5 | 타입 안전성 |
| TanStack Query | 5 | 서버 상태 관리 (캐싱, 리페치) |
| Axios | 1.6 | HTTP 클라이언트 |
| Tailwind CSS | 3.4 | 스타일링 |
| shadcn/ui (Radix) | - | UI 컴포넌트 |
| STOMP.js + SockJS | 7.3 / 1.6 | WebSocket 클라이언트 |
| react-markdown | 10 | 마크다운 렌더링 |
| react-syntax-highlighter | 16 | 코드 하이라이팅 |
| Lucide React | 0.563 | 아이콘 |
| TMDB API | v3 | 영화 데이터 (포스터, 정보, 평점, 검색, 상세, 추천) |

### 인프라
| 기술 | 용도 |
|------|------|
| Docker Compose | 로컬/배포 오케스트레이션 |
| Next.js Standalone | 프론트엔드 서빙 (포트 3000) |
| Gmail SMTP | 이메일 발송 |

---

## 3. 프로젝트 구조

### Backend
```
src/main/java/com/example/auth/
├── AuthApplication.java
├── config/
│   ├── SecurityConfig.java           # Spring Security + JWT + OAuth2
│   ├── WebSocketConfig.java          # STOMP WebSocket 설정
│   ├── WebSocketAuthConfig.java      # WebSocket 인증
│   ├── JwtConfig.java                # JWT 프로퍼티
│   └── FileStorageConfig.java        # 파일 업로드 설정
├── controller/
│   ├── AuthController.java           # 인증 API
│   ├── UserController.java           # 사용자 프로필/설정 API
│   ├── WorkspaceController.java      # 워크스페이스 관리 API
│   ├── ChatController.java           # 채팅 API + WebSocket
│   ├── SnippetController.java        # 코드 스니펫 API
│   ├── MemoController.java           # 메모 API
│   └── SearchController.java         # 통합 검색 API
├── dto/
│   ├── LoginRequest.java, RegisterRequest.java, AuthResponse.java
│   ├── chat/        ChatMessageRequest, ChatMessageResponse
│   ├── snippet/     CreateSnippetRequest, SnippetResponse, ...
│   ├── memo/        CreateMemoRequest, MemoResponse, ...
│   ├── workspace/   CreateWorkspaceRequest, WorkspaceResponse, WorkspaceMemberResponse
│   ├── profile/     UpdateProfileRequest, ProfileResponse, PublicProfileResponse
│   ├── settings/    UpdateSettingsRequest, UserSettingsResponse
│   └── search/      SearchResponse
├── entity/
│   ├── User.java                     # @Getter @Setter @Builder (Lombok)
│   ├── Workspace.java
│   ├── WorkspaceMember.java
│   ├── ChatMessage.java
│   ├── CodeSnippet.java
│   ├── Memo.java
│   ├── Notification.java
│   ├── UserSettings.java
│   ├── Role.java (enum)
│   ├── WorkspaceRole.java (enum: OWNER, ADMIN, MEMBER)
│   ├── MessageType.java (enum: TEXT, MENTION)
│   ├── UserStatus.java (enum: ONLINE, OFFLINE, AWAY, BUSY)
│   ├── Theme.java (enum: LIGHT, DARK, SYSTEM)
│   └── NotificationType.java (enum)
├── repository/                       # Spring Data JPA Repositories
├── service/
│   ├── AuthService.java              # 회원가입, 로그인, 토큰, 비밀번호 리셋
│   ├── JwtService.java               # JWT 생성/검증
│   ├── UserService.java              # 프로필, 아바타, 상태
│   ├── UserSettingsService.java      # 사용자 설정
│   ├── WorkspaceService.java         # 워크스페이스 CRUD, 멤버 관리
│   ├── ChatService.java              # 메시지 저장, 멘션 파싱, 알림
│   ├── SnippetService.java           # 스니펫 CRUD
│   ├── MemoService.java              # 메모 CRUD + 검색
│   ├── SearchService.java            # 통합 검색 (채팅+스니펫+메모)
│   ├── NotificationService.java      # 알림 생성/WebSocket 전송
│   ├── FileStorageService.java       # 아바타 업로드/리사이즈
│   └── EmailService.java             # 이메일 발송 (인증, 리셋, 잠금해제)
├── security/
│   ├── JwtAuthenticationFilter.java
│   ├── CustomUserDetailsService.java
│   ├── CustomOAuth2UserService.java
│   └── OAuth2AuthenticationSuccessHandler.java
└── exception/
    ├── GlobalExceptionHandler.java
    └── CustomException.java
```

### Frontend (frontend-next/)
```
frontend-next/src/
├── app/
│   ├── layout.tsx                    # Root layout (Providers 래핑)
│   ├── providers.tsx                 # QueryClient + User + Theme Providers ('use client')
│   ├── page.tsx                      # / → /home 리다이렉트
│   ├── globals.css                   # Tailwind CSS imports
│   ├── (public)/                     # Public route group (로그인 불필요)
│   │   ├── home/page.tsx
│   │   ├── login/page.tsx            # 로그인 (OAuth2 포함, Google/Apple SVG 아이콘)
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── unlock-account/page.tsx
│   │   └── oauth2/redirect/page.tsx
│   ├── (protected)/                  # Protected route group (로그인 필요)
│   │   ├── dashboard/page.tsx
│   │   ├── workspaces/page.tsx
│   │   ├── workspaces/[id]/page.tsx  # 채팅/스니펫/메모/검색 탭
│   │   ├── profile/page.tsx
│   │   ├── profile/edit/page.tsx
│   │   ├── users/[userId]/page.tsx
│   │   └── settings/page.tsx
│   └── error.tsx
├── middleware.ts                      # 라우트 보호 (has_session 쿠키 기반)
├── types/index.ts                    # 전체 TypeScript 타입 정의
├── lib/
│   ├── api-client.ts                 # Axios 인스턴스 + 인터셉터 (401 refresh)
│   ├── access-token.ts               # 인메모리 토큰 pub/sub
│   ├── ws.ts                         # WebSocket URL 설정
│   └── utils.ts                      # cn() 유틸리티
├── services/
│   └── api.ts                        # 서비스별 API 함수 (auth, workspace, chat 등)
├── queries/                          # TanStack Query 훅
│   ├── chat.ts                       # useChatMessages, useSendMessage
│   ├── snippets.ts                   # useSnippets, useCreateSnippet, ...
│   ├── memos.ts                      # useMemos, useCreateMemo, ...
│   ├── users.ts                      # useMe, useUser, useUpdateProfile
│   ├── search.ts                     # useSearch
│   └── notifications.ts             # useNotifications, useUnreadCount
├── providers/
│   ├── query-provider.tsx            # QueryClientProvider ('use client')
│   ├── user-provider.tsx             # UserContext (인증 상태)
│   └── theme-provider.tsx            # ThemeContext (테마 상태)
├── hooks/
│   ├── use-access-token.ts           # 토큰 pub/sub 구독
│   ├── use-web-socket.ts             # STOMP 채팅 WebSocket
│   └── use-presence-websocket.ts     # 프레전스 트래킹
├── components/
│   ├── ui/          button, input, label, card (shadcn/ui .tsx)
│   ├── chat/        chat-container, chat-input, message-list, message-item
│   ├── snippet/     snippet-container, snippet-list, snippet-editor, snippet-viewer, code-block
│   ├── memo/        memo-container, memo-list, memo-editor, memo-viewer, markdown-preview
│   ├── search/      search-container, search-result-item
│   ├── notification/ notification-bell, notification-panel, notification-item
│   ├── user/        avatar, status-badge, avatar-upload
│   ├── layout/      user-menu
│   ├── settings/    theme-toggle
│   └── common/      error-boundary
```

### Frontend Legacy (frontend/) — 이전 버전, 참고용
React 18 + Vite + JavaScript CSR SPA. `frontend-next/`로 마이그레이션 완료되어 Docker에서 더 이상 사용하지 않음.

---

## 4. API 엔드포인트 전체 목록

### 인증 (`/api/auth`) — Public
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 + 인증메일 발송 |
| POST | `/api/auth/login` | 로그인 → JWT 반환 (accessToken body, refreshToken httpOnly cookie) |
| POST | `/api/auth/refresh` | accessToken 재발급 |
| POST | `/api/auth/logout` | 로그아웃 (쿠키 삭제) |
| POST | `/api/auth/verify-email` | 이메일 인증코드 확인 |
| POST | `/api/auth/forgot-password` | 비밀번호 리셋 메일 발송 |
| POST | `/api/auth/reset-password` | 비밀번호 재설정 |
| POST | `/api/auth/unlock-account` | 계정 잠금 해제 |
| POST | `/api/auth/resend-unlock-email` | 잠금해제 메일 재발송 |

### 사용자 (`/api/users`) — JWT 필요
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/users/me` | 내 프로필 조회 |
| PUT | `/api/users/me` | 프로필 수정 (name, bio, jobTitle, company) |
| PUT | `/api/users/me/status` | 상태 변경 (ONLINE/OFFLINE/AWAY/BUSY) |
| POST | `/api/users/me/avatar` | 아바타 업로드 (multipart, max 5MB) |
| DELETE | `/api/users/me/avatar` | 아바타 삭제 |
| GET | `/api/users/{userId}` | 다른 유저 공개 프로필 |
| GET | `/api/users/me/settings` | 설정 조회 |
| PUT | `/api/users/me/settings` | 설정 수정 (theme, language, notifications) |

### 워크스페이스 (`/api/workspaces`) — JWT 필요
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/workspaces` | 워크스페이스 생성 |
| GET | `/api/workspaces` | 내 워크스페이스 목록 |
| GET | `/api/workspaces/{id}` | 워크스페이스 상세 |
| PUT | `/api/workspaces/{id}` | 워크스페이스 수정 (admin/owner) |
| DELETE | `/api/workspaces/{id}` | 워크스페이스 삭제 (owner) |
| GET | `/api/workspaces/{id}/members` | 멤버 목록 |
| DELETE | `/api/workspaces/{id}/members/{userId}` | 멤버 추방 (admin/owner) |
| DELETE | `/api/workspaces/{id}/members/me` | 워크스페이스 나가기 |
| POST | `/api/workspaces/join/{inviteCode}` | 초대코드로 참여 |
| POST | `/api/workspaces/{id}/invite` | 초대코드 재생성 (admin/owner) |

### 채팅 (`/api/workspaces/{id}/messages`) — JWT 필요
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/workspaces/{id}/messages?page=0&size=50` | 메시지 히스토리 (페이지네이션) |
| POST | `/api/workspaces/{id}/messages` | 메시지 전송 (REST) |

**WebSocket (STOMP):**
- 연결: `/ws` (SockJS)
- 발신: `/app/chat/{workspaceId}` — `{content, type}`
- 수신: `/topic/workspace/{workspaceId}`
- 알림 수신: `/user/queue/notifications`
- 멤버 변경: `/topic/workspace/{workspaceId}/members`

### 코드 스니펫 (`/api/workspaces/{id}/snippets`) — JWT 필요
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/workspaces/{id}/snippets` | 스니펫 생성 |
| GET | `/api/workspaces/{id}/snippets` | 스니펫 목록 |
| GET | `/api/workspaces/{id}/snippets/{snippetId}` | 스니펫 상세 |
| PUT | `/api/workspaces/{id}/snippets/{snippetId}` | 스니펫 수정 (작성자만) |
| DELETE | `/api/workspaces/{id}/snippets/{snippetId}` | 스니펫 삭제 (작성자/admin) |

### 메모 (`/api/workspaces/{id}/memos`) — JWT 필요
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/workspaces/{id}/memos` | 메모 생성 |
| GET | `/api/workspaces/{id}/memos` | 메모 목록 |
| GET | `/api/workspaces/{id}/memos/{memoId}` | 메모 상세 |
| PUT | `/api/workspaces/{id}/memos/{memoId}` | 메모 수정 (작성자만) |
| DELETE | `/api/workspaces/{id}/memos/{memoId}` | 메모 삭제 (작성자/admin) |
| GET | `/api/workspaces/{id}/memos/search?keyword=` | 메모 검색 |

### 통합 검색 (`/api/workspaces/{id}/search`) — JWT 필요
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/workspaces/{id}/search?query=...&type=ALL` | 통합 검색 (type: ALL/CHAT/SNIPPET/MEMO) |

### 알림 (`/api/notifications`) — JWT 필요
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/notifications?page=0&size=20` | 알림 목록 |
| GET | `/api/notifications/unread-count` | 읽지 않은 알림 수 |
| PUT | `/api/notifications/{id}/read` | 읽음 처리 |
| PUT | `/api/notifications/read-all` | 전체 읽음 처리 |
| DELETE | `/api/notifications/{id}` | 알림 삭제 |

---

## 5. 프론트엔드 라우팅

| Path | 페이지 | 인증 | WebSocket |
|------|--------|------|-----------|
| `/` | → `/home` 리다이렉트 | - | - |
| `/home` | 랜딩 페이지 | 불필요 | - |
| `/login` | 로그인 (OAuth2 포함) | Public only | - |
| `/register` | 회원가입 | Public only | - |
| `/verify-email` | 이메일 인증 | Public | - |
| `/forgot-password` | 비밀번호 찾기 | Public | - |
| `/reset-password` | 비밀번호 재설정 | Public | - |
| `/unlock-account` | 계정 잠금해제 | Public | - |
| `/oauth2/redirect` | OAuth2 콜백 | Public | - |
| `/genres/:genreId` | 장르별 영화 목록 (복수 장르 필터) | 불필요 | - |
| `/dashboard` | 대시보드 | **필요** | - |
| `/workspaces` | 워크스페이스 목록 | **필요** | - |
| `/workspaces/:id` | 워크스페이스 상세 | **필요** | **STOMP** |
| `/profile` | 내 프로필 | **필요** | - |
| `/profile/edit` | 프로필 편집 | **필요** | - |
| `/users/:userId` | 다른 유저 프로필 | **필요** | - |
| `/settings` | 설정 | **필요** | - |

---

## 6. 인증 플로우

```
[회원가입] → POST /auth/register → 인증 메일 발송
    ↓
[이메일 인증] → POST /auth/verify-email (6자리 코드, Redis 5분)
    ↓
[로그인] → POST /auth/login
    ↓
    ├── accessToken (응답 body, 인메모리 저장, 1시간)
    └── refreshToken (httpOnly cookie, 7일)
    ↓
[API 요청] → Authorization: Bearer {accessToken}
    ↓
[토큰 만료] → 401 응답 → POST /auth/refresh → 새 accessToken 발급 → 원래 요청 재시도
    ↓
[로그아웃] → POST /auth/logout → 쿠키 삭제 + 인메모리 토큰 제거

[비밀번호 찾기] → POST /auth/forgot-password → 리셋 메일 (15분 만료)
[계정 잠금] → 로그인 5회 실패 → 잠금 + 해제 메일 (1시간 만료)
```

---

## 7. 개발 히스토리

| 커밋 | 내용 |
|------|------|
| `fea7042` | 초기 프로젝트: Spring Boot + React JWT 인증 |
| `a717304` | CORS 설정 |
| `cddf0c2` | 프론트엔드 Vite + Tailwind CSS + shadcn/ui 마이그레이션 |
| `49232a3` | OAuth2 소셜 로그인 (Google, GitHub, Kakao) |
| `2761209` | 백엔드 DTO, Entity, Security 개선 |
| `618337f` | 이메일 인증 + Redis 지원 |
| `5dcc3dd` | 인프라 설정 업데이트 |
| `6f7932b` | **Phase 2 Backend**: 워크스페이스, 채팅, 스니펫, 메모 |
| `1ac6168` | **Phase 2 Frontend**: 워크스페이스, 채팅, 스니펫, 메모 UI |
| `6963ace` | **Phase 3 Backend**: 프로필, 설정, 파일 스토리지 |
| `7452518` | **Phase 3 Frontend**: 프로필, 설정, 테마 시스템 |
| `14df6d0` | 계정 잠금, 비밀번호 리셋, 비동기 이메일, 인프라 |
| `8bd971f` | 인물 검색 및 인물 상세 페이지 기능 추가 |
| `cf0d5f8` | 통합검색(영화/TV/인물) 및 TV 상세 조회 기능 추가 |
| `f9493aa` | 영화 상세 UX 개선(추천/정보 확장) 및 설정 페이지 오류 수정 |

### 미커밋 변경사항 (현재 작업 중)
- **Phase 4**: 통합 검색, 알림 시스템, Entity Lombok 통일, 프레전스 WebSocket
- **Phase 5**: Next.js 14 + TypeScript + TanStack Query 프론트엔드 마이그레이션 (`frontend-next/`)
- **Docker**: frontend-next Standalone 모드로 전환 (Nginx → Next.js server.js)
- **SceneHive TMDB 확장 (2026-02-19)**:
  - 홈 페이지를 TMDB 데이터 중심으로 재구성 (`/home`)
  - 영화 검색 페이지 추가 (`/search`, `/api/movies/search`)
  - 영화 상세 페이지 추가 (`/movies/[movieId]`, `/api/movies/[movieId]`)
  - 한국어 데이터 부재 시 영어 fallback 적용 (줄거리/태그라인/트레일러)
  - 추천 fallback 체인 적용 (`recommendations` → `similar` → `discover` → `popular`)

### 최근 반영 완료 사항 (2026-02-19)
- 인물 검색/상세 페이지 추가: `/people`, `/people/[personId]`, `/api/people/search`, `/api/people/[personId]`
- 통합 검색 확장: `/search`에서 영화/TV/인물 단일 진입점 제공 (`/api/search/multi`)
- TV 상세 페이지 추가: `/tv/[tvId]`, `/api/tv/[tvId]`
- 영화 상세 정보 보강: 추천/유사작 fallback 체인, 출연진/스태프 노출, 상세 UI 개선
- 홈/상세 fallback 고도화: 한국어 데이터 부재 시 영어 데이터 대체 전략 적용

### 최근 반영 완료 사항 (2026-02-20)
- 홈 캐러셀 드래그 UX 개선: 마우스 드래그/관성/엣지 자동 스크롤 지원 및 클릭 이동 동작 보정
- 장르 목록 페이지 추가: `/genres/[genreId]`, `/api/movies/genre/[genreId]`
- 장르 필터 고도화: 복수 장르 선택 지원, 기준 장르 고정 제거
- 장르 결과 페이지네이션: 클라이언트 기준 24개 단위 반환/더보기
- 복수 장르 필터 정책: OR(`|`)에서 AND(`,`)로 전환하여 선택 장르 동시 포함 작품만 노출

### 최근 반영 완료 사항 (2026-02-24)
- 로그인 사용자 전용 Favorites MVP 추가:
  - 백엔드 API: `POST/GET/DELETE /api/favorites`, `GET /api/favorites/exists`
  - 대상 타입: `MOVIE`, `TV`, `PERSON`
  - DB: `favorites` 테이블(유저-타입-타겟 유니크 제약) 기반 저장
- 상세 페이지 즐겨찾기 토글 연결:
  - `/movies/[movieId]`, `/tv/[tvId]`, `/people/[personId]`
- 대시보드 확장:
  - `/dashboard`에 `내 즐겨찾기` 섹션 추가 (최신순 카드 노출)
- 홈 확장 마무리:
  - `Trending TV`, `Trending People` 섹션 및 대응 API 라우트 반영

### 최근 반영 완료 사항 (2026-02-27)
- 홈 히어로 섹션 리디자인:
  - 레퍼런스 기반 full-bleed 메인 배너 스타일로 재구성
  - 좌상단 브랜드(아이콘/로고) 클릭 시 `window.location.reload()`로 홈 화면 즉시 리렌더
- 홈 CTA 개선:
  - `Watch Trailer` 버튼이 영화 상세 페이지 이동이 아닌 `youtubeUrl` 직접 이동 동작으로 변경
- 상세/검색 UI 톤 정리:
  - 적용 페이지: `/movies/[movieId]`, `/tv/[tvId]`, `/people/[personId]`, `/search`
  - 홈 화면과 동일한 색감/컴포넌트 톤으로 스타일 통일

---

## 8. 빌드 & 실행

### 로컬 개발
```bash
# Backend
./gradlew bootRun

# Frontend (Next.js)
cd frontend-next && npm run dev    # http://localhost:3000

# 인프라 (DB + Redis)
docker compose up -d db redis
```

### Docker 전체 배포
```bash
docker compose up -d --build
# Backend: http://localhost:8081
# Frontend: http://localhost:3000 (Next.js Standalone)
```

**Docker 아키텍처:**
- `frontend` 컨테이너: Next.js standalone (`node server.js`, 포트 3000)
- `backend` 컨테이너: Spring Boot (`java -jar app.jar`, 포트 8081)
- `db` 컨테이너: PostgreSQL 15 (포트 5433→5432)
- `redis` 컨테이너: Redis Alpine (포트 6379)
- 프론트엔드 → 백엔드 프록시: `next.config.mjs` rewrites (`BACKEND_URL` 환경변수)

### 환경변수 (.env)
```
DB_USER=testuser
DB_PASSWORD=testuser
DB_NAME=postgres
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
MAIL_USERNAME=...
MAIL_PASSWORD=...
REDIS_HOST=redis
REDIS_PORT=6379
FRONTEND_URL=http://localhost:3000
```

---

## 9. 주요 설계 결정

1. **JWT 인메모리 저장**: accessToken은 localStorage 대신 JavaScript 변수에 저장 (XSS 방어)
2. **Refresh Token httpOnly Cookie**: CSRF 공격 방어 + 자동 토큰 갱신
3. **STOMP over SockJS**: 브라우저 호환성 확보 + Spring WebSocket 네이티브 지원
4. **Workspace 기반 격리**: 모든 리소스(채팅, 스니펫, 메모)는 워크스페이스 단위로 격리
5. **역할 기반 접근제어**: OWNER > ADMIN > MEMBER 권한 체계
6. **Entity Lombok 통일**: 모든 Entity에 `@Getter @Setter @Builder` 패턴 적용
7. **멘션 시스템**: `@username` 패턴 파싱 → 대상에게 알림 발송
8. **비동기 이메일**: 스레드 풀 + 재시도 큐 (최대 5회, 지수 백오프)

---

## 10. 전체 개발 로드맵

### 완료된 Phase

#### Phase 1: 프로젝트 초기 설정 + 인증 시스템 ✅
- Spring Boot + React 프로젝트 셋업
- JWT 인증 (accessToken + refreshToken)
- 회원가입 / 로그인 / 토큰 갱신
- Spring Security + CORS 설정
- 프론트엔드 Vite + Tailwind CSS + shadcn/ui 마이그레이션
- OAuth2 소셜 로그인 (Google, GitHub, Kakao)
- 이메일 인증 (Redis 기반 인증코드)
- Docker Compose 인프라 (PostgreSQL, Redis)

#### Phase 2: 핵심 협업 기능 ✅
- **Backend**: 워크스페이스 CRUD, 멤버 관리, 초대코드
- **Backend**: 실시간 채팅 (STOMP WebSocket + REST fallback)
- **Backend**: 코드 스니펫 CRUD (제목, 코드, 언어, 설명)
- **Backend**: 메모 CRUD + 키워드 검색
- **Frontend**: 워크스페이스 목록/상세 페이지
- **Frontend**: 채팅 UI (멘션, 코드 메시지)
- **Frontend**: 스니펫 에디터/뷰어 (구문 하이라이팅)
- **Frontend**: 메모 에디터/뷰어 (마크다운 프리뷰)

#### Phase 3: 사용자 경험 + 프로필 ✅
- **Backend**: 프로필 관리 (아바타 업로드, 상태, bio)
- **Backend**: 사용자 설정 (테마, 언어, 알림 환경설정)
- **Backend**: 파일 스토리지 (이미지 리사이즈, 포맷 검증)
- **Frontend**: 프로필 페이지/편집 페이지
- **Frontend**: 설정 페이지 (테마 토글, 알림 설정)
- **Frontend**: UserMenu 드롭다운, Avatar 컴포넌트

#### Phase 4: 보안 강화 + 알림 + 검색 ✅ (미커밋)
- 계정 잠금 (5회 로그인 실패 → 잠금 + 해제 메일)
- 비밀번호 리셋 (토큰 기반, 15분 만료)
- 비동기 이메일 큐 (스레드 풀 + 재시도)
- 실시간 알림 시스템 (WebSocket + DB)
- 통합 검색 (채팅 + 스니펫 + 메모, 타입 필터)
- 프론트엔드 토큰 리프레시 자동화
- 프레전스 WebSocket (온라인 상태 추적)
- Entity Lombok 통일

---

### 미개발 Phase (예정)

#### Phase 5: 프론트엔드 현대화 — Next.js 마이그레이션 ✅
**목표**: React + Vite (CSR, JS) → **Next.js 14 App Router + TypeScript + TanStack Query**

**완료 내역:**
- Next.js 14 App Router 프로젝트 설정 (`frontend-next/`)
- TypeScript 전면 적용 (70+ 파일)
- TanStack Query v5 도입 (`queries/` 디렉터리)
- `(public)` / `(protected)` route groups 구조
- `middleware.ts` 기반 라우트 보호
- WebSocket 훅 마이그레이션 (dynamic import SockJS)
- Docker Standalone 빌드 (`output: 'standalone'`)
- `frontend/` (Vite+Nginx) → `frontend-next/` (Next.js Standalone) 전환
- **SceneHive 리브랜딩**: Dark Cinema 테마 적용, 전 페이지 한글화 (home/login/register)
  - 배경: `#0B0B14`, Amber 포인트 `#F59E0B`
  - 용어 변경: 워크스페이스 → 영화 클럽, 코드 스니펫 → 명대사, 메모 → 리뷰

**주요 아키텍처 변경:**
- `react-router-dom` → Next.js App Router (파일 기반 라우팅)
- `useState` + `useEffect` fetch → `useQuery` / `useMutation`
- PrivateRoute/PublicRoute → Next.js `middleware.ts`
- 환경변수 `VITE_*` → `NEXT_PUBLIC_*`
- Docker: Nginx 프록시 → Next.js rewrites (`BACKEND_URL` 환경변수)
- 백엔드 변경 **없음**

#### Phase 6: 테스트 체계 구축
**목표**: 백엔드 + 프론트엔드 테스트 커버리지 확보

**Backend 테스트:**
- 단위 테스트: Service 계층 (JUnit 5 + Mockito)
- 통합 테스트: Controller 계층 (MockMvc + @WebMvcTest)
- Repository 테스트: @DataJpaTest
- Security 테스트: 인증/인가 시나리오
- WebSocket 테스트: STOMP 메시지 송수신

**Frontend 테스트:**
- 단위 테스트: 컴포넌트 (Jest + React Testing Library)
- 통합 테스트: 페이지 단위 렌더링
- E2E 테스트: Playwright 또는 Cypress
  - 회원가입 → 로그인 → 워크스페이스 생성 → 채팅 플로우
  - OAuth2 로그인 플로우

#### Phase 7: CI/CD 파이프라인 구축
**목표**: 자동화된 빌드/테스트/배포 파이프라인

**CI (지속적 통합):**
- GitHub Actions 워크플로우
  - PR 생성 시: 린트 + 빌드 + 테스트 자동 실행
  - main 브랜치 푸시 시: 전체 테스트 + Docker 이미지 빌드
- Backend: `./gradlew build test`
- Frontend: `npm run lint && npm run build && npm run test`
- SonarQube 또는 CodeClimate 코드 품질 분석 (선택)

**CD (지속적 배포):**
- Docker 이미지 → Container Registry (Docker Hub / GitHub CR / AWS ECR)
- 스테이징 환경 자동 배포
- 프로덕션 환경 수동 승인 후 배포
- 환경별 설정 분리 (dev / staging / prod)

**인프라 as Code:**
- Docker Compose (현재) → 프로덕션 배포 설정
- Nginx 리버스 프록시 설정
- SSL/TLS 인증서 (Let's Encrypt)
- 환경변수 시크릿 관리 (GitHub Secrets / AWS SSM)

#### Phase 8: Modular Monolith → MSA 전환
**목표**: 현재 계층형 모놀리식 → 도메인 경계가 명확한 모듈러 모놀리스 → 도메인별 마이크로서비스 순차 분리

**진행 원칙:**
- 바로 여러 Spring Boot 애플리케이션으로 나누지 않고, 먼저 단일 배포 단위 안에서 모듈 소유권을 고정한다.
- `UserRepository`, `WorkspaceRepository`, `WorkspaceMemberRepository`처럼 여러 도메인이 공유하는 저장소 접근을 내부 포트로 치환한다.
- 모듈 간 쓰기 side effect는 내부 이벤트로 정리한 뒤 외부 브로커(Kafka/RabbitMQ 등)로 전환한다.
- 대시보드/통합검색은 쓰기 도메인이 아니라 read model/BFF 성격의 조회 모듈로 분리한다.
- 상세 계획은 `docs/architecture/modular-monolith.md`를 기준으로 관리한다.

**1차 반영 사항:**
- `IdentityReader`, `WorkspaceAccessChecker`, `NotificationPublisher` 내부 포트를 추가해 identity/workspace/notification 경계를 명시했다.
- `ChatService`, `MemoService`, `SnippetService`, `SearchService`, `DashboardService`, `ChatNotificationListener`의 직접 저장소/서비스 의존 일부를 내부 포트로 교체했다.
- `ModularMonolithBoundaryTest`로 모든 백엔드 클래스의 모듈 소유권과 1차 리팩터링 대상의 금지 의존성을 검증한다.

**2차 반영 사항:**
- `IdentityReader`를 id 기반 사용자 조회까지 확장하고 `IdentityPresenceUpdater` 쓰기 포트를 추가했다.
- `FavoriteService`, `NotificationService`, `PresenceService`에서 `UserRepository`, `WorkspaceRepository`, `WorkspaceService` 직접 의존을 제거했다.
- `ModularMonolithBoundaryTest`의 금지 의존성 검증 범위를 위 서비스들까지 확장했다.

**3차 반영 사항:**
- `ChatQueryReader`, `ContentQueryReader` read port를 추가해 query 모듈의 직접 repository 조회를 차단했다.
- `SearchService`, `DashboardService`에서 `ChatMessageRepository`, `CodeSnippetRepository`, `MemoRepository` 직접 의존을 제거했다.
- `ModularMonolithBoundaryTest`에 query 서비스가 chat/content write-model repository를 import하지 못하도록 검증을 추가했다.

**4차 반영 사항:**
- `NotificationCommand`, `NotificationCommandPublisher`, `NotificationCommandHandler`를 추가해 채팅 알림 생성을 명시적인 command event 계약으로 분리했다.
- `ChatNotificationListener`는 더 이상 `NotificationPublisher`에 직접 알림 생성을 요청하지 않고, `NotificationCommandPublisher`로 알림 command만 발행한다.
- 현재는 Spring event 기반 단일 프로세스 동작을 유지하며, 이후 Kafka 도입 시 `SpringNotificationCommandPublisher`와 `NotificationCommandHandler`를 producer/consumer로 교체하는 흐름을 만든다.

**5차 반영 사항:**
- `NotificationCommand`를 `notification.contract` 패키지로 이동하고 `eventId`, `schemaVersion`, `occurredAt`을 추가해 Kafka topic payload로 사용할 수 있는 메시지 계약 형태로 고정했다.
- command 계약은 더 이상 JPA entity enum인 `NotificationType`에 의존하지 않고, 별도 `NotificationCommandType`을 사용한다.
- `ModularMonolithBoundaryTest`에 contract 패키지가 DTO/entity/repository/service를 import하지 못하도록 검증을 추가했다.

**6차 반영 사항:**
- `docs/architecture/notification-kafka-policy.md`에 알림 command topic, partition key, retry topic, DLQ, 보관 기간, idempotency 기준을 문서화했다.
- 기본 topic은 `scenehive.notification.command.v1`, 메시지 key는 `recipientId`, 중복 방지 key는 `eventId`로 고정했다.
- Kafka consumer 도입 전 `notifications.event_id` 저장 및 unique constraint 추가가 필요하다는 선행 조건을 명시했다.

**7차 반영 사항:**
- `docker-compose.yml`, `docker-compose.prod.yml`에 Kafka KRaft 단일 브로커를 optional `kafka` profile로 추가했다.
- `kafka-init` 컨테이너가 알림 command/retry/DLQ topic을 생성하도록 구성했다.
- OCI 단일 VM 메모리 부담을 줄이기 위해 기본 `docker compose up -d`에는 Kafka가 포함되지 않는다.

**서비스 분리 계획:**
```
현재 (Monolith)                    →    MSA 구조
─────────────────────────────────────────────────────
AuthController + AuthService       →    auth-service (인증/인가)
UserController + UserService       →    user-service (프로필/설정)
WorkspaceController + WorkspaceService → workspace-service (워크스페이스/멤버)
ChatController + ChatService       →    chat-service (실시간 채팅)
SnippetController + SnippetService →    content-service (스니펫 + 메모)
MemoController + MemoService       →    (content-service에 통합)
NotificationService                →    notification-service (알림)
SearchService                      →    search-service (검색, Elasticsearch 도입)
FileStorageService                 →    file-service (파일 업로드/관리)
```

**기술 스택 추가:**
- API Gateway: Spring Cloud Gateway
- 서비스 디스커버리: Eureka 또는 Kubernetes DNS
- 서비스 간 통신: REST + 이벤트 기반 (Kafka / RabbitMQ)
- 분산 트랜잭션: Saga 패턴
- 설정 관리: Spring Cloud Config 또는 Kubernetes ConfigMap
- 검색 엔진: Elasticsearch (현재 LIKE 쿼리 → 풀텍스트 검색 전환)

**데이터베이스 분리:**
- auth-service: PostgreSQL (사용자, 인증)
- chat-service: MongoDB 또는 Cassandra (대량 메시지 저장)
- search-service: Elasticsearch (인덱싱 + 검색)
- notification-service: Redis (실시간) + PostgreSQL (이력)
- file-service: S3 호환 스토리지 (MinIO / AWS S3)

#### Phase 9: 컨테이너 오케스트레이션 (Kubernetes)
**목표**: Docker Compose → Kubernetes 기반 프로덕션 운영

**구성 요소:**
- Kubernetes 클러스터 (EKS / GKE / 자체 호스팅)
- Helm Charts (서비스별 배포 템플릿)
- Ingress Controller (Nginx Ingress)
- HPA (Horizontal Pod Autoscaler) — 트래픽 기반 자동 스케일링
- PVC (Persistent Volume Claim) — DB, 파일 스토리지
- ConfigMap / Secret — 환경별 설정

**모니터링 & 로깅:**
- Prometheus + Grafana (메트릭 수집/시각화)
- ELK Stack 또는 Loki (로그 수집/분석)
- Jaeger 또는 Zipkin (분산 트레이싱)
- Alertmanager (장애 알림)

#### Phase 10: 성능 최적화 + 추가 기능
**목표**: 대규모 사용자 대응 + 기능 확장

**성능:**
- Redis 캐싱 고도화 (워크스페이스 멤버, 자주 조회되는 데이터)
- DB 쿼리 최적화 (인덱스, N+1 문제 해결)
- CDN 적용 (정적 파일, 아바타 이미지)
- WebSocket 클러스터링 (Redis Pub/Sub 기반 멀티 인스턴스)
- 채팅 메시지 페이지네이션 최적화 (커서 기반)

**추가 기능 후보:**
- **TMDB API 연동**: 영화 클럽에 TMDB 영화 ID 매핑, 포스터/평점/캐스팅 표시
- 파일 첨부 (채팅, 리뷰에 이미지 업로드)
- 스레드 답글 (채팅 메시지에 스레드)
- DM (1:1 다이렉트 메시지)
- 영화 평점 / 별점 시스템
- 관람 기록 / 위시리스트
- 모바일 대응 (PWA 또는 React Native)
- AI 기능 (리뷰 요약, 영화 추천 봇)

---

### 로드맵 요약

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | 프로젝트 초기 설정 + 인증 시스템 | ✅ 완료 |
| 2 | 핵심 협업 기능 (워크스페이스, 채팅, 스니펫, 메모) | ✅ 완료 |
| 3 | 사용자 경험 (프로필, 설정, 테마) | ✅ 완료 |
| 4 | 보안 강화 + 알림 + 검색 | ✅ 완료 (미커밋) |
| 5 | 프론트엔드 Next.js + TypeScript + TanStack Query | ✅ 완료 (미커밋) |
| 6 | 테스트 체계 구축 (단위/통합/E2E) | 📋 미착수 |
| 7 | CI/CD 파이프라인 (GitHub Actions + Docker) | 📋 미착수 |
| 8 | MSA 전환 (서비스 분리 + 메시지 큐) | 📋 미착수 |
| 9 | Kubernetes 오케스트레이션 + 모니터링 | 📋 미착수 |
| 10 | 성능 최적화 + 추가 기능 | 📋 미착수 |

---

## 11. 참고사항

- 모든 Entity는 Lombok 기반 (`@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`)
- 기본값이 있는 필드에는 `@Builder.Default` 적용
- API 응답은 대부분 DTO의 static `from()` 메서드로 Entity → DTO 변환
- 프론트엔드 UI는 shadcn/ui 스타일 (Tailwind + Radix UI) — TypeScript
- **Dark Cinema 테마**: 배경 `#0B0B14`, Amber 포인트 `#F59E0B`, 카드 `rgba(255,255,255,0.05)`
- 한국어 UI (에러 메시지, 버튼 텍스트 등)
- 프론트엔드 디렉토리: `frontend-next/` (Next.js 14 + TypeScript)
- 이전 프론트엔드: `frontend/` (React + Vite + JS) — Docker에서 사용 안 함
- Docker 프록시: `next.config.mjs` rewrites (환경변수 `BACKEND_URL`로 백엔드 주소 설정)
- 서비스명: **SceneHive** (이전: DevCollab) — 영화 커뮤니티 플랫폼으로 컨셉 전환
