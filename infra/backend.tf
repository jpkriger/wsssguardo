locals {
  ecr_name = "${var.project}-backend-ecr"
  iam_role_name = "${var.project}-backend-IAM"
  key_name = "${var.project}-backend-key"

  tags = {
    Project     = var.project
    ManagedBy   = "terraform-backend"
  }
}

# ---------------------------------------------------------------------------
# ECR - Repositório de imagens de container
# ---------------------------------------------------------------------------

resource "aws_ecr_repository" "backend" {
  name = local.ecr_name
  tags = local.tags
  
  image_scanning_configuration {
    scan_on_push = true
  }

}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
        {
            rulePriority = 1
            description = "Armezena apenas as três imagens mais recentes"
            selection = {
                tagStatus = "any"
                countType = "imageCountMoreThan"
                countNumber = 3
            }
            action = {
                type = "expire"
            }
        }
    ]
  })
}

# ---------------------------------------------------------------------------
# IAM Role + Profile - Define permissões da EC2
# ---------------------------------------------------------------------------

resource "aws_iam_role" "backend" {
  name = local.iam_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
            Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backend" {
  role = aws_iam_role.backend.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "backend" {
  name = local.iam_role_name
  role = aws_iam_role.backend.name
}

# ---------------------------------------------------------------------------
# Key Pair SSH - Acesso Seguro na EC2
# ---------------------------------------------------------------------------

resource "tls_private_key" "backend" {
  algorithm = "RSA"
  rsa_bits = 4096
}

resource "local_file" "backend" {
  content = tls_private_key.backend.private_key_pem
  filename = "${path.module}/backend.pem"
  file_permission = "0400"
}

resource "aws_key_pair" "backend" {
  key_name = local.key_name
  public_key = tls_private_key.backend.public_key_openssh
}
