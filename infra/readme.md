# Infra

Terraform configuration that provisions the AWS infrastructure for the frontend.

## What it creates

| Resource | Description |
|---|---|
| `aws_s3_bucket` | Private S3 bucket that holds the built frontend assets |
| `aws_cloudfront_origin_access_control` | OAC so CloudFront can read from the private bucket |
| `aws_cloudfront_distribution` | CDN that serves the frontend over HTTPS globally |

SPA routing is handled by returning `index.html` for 403/404 responses from S3.

## Requirements

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.6
- AWS credentials configured (`aws configure` or environment variables)

## Usage

```bash
cd infra

# First time only
terraform init

# Preview changes
terraform plan -var="environment=dev"

# Apply
terraform apply -var="environment=dev"
```

After `apply`, Terraform prints the CloudFront URL:

```
cloudfront_domain_name = "https://xxxx.cloudfront.net"
```

## Deploying the frontend build

```bash
# Build the frontend
cd ../frontend && bun run build

# Sync dist/ to S3
aws s3 sync dist/ s3://$(terraform -chdir=../infra output -raw frontend_bucket_name) --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=../infra output -raw cloudfront_distribution_id) \
  --paths "/*"
```

## Variables

| Name | Default | Description |
|---|---|---|
| `aws_region` | `us-east-1` | AWS region |
| `project` | `wsssguardo` | Prefix for resource names |
| `environment` | `dev` | Environment tag (dev / staging / prod) |
