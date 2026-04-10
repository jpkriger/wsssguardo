# Infraestrutura do Backend — EC2

Documentação técnica e atômica de cada elemento configurado para o backend da aplicação.

---

## Visão geral

```
Internet
   │
   ├─ :80  ──► Nginx (redirect para HTTPS)
   └─ :443 ──► Nginx (SSL termination)
                  └──► Backend :8080 (container)
                           └──► Postgres :5432 (container)

Acesso administrativo: SSM Session Manager (sem porta 22)
Imagens:               ECR (pull autenticado via IAM Role)
IP público:            Elastic IP (fixo, não muda com reboot)
```

---

## ECR — Elastic Container Registry

**O que é:** Repositório privado da AWS para armazenar imagens Docker.

**Por que não Docker Hub:** O ECR está na mesma rede da AWS. O pull da imagem não sai para a internet, é mais rápido e sem limite de rate. A autenticação é feita pela IAM Role da EC2, sem credenciais estáticas.

### `aws_ecr_repository`

```hcl
image_scanning_configuration {
  scan_on_push = true
}
```

**Por que `scan_on_push`:** A cada `docker push`, a AWS inspeciona a imagem em busca de CVEs conhecidos. O resultado fica visível no console. Não bloqueia o push, mas alerta sobre vulnerabilidades.

### `aws_ecr_lifecycle_policy`

```hcl
countType   = "imageCountMoreThan"
countNumber = 3
```

**Por que:** Sem essa policy, cada deploy acumula uma nova imagem no repositório indefinidamente. O storage do ECR tem custo. A policy mantém apenas as 3 imagens mais recentes e deleta as anteriores automaticamente.

---

## IAM — Permissões da EC2

A EC2 não usa access key ou secret key. Ela assume uma **IAM Role** automaticamente via IMDS (Instance Metadata Service). As credenciais são temporárias, rotacionadas automaticamente pela AWS.

### `aws_iam_role`

```hcl
Principal = {
  Service = "ec2.amazonaws.com"
}
```

**O que faz:** Define que apenas o serviço EC2 pode assumir essa role. Nenhuma outra entidade (usuário, Lambda, etc.) consegue.

### `aws_iam_role_policy_attachment` — ECR

```hcl
policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
```

**O que permite:** `docker pull` de imagens no ECR.  
**O que não permite:** `docker push`, deletar imagens, criar repositórios. Princípio do menor privilégio — a EC2 só precisa baixar imagens, nunca publicar.

### `aws_iam_role_policy_attachment` — SSM

```hcl
policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
```

**O que permite:** A EC2 se registra no SSM e aceita sessões e comandos remotos.  
**Por que:** Elimina a necessidade de par de chaves SSH e porta 22 aberta. O acesso é feito via HTTPS de saída da EC2 para os endpoints do SSM — nenhuma porta de entrada extra é necessária.

### `aws_iam_instance_profile`

**O que é:** O wrapper que vincula a IAM Role à instância EC2. Sem ele, a role existe mas a EC2 não consegue assumi-la. É o mecanismo que injeta as credenciais temporárias no IMDS.

---

## Data Sources

Não criam recursos. Leem dados existentes na AWS em tempo de execução do Terraform.

### `aws_ami`

```hcl
filter { name = "name", values = ["al2023-ami-*-x86_64"] }
filter { name = "virtualization-type", values = ["hvm"] }
most_recent = true
```

**Por que não hardcodar o ID da AMI:** IDs de AMI são diferentes por região e mudam a cada atualização de segurança. Hardcodar significa usar uma imagem desatualizada após alguns meses. O data source sempre resolve para a versão mais recente do Amazon Linux 2023.

**Por que `hvm`:** É o tipo de virtualização padrão e obrigatório para instâncias modernas da AWS. O tipo alternativo (`paravirtual`) é legado e não suportado no t3.

**Por que Amazon Linux 2023:** Vem com SSM Agent e Docker disponíveis no repositório `dnf` por padrão. É mantido pela AWS com patches de segurança regulares e suporte até 2028.

### `aws_vpc` e `aws_subnets`

```hcl
data "aws_vpc" "default" { default = true }
```

**Por que VPC default:** Toda conta AWS tem uma VPC default criada automaticamente em cada região. Usar ela evita o custo e complexidade de criar e configurar uma VPC dedicada. Para este projeto, a VPC default é suficiente.

---

## Security Group

Firewall da EC2. Funciona como allowlist — tudo que não está explicitamente permitido é bloqueado.

### Ingress — porta 80 (HTTP)

```hcl
from_port   = 80
cidr_blocks = ["0.0.0.0/0"]
```

