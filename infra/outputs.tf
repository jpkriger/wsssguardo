output "cloudfront_domain_name" {
  description = "A URL gerada pelo CloudFront para acessar o site"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "ID da distribuição CloudFront para invalidação de cache"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_domain" {
  description = "Domínio customizado do frontend"
  value       = var.frontend_domain
}

output "acm_validation_cname" {
  description = "CNAME para validar o certificado ACM no Cloudflare"
  value = {
    name  = tolist(aws_acm_certificate.frontend.domain_validation_options)[0].resource_record_name
    value = tolist(aws_acm_certificate.frontend.domain_validation_options)[0].resource_record_value
  }
}

output "s3_bucket_name" {
  description = "O nome do bucket S3 onde os arquivos do Vite devem ser enviados"
  value = aws_s3_bucket.frontend.id
}

output "backend_ip" {
  description = "IP público fixo do backend — aponte o DNS para este endereço"
  value       = aws_eip.backend.public_ip
}

output "ecr_repository_url" {
  description = "URL do repositório ECR para push de imagens"
  value       = aws_ecr_repository.backend.repository_url
}

output "backend_private_ip" {
  description = "IP privado da EC2 do backend (usado pelo Prometheus para scrape)"
  value       = aws_instance.backend.private_ip
}

output "obs_instance_id" {
  description = "Instance ID da EC2 de observabilidade (para acesso via SSM)"
  value       = aws_instance.obs.id
}

output "obs_private_ip" {
  description = "IP privado da EC2 de observabilidade (usado pelo nginx do backend)"
  value       = aws_instance.obs.private_ip
}

# -------------------------------------------------------------------------
# Cognito
# -------------------------------------------------------------------------

output "cognito_user_pool_id" {
  description = "ID do Cognito User Pool — usado como COGNITO_USER_POOL_ID no backend"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "ID do App Client — usado como COGNITO_CLIENT_ID no backend"
  value       = aws_cognito_user_pool_client.backend.id
}

output "cognito_client_secret" {
  description = "Secret do App Client — usado como COGNITO_CLIENT_SECRET no backend"
  value       = aws_cognito_user_pool_client.backend.client_secret
  sensitive   = true
}

output "cognito_region" {
  description = "Região do Cognito — usado como COGNITO_REGION no backend"
  value       = var.aws_region
}