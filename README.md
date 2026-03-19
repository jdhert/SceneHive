# SceneHive

영화 팬을 위한 커뮤니티 플랫폼입니다.  
사용자는 TMDB 기반으로 영화를 탐색하고, 영화 클럽에 참여해 실시간으로 대화하고, 명대사와 리뷰를 축적할 수 있습니다.

## 한눈에 보는 프로젝트

**SceneHive**는 기존 협업형 커뮤니티 구조를 영화 도메인에 맞게 재해석한 서비스입니다.

- 영화 클럽(Workspace) 기반 커뮤니티
- 실시간 토론 채팅과 멘션 알림
- 명대사 아카이브와 리뷰/감상문 작성
- 영화/TV/인물 통합 탐색과 상세 정보 조회
- 즐겨찾기(Favorites) 기반 개인 큐레이션
- JWT + OAuth2 기반 인증 시스템

현재 활성 프론트엔드는 [`frontend-next/`](./frontend-next)이며, 프로젝트는 Next.js 기반 구조를 중심으로 유지되고 있습니다.

## 프로젝트 컨셉

SceneHive는 단순한 영화 정보 조회 사이트가 아니라, 영화를 매개로 사람들이 모이고 기록을 남기는 커뮤니티를 지향합니다.

- `영화 클럽`: 특정 영화, 시리즈, 감독, 장르를 주제로 운영하는 커뮤니티 공간
- `실시간 토론`: 클럽 멤버 간 빠른 감상 공유와 대화
- `명대사 아카이브`: 기억에 남는 장면과 대사를 저장하는 스니펫 공간
- `리뷰 & 감상문`: 마크다운 기반 장문 리뷰와 정리 노트
- `탐색 경험`: 홈 트렌딩, 장르 탐색, 검색, 상세 페이지로 이어지는 영화 탐색 흐름

## 현재 구현 범위

### 사용자 경험

- SceneHive 브랜딩 기반 `Dark Cinema` UI
- 홈에서 트렌딩 영화, TV, 인물 탐색
- 영화/TV/인물 통합 검색
- 영화/TV/인물 상세 페이지
- 복수 장르 필터와 장르별 목록 페이지
- 로그인 사용자 전용 즐겨찾기 토글 및 대시보드 표시

### 커뮤니티 기능

- 영화 클럽 생성, 조회, 참여, 멤버 관리
- 실시간 채팅 및 REST 기반 메시지 조회
- 명대사 스니펫 CRUD
- 리뷰/감상문 메모 CRUD 및 검색
- 워크스페이스 단위 통합 검색
- 알림 목록, 읽음 처리, 읽지 않음 개수 조회

### 인증 및 계정

- 이메일 회원가입 / 로그인
- JWT Access Token + Refresh Token Cookie
- 이메일 인증
- 비밀번호 재설정
- 계정 잠금 해제
- OAuth2 로그인
  - Google
  - Kakao
  - Naver

## 핵심 화면 흐름

1. 사용자는 `/home`에서 현재 화제작과 추천 탐색을 시작합니다.
2. 검색 또는 장르 탐색으로 관심 작품을 찾습니다.
3. 상세 페이지에서 작품 정보를 확인하고 즐겨찾기에 저장합니다.
4. 로그인 후 대시보드와 영화 클럽에서 토론, 명대사 저장, 리뷰 작성을 이어갑니다.

## 기술 스택

### Backend

- Java 17
- Spring Boot 3.2.1
- Spring Security 6
- Spring Data JPA
- Spring WebSocket + STOMP
- Spring Mail
- PostgreSQL
- Redis
- JJWT 0.12.3
- Lombok

### Frontend

- Next.js 14 App Router
- React 18
- TypeScript 5
- TanStack Query 5
- Axios
- Tailwind CSS
- Radix UI / shadcn 스타일 컴포넌트
- SockJS + STOMP.js
- react-markdown
- TMDB API v3

### Infrastructure

- Docker Compose
- Next.js Standalone
- PostgreSQL 15
- Redis

## 아키텍처 개요

```text
Browser
  -> Next.js 14 frontend (frontend-next/)
    -> /api, /ws, /oauth2 rewrite
      -> Spring Boot backend
        -> PostgreSQL
        -> Redis
        -> SMTP
        -> OAuth Providers
        -> TMDB API (frontend route handlers)
```

프론트엔드는 `next.config.mjs`의 rewrite 설정을 통해 백엔드 API, WebSocket, OAuth 경로를 프록시합니다.  
TMDB 기반 영화 데이터는 `frontend-next/src/app/api/**` 및 `frontend-next/src/lib/tmdb.ts`를 통해 처리합니다.

## 디렉터리 구조

```text
.
├── src/main/java/com/example/auth/   # Spring Boot 백엔드
│   ├── config/                       # Security, WebSocket, Async, Storage 설정
│   ├── controller/                   # 인증, 사용자, 워크스페이스, 채팅, 메모, 스니펫, 즐겨찾기 API
│   ├── service/                      # 도메인 로직
│   ├── repository/                   # JPA Repository
│   ├── entity/                       # User, Workspace, Memo, Favorite 등
│   ├── dto/                          # 요청/응답 DTO
│   └── security/                     # JWT / OAuth2 인증 처리
├── src/main/resources/               # application.yml 등 백엔드 설정
├── frontend-next/                    # 메인 프론트엔드 (Next.js 14)
│   ├── src/app/                      # App Router 페이지와 API route
│   ├── src/components/               # UI, 채팅, 메모, 스니펫, 검색, 알림 컴포넌트
│   ├── src/queries/                  # TanStack Query 훅
│   ├── src/services/                 # API 호출 함수
│   ├── src/providers/                # 인증/테마/쿼리 Provider
│   └── src/lib/                      # API 클라이언트, TMDB, WebSocket 유틸
├── docker-compose.yml                # 로컬 통합 실행
├── docker-compose.prod.yml           # 프로덕션 배포용 Compose
├── deploy.sh                         # 배포 스크립트
├── PROJECT_GUIDE.md                  # 상세 프로젝트 가이드
└── AGENTS.md                         # 에이전트 핸드오프 문서
```

