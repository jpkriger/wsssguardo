#!/usr/bin/env bash
# deploy.sh — Deploy completo: infra (Terraform) + backend (ECR + EC2) + frontend (S3 + CloudFront)
#
# Uso:
#   bash scripts/deploy.sh               # apply infra + deploy tudo
#   bash scripts/deploy.sh --skip-infra  # pula o terraform apply

set -euo pipefail

# ─── Configuração ──────────────────────────────────────────────────────────────
AWS_PROFILE="${AWS_PROFILE:-wsssguardo}"
REGION="us-east-2"
PROJECT="wsssguardo"
BACKEND_DOMAIN="ages-api.kriger.dev"
CERTBOT_EMAIL="jpsk145@gmail.com"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$ROOT_DIR/infra"
SKIP_INFRA=false

for arg in "$@"; do
  [[ "$arg" == "--skip-infra" ]] && SKIP_INFRA=true
done

# ─── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo ""; echo "==> $*"; }
info() { echo "    $*"; }
die()  { echo ""; echo "ERRO: $*" >&2; exit 1; }

# ─── Secrets (via env ou .env.secrets local) ───────────────────────────────────
SECRETS_FILE="${ROOT_DIR}/.env.secrets"
[[ -f "$SECRETS_FILE" ]] && source "$SECRETS_FILE"

DB_NAME="${DB_NAME:-}"
DB_USERNAME="${DB_USERNAME:-}"
DB_PASSWORD="${DB_PASSWORD:-}"

[[ -z "$DB_NAME"     ]] && die "DB_NAME não definido. Configure em .env.secrets ou como variável de ambiente."
[[ -z "$DB_USERNAME" ]] && die "DB_USERNAME não definido. Configure em .env.secrets ou como variável de ambiente."
[[ -z "$DB_PASSWORD" ]] && die "DB_PASSWORD não definido. Configure em .env.secrets ou como variável de ambiente."

# ─── Pré-requisitos ────────────────────────────────────────────────────────────
for cmd in aws terraform docker git dig; do
  command -v "$cmd" &>/dev/null || die "'$cmd' não encontrado no PATH"
done

echo "════════════════════════════════════════════════"
echo "  Deploy wsssguardo"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════"
aws sts get-caller-identity --profile "$AWS_PROFILE" --output table --no-cli-pager

# ─── 1. Terraform ──────────────────────────────────────────────────────────────
if [[ "$SKIP_INFRA" == false ]]; then
  log "[1/4] Infraestrutura — terraform apply..."
  cd "$INFRA_DIR"
  AWS_PROFILE=$AWS_PROFILE terraform init -reconfigure -input=false

  # Primeiro apply: cria só o certificado ACM
  AWS_PROFILE=$AWS_PROFILE terraform apply -auto-approve -input=false \
    -target=aws_acm_certificate.frontend

  CNAME_NAME=$(AWS_PROFILE=$AWS_PROFILE terraform output -json acm_validation_cname | jq -r '.name')
  CNAME_VALUE=$(AWS_PROFILE=$AWS_PROFILE terraform output -json acm_validation_cname | jq -r '.value')
  CERT_ARN=$(aws acm list-certificates \
    --profile "$AWS_PROFILE" --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='ages-app.kriger.dev'].CertificateArn | [0]" \
    --output text)

  CERT_STATUS=$(aws acm describe-certificate \
    --profile "$AWS_PROFILE" --region us-east-1 \
    --certificate-arn "$CERT_ARN" \
    --query "Certificate.Status" --output text 2>/dev/null || echo "PENDING_VALIDATION")

  if [[ "$CERT_STATUS" != "ISSUED" ]]; then
    echo ""
    echo "  ┌──────────────────────────────────────────────────────────┐"
    echo "  │  AÇÃO NECESSÁRIA: Validação do certificado ACM           │"
    echo "  │                                                          │"
    echo "  │  Adicione este CNAME no Cloudflare (DNS only):           │"
    echo "  │                                                          │"
    echo "  │  Nome : $CNAME_NAME"
    echo "  │  Valor: $CNAME_VALUE"
    echo "  │                                                          │"
    echo "  │  Após adicionar, pressione Enter para continuar...       │"
    echo "  └──────────────────────────────────────────────────────────┘"
    read -r

    info "Aguardando validação do certificado ACM (pode levar alguns minutos)..."
    aws acm wait certificate-validated \
      --profile "$AWS_PROFILE" \
      --region us-east-1 \
      --certificate-arn "$CERT_ARN"
    info "Certificado validado!"
  fi

  # Segundo apply: cria o resto da infra com o cert já validado
  AWS_PROFILE=$AWS_PROFILE terraform apply -auto-approve -input=false
