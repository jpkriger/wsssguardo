# WssSguardo

Monorepo do projeto de graduação com foco em qualidade, segurança e manutenibilidade desde o início.

## Baseline adotado

Este repositório segue **Option B (production-grade starter)**:

- arquitetura por feature com camadas bem definidas;
- DTOs, mappers, validação e tratamento global de erros;
- testes automatizados obrigatórios;
- lint e build obrigatórios no CI;
- documentação clara para devs iniciantes e agentes de IA.

## Stack (LTS-oriented)

- Backend: Java 25 + Spring Boot 4.0.4 + PostgreSQL + Liquibase
- Frontend: React + TypeScript + Vite + Bun
- Infra: Terraform (AWS S3 + CloudFront para frontend)
- CI: GitLab CI

## Estrutura do monorepo

```text
.
├── backend/    # API Spring Boot
├── frontend/   # SPA React
├── infra/      # Terraform para frontend cloud
└── docker-compose.yml
```

## Quick start (local com Docker)

Pré-requisitos:

- Docker + Docker Compose

```bash
docker compose up --build
```

Endpoints principais:

- Frontend: http://localhost
- Backend: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html

## Quick start (desenvolvimento sem Docker)

### Backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend

```bash
cd frontend
bun install
bun run dev
```

## Qualidade obrigatória

Antes de abrir merge request:

### Backend

```bash
cd backend
./mvnw clean verify
```

### Frontend

```bash
cd frontend
bun run lint
bun run test
bun run build
```

## Fluxo canônico por feature

Cada nova feature deve seguir o mesmo padrão do exemplo `entityobject`:

1. entidade JPA (`Entity`)
2. DTOs de entrada e saída
3. mapper dedicado
4. repository
5. service interface + implementation
6. controller REST
7. migration Liquibase
8. testes (unit + integração)
9. documentação atualizada

Referência em [backend/readme.md](backend/readme.md).

## Escopo de runtime/cloud atual

- **Hoje:** infraestrutura cloud provisiona frontend estático (S3 + CloudFront).
- **Próximo passo planejado:** definir caminho de deploy do backend (ex.: ECS/App Runner/Lambda) e integração com o frontend cloud.

Detalhes em [infra/readme.md](infra/readme.md).

## Regras para agentes de IA e contribuições

Consulte [AI_AGENTS.md](AI_AGENTS.md) antes de codar.
