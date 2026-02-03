# Auth Project

Spring Boot + React JWT 인증 시스템

## 기술 스택

### Backend
- Java 17
- Spring Boot 3.x
- Spring Security 6.x
- Spring Data JPA
- PostgreSQL
- JWT (jjwt)

### Frontend
- React 18
- React Router
- Axios

## 프로젝트 구조

```
├── src/                    # Spring Boot Backend
├── frontend/               # React Frontend
├── docker-compose.yml      # Docker 오케스트레이션
├── Dockerfile              # Backend Docker 설정
└── build.gradle            # Gradle 빌드 설정
```

## 실행 방법

### 로컬 실행

```bash
# Backend
./gradlew bootRun

# Frontend
cd frontend
npm install
npm start
```

### Docker Compose

```bash
docker-compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/refresh | 토큰 갱신 |
| GET | /api/users/me | 내 정보 조회 |

## 접속 URL

- Frontend: http://localhost:3000
- Backend API: http://localhost:8081
- H2 Console: http://localhost:8081/h2-console (개발용)