else
  log "[1/4] Infraestrutura — pulando (--skip-infra)"
  cd "$INFRA_DIR"
  AWS_PROFILE=$AWS_PROFILE terraform init -reconfigure -input=false
  AWS_PROFILE=$AWS_PROFILE terraform apply -auto-approve -input=false -refresh-only
fi

ECR_URL=$(AWS_PROFILE=$AWS_PROFILE terraform output -raw ecr_repository_url)
BACKEND_IP=$(AWS_PROFILE=$AWS_PROFILE terraform output -raw backend_ip)
S3_BUCKET=$(AWS_PROFILE=$AWS_PROFILE terraform output -raw s3_bucket_name)
CF_DOMAIN=$(AWS_PROFILE=$AWS_PROFILE terraform output -raw cloudfront_domain_name)
CF_ID=$(AWS_PROFILE=$AWS_PROFILE terraform output -raw cloudfront_distribution_id)
FRONTEND_DOMAIN=$(AWS_PROFILE=$AWS_PROFILE terraform output -raw frontend_domain)

info "ECR URL    : $ECR_URL"
info "Backend IP : $BACKEND_IP"
info "S3 Bucket  : $S3_BUCKET"
info "CloudFront : https://$CF_DOMAIN"

# ─── 2. Backend — build + push ECR ─────────────────────────────────────────────
log "[2/4] Backend — build e push para ECR..."
cd "$ROOT_DIR"
IMAGE_TAG=$(git rev-parse --short HEAD)

info "Login no ECR..."
aws ecr get-login-password --region "$REGION" --profile "$AWS_PROFILE" | \
  docker login --username AWS --password-stdin "$ECR_URL"

info "Build da imagem (tag: $IMAGE_TAG)..."
docker build -t "$ECR_URL:$IMAGE_TAG" -t "$ECR_URL:latest" ./backend

info "Push para ECR..."
docker push "$ECR_URL:$IMAGE_TAG"
docker push "$ECR_URL:latest"

# ─── 3. Backend — deploy na EC2 via SSM ────────────────────────────────────────
log "[3/4] Backend — deploy na EC2 via SSM..."

