# Backend

API Spring Boot organizada por feature (vertical slice).

## Fluxo oficial (Docker-first)

No dia a dia, o backend roda no serviço `backend-dev` do [docker-compose.yml](../docker-compose.yml), iniciado via VS Code F5.

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- Debug attach (Java): `localhost:5005`

Arquivos de referência:

- [../.vscode/launch.json](../.vscode/launch.json)
- [../.vscode/tasks.json](../.vscode/tasks.json)
- [Dockerfile](Dockerfile)

## Banco de dados no Docker dev

No perfil `dev` do compose, o backend usa PostgreSQL (`db`), não H2.

Variáveis principais vêm do compose:

- `DB_URL=jdbc:postgresql://db:5432/wssdb`
- `DB_DRIVER=org.postgresql.Driver`
- `DB_USERNAME=wss`
- `DB_PASSWORD=wss`

## Execução fora do Docker (opcional)

Se executar fora do Docker com profile `dev`, então o backend usa H2 conforme [src/main/resources/application-dev.properties](src/main/resources/application-dev.properties).

## Estrutura canônica por feature

```text
src/main/java/wsssguardo/<feature>/
  <Feature>.java
  controller/
  dto/
  repository/
  service/
```

Referência implementada: `entityobject`.

## Endpoints de exemplo

- `POST /api/entity-objects`
- `GET /api/entity-objects/{id}`
- `GET /api/entity-objects`
- `GET /api/projects`
- `GET /api/projects?ids=<uuid>&ids=<uuid>`
- `GET /api/projects?userId=<uuid>`
- `POST /api/risks`

O endpoint de projetos aceita três modos de consulta no mesmo controller:

- Sem parâmetros retorna a lista completa de projetos (`id`, `name`, `customerId`, `startDate`, `endDate`, `status`).
- `ids` repetido retorna detalhes de projetos preservando a ordem solicitada.
- `userId` retorna lista de IDs (UUID) dos projetos relacionados ao usuário.

## Contrato: criar risco

`POST /api/risks` cria um risco usando o contrato derivado da migration `risks`, incluindo relações com `project`, `finds` e `damageAssets`.

Request:

```json
{
  "projectId": "00000000-0000-0000-0000-000000000001",
  "name": "Unauthorized data exposure",
  "findIds": ["00000000-0000-0000-0000-000000000002"],
  "description": "Personal data exposed in public endpoint",
  "consequences": "Privacy incident",
  "occurrenceProbability": 0.7,
  "impactProbability": 0.9,
  "damageOperations": "Incident response required",
  "damageAssetIds": ["00000000-0000-0000-0000-000000000003"],
  "damageIndividuals": "Personal data exposure",
  "damageOtherOrgs": "Partner notification",
  "recommendation": "Restrict endpoint and add tests",
  "riskLevel": 9000
}
```

Response `201 Created`:

```json
{
  "id": "00000000-0000-0000-0000-000000000010",
  "projectId": "00000000-0000-0000-0000-000000000001",
  "name": "Unauthorized data exposure",
  "findIds": ["00000000-0000-0000-0000-000000000002"],
  "description": "Personal data exposed in public endpoint",
  "consequences": "Privacy incident",
  "occurrenceProbability": 0.7,
  "impactProbability": 0.9,
  "damageOperations": "Incident response required",
  "damageAssetIds": ["00000000-0000-0000-0000-000000000003"],
  "damageIndividuals": "Personal data exposure",
  "damageOtherOrgs": "Partner notification",
  "recommendation": "Restrict endpoint and add tests",
  "riskLevel": 9000,
  "createdBy": "authenticatedUser",
  "createdAt": "2026-04-30T10:00:00",
  "updatedAt": null
}
```

Erros padronizados pelo `GlobalExceptionHandler`:

- `400 Bad Request`: validação de body, como `projectId` ausente, `name` vazio ou `riskLevel` fora de `0..10000`.
- `404 Not Found`: `Project`, `Find` ou `Asset` informado por UUID não existe.

Teste local do endpoint:

```bash
./mvnw test -Dtest=RiskServiceImplTest,RiskControllerIntegrationTest
```

## Qualidade

```bash
./mvnw clean verify
```
