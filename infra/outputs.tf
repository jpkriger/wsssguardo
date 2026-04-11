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