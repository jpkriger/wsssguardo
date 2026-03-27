FROM maven:3.9.11-eclipse-temurin-25 AS dev
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
EXPOSE 8080 5005
CMD ["mvn", "-DskipTests", "-Dmaven.test.skip=true", "-Dspring-boot.run.useTestClasspath=false", "spring-boot:run", "-Dspring-boot.run.jvmArguments=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"]

FROM maven:3.9.11-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