INSTANCE_ID=$(aws ec2 describe-instances \
  --profile "$AWS_PROFILE" \
  --region "$REGION" \
  --filters \
    "Name=tag:Name,Values=${PROJECT}-backend-ec2" \
    "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

[[ "$INSTANCE_ID" == "None" || -z "$INSTANCE_ID" ]] && \
  die "EC2 '${PROJECT}-backend-ec2' não encontrada ou não está running."

info "Instance ID: $INSTANCE_ID"

# Aguarda DNS apontar para o Elastic IP (necessário para o certbot)
info "Verificando DNS de $BACKEND_DOMAIN..."
for i in $(seq 1 5); do
  RESOLVED=$(dig +short "$BACKEND_DOMAIN" | head -1)
  if [[ "$RESOLVED" == "$BACKEND_IP" ]]; then
    info "DNS OK: $BACKEND_DOMAIN → $BACKEND_IP"
    break
  fi
  if [[ $i -eq 5 ]]; then
    echo ""
    echo "  ATENÇÃO: $BACKEND_DOMAIN resolve para '$RESOLVED'"
    echo "           Elastic IP da EC2: $BACKEND_IP"
    echo ""
    echo "  Aponte $BACKEND_DOMAIN → $BACKEND_IP no DNS (sem proxy/CDN)"
    echo "  e pressione Enter quando estiver propagado..."
    read -r
  else
    info "DNS ainda não propagado ($RESOLVED), tentando novamente em 15s... ($i/5)"
    sleep 15
  fi
done

# Aguarda SSM agent ficar online (user_data pode ainda estar rodando)
info "Aguardando SSM agent na EC2..."
for i in $(seq 1 24); do
  SSM_STATUS=$(aws ssm describe-instance-information \
    --profile "$AWS_PROFILE" \
    --region "$REGION" \
    --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
    --query "InstanceInformationList[0].PingStatus" \
    --output text 2>/dev/null || echo "None")
  [[ "$SSM_STATUS" == "Online" ]] && { info "SSM Online."; break; }
  info "SSM não disponível ainda ($i/24), aguardando 15s..."
  sleep 15
done
[[ "$SSM_STATUS" != "Online" ]] && die "EC2 não ficou disponível via SSM após 6 minutos."

# Prepara arquivos em base64
COMPOSE_B64=$(base64 -w 0 < "$ROOT_DIR/docker-compose.ec2.yml")
NGINX_B64=$(base64 -w 0 < "$ROOT_DIR/nginx/default.conf")

# Script que será executado na EC2 (tudo em base64 para evitar problemas de escaping no SSM)
EC2_SCRIPT=$(cat <<SCRIPT
#!/bin/bash
set -euo pipefail

mkdir -p /opt/${PROJECT}

echo '${COMPOSE_B64}' | base64 -d > /opt/${PROJECT}/docker-compose.yml
echo '${NGINX_B64}'   | base64 -d > /opt/${PROJECT}/nginx.conf
printf 'ECR_URL=${ECR_URL}\nIMAGE_TAG=${IMAGE_TAG}\nCORS_ALLOWED_ORIGINS=https://${FRONTEND_DOMAIN}\nDB_NAME=${DB_NAME}\nDB_USERNAME=${DB_USERNAME}\nDB_PASSWORD=${DB_PASSWORD}\n' \
  > /opt/${PROJECT}/.env

aws ecr get-login-password --region ${REGION} | \
  docker login --username AWS --password-stdin ${ECR_URL}

if [ ! -f "/etc/letsencrypt/live/${BACKEND_DOMAIN}/fullchain.pem" ]; then
  echo "==> Emitindo certificado TLS..."
  certbot certonly --standalone -d ${BACKEND_DOMAIN} \
    --non-interactive --agree-tos -m ${CERTBOT_EMAIL}
fi

cd /opt/${PROJECT}
docker-compose pull
docker-compose up -d
SCRIPT
)

SCRIPT_B64=$(printf '%s' "$EC2_SCRIPT" | base64 -w 0)

COMMAND_ID=$(aws ssm send-command \
  --profile "$AWS_PROFILE" \
  --region "$REGION" \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --comment "deploy $IMAGE_TAG" \
  --parameters "commands=[\"echo '${SCRIPT_B64}' | base64 -d | bash\"]" \
  --query "Command.CommandId" \
  --output text)

info "SSM Command ID: $COMMAND_ID"
info "Aguardando execução (primeiro deploy pode levar alguns minutos)..."

aws ssm wait command-executed \
  --profile "$AWS_PROFILE" \
  --region "$REGION" \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" 2>/dev/null || true

STATUS=$(aws ssm get-command-invocation \
  --profile "$AWS_PROFILE" \
  --region "$REGION" \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --query "Status" \
  --output text)

info "Status: $STATUS"

if [[ "$STATUS" != "Success" ]]; then
  echo "--- stdout ---"
  aws ssm get-command-invocation \
    --profile "$AWS_PROFILE" --region "$REGION" \
    --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" \
    --query "StandardOutputContent" --output text
  echo "--- stderr ---"
  aws ssm get-command-invocation \
    --profile "$AWS_PROFILE" --region "$REGION" \
    --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" \
    --query "StandardErrorContent" --output text
  die "Deploy do backend falhou (status: $STATUS)"
fi

# ─── 4. Frontend — build + S3 + CloudFront ─────────────────────────────────────
log "[4/4] Frontend — build e deploy no S3/CloudFront..."
cd "$ROOT_DIR/frontend"

info "Instalando dependências..."
bun install --frozen-lockfile

info "Build Vite..."
bun run build

info "Upload para S3..."
aws s3 sync dist/ "s3://$S3_BUCKET/" \
  --delete \
  --profile "$AWS_PROFILE" \
  --region "$REGION"

info "Invalidando cache do CloudFront..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --profile "$AWS_PROFILE" \
  --distribution-id "$CF_ID" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text)

info "Invalidation: $INVALIDATION_ID"

# ─── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Deploy concluído!"
echo ""
echo "  Frontend : https://$CF_DOMAIN"
echo "  Backend  : https://$BACKEND_DOMAIN"
echo "════════════════════════════════════════════════"
