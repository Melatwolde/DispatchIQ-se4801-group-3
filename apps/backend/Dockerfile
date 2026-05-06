FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy Maven wrapper and config
COPY .mvn .mvn
COPY mvnw .
COPY pom.xml .

# Copy backend source
COPY apps/backend/pom.xml apps/backend/
COPY apps/backend/src apps/backend/src

# Give permission and build
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests --no-transfer-progress

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built jar from Maven target
COPY --from=build /app/apps/backend/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]