terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket       = "wsssguardo-tf-prod"
    key          = "terraform.tfstate"
    region       = "us-east-2"
    use_lockfile = true
    encrypt      = true
  }
}

provider "aws" {
  region = var.aws_region
}

# ACM para CloudFront obrigatoriamente em us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
