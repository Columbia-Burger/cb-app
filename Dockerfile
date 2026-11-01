# Una sola imagen: Angular compilado dentro de Spring Boot.

# ── 1. Frontend ────────────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx ng build --configuration production

# ── 2. Backend (con el frontend en classpath:/static) ──────────
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
COPY --from=frontend /web/dist/columbia-burger/browser/ ./src/main/resources/static/
RUN mvn -q -B -DskipTests package

# ── 3. Imagen final ────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
# Railway inyecta PORT; JAVA_TOOL_OPTIONS (memoria) lo lee la JVM automáticamente
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