**Por que está aberta:** O nginx precisa da porta 80 para:
1. Redirecionar requisições HTTP para HTTPS (301)
2. Responder ao desafio de validação do Let's Encrypt durante a emissão do certificado

**O que trafega nela:** Apenas o redirect `301 → https://`. Nenhum dado da aplicação.

### Ingress — porta 443 (HTTPS)

```hcl
from_port   = 443
cidr_blocks = ["0.0.0.0/0"]
```

**O que trafega:** Todo o tráfego real da aplicação, criptografado com TLS.

### Portas fechadas propositalmente

| Porta | Serviço | Motivo |
|-------|---------|--------|
| 22    | SSH     | Acesso via SSM, sem necessidade de SSH |
| 8080  | Backend | Tráfego interno entre containers, não exposto |
| 5432  | Postgres| Tráfego interno entre containers, não exposto |

### Egress — liberado total

```hcl
from_port   = 0
to_port     = 0
protocol    = "-1"
```

**Por que:** A EC2 precisa de saída para: pull de imagens no ECR, comunicação com endpoints do SSM, atualização de pacotes via `dnf`, e validação do Let's Encrypt.

---

## EC2

### `instance_type = "t3.small"`

2 vCPU, 2GB RAM. Instância **burstable** — acumula créditos de CPU em períodos ociosos e usa esses créditos em picos de carga. Adequado para workloads de baixo tráfego com picos ocasionais.

### `root_block_device`

```hcl
volume_size = 20
volume_type = "gp3"
```

**Por que `gp3` e não `gp2`:** O `gp3` entrega 3000 IOPS base sem custo adicional (o `gp2` cobra por IOPS acima do baseline). É mais barato e mais performático para o mesmo tamanho.

**Por que 20GB:** Espaço para o SO (~4GB), Docker, imagens de container (~2-3GB cada) e logs.

### `user_data`

Script executado **uma única vez** no primeiro boot da instância.

```bash
set -e
```
**Por que:** Qualquer erro interrompe o script imediatamente. Sem isso, o script continua mesmo após falha, podendo deixar o servidor em estado inconsistente.

```bash
dnf install -y docker certbot
systemctl enable --now docker
```
**`enable --now`:** Liga o serviço imediatamente E o marca para iniciar automaticamente após reboot. Dois comandos em um.

```bash
usermod -aG docker ec2-user
```
**Por que:** Permite rodar `docker` sem `sudo` com o usuário `ec2-user`. Sem isso, todos os comandos Docker precisariam de root.

```bash
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```
**Por que baixar direto e não via `dnf`:** A versão do Docker Compose no repositório do Amazon Linux costuma estar desatualizada. Baixar do GitHub garante a versão mais recente.

```bash
aws ecr get-login-password --region ... | docker login --username AWS --password-stdin ...
```
**Por que:** As imagens no ECR são privadas. Antes de qualquer `docker pull`, é necessário autenticar. O comando usa as credenciais temporárias da IAM Role (via IMDS) para gerar um token e fazer login no registry.

```bash
mkdir -p /opt/wsssguardo
```
**Por que:** Diretório onde a pipeline vai depositar o `docker-compose.yml` e os arquivos de configuração via SSM.

```bash
echo "0 3 * * * root certbot renew ..." > /etc/cron.d/certbot-renew
```
**Por que:** Certificados Let's Encrypt expiram em 90 dias. O cron roda diariamente às 3h, mas o certbot só renova se o certificado estiver a menos de 30 dias do vencimento.  
**`--pre-hook / --post-hook`:** Para o container do nginx antes de renovar (libera a porta 80 para o certbot standalone) e o reinicia depois com o novo certificado.

---

## Elastic IP

```hcl
resource "aws_eip" "backend" {
  instance = aws_instance.backend.id
  domain   = "vpc"
}
```

**O que é:** Um IP público estático da AWS. Por padrão, toda EC2 recebe um IP público novo a cada vez que é reiniciada ou recriada. O Elastic IP resolve isso — o IP é reservado na sua conta e permanece o mesmo independente do ciclo de vida da instância.

**Por que é necessário aqui:** O DNS do domínio `ages-api.kriger.dev` precisa apontar para um IP fixo. Se o IP mudasse a cada reboot, o domínio quebraria.

**Por que é necessário para o TLS:** O Let's Encrypt valida o domínio acessando o servidor via HTTP. Para isso funcionar, o DNS já precisa estar apontando para a EC2 antes da emissão do certificado. Com IP dinâmico, isso seria impossível de garantir.

---

## Nginx — `nginx/default.conf`

