# --- Build stage ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

# --- Run stage ---
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=10000
# (optionnel mais utile) Limiter la mémoire si plan gratuit:
ENV JAVA_TOOL_OPTIONS="-Xms256m -Xmx512m"
CMD ["sh","-c","java -Dserver.port=${PORT} -jar app.jar"]
