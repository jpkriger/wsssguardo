# Copilot Cloud Agent Guide

## What this repository is

WssSguardo is a monorepo with three main parts:

- Backend: Spring Boot 4 API in Java 25, organized by feature using a vertical-slice layout.
- Frontend: React + TypeScript + Vite, using Bun for dependency management and scripts.
- Infra: Terraform for AWS bootstrap state and remote-state setup.

The repo is relatively small but opinionated. It is Docker-first for local development and validation, with CI checks defined in [`.gitlab-ci.yml`](../.gitlab-ci.yml).

## Key layout facts

- Root files: [README.md](../README.md), [docker-compose.yml](../docker-compose.yml), [AGENTS.md](../AGENTS.md), [backend/](../backend), [frontend/](../frontend), [infra/](../infra), [scripts/](../scripts).
- VS Code workflow: [`.vscode/tasks.json`](../.vscode/tasks.json) and [`.vscode/launch.json`](../.vscode/launch.json).
- Backend entrypoint: [backend/src/main/java/wsssguardo/WssSguardoApplication.java](../backend/src/main/java/wsssguardo/WssSguardoApplication.java).
- Backend error handling: [backend/src/main/java/wsssguardo/shared/exception/GlobalExceptionHandler.java](../backend/src/main/java/wsssguardo/shared/exception/GlobalExceptionHandler.java).
- Example feature: [backend/src/main/java/wsssguardo/entityobject](../backend/src/main/java/wsssguardo/entityobject) with controller, dto, mapper, repository, and service.
- Frontend API layer: [frontend/src/api](../frontend/src/api) and UI entry at [frontend/src/App.tsx](../frontend/src/App.tsx).
- Terraform bootstrap: [infra/bootstrap](../infra/bootstrap) and root provider config in [infra/providers.tf](../infra/providers.tf).

## How to build and validate

Always prefer the documented CI-equivalent commands below. If a prerequisite is missing, install it first rather than guessing at alternatives.

### Backend

- Runtime: Java 25.
- Build and test: `cd backend && chmod +x mvnw && ./mvnw --batch-mode --no-transfer-progress clean verify`.
- This succeeded locally in about 33 seconds.
- The test profile used by the project is `dev`; the backend integration tests still run against H2 when executed outside Docker with that profile.
- The backend build currently emits expected warnings about Spring Boot, Hibernate, Mockito, and SpringDoc startup; they do not fail the build.

### Frontend

- Runtime: Bun 1.3.11 in CI and Docker; Bun is not installed on the host here.
- Always run dependency installation before lint/test/build when `node_modules` is absent: `cd frontend && bun install --frozen-lockfile || bun install`.
- Lint: `bun run lint`.
- Tests: `bun run test`.
- Build: `bun run build`.
- In this repo, build already includes lint, then TypeScript, then Vite.
- The dev container also runs lint before starting Vite; if lint fails, the frontend does not start.
- Validation was confirmed in Docker using `oven/bun:1`.

### Docker development flow

- Recommended startup: VS Code F5 using the compound debug config [Debug Front + Back](../.vscode/launch.json).
- That workflow calls the task [Compose Dev Up](../.vscode/tasks.json), which runs `docker compose --profile dev up -d --wait --build db backend-dev frontend-dev`.
- Shutdown: `docker compose --profile dev down --remove-orphans`.
- In local validation, the stack typically took about 40 seconds to become ready.
- The backend can take noticeably longer than the compose healthcheck to answer HTTP requests the first time; if an immediate request returns an empty reply, retry for up to about 30 seconds before treating it as a failure.
- Frontend was reachable as soon as the stack reported healthy.

### Terraform bootstrap

- Required tools: Terraform 1.6+ and AWS CLI.
- Bootstrap command: `./scripts/deploy-bootstrap.sh dev`.
- The script fails immediately if `terraform` or `aws` is missing.
- The script creates or imports the S3 bucket used for remote state, then prints the backend block to copy into [infra/providers.tf](../infra/providers.tf).
- Do not run infra applies before bootstrap exists.

## CI and validation pipeline

- Backend CI job mirrors `./mvnw --batch-mode --no-transfer-progress clean verify` from [`.gitlab-ci.yml`](../.gitlab-ci.yml).
- Frontend CI job runs `bun install` or `bun install --frozen-lockfile`, then `bun run lint`, `bun run test`, and `bun run build`.
- Treat those as the source of truth for validation unless this file is incomplete or proven wrong.

## Repository conventions that matter

- Keep backend changes aligned with the feature folder pattern already used in `entityobject`.
- Controllers return DTOs, not JPA entities.
- Validation uses Bean Validation and `@Valid` on request bodies.
- Shared API errors should stay normalized through the global exception handler.
- Frontend network calls should go through `frontend/src/api`, not directly inside UI components.

## Practical guidance for cloud agents

- Trust these instructions first and only search the repo if something is missing or contradicts what you observe.
- Prefer the smallest change that satisfies the task.
- Before changing code, check whether the relevant validation already exists in backend tests, frontend tests, or compose tasks.
- If a command fails, inspect whether the failure is due to missing host tools, missing frontend dependencies, or startup timing rather than code.
