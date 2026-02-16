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
COPY --from=backend-build /app/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
