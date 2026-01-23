# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY Client/ .
RUN npm install && npm run build

# Stage 2: Build Spring Boot backend
FROM eclipse-temurin:21-jdk AS backend-build
WORKDIR /app/backend
COPY Server/pom.xml .
COPY Server/src ./src
# Copy frontend build into backend
COPY --from=frontend-build /app/frontend/build ./src/main/resources/static
RUN mvn clean package -DskipTests

# Stage 3: Final runtime image
FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
