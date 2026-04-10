output "cloudfront_domain_name" {
  description = "A URL gerada pelo CloudFront para acessar o site"
  value = aws_cloudfront_distribution.frontend.domain_name
  
}

output "s3_bucket_name" {
  description = "O nome do bucket S3 onde os arquivos do Vite devem ser enviados"
  value = aws_s3_bucket.frontend.id
}