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
- 2026-02-20: 홈 캐러셀 드래그 UX 개선, 장르별 목록 페이지/복수 장르 필터(AND) 및 24개 단위 페이징 반영
- 2026-02-24: 로그인 사용자 전용 Favorites MVP 추가 (영화/TV/인물 즐겨찾기 토글 + 대시보드 목록)
- 2026-02-27: 홈 히어로 레이아웃 재구성(full-bleed), 홈 트레일러 버튼 유튜브 링크 연결, 상세/통합검색 UI 톤 통일 반영

## Handoff Snapshot Log (Auto)
<!-- HANDOFF_LOG_START -->
## Handoff Snapshot
- Timestamp (KST): 2026-04-15 17:29:00 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): CI를 이미지 build/push 전담으로 통합하고 staging/prod를 deploy-only로 분리
- Scope (In/Out): In: .github/workflows/ci.yml, .github/workflows/cd-staging.yml, .github/workflows/cd-prod.yml, frontend-next/src/app/(public)/login/page.tsx, AGENTS.md / Out: 애플리케이션 비즈니스 로직 및 deploy.sh 헬스체크/로그 출력 동작 변경 없음
- Current Status: done
- Percent Complete: 100
- Files Changed:  M .github/workflows/cd-prod.yml,  M .github/workflows/cd-staging.yml,  M .github/workflows/ci.yml,  M AGENTS.md,  M frontend-next/src/app/(public)/login/page.tsx, ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "CI를 이미지 build/push 전담으로 통합하고 staging/prod를 deploy-only로 분리" -ScopeIn ".github/workflows/ci.yml, .github/workflows/cd-staging.yml, .github/workflows/cd-prod.yml, frontend-next/src/app/(public)/login/page.tsx, AGENTS.md" -ScopeOut "애플리케이션 비즈니스 로직 및 deploy.sh 헬스체크/로그 출력 동작 변경 없음" -Status "done" -PercentComplete "100" -TestsResult "frontend-next npm run build 성공; git diff --check는 AGENTS.md EOF blank line만 경고" -OpenRisks "GitHub Actions YAML 자체는 원격 실행 전까지 런타임 검증이 불가하며, GHCR package visibility 또는 Actions permissions 설정이 예상과 다르면 manifest inspect 단계에서 실패할 수 있음" -Blockers "None" -NextAction1 "main push 후 CI에서 sha 이미지 publish 확인" -NextAction2 "CI 완료 후 CD-Staging workflow_run 자동 배포 확인" -NextAction3 "prod 배포 시 검증된 sha 또는 v* release tag로 workflow_dispatch 실행"
- Tests Run + Result: frontend-next npm run build 성공; git diff --check는 AGENTS.md EOF blank line만 경고
- Open Risks: GitHub Actions YAML 자체는 원격 실행 전까지 런타임 검증이 불가하며, GHCR package visibility 또는 Actions permissions 설정이 예상과 다르면 manifest inspect 단계에서 실패할 수 있음
- Blockers: None
- Next 3 Actions: 1) main push 후 CI에서 sha 이미지 publish 확인, 2) CI 완료 후 CD-Staging workflow_run 자동 배포 확인, 3) prod 배포 시 검증된 sha 또는 v* release tag로 workflow_dispatch 실행
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-04-15 17:22:03 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): CI에 이미지 build/push를 통합하고 staging/prod를 deploy-only로 분리
- Scope (In/Out): In: .github/workflows/ci.yml, .github/workflows/cd-staging.yml, .github/workflows/cd-prod.yml, AGENTS.md / Out: 애플리케이션 비즈니스 로직 및 deploy.sh 헬스체크 동작 변경 없음
- Current Status: in progress
- Percent Complete: 35
- Files Changed:  M .github/workflows/cd-prod.yml,  M .github/workflows/cd-staging.yml,  M .github/workflows/ci.yml, ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "CI에 이미지 build/push를 통합하고 staging/prod를 deploy-only로 분리" -ScopeIn ".github/workflows/ci.yml, .github/workflows/cd-staging.yml, .github/workflows/cd-prod.yml, AGENTS.md" -ScopeOut "애플리케이션 비즈니스 로직 및 deploy.sh 헬스체크 동작 변경 없음" -Status "in progress" -PercentComplete "35" -TestsResult "Not run (workflow 역할 분리 구조 검토 완료, 보정 패치 예정)" -OpenRisks "prod에서 release tag 배포를 허용하려면 CI가 tag 이미지도 publish해야 하며, 수동 입력 검증이 느슨하면 잘못된 태그 배포 가능" -Blockers "None" -NextAction1 "CI에서 sha 및 release tag 이미지 publish 로직 보강" -NextAction2 "cd-prod에 image 존재 검증 및 입력 제한 추가" -NextAction3 "검토 후 커밋/푸시"
- Tests Run + Result: Not run (workflow 역할 분리 구조 검토 완료, 보정 패치 예정)
- Open Risks: prod에서 release tag 배포를 허용하려면 CI가 tag 이미지도 publish해야 하며, 수동 입력 검증이 느슨하면 잘못된 태그 배포 가능
- Blockers: None
- Next 3 Actions: 1) CI에서 sha 및 release tag 이미지 publish 로직 보강, 2) cd-prod에 image 존재 검증 및 입력 제한 추가, 3) 검토 후 커밋/푸시
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-04-15 16:37:57 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): Public GHCR 기준 OCI 자동배포 파이프라인 단순화
- Scope (In/Out): In: .github/workflows/*.yml, deploy.sh, AGENTS.md / Out: 애플리케이션 비즈니스 로직 변경 없음
- Current Status: done
- Percent Complete: 100%
- Files Changed:  M .env.production.example,  M .env.staging.example,  M .github/workflows/cd-prod.yml,  M .github/workflows/cd-staging.yml,  M AGENTS.md,  M deploy.sh,  M docker-compose.prod.yml,  M frontend-next/Dockerfile, ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "Public GHCR 기준 OCI 자동배포 파이프라인 단순화" -ScopeIn ".github/workflows/*.yml, deploy.sh, AGENTS.md" -ScopeOut "애플리케이션 비즈니스 로직 변경 없음" -Status "done" -PercentComplete "100%" -TestsResult "git diff 및 compose config 검토 완료; bash 구문검사는 로컬 bash 부재로 미실행" -OpenRisks "GHCR package visibility가 실제로 public이 아니면 서버 pull 단계에서 여전히 인증이 필요함" -Blockers "None" -NextAction1 "GitHub Variables와 OCI 서버 .env 확인" -NextAction2 "커밋/푸시 후 CD-Staging 실제 실행 확인" -NextAction3 "필요 시 package visibility를 public으로 재확인"
- Tests Run + Result: git diff 및 compose config 검토 완료; bash 구문검사는 로컬 bash 부재로 미실행
- Open Risks: GHCR package visibility가 실제로 public이 아니면 서버 pull 단계에서 여전히 인증이 필요함
- Blockers: None
- Next 3 Actions: 1) GitHub Variables와 OCI 서버 .env 확인, 2) 커밋/푸시 후 CD-Staging 실제 실행 확인, 3) 필요 시 package visibility를 public으로 재확인
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-04-15 16:03:25 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): OCI VM 대상 GHCR 기반 자동배포 파이프라인 정비
- Scope (In/Out): In: .github/workflows/*.yml, deploy.sh, docker-compose.prod.yml, frontend-next/Dockerfile, env examples, AGENTS.md / Out: 애플리케이션 비즈니스 로직 변경 없음
- Current Status: done
- Percent Complete: 100%
- Files Changed:  M .env.production.example,  M .env.staging.example,  M .github/workflows/cd-prod.yml,  M .github/workflows/cd-staging.yml,  M AGENTS.md,  M deploy.sh,  M docker-compose.prod.yml,  M frontend-next/Dockerfile, ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "OCI VM 대상 GHCR 기반 자동배포 파이프라인 정비" -ScopeIn ".github/workflows/*.yml, deploy.sh, docker-compose.prod.yml, frontend-next/Dockerfile, env examples, AGENTS.md" -ScopeOut "애플리케이션 비즈니스 로직 변경 없음" -Status "done" -PercentComplete "100%" -TestsResult "docker compose -f docker-compose.prod.yml config 검증 완료; bash -n deploy.sh 는 로컬 환경에 bash 미설치로 미실행" -OpenRisks "GitHub Secrets(GHCR_USERNAME, GHCR_TOKEN, STAGING/PRODUCTION_*_ENV_FILE, SSH 관련)와 Actions Variables 미설정 시 배포 실패 가능" -Blockers "None" -NextAction1 "GitHub Secrets/Variables를 OCI 기준 값으로 등록" -NextAction2 "OCI VM에 Docker/Compose 설치 후 SSH 접속 테스트" -NextAction3 "main push 또는 workflow_dispatch로 실제 배포 검증"
- Tests Run + Result: docker compose -f docker-compose.prod.yml config 검증 완료; bash -n deploy.sh 는 로컬 환경에 bash 미설치로 미실행
- Open Risks: GitHub Secrets(GHCR_USERNAME, GHCR_TOKEN, STAGING/PRODUCTION_*_ENV_FILE, SSH 관련)와 Actions Variables 미설정 시 배포 실패 가능
- Blockers: None
- Next 3 Actions: 1) GitHub Secrets/Variables를 OCI 기준 값으로 등록, 2) OCI VM에 Docker/Compose 설치 후 SSH 접속 테스트, 3) main push 또는 workflow_dispatch로 실제 배포 검증
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-04-15 16:00:12 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): OCI VM 대상 GHCR 기반 자동배포 파이프라인 정비
- Scope (In/Out): In: .github/workflows/*.yml, deploy.sh, docker-compose.prod.yml, frontend-next/Dockerfile, env examples, AGENTS.md / Out: 애플리케이션 비즈니스 로직 변경 없음
- Current Status: in progress
- Percent Complete: 20%
- Files Changed: ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "OCI VM 대상 GHCR 기반 자동배포 파이프라인 정비" -ScopeIn ".github/workflows/*.yml, deploy.sh, docker-compose.prod.yml, frontend-next/Dockerfile, env examples, AGENTS.md" -ScopeOut "애플리케이션 비즈니스 로직 변경 없음" -Status "in progress" -PercentComplete "20%" -TestsResult "Not run (구조 분석 완료, 수정 시작 전)" -OpenRisks "OCI 서버 시크릿/환경변수 미설정 시 워크플로우는 여전히 실패 가능" -Blockers "None" -NextAction1 "GHCR 빌드 후 SSH 배포 구조에 맞게 workflow와 deploy 스크립트 수정" -NextAction2 "prod compose의 외부 노출 포트와 env 주입 방식 정리" -NextAction3 "검증 후 사용자에게 필요한 GitHub Secrets/Variables 체크리스트 제공"
- Tests Run + Result: Not run (구조 분석 완료, 수정 시작 전)
- Open Risks: OCI 서버 시크릿/환경변수 미설정 시 워크플로우는 여전히 실패 가능
- Blockers: None
- Next 3 Actions: 1) GHCR 빌드 후 SSH 배포 구조에 맞게 workflow와 deploy 스크립트 수정, 2) prod compose의 외부 노출 포트와 env 주입 방식 정리, 3) 검증 후 사용자에게 필요한 GitHub Secrets/Variables 체크리스트 제공
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-03-19 10:23:07 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): README에 데이터 모델링 산출물 추가
- Scope (In/Out): In: README.md, AGENTS.md / 엔티티 관계 기반 데이터 모델링 문서화 / Out: 애플리케이션 로직 및 스키마 변경 없음
- Current Status: done
- Percent Complete: 100%
- Files Changed:  M .gitignore,  M AGENTS.md,  M README.md, ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "README에 데이터 모델링 산출물 추가" -ScopeIn "README.md, AGENTS.md / 엔티티 관계 기반 데이터 모델링 문서화" -ScopeOut "애플리케이션 로직 및 스키마 변경 없음" -Status "done" -PercentComplete "100%" -TestsResult "Not run (문서 작업; 엔티티 관계와 README 렌더링용 Mermaid 다이어그램 검토 완료)" -OpenRisks "README의 데이터 모델은 개념/요약 수준이며 상세 DDL 변경 시 함께 갱신 필요" -Blockers "None" -NextAction1 "원하면 상세 스키마는 docs/ERD 문서로 분리" -NextAction2 "엔티티 추가 시 README 데이터 모델 섹션 동기화" -NextAction3 "필요 시 DB 인덱스/제약조건 표를 별도 추가"
- Tests Run + Result: Not run (문서 작업; 엔티티 관계와 README 렌더링용 Mermaid 다이어그램 검토 완료)
- Open Risks: README의 데이터 모델은 개념/요약 수준이며 상세 DDL 변경 시 함께 갱신 필요
- Blockers: None
- Next 3 Actions: 1) 원하면 상세 스키마는 docs/ERD 문서로 분리, 2) 엔티티 추가 시 README 데이터 모델 섹션 동기화, 3) 필요 시 DB 인덱스/제약조건 표를 별도 추가
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-03-19 10:21:03 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): README에 데이터 모델링 산출물 추가
- Scope (In/Out): In: README.md, AGENTS.md / 엔티티 관계 기반 데이터 모델링 문서화 / Out: 애플리케이션 로직 및 스키마 변경 없음
- Current Status: in progress
- Percent Complete: 10%
- Files Changed:  M .gitignore, ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "README에 데이터 모델링 산출물 추가" -ScopeIn "README.md, AGENTS.md / 엔티티 관계 기반 데이터 모델링 문서화" -ScopeOut "애플리케이션 로직 및 스키마 변경 없음" -Status "in progress" -PercentComplete "10%" -TestsResult "Not run (문서 작업 시작)" -OpenRisks "README용 모델링은 현재 엔티티 기준 요약이므로 컬럼 전체 목록 대신 핵심 관계 위주로 표현할 가능성이 높음" -Blockers "None" -NextAction1 "엔티티 관계와 핵심 속성 확인" -NextAction2 "README에 ER 다이어그램과 도메인 설명 추가" -NextAction3 "문서 변경분 커밋 및 원격 푸시"
- Tests Run + Result: Not run (문서 작업 시작)
- Open Risks: README용 모델링은 현재 엔티티 기준 요약이므로 컬럼 전체 목록 대신 핵심 관계 위주로 표현할 가능성이 높음
- Blockers: None
- Next 3 Actions: 1) 엔티티 관계와 핵심 속성 확인, 2) README에 ER 다이어그램과 도메인 설명 추가, 3) 문서 변경분 커밋 및 원격 푸시
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-03-19 10:02:57 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): README 시각화 보강
- Scope (In/Out): In: README.md, AGENTS.md / Mermaid 기반 도식 및 시각 구조 개선 / Out: 애플리케이션 로직 변경 없음
- Current Status: done
- Percent Complete: 100%
- Files Changed:  M .gitignore,  M AGENTS.md,  M README.md, ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "README 시각화 보강" -ScopeIn "README.md, AGENTS.md / Mermaid 기반 도식 및 시각 구조 개선" -ScopeOut "애플리케이션 로직 변경 없음" -Status "done" -PercentComplete "100%" -TestsResult "Not run (문서 작업; Mermaid 문법과 문서 흐름 검토 완료)" -OpenRisks "Mermaid 미지원 뷰어에서는 다이어그램이 코드 블록으로만 보일 수 있음" -Blockers "None" -NextAction1 "원하면 시각화 변경분만 별도 커밋" -NextAction2 "원하면 README 스크린샷 섹션 추가" -NextAction3 "추가 기능 반영 시 다이어그램도 함께 갱신"
- Tests Run + Result: Not run (문서 작업; Mermaid 문법과 문서 흐름 검토 완료)
- Open Risks: Mermaid 미지원 뷰어에서는 다이어그램이 코드 블록으로만 보일 수 있음
- Blockers: None
- Next 3 Actions: 1) 원하면 시각화 변경분만 별도 커밋, 2) 원하면 README 스크린샷 섹션 추가, 3) 추가 기능 반영 시 다이어그램도 함께 갱신
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-03-19 10:01:59 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): README 시각화 보강
- Scope (In/Out): In: README.md, AGENTS.md / Mermaid 기반 도식 및 시각 구조 개선 / Out: 애플리케이션 로직 변경 없음
- Current Status: in progress
- Percent Complete: 15%
- Files Changed:  M .gitignore, ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "README 시각화 보강" -ScopeIn "README.md, AGENTS.md / Mermaid 기반 도식 및 시각 구조 개선" -ScopeOut "애플리케이션 로직 변경 없음" -Status "in progress" -PercentComplete "15%" -TestsResult "Not run (문서 작업 시작)" -OpenRisks "Mermaid 렌더링은 GitHub에서는 지원되지만 일부 뷰어에서는 텍스트로만 보일 수 있음" -Blockers "None" -NextAction1 "README 내 시각화 포인트 선정" -NextAction2 "Mermaid 다이어그램 및 요약 섹션 추가" -NextAction3 "검토 후 커밋/푸시 여부 정리"
- Tests Run + Result: Not run (문서 작업 시작)
- Open Risks: Mermaid 렌더링은 GitHub에서는 지원되지만 일부 뷰어에서는 텍스트로만 보일 수 있음
- Blockers: None
- Next 3 Actions: 1) README 내 시각화 포인트 선정, 2) Mermaid 다이어그램 및 요약 섹션 추가, 3) 검토 후 커밋/푸시 여부 정리
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-03-19 09:53:01 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): SceneHive README를 실제 프로젝트 구조 기준으로 전면 개편
- Scope (In/Out): In: README.md, AGENTS.md / 프로젝트 개요·구조·실행 가이드 문서화 / Out: 애플리케이션 로직 및 인프라 동작 변경 없음
- Current Status: done
- Percent Complete: 100%
- Files Changed:  M .gitignore,  M AGENTS.md,  M README.md, ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "SceneHive README를 실제 프로젝트 구조 기준으로 전면 개편" -ScopeIn "README.md, AGENTS.md / 프로젝트 개요·구조·실행 가이드 문서화" -ScopeOut "애플리케이션 로직 및 인프라 동작 변경 없음" -Status "done" -PercentComplete "100%" -TestsResult "Not run (문서 작업; README 내용과 저장소 구조/설정 파일 교차 검토 완료)" -OpenRisks "README는 현재 코드 기준으로 정리했으며 향후 라우트/배포 변경 시 문서 동기화가 필요" -Blockers "None" -NextAction1 "필요 시 README에 스크린샷 또는 아키텍처 다이어그램 추가" -NextAction2 "PROJECT_GUIDE와 README 변경 시 함께 동기화" -NextAction3 "향후 Favorites 전용 페이지 등 신규 기능 반영 시 README 갱신"
- Tests Run + Result: Not run (문서 작업; README 내용과 저장소 구조/설정 파일 교차 검토 완료)
- Open Risks: README는 현재 코드 기준으로 정리했으며 향후 라우트/배포 변경 시 문서 동기화가 필요
- Blockers: None
- Next 3 Actions: 1) 필요 시 README에 스크린샷 또는 아키텍처 다이어그램 추가, 2) PROJECT_GUIDE와 README 변경 시 함께 동기화, 3) 향후 Favorites 전용 페이지 등 신규 기능 반영 시 README 갱신
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-03-19 09:50:54 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): SceneHive README를 실제 프로젝트 구조 기준으로 전면 개편
- Scope (In/Out): In: README.md, AGENTS.md / 프로젝트 개요·구조·실행 가이드 문서화 / Out: 애플리케이션 로직 및 인프라 동작 변경 없음
- Current Status: in progress
- Percent Complete: 20%
- Files Changed:  M .gitignore, ?? .ref-v0-movie-community-service/, ?? nul
- Commands Run: git branch --show-current, git status --short, & .\scripts\agent-checkpoint.ps1 -AgentName "Codex" -Goal "SceneHive README를 실제 프로젝트 구조 기준으로 전면 개편" -ScopeIn "README.md, AGENTS.md / 프로젝트 개요·구조·실행 가이드 문서화" -ScopeOut "애플리케이션 로직 및 인프라 동작 변경 없음" -Status "in progress" -PercentComplete "20%" -TestsResult "Not run (문서 작업 시작 전)" -OpenRisks "README 내용은 PROJECT_GUIDE 및 현재 코드 구조 기준으로 정리되며 미완료 기능은 상태 표기가 필요" -Blockers "None" -NextAction1 "실제 구조 기준 README 섹션 초안 작성" -NextAction2 "README.md 반영 후 문구/명령 정합성 검토" -NextAction3 "작업 완료 스냅샷으로 AGENTS.md 갱신"
- Tests Run + Result: Not run (문서 작업 시작 전)
- Open Risks: README 내용은 PROJECT_GUIDE 및 현재 코드 구조 기준으로 정리되며 미완료 기능은 상태 표기가 필요
- Blockers: None
- Next 3 Actions: 1) 실제 구조 기준 README 섹션 초안 작성, 2) README.md 반영 후 문구/명령 정합성 검토, 3) 작업 완료 스냅샷으로 AGENTS.md 갱신
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-03-04 17:44:34 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): GitHub Actions CD-Staging 실패 원인(이미지 태그 대문자) 수정 및 체크포인트 기록
- Scope (In/Out): In: .github/workflows/{cd-staging,cd-prod}.yml, deploy.sh, AGENTS.md / Out: CI 테스트 로직 변경, STAGING 서버 시크릿 등록
- Current Status: in progress
- Percent Complete: 95%
- Files Changed:  M .github/workflows/cd-prod.yml,  M .github/workflows/cd-staging.yml,  M deploy.sh,  M AGENTS.md, ?? .ref-v0-movie-community-service/, ?? .sisyphus/, ?? nul
- Commands Run: git status --short, git branch --show-current, grep(워크플로 IMAGE_NAME 사용처), read(.github/workflows/*.yml, deploy.sh), bash -n deploy.sh, git diff -- .github/workflows/cd-staging.yml .github/workflows/cd-prod.yml deploy.sh
- Tests Run + Result: bash -n deploy.sh 성공; YAML/Bash LSP 미설치로 lsp_diagnostics 미실행
- Open Risks: GitHub Secrets(STAGING_HOST/STAGING_USER/STAGING_SSH_KEY) 미설정 시 CD-Staging deploy job 실패 지속 가능
- Blockers: None
- Next 3 Actions: 1) workflow/deploy.sh 수정사항 커밋 및 push, 2) main push 후 Actions에서 CD-Staging build-and-push 재검증, 3) 필요 시 CD-Staging을 workflow_dispatch 전용으로 분리 검토
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-03-04 13:54:36 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): Kakao OAuth 로그인 후 로그인 상태 동기화 이슈 수정 및 핸드오프 준비
- Scope (In/Out): In: src/main/java/com/example/auth/security/{JwtAuthenticationFilter,OAuth2AuthenticationSuccessHandler}.java, frontend-next/src/providers/user-provider.tsx, AGENTS.md / Out: 네이버 OAuth 연동, 관리자 provider 필터 API 신규 구현
- Current Status: in progress
- Percent Complete: 90%
- Files Changed:  M AGENTS.md,  M docker-compose.yml,  M frontend-next/src/app/(protected)/settings/page.tsx,  M frontend-next/src/app/(public)/forgot-password/page.tsx,  M frontend-next/src/app/(public)/login/page.tsx,  M frontend-next/src/app/(public)/register/page.tsx,  M frontend-next/src/app/(public)/reset-password/page.tsx,  M frontend-next/src/app/(public)/unlock-account/page.tsx,  M frontend-next/src/app/(public)/verify-email/page.tsx,  M frontend-next/src/providers/user-provider.tsx,  M frontend-next/src/types/index.ts,  M src/main/java/com/example/auth/config/SecurityConfig.java,  M src/main/java/com/example/auth/dto/UserResponse.java,  M src/main/java/com/example/auth/dto/profile/ProfileResponse.java,  M src/main/java/com/example/auth/entity/User.java,  M src/main/java/com/example/auth/security/CustomOAuth2UserService.java,  M src/main/java/com/example/auth/security/JwtAuthenticationFilter.java,  M src/main/java/com/example/auth/security/OAuth2AuthenticationSuccessHandler.java,  M src/main/java/com/example/auth/security/OAuthAttributes.java,  M src/main/java/com/example/auth/service/AuthService.java,  M src/main/java/com/example/auth/service/UserService.java,  M src/main/resources/application.yml, ?? .ref-v0-movie-community-service/, ?? src/main/java/com/example/auth/entity/AuthProvider.java, ?? src/main/java/com/example/auth/security/OAuth2AuthenticationFailureHandler.java, ?? src/test/
- Commands Run: git branch --show-current, git status --short, & "$PSScriptRoot\agent-checkpoint.ps1" @args
- Tests Run + Result: docker compose build backend 성공; frontend-next npm run build 성공; docker compose up -d --build backend frontend 성공
- Open Risks: 브라우저 쿠키/세션 잔여 상태에 따라 재현 편차 가능, 실제 브라우저 재로그인 E2E 최종 확인 필요
- Blockers: None
- Next 3 Actions: 1) 브라우저에서 카카오 로그인 재시도 후 /api/users/me 200 및 UI 로그인 상태 일치 확인, 2) 실패 시 Network에서 /oauth2/redirect, /api/users/me 응답 코드/헤더 확인, 3) 필요 시 UserController @AuthenticationPrincipal null-safe 처리 추가
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-03-04 13:37:48 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): Provider 기반 로그인/비밀번호 정책 분기 및 설정 UI 반영
- Scope (In/Out): In: src/main/java/com/example/auth/{service,dto/profile,entity}/**, frontend-next/src/app/(protected)/settings/page.tsx, frontend-next/src/types/index.ts / Out: 네이버 OAuth 신규 연동, 관리자 전용 사용자 필터 API 추가
- Current Status: done
- Percent Complete: 100%
- Files Changed:  M AGENTS.md,  M docker-compose.yml,  M frontend-next/src/app/(protected)/settings/page.tsx,  M frontend-next/src/app/(public)/forgot-password/page.tsx,  M frontend-next/src/app/(public)/login/page.tsx,  M frontend-next/src/app/(public)/register/page.tsx,  M frontend-next/src/app/(public)/reset-password/page.tsx,  M frontend-next/src/app/(public)/unlock-account/page.tsx,  M frontend-next/src/app/(public)/verify-email/page.tsx,  M frontend-next/src/types/index.ts,  M src/main/java/com/example/auth/config/SecurityConfig.java,  M src/main/java/com/example/auth/dto/UserResponse.java,  M src/main/java/com/example/auth/dto/profile/ProfileResponse.java,  M src/main/java/com/example/auth/entity/User.java,  M src/main/java/com/example/auth/security/CustomOAuth2UserService.java,  M src/main/java/com/example/auth/security/OAuthAttributes.java,  M src/main/java/com/example/auth/service/AuthService.java,  M src/main/java/com/example/auth/service/UserService.java,  M src/main/resources/application.yml, ?? .ref-v0-movie-community-service/, ?? src/main/java/com/example/auth/entity/AuthProvider.java, ?? src/main/java/com/example/auth/security/OAuth2AuthenticationFailureHandler.java, ?? src/test/
- Commands Run: git branch --show-current, git status --short, & "$PSScriptRoot\agent-checkpoint.ps1" @args
- Tests Run + Result: docker compose build backend 성공; frontend-next npm run build 성공(기존 lint warning만 존재)
- Open Risks: 기존 소셜 계정이 LOCAL로 남아있으면 정책 분기 체감이 제한될 수 있어 로그인 후 provider 재동기화 필요
- Blockers: None
- Next 3 Actions: 1) 카카오 로그인 재시도 후 users.provider/provider_user_id 값 반영 확인, 2) 설정 페이지에서 소셜 계정 비밀번호 카드 안내 문구 UX 미세 조정, 3) 필요 시 관리자용 users provider 필터 API 설계
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-03-04 11:31:39 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): 카카오 OAuth 로그인 연동 및 이메일 필수 동의 처리
- Scope (In/Out): In: src/main/resources/application.yml, src/main/java/com/example/auth/security/**, src/main/java/com/example/auth/config/SecurityConfig.java, frontend-next/src/app/(public)/login/page.tsx, docker-compose.yml / Out: 네이버 OAuth 구현, 백엔드 도메인 로직 대규모 개편
- Current Status: done
- Percent Complete: 100%
- Files Changed:  M docker-compose.yml,  M frontend-next/src/app/(public)/forgot-password/page.tsx,  M frontend-next/src/app/(public)/login/page.tsx,  M frontend-next/src/app/(public)/register/page.tsx,  M frontend-next/src/app/(public)/reset-password/page.tsx,  M frontend-next/src/app/(public)/unlock-account/page.tsx,  M frontend-next/src/app/(public)/verify-email/page.tsx,  M src/main/java/com/example/auth/config/SecurityConfig.java,  M src/main/java/com/example/auth/security/CustomOAuth2UserService.java,  M src/main/java/com/example/auth/security/OAuthAttributes.java,  M src/main/resources/application.yml, ?? .ref-v0-movie-community-service/, ?? src/main/java/com/example/auth/security/OAuth2AuthenticationFailureHandler.java, ?? src/test/
- Commands Run: git branch --show-current, git status --short, & "$PSScriptRoot\agent-checkpoint.ps1" @args
- Tests Run + Result: docker compose build backend 성공; frontend-next npm run build 성공(기존 lint warning만 존재)
- Open Risks: KAKAO_CLIENT_AUTH_METHOD 설정이 콘솔의 Client Secret 사용 여부와 불일치하면 OAuth 교환 실패 가능
- Blockers: None
- Next 3 Actions: 1) 카카오 실제 브라우저 로그인 E2E 검증 및 동의 거부 시나리오 확인, 2) 네이버 OAuth registration/provider 및 attribute 매핑 추가, 3) OAuth provider 확장 내용을 PROJECT_GUIDE.md와 동기화
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-02-27 17:58:17 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): 홈 히어로 개선 및 상세/검색 UI 톤 통일 작업을 문서 기준으로 동기화
- Scope (In/Out): In: frontend-next/src/app/(public)/{home,movies/[movieId],tv/[tvId],people/[personId],search}/page.tsx, AGENTS.md, PROJECT_GUIDE.md / Out: Spring 백엔드 비즈니스 로직 변경 없음
- Current Status: done
- Percent Complete: 100%
- Files Changed:
  - frontend-next/src/app/(public)/home/page.tsx
  - frontend-next/src/app/(public)/movies/[movieId]/page.tsx
  - frontend-next/src/app/(public)/tv/[tvId]/page.tsx
  - frontend-next/src/app/(public)/people/[personId]/page.tsx
  - frontend-next/src/app/(public)/search/page.tsx
  - AGENTS.md
  - PROJECT_GUIDE.md
- Commands Run: git branch --show-current; git status --short; git log --oneline -5; Get-Content -LiteralPath AGENTS.md, PROJECT_GUIDE.md -Raw -Encoding UTF8; git show --name-only/--stat d1e8668 3acd648; Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"; git add/commit/push
- Tests Run + Result: Not run (코드 테스트 미수행, 커밋/푸시 및 문서 동기화만 수행)
- Open Risks: `.ref-v0-movie-community-service/`, `src/test/` untracked 항목 정책은 미확정 상태
- Blockers: None
- Next 3 Actions:
  1) 홈 히어로/캐러셀 모바일 브레이크포인트 미세 튜닝
  2) 통합검색 결과 랭킹 가중치(정확도/인기도/타입) 정책 확정
  3) Favorites 목록 전용 페이지(`/favorites`)와 필터 UX 확장
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-02-24 17:47:57 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): 로그인 사용자 Favorites MVP(영화/TV/인물) 및 대시보드 연동 반영
- Scope (In/Out): In: src/main/java/com/example/auth/{entity,repository,service,controller,dto/favorite}/**, frontend-next/src/{components/favorite,queries/favorites.ts,services/api.ts,types/index.ts,app/(public)/**/[id]/page.tsx,app/(protected)/dashboard/page.tsx}, AGENTS.md, PROJECT_GUIDE.md / Out: 기존 워크스페이스/채팅 비즈니스 로직 변경 없음
- Current Status: done
- Percent Complete: 100%
- Files Changed:
  - src/main/java/com/example/auth/entity/Favorite.java
  - src/main/java/com/example/auth/entity/FavoriteType.java
  - src/main/java/com/example/auth/repository/FavoriteRepository.java
  - src/main/java/com/example/auth/service/FavoriteService.java
  - src/main/java/com/example/auth/controller/FavoriteController.java
  - src/main/java/com/example/auth/dto/favorite/FavoriteRequest.java
  - src/main/java/com/example/auth/dto/favorite/FavoriteResponse.java
  - frontend-next/src/components/favorite/favorite-toggle-button.tsx
  - frontend-next/src/queries/favorites.ts
  - frontend-next/src/services/api.ts
  - frontend-next/src/types/index.ts
  - frontend-next/src/app/(public)/movies/[movieId]/page.tsx
  - frontend-next/src/app/(public)/tv/[tvId]/page.tsx
  - frontend-next/src/app/(public)/people/[personId]/page.tsx
  - frontend-next/src/app/(protected)/dashboard/page.tsx
  - frontend-next/src/app/(public)/home/page.tsx
  - frontend-next/src/lib/tmdb.ts
  - frontend-next/src/app/api/people/trending/route.ts
  - frontend-next/src/app/api/tv/trending/route.ts
  - AGENTS.md
  - PROJECT_GUIDE.md
