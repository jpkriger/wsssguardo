# WssSguardo

Monorepo com backend Spring Boot, frontend React e infraestrutura Terraform.

## Fluxo oficial de desenvolvimento

O fluxo oficial é **Docker-first** com VS Code **F5**.

Você não precisa instalar Java, Maven ou Bun no host para desenvolver.

### Pré-requisitos

- Docker + Docker Compose
- VS Code com extensões Java e JavaScript debugging

## Executar com F5 (recomendado)

1. Abra o workspace no VS Code.
2. Vá em Run and Debug.
3. Selecione **Debug Front + Back**.
4. Pressione **F5**.

Isso executa a task `Compose Dev Up`, sobe os serviços Docker de desenvolvimento e conecta o debugger Java no backend.

Arquivos relevantes:

- [.vscode/launch.json](.vscode/launch.json)
- [.vscode/tasks.json](.vscode/tasks.json)
- [docker-compose.yml](docker-compose.yml)

## Perfis Docker

O compose possui dois perfis:

- **dev**: `db`, `backend-dev`, `frontend-dev` (usado no F5)
- **prod**: `db`, `backend`, `frontend`

### Portas no perfil dev

- Frontend dev server: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- Backend debugger (attach): `localhost:5005`
- PostgreSQL: `localhost:5432`

> No Docker dev, o banco é **PostgreSQL** (não H2).

## Comandos úteis

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

## Lint e build do frontend

No frontend, `build` roda lint antes de compilar:

- [frontend/package.json](frontend/package.json)

```json
"build": "eslint . && tsc -b && vite build"
```

No perfil **dev**, o container do frontend também executa lint antes de iniciar o Vite.

## Estrutura

```text
.
├── backend/
├── frontend/
├── infra/
├── .vscode/
└── docker-compose.yml
```
