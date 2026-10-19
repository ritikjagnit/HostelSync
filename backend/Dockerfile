# Multi-stage build for HostelSync Spring Boot Backend
# Stage 1: Build the JAR with Eclipse Temurin Java 21
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Copy maven wrapper and dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

# Copy source and package
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Lightweight runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Security: run as non-root user
RUN addgroup -S hostelsync && adduser -S hostelsync -G hostelsync
USER hostelsync

# Copy JAR from builder
COPY --from=builder /workspace/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