## 주요 API 영역

현재 백엔드에서 확인 가능한 주요 엔드포인트 범주는 아래와 같습니다.

- `/api/auth/*`
  - 회원가입, 로그인, 토큰 재발급, 로그아웃
  - 이메일 인증, 비밀번호 재설정, 계정 잠금 해제
- `/api/users/*`
  - 내 정보 조회/수정
  - 상태 변경
  - 아바타 업로드/삭제
  - 비밀번호 변경
  - 사용자 설정 조회/수정
- `/api/workspaces/*`
  - 영화 클럽 생성/수정/삭제
  - 초대코드 기반 참여
  - 멤버 조회/제거/탈퇴
- `/api/workspaces/{workspaceId}/messages`
  - 채팅 히스토리 조회
  - 메시지 전송
- `/api/workspaces/{workspaceId}/snippets`
  - 명대사 스니펫 CRUD
- `/api/workspaces/{workspaceId}/memos`
  - 리뷰/감상문 CRUD 및 검색
- `/api/workspaces/{workspaceId}/search`
  - 채팅/스니펫/메모 통합 검색
- `/api/notifications/*`
  - 알림 목록, 읽음 처리, 삭제
- `/api/dashboard`
  - 대시보드 집계 데이터
- `/api/favorites/*`
  - 영화/TV/인물 즐겨찾기 등록, 삭제, 존재 여부 조회

실시간 메시징은 STOMP WebSocket 기반입니다.

- WebSocket endpoint: `/ws`
- Publish: `/app/chat/{workspaceId}`
- Subscribe: `/topic/workspace/{workspaceId}`
- User queue: `/user/queue/notifications`

## 프론트엔드 라우트 요약

### Public

- `/home`
- `/search`
- `/movies/[movieId]`
- `/tv/[tvId]`
- `/people`
- `/people/[personId]`
- `/genres/[genreId]`
- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/unlock-account`
- `/oauth2/redirect`

### Protected

- `/dashboard`
- `/workspaces`
- `/workspaces/[id]`
- `/profile`
- `/profile/edit`
- `/users/[userId]`
- `/settings`

## 실행 방법

### 사전 요구사항

- Java 17+
- Node.js 18+
- Docker Desktop
- PostgreSQL / Redis를 직접 띄우지 않을 경우 Docker Compose 사용 권장

### 1. 환경변수 준비

루트의 `.env` 또는 예제 파일을 기준으로 환경변수를 준비합니다.

주요 항목:

- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `REDIS_HOST`
- `REDIS_PORT`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `KAKAO_CLIENT_ID`
- `KAKAO_CLIENT_SECRET`
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `FRONTEND_URL`
- `TMDB_API_KEY`

배포 환경 예시는 아래 파일을 참고하면 됩니다.

- `.env.production.example`
- `.env.staging.example`

### 2. 로컬 개발 실행

인프라만 먼저 실행:

```bash
docker compose up -d db redis
```

백엔드 실행:

```bash
./gradlew bootRun
```

프론트엔드 실행:

```bash
cd frontend-next
npm install
npm run dev
```

접속 주소:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8081`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`

### 3. Docker로 전체 실행

```bash
docker compose up -d --build
```

컨테이너 구성:

- `frontend`: Next.js standalone 서버
- `backend`: Spring Boot 애플리케이션
- `db`: PostgreSQL 15
- `redis`: Redis

## 환경별 참고 사항

- 프론트엔드 기본 API 프록시 대상은 `BACKEND_URL`입니다.
- Docker Compose에서는 프론트엔드가 `http://backend:8081`로 백엔드를 바라봅니다.
- OAuth 콜백 URL은 환경별 도메인에 맞게 설정해야 합니다.
- Kakao / Naver OAuth는 콘솔 설정과 `*_CLIENT_AUTH_METHOD` 값이 맞아야 합니다.

## 현재 제품 상태

| 영역 | 상태 | 비고 |
|------|------|------|
| 인증 / 계정 관리 | 운영 가능 수준 | JWT, 이메일 인증, 비밀번호 리셋, OAuth2 |
| 영화 탐색 UI | 운영 가능 수준 | 홈, 검색, 상세, 장르 탐색, TMDB 연동 |
| 커뮤니티 핵심 기능 | 구현 완료 | 워크스페이스, 채팅, 메모, 스니펫 |
| 즐겨찾기 | MVP 완료 | 영화/TV/인물 저장 가능 |
| 테스트 체계 | 보강 필요 | 일부 테스트 파일만 존재 |
| CI/CD | 부분 구성 | GitHub Actions / 배포 스크립트 존재 |

## 문서 가이드

- 사용자/기여자용 빠른 개요: `README.md`
- 프로젝트 상세 구조와 개발 히스토리: [`PROJECT_GUIDE.md`](./PROJECT_GUIDE.md)
- 에이전트 작업 인수인계: [`AGENTS.md`](./AGENTS.md)

## 로드맵 메모

현재 코드와 문서 기준으로 다음 영역이 후속 과제로 남아 있습니다.

- 테스트 체계 확장
- CI/CD 안정화
- 즐겨찾기 전용 페이지 및 UX 보강
- 검색 랭킹 정책 정교화
- 영화 커뮤니티 컨셉에 맞는 추가 도메인 기능 확장
