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
- `GET /api/projects?ids=<uuid>&ids=<uuid>`
- `GET /api/projects?userId=<uuid>`

O endpoint de projetos aceita dois modos de consulta no mesmo controller:
- `ids` repetido para retornar detalhes de projetos (`id`, `name`, `customerId`, `startDate`, `endDate`, `status`) preservando a ordem solicitada.
- `userId` para retornar lista de IDs (UUID) dos projetos relacionados ao usuário.

## Qualidade

```bash
./mvnw clean verify
```
