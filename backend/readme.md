# Backend

Backend Spring Boot organizado por feature (vertical slice), com camadas explícitas por entidade.

## Stack

- Java 25
- Spring Boot 4.0.4
- Spring Data JPA
- Spring Security
- Liquibase
- PostgreSQL (prod) / H2 (dev)

## Estrutura canônica por feature

Cada feature deve seguir este template:

```text
src/main/java/wsssguardo/<feature>/
  <Feature>.java
  controller/
    <Feature>Controller.java
  dto/
    <Feature>CreateRequest.java
    <Feature>Response.java
  mapper/
    <Feature>Mapper.java
  repository/
    <Feature>Repository.java
  service/
    <Feature>Service.java
    <Feature>ServiceImpl.java
```

Referência implementada: `entityobject`.

## Regras obrigatórias da baseline

1. Controller nunca expõe entidade JPA diretamente.
2. Entrada via DTO com Bean Validation (`@Valid`, `@NotBlank`, etc).
3. Conversão DTO ↔ Entity via mapper dedicado.
4. Service contém regra de negócio e usa interface.
5. Erros passam pelo `GlobalExceptionHandler`.
6. Toda mudança de schema exige migration Liquibase.
7. Toda feature nova exige testes unitários e de integração.

## Endpoints de exemplo

- `POST /api/entity-objects`
- `GET /api/entity-objects/{id}`
- `GET /api/entity-objects`

Payload de criação:

```json
{
  "name": "Qualquer Nome"
}
```

## Rodando localmente

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Com profile `dev`:

- H2 em memória: `jdbc:h2:mem:wssdb`
- H2 console: `/h2-console`

## Testes e qualidade

```bash
./mvnw clean verify
```

Checklist mínimo por feature:

- teste unitário de service;
- teste de integração dos endpoints principais;
- teste de validação (400);
- teste de cenário não encontrado (404).
