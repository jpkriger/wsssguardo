# Backend - Estrutura de API por Entidade

Este backend segue um modelo vertical por entidade. Cada entidade fica em sua propria pasta e inclui os componentes necessarios para expor endpoints.

## Estrutura sugerida

```text
src/main/java/wsssguardo/
	entityobject/
		EntityObject.java
		dto/
			EntityObjectCreateRequest.java
			EntityObjectResponse.java
		repository/
			EntityObjectRepository.java
		service/
			EntityObjectService.java
			EntityObjectServiceImpl.java
		controller/
			EntityObjectController.java
```

## Exemplo ja implementado

- Entidade: EntityObject
- Endpoints:
	- POST /api/entity-objects
	- GET /api/entity-objects/{id}
	- GET /api/entity-objects

### Payload de criacao

```json
{
	"name": "Qualquer Nome"
}
```

## Ambiente local com H2

- Banco em memoria: `jdbc:h2:mem:wssdb`
- Console H2: `/h2-console`
- Usuario: `sa`
- Senha: (vazia)

## Como replicar para nova entidade

1. Crie a pasta da entidade em `wsssguardo/<entidade>/`.
2. Adicione a classe de entidade JPA (`<Entidade>.java`).
3. Crie DTOs em `dto/` para entrada e saida.
4. Crie o repository em `repository/` extendendo `JpaRepository`.
5. Crie service interface + implementacao em `service/`.
6. Crie controller REST em `controller/` com os endpoints basicos.
