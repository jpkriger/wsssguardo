FROM maven:3.9.11-eclipse-temurin-25 AS dev
WORKDIR /workspace
ENV PUPPETEER_CACHE_DIR=/workspace/report-renderer/.cache/puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN apt-get update && apt-get install -y --no-install-recommends \
		ca-certificates \
		fonts-liberation \
		libasound2t64 \
		libatk-bridge2.0-0 \
		libatk1.0-0 \
		libcairo2 \
		libcups2 \
		libdbus-1-3 \
		libdrm2 \
		libgbm1 \
		libglib2.0-0 \
		libgtk-3-0 \
		libnss3 \
		libnspr4 \
		libpango-1.0-0 \
		libx11-6 \
		libx11-xcb1 \
		libxcomposite1 \
		libxdamage1 \
		libxext6 \
		libxfixes3 \
		libxkbcommon0 \
		libxrandr2 \
		libxrender1 \
		libxcb1 \
		libxcursor1 \
		libxi6 \
		libxtst6 \
		nodejs \
		npm \
	&& rm -rf /var/lib/apt/lists/*
COPY pom.xml .
COPY src ./src
COPY report-renderer ./report-renderer
RUN cd report-renderer && npm install --no-fund --no-audit && npm run build && npx puppeteer@24 browsers install chrome-headless-shell@latest --cache-dir=.cache/puppeteer || true
EXPOSE 8080 5005
CMD ["mvn", "-DskipTests", "-Dmaven.test.skip=true", "-Dspring-boot.run.useTestClasspath=false", "spring-boot:run", "-Dspring-boot.run.jvmArguments=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"]

FROM maven:3.9.11-eclipse-temurin-25 AS build
WORKDIR /app
ENV PUPPETEER_CACHE_DIR=/app/report-renderer/.cache/puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN apt-get update && apt-get install -y --no-install-recommends \
		ca-certificates \
		fonts-liberation \
		libasound2t64 \
		libatk-bridge2.0-0 \
		libatk1.0-0 \
		libcairo2 \
		libcups2 \
		libdbus-1-3 \
		libdrm2 \
		libgbm1 \
		libglib2.0-0 \
		libgtk-3-0 \
		libnss3 \
		libnspr4 \
		libpango-1.0-0 \
		libx11-6 \
		libx11-xcb1 \
		libxcomposite1 \
		libxdamage1 \
		libxext6 \
		libxfixes3 \
		libxkbcommon0 \
		libxrandr2 \
		libxrender1 \
		libxcb1 \
		libxcursor1 \
		libxi6 \
		libxtst6 \
		nodejs \
		npm \
	&& rm -rf /var/lib/apt/lists/*
COPY pom.xml ./
COPY src ./src
COPY report-renderer ./report-renderer
RUN cd report-renderer && npm install --no-fund --no-audit && npm run build && npx puppeteer@24 browsers install chrome-headless-shell@latest --cache-dir=.cache/puppeteer || true
RUN mvn -B -DskipTests package

FROM eclipse-temurin:25-jre
WORKDIR /app
ENV PUPPETEER_CACHE_DIR=/app/report-renderer/.cache/puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
		ca-certificates \
		fonts-liberation \
		libasound2t64 \
		libatk-bridge2.0-0 \
		libatk1.0-0 \
		libcairo2 \
		libcups2 \
		libdbus-1-3 \
		libdrm2 \
		libgbm1 \
		libglib2.0-0 \
		libgtk-3-0 \
		libnss3 \
		libnspr4 \
		libpango-1.0-0 \
		libx11-6 \
		libx11-xcb1 \
		libxcomposite1 \
		libxdamage1 \
		libxext6 \
		libxfixes3 \
		libxkbcommon0 \
		libxrandr2 \
		libxrender1 \
		libxcb1 \
		libxcursor1 \
		libxi6 \
		libxtst6 \
		nodejs \
		npm \
	&& rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/*.jar app.jar
COPY --from=build /app/report-renderer ./report-renderer
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
