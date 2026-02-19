# AGENTS.md

이 문서는 DevCollab에 기여하는 에이전트 간 작업 연속성을 보장하기 위한 핸드오프 기준서다.
목표는 컨텍스트 초기화, 토큰 한도 종료, 세션 중단이 발생해도 다음 에이전트가 즉시 이어받는 것이다.

## 0. 세션 시작 부트스트랩 (필수)

새로운 컨텍스트에서 시작한 에이전트는 코드 수정 전에 아래를 먼저 수행한다.

1. `AGENTS.md` 전체 읽기
2. `PROJECT_GUIDE.md` 전체 읽기
3. 현재 작업의 제품 컨셉을 3줄 이내로 요약
4. 최신 `Handoff Snapshot` 기준으로 현재 작업 시작점 확인

권장 명령:
- `Get-Content -Path AGENTS.md, PROJECT_GUIDE.md -Encoding UTF8`

## 1. 프로젝트 고정 컨텍스트

- 프로젝트: `SceneHive` (이전: DevCollab — 2026-02-19 리브랜딩)
- 도메인: 영화 팬 커뮤니티 플랫폼
- 핵심 기능: 영화 클럽(워크스페이스), 실시간 토론(채팅), 명대사 아카이브(스니펫), 리뷰·감상문(메모), 통합 검색, 알림
- 색상 테마: Dark Cinema (`#0B0B14` 배경) + Amber 포인트 (`#F59E0B`)
- 백엔드: Java 17+, Spring Boot 3.2.1, PostgreSQL, Redis, STOMP WebSocket
- 프론트엔드: `frontend-next/` (Next.js 14, TypeScript, TanStack Query)
- 레거시 프론트엔드: `frontend/`는 참고용이며 Docker 런타임 비사용
- TMDB API 연동 예정 (영화 데이터 공공 API)

## 2. 표준 핸드오프 스냅샷 템플릿

아래 템플릿은 작업을 멈추기 전에 반드시 최신화한다.

```md
## Handoff Snapshot
- Timestamp (KST):
- Agent Name:
- Branch:
- Goal (1 line):
- Scope (In/Out):
- Current Status: `not started | in progress | blocked | done`
- Percent Complete:
- Files Changed:
- Commands Run:
- Tests Run + Result:
- Open Risks:
- Blockers:
- Next 3 Actions:
- Resume Command:
```

작성 규칙:
- 상대경로/절대경로를 명확히 적는다.
- 실행 명령은 그대로 재실행 가능한 형태로 적는다.
- 테스트를 안 돌렸으면 `Not run`을 명시한다.
- 최신 스냅샷이 1개라도 있으면 이전 히스토리를 삭제하지 않는다.

## 3. 최초 Handoff Snapshot (2026-02-13)

## Handoff Snapshot
- Timestamp (KST): `2026-02-13 10:59:28 +09:00`
- Agent Name: `Codex`
- Branch: `main`
- Goal (1 line): `AGENTS.md 한국어 전환 및 핸드오프 정책 초기 정착`
- Scope (In/Out): `In: AGENTS.md / Out: 소스 코드 로직 변경`
- Current Status: `done`
- Percent Complete: `100%`
- Files Changed: `AGENTS.md`
- Commands Run: `git branch --show-current`, `git status --short`, `Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"`
- Tests Run + Result: `Not run (문서 작업)`
- Open Risks: `강제 종료 시점 직전 상태는 100% 보장 불가`
- Blockers: `None`
- Next 3 Actions: `1) 다음 작업 시작 전에 Snapshot 갱신`, `2) 작업 단위를 30분 이내로 분할`, `3) 중간 체크포인트 기록 주기 준수`
- Resume Command: `git status --short && git branch --show-current`

## 4. 역할 분담 기준

- Planner Agent: 작업 경계, 완료 기준, 우선순위 정의
- Backend Agent: `src/main/java/**`, DB, API, 보안 관련 변경 담당
- Frontend Agent: `frontend-next/**`, 쿼리/상태/UI/라우팅 변경 담당
- QA Agent: 회귀 리스크 점검, 테스트 시나리오와 검증 기준 담당
- Infra Agent: Docker Compose, 환경변수, 실행/배포/운영 진단 담당

## 5. 핸드오프 필수 산출물

작업 종료 또는 교대 전에 아래 5가지를 남긴다.

1. 무엇을 바꿨는지: 파일 목록 포함 요약
2. 왜 바꿨는지: 요구사항 또는 원인
3. 어떻게 검증했는지: 실행 명령과 결과
4. 남은 작업: 우선순위 최대 5개
5. 안전 메모: 리스크, 롤백 포인트, 데이터 영향

