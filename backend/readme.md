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
- `GET /api/finds/getFindingNameByProjectId/{projectId}`

O endpoint de projetos aceita três modos de consulta no mesmo controller:

- Sem parâmetros retorna a lista completa de projetos (`id`, `name`, `companyId`, `startDate`, `endDate`, `status`).
- `ids` repetido retorna detalhes de projetos preservando a ordem solicitada.
- `userId` retorna lista de IDs (UUID) dos projetos relacionados ao usuário.

## Contratos documentados

- [Contrato da API de relatório](../docs/report-api-contract.md)
- Os endpoints de risco usam a rota base `/api/projects/{projectId}/risks`:

### Riscos

`POST /api/projects/{projectId}/risks`

Request:

```json
{
  "name": "Unauthorized data exposure",
  "findIds": ["uuid"],
  "description": "Personal data exposed in public endpoint",
  "consequences": "Privacy incident",
  "occurrenceProbability": 0.7,
  "impactProbability": 0.9,
  "damageOperations": 8,
  "damageAssets": 6,
  "damageIndividuals": 9,
  "damageOtherOrgs": 7,
  "recommendation": "Restrict endpoint and add tests",
  "priority": "P1"
}
```

Response `201 Created`:

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "name": "Unauthorized data exposure",
  "findIds": ["uuid"],
  "description": "Personal data exposed in public endpoint",
  "consequences": "Privacy incident",
  "occurrenceProbability": 0.7,
  "impactProbability": 0.9,
  "damageOperations": 8,
  "damageAssets": 6,
  "damageIndividuals": 9,
  "damageOtherOrgs": 7,
  "generalRisk": 7.5,
  "priority": "P1",
  "aiSummary": null,
  "recommendation": "Restrict endpoint and add tests",
  "createdBy": "user",
  "createdAt": "2026-06-19T00:00:00",
  "updatedAt": null
}
```

`PUT /api/projects/{projectId}/risks/{id}` aceita os mesmos campos de criação como atualização parcial. `priority` é manual e aceita `P1`, `P2`, `P3`, `P4` ou `P5`. `aiSummary` é persistido para preenchimento por outro fluxo e pode retornar `null`.

`generalRisk` não é aceito no request. O backend calcula a média aritmética de `damageOperations`, `damageAssets`, `damageIndividuals` e `damageOtherOrgs` em criação e atualização. As quatro notas são obrigatórias no risco persistido e devem respeitar `riskConfig.minRange` e `riskConfig.maxRange` da configuração do projeto; valores fora da escala retornam `400 Bad Request`.

Teste local:

```bash
./mvnw test
./mvnw clean verify
```

- O endpoint `GET /api/finds/getFindingNameByProjectId/{projectId}` retorna uma lista enxuta para seleção:

```json
[
  {
    "id": "uuid",
    "name": "Nome do achado"
  }
]
```

## Qualidade

```bash
./mvnw clean verify
```
