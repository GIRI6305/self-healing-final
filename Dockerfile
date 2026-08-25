FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY backend/pom.xml backend/pom.xml
RUN mvn -q -f backend/pom.xml dependency:go-offline
COPY backend/src backend/src
RUN mvn -q -f backend/pom.xml -DskipTests package
FROM eclipse-temurin:21.0.8_9-jre-alpine
RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=build /workspace/backend/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
