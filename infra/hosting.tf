locals {
  bucket_name  = "${var.project}-frontend"
  oac_name     = "${var.project}-frontend-oac"
  hosting_tags = {
    Project   = var.project
    ManagedBy = "terraform-hosting"
  }
}

# -------------------------------------------------------------------------
# S3 — Armazenamento da build do Frontend
# -------------------------------------------------------------------------

resource "aws_s3_bucket" "frontend" {
  bucket        = local.bucket_name
  force_destroy = true
  tags          = local.hosting_tags
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -------------------------------------------------------------------------
# ACM — Certificado TLS para o domínio customizado (obrigatório us-east-1)
# -------------------------------------------------------------------------

resource "aws_acm_certificate" "frontend" {
  provider          = aws.us_east_1
  domain_name       = var.frontend_domain
  validation_method = "DNS"
  tags              = local.hosting_tags

  lifecycle {
    create_before_destroy = true
  }
}

# -------------------------------------------------------------------------
# CloudFront Function — SPA routing (reescreve rotas do React para index.html)
# -------------------------------------------------------------------------

resource "aws_cloudfront_function" "spa_routing" {
  name    = "${var.project}-spa-routing"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var uri = event.request.uri;
      if (!uri.startsWith('/api/') && !uri.includes('.')) {
        event.request.uri = '/index.html';
      }
      return event.request;
    }
  EOT
}

# -------------------------------------------------------------------------
# Cloudfront OAC — Controle de acesso
# -------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = local.oac_name
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# -------------------------------------------------------------------------
# Cloudfront Distribution — CDN para o Frontend
# -------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [var.frontend_domain]

  # Origin 1: S3 — arquivos estáticos do frontend
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.frontend.id
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # Origin 2: EC2 — backend (nginx com TLS)
  origin {
    domain_name = var.domain
    origin_id   = "backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.frontend.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Behavior /api/* → backend (sem cache)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "backend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    forwarded_values {
      query_string = true
      headers      = ["Origin", "Authorization", "Content-Type", "Accept"]
      cookies {
        forward = "all"
      }
    }
  }

  # Behavior default → S3 (com cache)
  default_cache_behavior {
    target_origin_id       = aws_s3_bucket.frontend.id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_routing.arn
    }
  }

  depends_on = [aws_acm_certificate.frontend]
}

# -------------------------------------------------------------------------
# Bucket Policy — Permitir acesso do Cloudfront ao S3
# -------------------------------------------------------------------------

data "aws_iam_policy_document" "frontend" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket     = aws_s3_bucket.frontend.id
  policy     = data.aws_iam_policy_document.frontend.json
  depends_on = [aws_s3_bucket_public_access_block.frontend]
}
