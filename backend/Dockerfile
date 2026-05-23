# Stage 1: Build the JAR using Gradle
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Install bash and dos2unix for handling Windows line endings if necessary
RUN apk add --no-cache bash dos2unix

COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Fix line endings and make gradlew executable
RUN dos2unix gradlew && chmod +x gradlew

# Download dependencies first to cache this layer
RUN ./gradlew dependencies --no-daemon || true

COPY src src
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a physical uploads folder inside the container
RUN mkdir -p /app/uploads

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
