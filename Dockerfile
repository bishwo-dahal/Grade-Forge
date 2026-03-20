# Stage 1: Build React frontend
FROM node:24-bullseye-slim AS frontend-build
WORKDIR /app/frontend
# Only copy package.json and package-lock.json
COPY Client/package.json Client/package-lock.json ./
# Use BuildKit cache for npm downloads to speed rebuilds in CI.
RUN --mount=type=cache,target=/root/.npm npm ci
# Copy the rest of the client code
COPY Client/ ./
RUN npm run build

# Stage 2: Build Spring Boot backend
FROM maven:3.9.12-eclipse-temurin-21 AS backend-build
WORKDIR /app/backend
COPY Server/pom.xml .
# Cache Maven dependencies separately from source changes.
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests dependency:go-offline
COPY Server/src ./src
# Copy frontend build into backend
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests clean package

# Stage 3: Final runtime image
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Install Docker CLI inside the container so RunTestsSyncService can call `docker`
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      docker.io \
      python3 \
      python3-venv \
      python3-pip && \
    rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /app/backend/target/*.jar app.jar

# Copy grader pipeline into the runtime image and install Python deps.
# Backend uses GRADER_DIR to locate this directory.
COPY grader/ /app/grader/
RUN python3 -m venv /opt/grader-venv && \
    /opt/grader-venv/bin/pip install --no-cache-dir -r /app/grader/requirements.txt

ENV GRADER_DIR=/app/grader
ENV GRADER_PYTHON_CMD=/opt/grader-venv/bin/python

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
