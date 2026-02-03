# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spring Boot JWT authentication backend system. Starting with H2 in-memory database for development, planned migration to PostgreSQL for production.

## Technology Stack

- Java 17+
- Spring Boot 3.x / Spring Security 6.x
- Spring Data JPA
- H2 Database (dev) / PostgreSQL (prod)
- JWT via jjwt library
- Gradle build system
- Lombok

## Build & Run Commands

```bash
# Build the project
./gradlew build

# Run the application
./gradlew bootRun

# Run tests
./gradlew test

# Run a specific test class
./gradlew test --tests "ClassName"

# Run a specific test method
./gradlew test --tests "ClassName.methodName"

# Clean build
./gradlew clean build
```

## Project Structure

```
src/main/java/com/example/auth/
├── AuthApplication.java              # Main entry point
├── config/
│   ├── SecurityConfig.java           # Spring Security configuration
│   └── JwtConfig.java                # JWT configuration properties
├── controller/
│   └── AuthController.java           # REST API endpoints
├── dto/
│   ├── LoginRequest.java
│   ├── RegisterRequest.java
│   └── AuthResponse.java
├── entity/
│   └── User.java                     # JPA entity (id, email, password, name, role)
├── repository/
│   └── UserRepository.java           # Spring Data JPA repository
├── service/
│   ├── AuthService.java              # Authentication business logic
│   └── JwtService.java               # JWT token generation/validation
├── security/
│   ├── JwtAuthenticationFilter.java  # JWT filter for request processing
│   └── CustomUserDetailsService.java # Spring Security UserDetailsService
└── exception/
    ├── GlobalExceptionHandler.java   # Centralized @ControllerAdvice
    └── CustomException.java
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | User registration |
| `/api/auth/login` | POST | No | Login, returns JWT tokens |
| `/api/auth/refresh` | POST | No | Refresh access token |
| `/api/users/me` | GET | Yes | Get authenticated user info |

## Security Configuration

- Public paths: `/api/auth/**`, `/h2-console/**` (dev only)
- All other paths require JWT authentication
- CSRF disabled (REST API)
- Stateless session management
- Passwords stored with BCrypt encoding

## JWT Token Flow

1. Login returns Access Token (1 hour) + Refresh Token (7 days)
2. Client sends `Authorization: Bearer {token}` header
3. `JwtAuthenticationFilter` validates token on each request
4. Valid tokens populate `SecurityContext` with authentication
5. Expired access tokens can be renewed via refresh endpoint

## Configuration Files

- `application.yml`: Development config with H2, jwt secret, token expiration
- `application-prod.yml`: Production config with PostgreSQL, environment variables for secrets

## Implementation Order (for new development)

1. Project setup (build.gradle, application.yml)
2. User entity and repository
3. JwtService (token generation/validation)
4. SecurityConfig and JwtAuthenticationFilter
5. AuthService (registration, login logic)
6. AuthController (REST endpoints)
7. GlobalExceptionHandler
8. Test cases