### Bloco HTTP (porta 80)

```nginx
return 301 https://$host$request_uri;
```

**O que faz:** Qualquer requisição HTTP recebe um redirect permanente (301) para a versão HTTPS da mesma URL. Nenhum dado trafega em texto puro.

**Por que 301 e não 302:** O 301 é permanente. Browsers e ferramentas de SEO entendem que o HTTP nunca deve ser usado e passam a ir direto para HTTPS em requisições futuras. O 302 é temporário e repetiria o redirect a cada requisição.

### Bloco HTTPS (porta 443)

```nginx
ssl_certificate     /etc/letsencrypt/live/ages-api.kriger.dev/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/ages-api.kriger.dev/privkey.pem;
```

**`fullchain.pem`:** Contém o certificado do domínio + os certificados intermediários da cadeia de confiança. Sem os intermediários, alguns clientes rejectam a conexão.  
**`privkey.pem`:** Chave privada. Nunca sai do servidor.

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
```

**Por que não TLS 1.0/1.1:** São versões antigas com vulnerabilidades conhecidas (POODLE, BEAST). Desabilitadas por padrão em qualquer configuração moderna.

```nginx
ssl_ciphers HIGH:!aNULL:!MD5;
```

**`HIGH`:** Apenas ciphers com nível de segurança alto.  
**`!aNULL`:** Exclui ciphers sem autenticação (anonymous) — vulneráveis a MITM.  
**`!MD5`:** Exclui ciphers que usam MD5, algoritmo criptograficamente quebrado.

### Proxy para o backend

```nginx
proxy_pass http://backend:8080;
```

**`backend`:** Nome do serviço no Docker Compose. O Docker resolve automaticamente para o IP interno do container.

```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
```

**Por que HTTP/1.1:** Suporta conexões persistentes (keepalive) com o upstream. O padrão do nginx é HTTP/1.0, que fecha a conexão após cada requisição — ineficiente.  
**Por que `Connection ""`:** Limpa o header `Connection` que vem do cliente. Sem isso, um `Connection: close` do browser seria repassado ao backend, quebrando o keepalive mesmo com HTTP/1.1.

```nginx
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

**Por que:** O backend só vê o IP do nginx, não o IP do cliente real. Esses headers repassam as informações originais da requisição para o backend poder logar, aplicar rate limit ou verificar o protocolo corretamente.

```nginx
proxy_connect_timeout 60s;
proxy_send_timeout    60s;
proxy_read_timeout    60s;
```

**Por que 60s:** Evita que requisições lentas ou travadas fiquem presas indefinidamente consumindo recursos. O nginx encerra a conexão após 60s sem resposta.

---

## Docker Compose — serviço nginx (prod)

```yaml
volumes:
  - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

**`./nginx/default.conf`:** Monta o arquivo de configuração do repositório dentro do container. O `:ro` (read-only) impede que o container modifique o arquivo.  
**`/etc/letsencrypt`:** Monta a pasta de certificados do host dentro do container. O certbot roda no host e grava aqui; o nginx lê daqui. O `:ro` garante que o nginx nunca modifica os certificados.

```yaml
restart: unless-stopped
```

**Por que:** Se o container cair por qualquer motivo (erro, OOM), o Docker o reinicia automaticamente. A exceção é quando ele é parado explicitamente (ex: `docker stop nginx` — usado durante a renovação do certificado).

---

## Fluxo completo de provisionamento

```
1. terraform apply
   ├── Cria ECR, IAM Role, Security Group
   ├── Cria EC2 → user_data roda no primeiro boot
   │     ├── Instala Docker, Docker Compose, Certbot
   │     ├── Faz login no ECR via IAM Role
   │     ├── Cria /opt/wsssguardo
   │     └── Configura cron de renovação do certificado
   └── Cria e associa Elastic IP → output mostra o IP

2. Aponta ages-api.kriger.dev → Elastic IP no DNS

3. Aguarda propagação DNS

4. Via SSM — emissão do certificado (uma única vez):
   sudo certbot certonly --standalone \
     -d ages-api.kriger.dev \
     --non-interactive --agree-tos \
     -m jpsk145@gmail.com

5. Pipeline de deploy (cada nova versão):
   ├── docker build + push para o ECR
   └── SSM send-command na EC2:
         cd /opt/wsssguardo
         docker-compose --profile prod pull
         docker-compose --profile prod up -d

6. Renovação automática (cron — todo dia às 3h):
   └── certbot renew
         ├── Para o nginx (pre-hook)
         ├── Renova o certificado
         └── Reinicia o nginx (post-hook)
```