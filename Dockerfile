# Stage 1: Build React frontend
FROM node:24-bullseye-slim AS frontend-build
WORKDIR /app/frontend
# Only copy package.json and package-lock.json
COPY Client/package.json Client/package-lock.json ./
RUN npm ci
# Copy the rest of the client code
COPY Client/ ./
RUN npm run build

# Stage 2: Build Spring Boot backend
FROM maven:3.9.12-eclipse-temurin-21 AS backend-build
WORKDIR /app/backend
COPY Server/pom.xml .
COPY Server/src ./src
# Copy frontend build into backend
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static
RUN mvn clean package -DskipTests

# Stage 3: Final runtime image
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Install Docker CLI inside the container so RunTestsSyncService can call `docker`
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      lsb-release && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      docker-ce \
      docker-ce-cli \
      containerd.io \
      docker-buildx-plugin \
      docker-compose-plugin && \
    rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /app/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