## 6. 이어받기 프로토콜

다음 에이전트는 아래 순서로 시작한다.

1. 본 파일의 최신 `Handoff Snapshot` 확인
2. 저장소 상태 확인
3. `Resume Command` 실행
4. Blocker/Risk가 여전히 유효한지 재검증
5. `Next 3 Actions`를 시작점으로 이어서 진행

저장소 상태 확인 명령:
- `git status --short`
- `git branch --show-current`

## 7. 토큰 한도/컨텍스트 종료 감지와 대응

중요 원칙:
- 에이전트는 "강제 종료 직전"을 완벽히 감지할 수 없다.
- 따라서 "종료 시점 기록"이 아니라 "사전 체크포인트 기록" 방식으로 운영해야 한다.

운영 규칙:
- 작업 시작 전 스냅샷을 먼저 갱신한다.
- 5~10분마다 또는 의미 있는 변경마다 스냅샷을 갱신한다.
- 긴 명령 실행 전, 먼저 현재 상태를 스냅샷에 기록한다.
- 30분 이상 한 번에 묶어 진행하지 않는다.
- 작업 단위가 끝날 때마다 `Next 3 Actions`를 구체화한다.

현실적 한계:
- 갑작스러운 세션 종료 순간에는 md 기록이 누락될 수 있다.
- 위 규칙을 지키면 "마지막 수 분"만 손실되고, 전체 문맥 손실은 크게 줄일 수 있다.

## 8. 완료 정의 (Definition of Done)

아래를 모두 만족해야 작업 완료로 본다.

1. 요구사항 충족
2. 테스트 수행 또는 미수행 사유 명시
3. `Handoff Snapshot` 갱신
4. 잔여 리스크 기록
5. 다음 에이전트가 질문 없이 재개 가능

## 9. 빠른 실행 커맨드

- 백엔드 실행: `./gradlew bootRun`
- 프론트엔드 실행: `cd frontend-next && npm run dev`
- 인프라만 실행: `docker compose up -d db redis`
- 전체 실행: `docker compose up -d --build`
- 체크포인트 기록(짧은 명령): `.\scripts\checkpoint.ps1`
- 체크포인트 로그 정리: `.\scripts\checkpoint-prune.ps1 -Keep 30`
- 세션 별칭 로드: `. .\scripts\agent-alias.ps1`
  - 별칭: `checkpoint`, `checkpoint-prune`, `ckp`, `ckpr`

기본 주소:
- Backend: `http://localhost:8081`
- Frontend: `http://localhost:3000`

정기 정리 권장:
- 기본 정책: 최신 `30`개 Snapshot 유지, 나머지는 `AGENTS_ARCHIVE.md`로 이동
- 실행 주기: 주 1회 또는 로그가 30개를 초과한 시점
- 수동 실행: `checkpoint-prune -Keep 30`

## 10. 변경 이력

- 2026-02-13: AGENTS 문서 한국어 전환, 최초 Snapshot 기입, 토큰/컨텍스트 종료 대응 규칙 추가
- 2026-02-19: **SceneHive 리브랜딩** — DevCollab → SceneHive, Dark Cinema 테마 적용, 프로젝트 컨셉 영화 커뮤니티로 전환

