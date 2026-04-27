#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-dev}"
PROJECT="wsssguardo"
REGION="us-east-2"
BOOTSTRAP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../infra/bootstrap" && pwd)"

BUCKET_NAME="${PROJECT}-tf-${ENVIRONMENT}"

echo "==> Ambiente    : ${ENVIRONMENT}"
echo "==> Bootstrap   : ${BOOTSTRAP_DIR}"

# Verifica dependências
for cmd in terraform aws; do
  if ! command -v "${cmd}" &>/dev/null; then
    echo "ERRO: '${cmd}' não encontrado."
    exit 1
  fi
done

echo "==> Credenciais AWS:"
aws sts get-caller-identity --output table --no-cli-pager

echo ""
echo "==> terraform init..."
terraform -chdir="${BOOTSTRAP_DIR}" init -reconfigure

echo ""
echo "==> Verificando se recursos já existem na AWS..."

if aws s3api head-bucket --bucket "${BUCKET_NAME}" --region "${REGION}" 2>/dev/null; then
  echo "    Bucket já existe — importando para o state local..."
  terraform -chdir="${BOOTSTRAP_DIR}" import \
    -var="environment=${ENVIRONMENT}" \
    aws_s3_bucket.tfstate "${BUCKET_NAME}" 2>/dev/null || true
fi

echo ""
echo "==> terraform apply..."
terraform -chdir="${BOOTSTRAP_DIR}" apply \
  -var="environment=${ENVIRONMENT}" \
  -auto-approve

echo ""
echo "==> Recursos prontos:"
echo "    S3 bucket  : ${BUCKET_NAME}"
echo ""
echo "==> Adicione ao bloco terraform {} em infra/providers.tf:"
echo ""
cat <<EOF
  backend "s3" {
    bucket       = "${BUCKET_NAME}"
    key          = "terraform.tfstate"
    region       = "${REGION}"
    use_lockfile = true
    encrypt      = true
  }
EOF
