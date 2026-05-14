locals {
  obs_sg_name  = "${var.project}-obs-sg"
  obs_iam_name = "${var.project}-obs-IAM"
  obs_ec2_name = "${var.project}-obs-ec2"
  obs_tags = {
    Project   = var.project
    ManagedBy = "terraform-obs"
  }
}

# ---------------------------------------------------------------------------
# AMI ARM64 — Amazon Linux 2023 para t4g
# ---------------------------------------------------------------------------

data "aws_ami" "amazon_linux_2023_arm64" {
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

# ---------------------------------------------------------------------------
# Security Group — sem ingress público, só egress
# ---------------------------------------------------------------------------

resource "aws_security_group" "obs" {
  name   = local.obs_sg_name
  vpc_id = data.aws_vpc.default.id
  tags   = local.obs_tags

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ---------------------------------------------------------------------------
# Regras no SG do backend — permite scrape apenas da EC2 de observabilidade
# ---------------------------------------------------------------------------

# Permite nginx do backend proxiar o Grafana
resource "aws_security_group_rule" "obs_grafana_from_backend" {
  type                     = "ingress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  security_group_id        = aws_security_group.obs.id
  source_security_group_id = aws_security_group.backend.id
  description              = "Grafana - proxy via nginx do backend"
}

# Permite Promtail do backend enviar logs pro Loki
resource "aws_security_group_rule" "obs_loki_from_backend" {
  type                     = "ingress"
  from_port                = 3100
  to_port                  = 3100
  protocol                 = "tcp"
  security_group_id        = aws_security_group.obs.id
  source_security_group_id = aws_security_group.backend.id
  description              = "Loki - recebe logs do Promtail do backend"
}

resource "aws_security_group_rule" "backend_actuator_from_obs" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  security_group_id        = aws_security_group.backend.id
  source_security_group_id = aws_security_group.obs.id
  description              = "Prometheus scrape - Spring Boot actuator"
}

resource "aws_security_group_rule" "backend_node_exporter_from_obs" {
  type                     = "ingress"
  from_port                = 9100
  to_port                  = 9100
  protocol                 = "tcp"
  security_group_id        = aws_security_group.backend.id
  source_security_group_id = aws_security_group.obs.id
  description              = "Prometheus scrape - node exporter"
}

# ---------------------------------------------------------------------------
# IAM Role — acesso SSM (sem chave SSH necessária)
# ---------------------------------------------------------------------------

resource "aws_iam_role" "obs" {
  name = local.obs_iam_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "obs_ssm" {
  role       = aws_iam_role.obs.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "obs" {
  name = local.obs_iam_name
  role = aws_iam_role.obs.name
}

# ---------------------------------------------------------------------------
# EC2 t4g.small (ARM) — Grafana + Prometheus, sem IP público
# ---------------------------------------------------------------------------

resource "aws_instance" "obs" {
  ami                    = data.aws_ami.amazon_linux_2023_arm64.id
  instance_type          = "t4g.small"
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.obs.id]
  iam_instance_profile   = aws_iam_instance_profile.obs.name
  tags                   = merge(local.obs_tags, { Name = local.obs_ec2_name })

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e

    dnf update -y
    dnf install -y docker

    systemctl enable --now docker

    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-aarch64 \
      -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    mkdir -p /opt/${var.project}-obs
  EOF
}