## Handoff Snapshot Log (Auto)
<!-- HANDOFF_LOG_START -->
## Handoff Snapshot
- Timestamp (KST): 2026-02-19 14:19:04 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): SceneHive TMDB 홈/검색/상세 고도화 및 fallback 안정화
- Scope (In/Out): In: frontend-next/src/app/(public)/**, frontend-next/src/lib/tmdb.ts, frontend-next/src/app/api/movies/**, docker-compose.yml, frontend-next/next.config.mjs, 문서 업데이트 / Out: Spring 백엔드 비즈니스 로직 변경
- Current Status: done
- Percent Complete: 100%
- Files Changed:
  - frontend-next/src/app/(public)/home/page.tsx
  - frontend-next/src/app/(public)/search/page.tsx
  - frontend-next/src/app/(public)/movies/[movieId]/page.tsx
  - frontend-next/src/app/api/movies/[movieId]/route.ts
  - frontend-next/src/app/api/movies/search/route.ts
  - frontend-next/src/app/api/movies/trending/route.ts
  - frontend-next/src/app/api/movies/now-playing/route.ts
  - frontend-next/src/app/api/movies/upcoming/route.ts
  - frontend-next/src/app/api/movies/top-rated/route.ts
  - frontend-next/src/app/api/movies/genres/route.ts
  - frontend-next/src/lib/tmdb.ts
  - frontend-next/src/app/globals.css
  - frontend-next/next.config.mjs
  - docker-compose.yml
  - AGENTS.md, PROJECT_GUIDE.md
- Commands Run: docker-compose up -d --no-deps --build frontend, curl.exe -s -i http://localhost:3000/api/movies/1316092, curl.exe -s -i http://localhost:3000/api/movies/trending
- Tests Run + Result: Not run (빌드/배포 및 API 응답 수동 확인만 수행)
- Open Risks: TMDB 원천 데이터가 비어있는 경우 일부 섹션은 여전히 제한적 표시 가능 / <img> 사용 관련 Next 경고 존재
- Blockers: None
- Next 3 Actions:
  1) 영화 상세 페이지에서 추천/트레일러 fallback 결과 실제 케이스 점검
  2) /api/movies 라우트 통합([category]) 리팩터링 여부 결정
  3) Phase 6 테스트 코드 범위(backend/frontend/e2e) 재정렬
- Resume Command: docker-compose up -d --no-deps --build frontend && curl.exe -s -i http://localhost:3000/api/movies/1316092

## Handoff Snapshot
- Timestamp (KST): 2026-02-19 (리브랜딩 작업)
- Agent Name: Claude Sonnet 4.5
- Branch: main
- Goal (1 line): SceneHive 리브랜딩 — Dark Cinema 테마, 한글화, 컨셉 전환
- Scope (In/Out): In: frontend-next/src/app/, PROJECT_GUIDE.md, AGENTS.md / Out: 백엔드 로직, DB 스키마
- Current Status: done
- Percent Complete: 100%
- Files Changed:
  - frontend-next/src/app/layout.tsx (SceneHive 타이틀)
  - frontend-next/src/app/globals.css (#0B0B14 배경)
  - frontend-next/src/app/(public)/home/page.tsx (전면 SceneHive 디자인)
  - frontend-next/src/app/(public)/login/page.tsx (Dark Cinema 테마, 한글화)
  - frontend-next/src/app/(public)/register/page.tsx (Dark Cinema 테마, 한글화)
  - AGENTS.md, PROJECT_GUIDE.md (컨셉 업데이트)
- Commands Run: docker compose up --build frontend -d
- Tests Run + Result: Not run (UI 리브랜딩)
- Open Risks: Docker 재빌드 완료 후 화면 확인 필요 / user-menu 드롭다운은 여전히 밝은 색 (dark: 클래스 기반) — SceneHive 테마와 불일치 가능
- Blockers: None
- Next 3 Actions:
  1) Docker 빌드 완료 후 http://localhost:3000 에서 SceneHive 화면 확인
  2) 로그인/홈 화면 색상 및 레이아웃 검토
  3) TMDB API 연동 계획 수립 (영화 클럽에 영화 정보 표시)
- Resume Command: docker compose ps && curl -s http://localhost:3000 | head -5

## Handoff Snapshot
- Timestamp (KST): 2026-02-13 11:32:56 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): Add alias and prune workflow
- Scope (In/Out): In: scripts/*.ps1, AGENTS.md / Out: No app logic changes
- Current Status: done
- Percent Complete: 100%
- Files Changed: ?? AGENTS.md, ?? scripts/
- Commands Run: git branch --show-current, git status --short, & "$PSScriptRoot\agent-checkpoint.ps1" @args
- Tests Run + Result: wrappers and alias loaded
- Open Risks: Abrupt session end can skip final snapshot
- Blockers: None
- Next 3 Actions: 1) Use ckp at task start, 2) Use ckp before long commands, 3) Run ckpr weekly
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-02-13 11:23:55 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): Verify checkpoint append
- Scope (In/Out): In: scripts/agent-checkpoint.ps1 / Out: No app logic changes
- Current Status: done
- Percent Complete: 100%
- Files Changed: ?? AGENTS.md, ?? scripts/
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "Verify checkpoint append" -ScopeIn "scripts/agent-checkpoint.ps1" -ScopeOut "No app logic changes" -Status "done" -PercentComplete "100%" -TestsResult "script run passed" -OpenRisks "Abrupt termination may skip last write" -Blockers "None" -NextAction1 "Run before long tasks" -NextAction2 "Run before risky commands" -NextAction3 "Run at task end"
- Tests Run + Result: script run passed
- Open Risks: Abrupt termination may skip last write
- Blockers: None
- Next 3 Actions: 1) Run before long tasks, 2) Run before risky commands, 3) Run at task end
- Resume Command: git status --short && git branch --show-current
<!-- HANDOFF_LOG_END -->




