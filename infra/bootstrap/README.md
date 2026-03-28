# Bootstrap — Terraform Remote State

## O que é

O bootstrap cria a infraestrutura necessária para que o Terraform possa armazenar o state remotamente na AWS. Ele precisa existir **antes** de qualquer `terraform apply` na infra principal.

### Recursos criados

| Recurso | Nome | Finalidade |
|---|---|---|
| S3 Bucket | `wsssguardo-tfstate-<env>` | Armazena o arquivo `terraform.tfstate` |

O bucket é criado com:
- **Versionamento habilitado** — permite recuperar versões anteriores do state
- **Criptografia AES256** — state criptografado em repouso
- **Acesso público bloqueado** — nenhum acesso externo permitido
- **Lock via `use_lockfile`** — evita que dois applies rodem ao mesmo tempo

---

## Pré-requisitos

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.6
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- Credenciais AWS configuradas com permissão para criar S3

### Configurar credenciais AWS

```bash
aws configure --profile wsssguardo
```

Informe:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-2`
- Default output format: `json`

---

## Como rodar o bootstrap

```bash
export AWS_PROFILE=wsssguardo
./scripts/deploy-bootstrap.sh         # ambiente dev (padrão)
./scripts/deploy-bootstrap.sh prod    # ambiente prod
```

O script vai:
1. Verificar as credenciais AWS
2. Rodar `terraform init` no bootstrap
3. Verificar se os recursos já existem e importar se necessário
4. Rodar `terraform apply` para criar o bucket

---

## Como inicializar a infra principal

Após o bootstrap, inicialize o backend remoto na infra principal:

```bash
export AWS_PROFILE=wsssguardo
terraform -chdir=infra init
```

A partir daí, qualquer `terraform apply` dentro de `infra/` vai salvar o state no S3 automaticamente.

---

## Observações

- O state do bootstrap fica **local** na máquina de quem rodou — nunca sobe para o repo
- Se outro membro do time rodar o script, ele importa automaticamente os recursos já existentes
- Arquivos `*.tfstate`, `.terraform/` e `.terraform.lock.hcl` estão no `.gitignore` e nunca devem ser commitados
