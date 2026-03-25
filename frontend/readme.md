# Frontend

Aplicação React + TypeScript + Vite com Bun.

## Requisitos

- Bun >= 1.1

## Rodando localmente

```bash
bun install
bun run dev
```

Dev server: `http://localhost:5173`.

Chamadas para `/api/*` são proxied para `http://localhost:8080`.

## Qualidade obrigatória

```bash
bun run lint
bun run test
bun run build
```

## Estrutura

```text
src/
  api/            # Wrappers tipados para endpoints do backend
  App.tsx         # Exemplo de fluxo ponta-a-ponta
  main.tsx        # Entry point
```

## Regras da baseline

1. Toda chamada HTTP deve ficar em `src/api/*`.
2. Componentes de UI não fazem `fetch` direto.
3. Fluxos devem tratar estados: loading, error, empty e success.
4. Mudanças em contrato backend exigem atualização de tipos e testes.
5. Toda feature deve passar em lint, test e build no CI.

## Como adicionar uma nova feature

1. Criar módulo em `src/api/<resource>.ts` com tipos de request/response.
2. Criar teste do módulo API em `src/api/<resource>.test.ts`.
3. Criar/ajustar componente de UI com tratamento de estados.
4. Garantir compatibilidade com os contratos da API backend.
