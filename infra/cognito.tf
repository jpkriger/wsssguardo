locals {
  cognito_tags = {
    Project   = var.project
    ManagedBy = "terraform-cognito"
  }
}

# -------------------------------------------------------------------------
# Cognito User Pool
# -------------------------------------------------------------------------

resource "aws_cognito_user_pool" "main" {
  name = "${var.project}-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "ON"

  software_token_mfa_configuration {
    enabled = true
  }

  password_policy {
    minimum_length                   = 12
    require_uppercase                = true
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  schema {
    name                = "given_name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "family_name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  tags = local.cognito_tags
}

# -------------------------------------------------------------------------
# Cognito App Client — cliente confidencial (backend)
# -------------------------------------------------------------------------

resource "aws_cognito_user_pool_client" "backend" {
  name         = "${var.project}-backend-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = true

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  prevent_user_existence_errors = "ENABLED"
}

# -------------------------------------------------------------------------
# IAM — Permissão para o EC2 do backend chamar o Cognito
# -------------------------------------------------------------------------

resource "aws_iam_role_policy" "backend_cognito" {
  name = "${var.project}-backend-cognito"
  role = aws_iam_role.backend.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:InitiateAuth",
          "cognito-idp:RespondToAuthChallenge",
          "cognito-idp:AssociateSoftwareToken",
          "cognito-idp:VerifySoftwareToken",
          "cognito-idp:GlobalSignOut",
          "cognito-idp:ListUsers",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:GetUserPoolMfaConfig",
        ]
        Resource = aws_cognito_user_pool.main.arn
      }
    ]
  })
}
