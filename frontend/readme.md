# Frontend

React + Vite application using [Bun](https://bun.sh) as the runtime and package manager.

## Requirements

- [Bun](https://bun.sh) >= 1.1

## Getting started

```bash
# Install dependencies
bun install

# Start dev server (proxies /api → http://localhost:8080)
bun run dev

# Type-check + build for production
bun run build

# Preview production build locally
bun run preview
```

The dev server runs at `http://localhost:5173`.
API calls to `/api/*` are proxied to the backend at `http://localhost:8080`.

## Structure

```
src/
  api/          # Typed fetch wrappers for each backend resource
  App.tsx       # Root component with EntityObject sample
  main.tsx      # Entry point
```

## Adding a new page / resource

1. Add a typed fetch wrapper in `src/api/<resource>.ts` mirroring the backend DTO.
2. Create your component/page in `src/`.
3. Wire up routing if needed (add `react-router-dom` via `bun add react-router-dom`).
