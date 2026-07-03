#!/usr/bin/env bash
#
# Refactor Customer -> Company across backend (Java) and frontend (TS).
#
# Scope: see arrays MOVES and TARGETS below. Idempotent (safe to re-run).
#
# Explicitly excluded:
#   - backend/src/main/resources/db/changelog/migrations/0002-create-initial-project-entities.xml
#     and 0003-add-seed-data.xml: Liquibase checksum stability. Their schema is
#     superseded by 0010 renames at runtime.
#   - 0010-sprint3-database-update.xml: contains literal references to the
#     OLD constraint names (pk_customers, fk_projects_on_customer) that are
#     the source operand of the ALTER...RENAME statements.
#   - backend/readme.md: edited manually upstream of this script.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# ---- Phase 1: file renames -------------------------------------------------

declare -a MOVES=(
  "backend/src/main/java/wsssguardo/customer/Customer.java:backend/src/main/java/wsssguardo/company/Company.java"
  "backend/src/main/java/wsssguardo/customer/controller/CustomerController.java:backend/src/main/java/wsssguardo/company/controller/CompanyController.java"
  "backend/src/main/java/wsssguardo/customer/dto/requestdto/CustomerRequestDTO.java:backend/src/main/java/wsssguardo/company/dto/requestdto/CompanyRequestDTO.java"
  "backend/src/main/java/wsssguardo/customer/dto/requestdto/CustomerUpdateRequestDTO.java:backend/src/main/java/wsssguardo/company/dto/requestdto/CompanyUpdateRequestDTO.java"
  "backend/src/main/java/wsssguardo/customer/dto/responsedto/CustomerResponseDTO.java:backend/src/main/java/wsssguardo/company/dto/responsedto/CompanyResponseDTO.java"
  "backend/src/main/java/wsssguardo/customer/dto/responsedto/CustomerWithProjectsDTO.java:backend/src/main/java/wsssguardo/company/dto/responsedto/CompanyWithProjectsDTO.java"
  "backend/src/main/java/wsssguardo/customer/mapper/CustomerMapper.java:backend/src/main/java/wsssguardo/company/mapper/CompanyMapper.java"
  "backend/src/main/java/wsssguardo/customer/mapper/CustomerUpdateMapper.java:backend/src/main/java/wsssguardo/company/mapper/CompanyUpdateMapper.java"
  "backend/src/main/java/wsssguardo/customer/repository/CustomerRepository.java:backend/src/main/java/wsssguardo/company/repository/CompanyRepository.java"
  "backend/src/main/java/wsssguardo/customer/service/CustomerService.java:backend/src/main/java/wsssguardo/company/service/CompanyService.java"
  "backend/src/test/java/wsssguardo/customer/service/CustomerServiceTest.java:backend/src/test/java/wsssguardo/company/service/CompanyServiceTest.java"
)

echo "==> Phase 1: rename files (git mv preserves history)"
for pair in "${MOVES[@]}"; do
  src="${pair%%:*}"
  dst="${pair##*:}"
  if [[ -f "$src" ]]; then
    mkdir -p "$(dirname "$dst")"
    # Remove any empty stub file at destination (leftover from prior attempts)
    [[ -e "$dst" && ! -s "$dst" ]] && rm -f "$dst"
    if [[ -e "$dst" ]]; then
      echo "  ERROR: destination already exists and is non-empty: $dst" >&2
      exit 1
    fi
    git mv "$src" "$dst"
    echo "  moved $src -> $dst"
  elif [[ -f "$dst" ]]; then
    echo "  already moved: $dst"
  else
    echo "  WARN: neither src nor dst exists for pair $pair" >&2
  fi
done

# Remove empty leftover dirs (untracked, from prior partial refactors)
for d in \
  backend/src/main/java/wsssguardo/customer \
  backend/src/test/java/wsssguardo/customer \
  backend/src/main/java/wsssguardo/company \
  backend/src/test/java/wsssguardo/company; do
  [[ -d "$d" ]] && find "$d" -type d -empty -delete 2>/dev/null || true
done

# ---- Phase 2: content substitution -----------------------------------------

declare -a TARGETS=(
  # Backend main
  backend/src/main/java/wsssguardo/company/Company.java
  backend/src/main/java/wsssguardo/company/controller/CompanyController.java
  backend/src/main/java/wsssguardo/company/dto/requestdto/CompanyRequestDTO.java
  backend/src/main/java/wsssguardo/company/dto/requestdto/CompanyUpdateRequestDTO.java
  backend/src/main/java/wsssguardo/company/dto/responsedto/CompanyResponseDTO.java
  backend/src/main/java/wsssguardo/company/dto/responsedto/CompanyWithProjectsDTO.java
  backend/src/main/java/wsssguardo/company/mapper/CompanyMapper.java
  backend/src/main/java/wsssguardo/company/mapper/CompanyUpdateMapper.java
  backend/src/main/java/wsssguardo/company/repository/CompanyRepository.java
  backend/src/main/java/wsssguardo/company/service/CompanyService.java
  backend/src/main/java/wsssguardo/project/Project.java
  backend/src/main/java/wsssguardo/project/dto/ProjectCreateRequest.java
  backend/src/main/java/wsssguardo/project/dto/ProjectUpdateRequest.java
  backend/src/main/java/wsssguardo/project/dto/ProjectResponse.java
  backend/src/main/java/wsssguardo/project/mapper/ProjectMapper.java
  backend/src/main/java/wsssguardo/project/repository/ProjectRepository.java
  backend/src/main/java/wsssguardo/project/service/ProjectService.java
  # Backend tests
  backend/src/test/java/wsssguardo/company/service/CompanyServiceTest.java
  backend/src/test/java/wsssguardo/project/controller/ProjectControllerIntegrationTest.java
  backend/src/test/java/wsssguardo/project/service/ProjectServiceTest.java
  backend/src/test/java/wsssguardo/risk/controller/RiskControllerIntegrationTest.java
  backend/src/test/java/wsssguardo/find/controller/FindControllerIntegrationTest.java
  # Frontend
  frontend/src/api/company.ts
  frontend/src/api/project.ts
  frontend/src/api/project.test.ts
  frontend/src/pages/Companies.tsx
)

echo "==> Phase 2: content substitution"
for f in "${TARGETS[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "  skip (not found): $f"
    continue
  fi
  # Order matters: plurals before singulars so 'customers' isn't half-rewritten.
  sed -i \
    -e 's/CUSTOMERS/COMPANIES/g' \
    -e 's/Customers/Companies/g' \
    -e 's/customers/companies/g' \
    -e 's/CUSTOMER/COMPANY/g' \
    -e 's/Customer/Company/g' \
    -e 's/customer/company/g' \
    "$f"
  echo "  rewrote $f"
done

# ---- Phase 3: verification -------------------------------------------------

echo "==> Phase 3: residual 'customer' check (excluding allowed files)"
RESIDUAL=$(git grep -in 'customer' -- \
  ':!backend/src/main/resources/db/changelog/migrations/0002-create-initial-project-entities.xml' \
  ':!backend/src/main/resources/db/changelog/migrations/0003-add-seed-data.xml' \
  ':!backend/src/main/resources/db/changelog/migrations/0010-sprint3-database-update.xml' \
  ':!scripts/refactor-customer-to-company.sh' \
  || true)

if [[ -n "$RESIDUAL" ]]; then
  echo "$RESIDUAL"
  echo ""
  echo "FAIL: residual 'customer' references outside ignored files." >&2
  exit 1
fi

echo "  OK: no residual references."
echo ""
echo "==> Done. Inspect: git status; git diff --stat"
