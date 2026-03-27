# Infra

Configuração Terraform para infraestrutura cloud do frontend.

## Escopo atual (hoje)

Provisiona apenas frontend estático:

| Resource                               | Description                            |
| -------------------------------------- | -------------------------------------- |
| `aws_s3_bucket`                        | Bucket privado para assets do frontend |
| `aws_cloudfront_origin_access_control` | OAC para acesso seguro ao bucket       |
| `aws_cloudfront_distribution`          | CDN HTTPS para servir a SPA            |

Roteamento SPA: erros 403/404 retornam `index.html`.

## Escopo planejado (próximo passo)

Definir caminho de deploy do backend para tornar o runtime cloud completo:

1. runtime backend gerenciado (ex.: ECS Fargate ou App Runner);
2. banco gerenciado (RDS PostgreSQL) por ambiente;
3. integração de domínio/API entre frontend cloud e backend cloud;
4. pipeline CI/CD com deploy automatizado por ambiente.

## Requisitos

- Terraform >= 1.6
- Credenciais AWS configuradas (`aws configure` ou variáveis de ambiente)

## Uso

```bash
cd infra
terraform init
terraform plan -var="environment=dev"
terraform apply -var="environment=dev"
```

Após `apply`, a saída inclui:

```text
cloudfront_domain_name = "https://xxxx.cloudfront.net"
```

## Deploy manual do frontend

```bash
cd ../frontend && bun run build
aws s3 sync dist/ s3://$(terraform -chdir=../infra output -raw frontend_bucket_name) --delete
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=../infra output -raw cloudfront_distribution_id) \
  --paths "/*"
```

## Variáveis

| Name          | Default      | Description                           |
| ------------- | ------------ | ------------------------------------- |
| `aws_region`  | `us-east-1`  | Região AWS                            |
| `project`     | `wsssguardo` | Prefixo de nomes                      |
| `environment` | `dev`        | Ambiente (`dev` / `staging` / `prod`) |
