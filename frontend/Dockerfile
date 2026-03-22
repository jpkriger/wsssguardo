FROM node:20-alpine AS dev
WORKDIR /app

RUN apk add --no-cache bash curl unzip \
	&& curl -fsSL https://bun.sh/install | bash \
	&& ln -s /root/.bun/bin/bun /usr/local/bin/bun

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY . .
EXPOSE 5173
CMD ["bun", "run", "dev", "--host", "0.0.0.0", "--port", "5173"]

FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
