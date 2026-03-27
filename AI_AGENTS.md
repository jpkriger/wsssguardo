# AI_AGENTS

Guia obrigatório para agentes de IA que contribuírem no repositório.

## Objetivo

Manter o projeto seguro, robusto e compreensível para times com níveis diferentes de experiência.

## Regras gerais

1. Preserve a arquitetura por feature usada no backend.
2. Não faça atalhos que reduzam segurança, testes ou documentação.
3. Não altere APIs públicas sem atualizar DTOs, testes e docs.
4. Faça mudanças pequenas, coesas e fáceis de revisar.

## Backend (obrigatório por feature)

Cada feature nova deve ter:

- entidade JPA;
- DTO de request e DTO de response;
- mapper dedicado;
- repository;
- service interface + implementation;
- controller;
- migration Liquibase;
- teste unitário de service;
- teste de integração de endpoint.

### Regras backend

- Controller nunca retorna entidade JPA diretamente.
- Request body deve usar Bean Validation e `@Valid`.
- Erros devem ser padronizados no `GlobalExceptionHandler`.
- Não remover autenticação por padrão; bypass só em contexto local/documentado.

## Frontend (obrigatório por feature)

Cada feature nova deve ter:

- módulo API tipado em `src/api`;
- teste do módulo API;
- componente com estados de loading/error/empty/success;
- atualização de tipos conforme contrato backend.

### Regras frontend

- Não usar `fetch` direto dentro de componentes de UI.
- Toda chamada de rede deve passar por `src/api/*`.
- Não ignorar erros silenciosamente.

## Qualidade e CI

Toda contribuição deve passar em:

- Backend: `./mvnw clean verify`
- Frontend: `bun run lint`, `bun run test`, `bun run build`

Não introduzir pipelines que permitam pular lint/testes em mudanças de código.

## Documentação obrigatória

Em toda feature, atualizar documentação mínima:

- README relevante (root/backend/frontend/infra);
- contrato de endpoint (request/response/erros);
- instruções de teste local.

## Segurança e configuração

- Nunca commitar segredos.
- Configuração deve vir por variáveis de ambiente.
- Sempre documentar defaults e diferenças por ambiente (`dev`, `staging`, `prod`).

## Definition of Done (DoD)

Uma mudança só está pronta quando:

1. compila;
2. testes passam;
3. lint passa;
4. docs foram atualizadas;
5. segue as regras acima.
