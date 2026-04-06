locals {
  bucket_name = "${var.project}-frontend"
  oac_name    = "${var.project}-frontend-oac"

    tags = {
        Project     = var.project
        ManagedBy   = "terraform-hosting"
    }
}

# -------------------------------------------------------------------------
# S3 — Armazenamento da build do Frontend
# -------------------------------------------------------------------------

resource "aws_s3_bucket" "frontend" {
  bucket = local.bucket_name
  tags = local.tags
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend"{
    bucket = aws_s3_bucket.frontend.id
    block_public_acls = true
    block_public_policy = true
    ignore_public_acls = true
    restrict_public_buckets = true
}

# -------------------------------------------------------------------------
# Cloudfront OAC — Controle de acesso
# -------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "frontend" {
  name = local.oac_name
  origin_access_control_origin_type = "s3"
  signing_behavior = "always"
  signing_protocol = "sigv4"
}

# -------------------------------------------------------------------------
# Cloudfront Distribution — CDN para o Frontend
# -------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "frontend" {
  enabled = true
  is_ipv6_enabled = true
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id = aws_s3_bucket.frontend.id
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  default_cache_behavior {
    target_origin_id = aws_s3_bucket.frontend.id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods = [ "GET", "HEAD" ]
    cached_methods =  [ "GET", "HEAD" ]
    min_ttl = 0
    default_ttl = 86400
    max_ttl = 31536000
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  custom_error_response {
    error_code = 403
    response_code = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code = 404
    response_code = 200
    response_page_path = "/index.html"
  }
}

# -------------------------------------------------------------------------
# Bucket Policy — Permitir acesso do Cloudfront ao S3
# -------------------------------------------------------------------------

data "aws_iam_policy_document" "frontend" {
  statement {
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]
    principals {
      type = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test = "StringEquals"
      variable = "AWS:SourceArn"
      values = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend.json
  depends_on = [ aws_s3_bucket_public_access_block.frontend ]
}