- Commands Run: Get-Content -Path AGENTS.md, PROJECT_GUIDE.md -Encoding UTF8; git status --short; rg -n "favorite|Favorite|wishlist|bookmark|like" src/main/java frontend-next/src; docker-compose up -d --build backend frontend; docker-compose ps; git add/commit/push
- Tests Run + Result: Not run (도커 재빌드/재배포 및 수동 배포 확인만 수행)
- Open Risks: Favorites 토글 동시 요청(연타) 시 최종 상태만 보장; 상세한 중복 방지 UX는 후속 개선 필요
- Blockers: None
- Next 3 Actions:
  1) 즐겨찾기 목록 전용 페이지(`/favorites`) 추가 및 타입 필터 UX 보강
  2) 즐겨찾기 API에 페이지네이션/정렬 옵션 추가
  3) Favorites 서비스 단위 테스트 및 API 통합 테스트 추가
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-02-20 17:45:30 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): 홈 캐러셀 드래그 UX 및 장르 탐색(복수 선택/AND/24개 페이지) 기능 반영
- Scope (In/Out): In: frontend-next/src/app/(public)/home/page.tsx, frontend-next/src/app/(public)/genres/[genreId]/page.tsx, frontend-next/src/app/api/movies/genre/[genreId]/route.ts, frontend-next/src/lib/tmdb.ts, AGENTS.md, PROJECT_GUIDE.md / Out: Spring 백엔드 로직 변경 없음
- Current Status: done
- Percent Complete: 100%
- Files Changed:
  - frontend-next/src/app/(public)/home/page.tsx
  - frontend-next/src/app/(public)/genres/[genreId]/page.tsx
  - frontend-next/src/app/api/movies/genre/[genreId]/route.ts
  - frontend-next/src/lib/tmdb.ts
  - AGENTS.md
  - PROJECT_GUIDE.md
