output "bucket_name" {
  description = "Nome do bucket S3 para o tfstate"
  value       = aws_s3_bucket.tfstate.id
}
