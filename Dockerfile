# Build stage
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Gradle Wrapper 복사
COPY gradlew ./
COPY gradle ./gradle
RUN chmod +x gradlew

# Gradle 파일 복사
COPY build.gradle settings.gradle gradle.properties ./

# 의존성 다운로드 (캐싱 활용)
RUN ./gradlew dependencies --no-daemon || true

# 소스 복사 및 빌드
COPY src ./src
RUN ./gradlew clean build -x test --no-daemon

# Production stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 빌드된 JAR 복사
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
