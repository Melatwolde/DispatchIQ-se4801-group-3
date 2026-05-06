FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy Gradle wrapper and config files
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY gradle/libs.versions.toml gradle/

# Copy source code
COPY apps/backend apps/backend

# Build the jar 
RUN ./gradlew :apps:backend:bootJar --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built jar (note the path)
COPY --from=build /app/apps/backend/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]