# Frontend

Aplicação React + TypeScript + Vite.

## Fluxo oficial (Docker-first)

O frontend de desenvolvimento roda no serviço `frontend-dev` do compose (perfil `dev`) e é iniciado no F5 junto com backend e banco.

- URL: `http://localhost:5173`
- Proxy `/api`: `http://backend-dev:8080`

Referências:

- [../docker-compose.yml](../docker-compose.yml)
- [vite.config.ts](vite.config.ts)
- [Dockerfile](Dockerfile)

## Lint no fluxo Docker

No container de dev, o comando de startup executa:

1. `bun run lint`
2. `bun run dev --host 0.0.0.0 --port 5173`

Se houver erro de lint, o frontend-dev não sobe.

## Build

`build` também é bloqueado por lint:

```json
"build": "eslint . && tsc -b && vite build"
```

## Qualidade

```bash
bun run lint
bun run test
bun run build
```

## Estrutura

```text
src/
  api/
  App.tsx
  main.tsx
```