- Commands Run: Get-Content -Path AGENTS.md, PROJECT_GUIDE.md -Encoding UTF8; git status --short; rg -n "fetchMoviesByGenre\(|fetchMoviesByGenres\(" frontend-next/src; docker-compose up -d --no-deps --build frontend; docker-compose logs --tail=120 frontend
- Tests Run + Result: Not run (수동 기능 확인 + Docker 빌드/배포 확인만 수행)
- Open Risks: drag/pointer 튜닝 값은 사용자 체감에 따라 추가 조정 가능
- Blockers: None
- Next 3 Actions:
  1) 통합 검색 결과 정렬 가중치(정확도/인기도) 정책 확정
  2) 장르 필터를 검색 페이지와 연결할지 UX 결정
  3) TMDB 이미지 `<img>` 경고를 `next/image`로 정리할지 결정
- Resume Command: git status --short && git branch --show-current

## Handoff Snapshot
- Timestamp (KST): 2026-02-19 17:50:27 +09:00
- Agent Name: Codex
- Branch: main
- Goal (1 line): TMDB 확장 진행사항 문서 업데이트 및 히스토리 동기화
- Scope (In/Out): In: AGENTS.md, PROJECT_GUIDE.md / Out: 앱 로직 변경 없음
- Current Status: done
- Percent Complete: 100%
- Files Changed: AGENTS.md, PROJECT_GUIDE.md
- Commands Run: Get-Content -Path AGENTS.md, PROJECT_GUIDE.md -Encoding UTF8; git status --short; git branch --show-current; Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
- Tests Run + Result: Not run (문서 작업)
- Open Risks: Untracked 항목(.ref-v0-movie-community-service/, src/test/) 처리 정책 미확정
- Blockers: None
- Next 3 Actions:
  1) 통합 검색 랭킹 기준(인물/영화/TV 가중치) 확정
  2) 상세 페이지 데이터 fallback(ko→en) 정책을 검색 결과에도 동일 적용할지 결정
  3) Phase 6 테스트 범위(최소 smoke/E2E) 우선순위 재정의
- Resume Command: git status --short && git branch --show-current

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


