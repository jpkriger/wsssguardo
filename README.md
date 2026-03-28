# WssSguardo

Monorepo com backend Spring Boot, frontend React (Vite + Bun) e infraestrutura Terraform.

**Resumo rápido**: O fluxo oficial é "Docker-first": o `Compose Dev Up` inicia `db`, `backend-dev` e `frontend-dev` em containers. Use o atalho VS Code **F5** (compound `Debug Front + Back`) para subir tudo e anexar o debugger Java.

## Requisitos para rodar o projeto

- **Docker & Docker Compose** (Docker Desktop ou engine compatível)
- **Visual Studio Code** >= 1.113 (recomendado para Quick Start / F5)
- VS Code extensions: **Container Tools**, **Extension Pack for Java**, **Debugger for Java**
- **Java 25** is required for local builds (the project and Dockerfiles use Eclipse Temurin 25)

Observação: com o fluxo Docker-first você não precisa instalar Java, Maven ou Bun no host para desenvolvimento; eles são providos pelos containers.

Arquivos de referência:

- [.vscode/launch.json](.vscode/launch.json)
- [.vscode/tasks.json](.vscode/tasks.json)
- [docker-compose.yml](docker-compose.yml)

## Executar (recomendado: VS Code F5)

1. Abra o workspace no VS Code.
2. Vá em Run and Debug.
3. Selecione **Debug Front + Back** (compound que executa a task `Compose Dev Up`).
4. Pressione **F5**.

O fluxo F5 executa a task `Compose Dev Up` (veja [`.vscode/tasks.json`](.vscode/tasks.json)) que chama `docker compose --profile dev up -d --wait --build db backend-dev frontend-dev`. O backend fica disponível em `http://localhost:8080` e o frontend em `http://localhost:5173`.

### Portas importantes (perfil `dev`)

- Frontend dev server: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html (springdoc)
- Backend debugger (attach): localhost:5005
- PostgreSQL: localhost:5432

## Comandos manuais úteis

Subir ambiente dev manualmente:

```bash
docker compose --profile dev up -d --build
```

Derrubar ambiente dev:

```bash
docker compose --profile dev down --remove-orphans
```

Subir ambiente prod local:

```bash
docker compose --profile prod up -d --build
```

Reiniciar apenas o backend (dev):

```bash
docker compose --profile dev up -d --wait --build backend-dev
```

## Notas por componente

- Backend: a imagem de desenvolvimento usa `maven:3.9.11-eclipse-temurin-25` e expõe a porta de depuração `5005` (veja [backend/Dockerfile](backend/Dockerfile)). O `pom.xml` define `<java.version>25</java.version>`.
- Backend profile `dev` dentro do container usa PostgreSQL quando executado via Docker (variáveis são passadas pelo compose). Se executar o backend localmente fora do Docker com o profile `dev`, o projeto pode usar H2 conforme [backend/src/main/resources/application-dev.properties](backend/src/main/resources/application-dev.properties).
- Frontend: o fluxo dev usa Bun dentro do container (`bun` é instalado no Dockerfile) e executa lint antes de iniciar o servidor Vite. Veja [frontend/Dockerfile](frontend/Dockerfile) e [frontend/package.json](frontend/package.json).

## Lint / Build

- Frontend build (bloqueado por lint): conforme [frontend/package.json](frontend/package.json)

```json
"build": "eslint . && tsc -b && vite build"
```

- Backend build e testes:

```bash
./mvnw clean verify
```

## Estrutura resumida

```text
.
├── backend/        # Spring Boot API (Java 25, Maven)
├── frontend/       # React + Vite + Bun
├── infra/          # Terraform
├── .vscode/        # VS Code debug / tasks
└── docker-compose.yml
```
