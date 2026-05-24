variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "project" {
  description = "Project name prefix"
  type        = string
  default     = "wsssguardo"
}

variable "certbot_email" {
  description = "Email para notificações do Let's Encrypt"
  type        = string
  default     = "jpsk145@gmail.com"
}

variable "domain" {
  description = "Domínio do backend"
  type        = string
  default     = "ages-api.kriger.dev"
}

variable "frontend_domain" {
  description = "Domínio customizado do frontend"
  type        = string
  default     = "ages-app.kriger.dev"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  nullable    = false

  validation {
    condition     = length(trimspace(var.grafana_password)) > 0
    error_message = "grafana_password must be provided and must not be empty."
  }
}

variable "grafana_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
  nullable    = false

  validation {
    condition     = length(trim(var.grafana_password)) > 0
    error_message = "grafana_password must not be empty."
  }
}