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
