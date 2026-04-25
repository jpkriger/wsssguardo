locals {
  ecr_name      = "${var.project}-backend-ecr"
  iam_role_name = "${var.project}-backend-IAM"
  sg_name       = "${var.project}-backend-sg"
  ec2_name      = "${var.project}-backend-ec2"
  eip_name      = "${var.project}-backend-eip"
  tags = {
    Project     = var.project
    ManagedBy   = "terraform-backend"
  }
}

# ---------------------------------------------------------------------------
# ECR - Repositório de imagens de container
# ---------------------------------------------------------------------------

resource "aws_ecr_repository" "backend" {
  name         = local.ecr_name
  force_delete = true
  tags         = local.tags

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

resource "aws_iam_role_policy_attachment" "backend_ecr" {
  role = aws_iam_role.backend.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "backend_ssm" {
  role       = aws_iam_role.backend.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "backend" {
  name = local.iam_role_name
  role = aws_iam_role.backend.name
}

# ---------------------------------------------------------------------------
# Data Sources — AMI e VPC default
# ---------------------------------------------------------------------------

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ---------------------------------------------------------------------------
# Security Group — Tráfego HTTP/HTTPS para o Nginx
# ---------------------------------------------------------------------------

resource "aws_security_group" "backend" {
  name   = local.sg_name
  vpc_id = data.aws_vpc.default.id
  tags   = local.tags

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ---------------------------------------------------------------------------
# EC2 — t4g.small ARM (Amazon Linux 2023 arm64)
# ---------------------------------------------------------------------------

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t4g.small"
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.backend.id]
  iam_instance_profile   = aws_iam_instance_profile.backend.name
  tags                   = merge(local.tags, { Name = local.ec2_name })

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Pacotes
    dnf update -y
    dnf install -y docker certbot

    # Docker
    systemctl enable --now docker
    usermod -aG docker ec2-user

    # Docker Compose
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-aarch64 \
      -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Login no ECR
    aws ecr get-login-password --region ${var.aws_region} | \
      docker login --username AWS --password-stdin ${aws_ecr_repository.backend.repository_url}

    # Diretório da aplicação
    mkdir -p /opt/${var.project}

    # Cron de renovação automática do certificado
    echo "0 3 * * * root certbot renew --quiet --pre-hook 'docker stop nginx || true' --post-hook 'docker start nginx || true'" \
      > /etc/cron.d/certbot-renew
  EOF
}

# ---------------------------------------------------------------------------
# Elastic IP — IP fixo para o backend
# ---------------------------------------------------------------------------

resource "aws_eip" "backend" {
  instance = aws_instance.backend.id
  domain   = "vpc"
  tags     = merge(local.tags, { Name = local.eip_name })
}

