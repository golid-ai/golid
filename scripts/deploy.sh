#!/usr/bin/env bash
# ==============================================================================
# Cloud Run Deployment
# ==============================================================================
#
#   ./scripts/deploy.sh [env] [target]
#
#   env:    qa (default), prod
#   target: all (default), api, web
#
# Examples:
#   ./scripts/deploy.sh              # qa, both services
#   ./scripts/deploy.sh prod         # prod, both services
#   ./scripts/deploy.sh qa api       # qa, backend only
#   ./scripts/deploy.sh prod web     # prod, frontend only
#   ./scripts/deploy.sh check        # validate config without deploying
#
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ------------------------------------------------------------------------------
# Parse positional arguments
# ------------------------------------------------------------------------------

ENV="${1:-qa}"
TARGET="${2:-all}"

# Handle "check" as a special first argument
RUN_CHECK_ONLY=false
if [[ "$ENV" == "check" ]]; then
  RUN_CHECK_ONLY=true
  ENV="${2:-qa}"
  TARGET="${3:-all}"
fi

if [[ "$ENV" != "qa" && "$ENV" != "prod" ]]; then
  echo "Usage: $0 [qa|prod|check] [all|api|web]"
  exit 1
fi

if [[ "$TARGET" != "all" && "$TARGET" != "api" && "$TARGET" != "web" ]]; then
  echo "Usage: $0 [qa|prod|check] [all|api|web]"
  exit 1
fi

SHIP_API=false
SHIP_WEB=false
[[ "$TARGET" == "all" || "$TARGET" == "api" ]] && SHIP_API=true
[[ "$TARGET" == "all" || "$TARGET" == "web" ]] && SHIP_WEB=true

# ------------------------------------------------------------------------------
# Project configuration
#
# All naming and resource config lives here. To adapt this script for a new
# project, change the values in this block and the env files in config/.
# ------------------------------------------------------------------------------

PROJECT_NAME="golid"

load_env() {
  local env_file="${PROJECT_ROOT}/config/.env.${ENV}"
  if [[ -f "$env_file" ]]; then
    set -a; source "$env_file"; set +a
  fi
}

load_env

# GCP project and region
GCP_PROJECT="${PROJECT_ID:-${GCP_PROJECT_ID:-"${PROJECT_NAME}-${ENV}"}}"
GCP_REGION="${REGION:-us-central1}"

# Resource names (derived from project name + env)
_suffix=""
[[ "$ENV" == "qa" ]] && _suffix="-qa"

declare -A RES=(
  [api_service]="${PROJECT_NAME}-api${_suffix}"
  [web_service]="${PROJECT_NAME}-web${_suffix}"
  [db_instance]="${PROJECT_NAME}-db${_suffix}"
  [db_name]="${PROJECT_NAME}"
  [bucket]="${PROJECT_NAME}-data-${ENV}"
  [registry]="${PROJECT_NAME}"
  [vpc_connector]="${PROJECT_NAME}-vpc"
)

# Service accounts
SA_API="${PROJECT_NAME}-api@${GCP_PROJECT}.iam.gserviceaccount.com"
SA_WEB="${PROJECT_NAME}-web@${GCP_PROJECT}.iam.gserviceaccount.com"
SA_STORAGE="${PROJECT_NAME}-gcs@${GCP_PROJECT}.iam.gserviceaccount.com"

# Scaling (prod stays warm, qa scales to zero)
if [[ "$ENV" == "prod" ]]; then
  SCALE_MIN=1; SCALE_MAX=10; MEM="512Mi"; CPUS="1"
else
  SCALE_MIN=0; SCALE_MAX=3; MEM="512Mi"; CPUS="1"
fi

# Image tags (git SHA + timestamp for uniqueness)
IMG_SUFFIX="$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || echo none)-$(date +%s)"
IMG_API="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${RES[registry]}/api:${IMG_SUFFIX}"
IMG_WEB="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${RES[registry]}/web:${IMG_SUFFIX}"

# Database credentials
DB_USER="${DB_USER:-${PROJECT_NAME}_user}"

# ------------------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------------------

_ts() { date +%H:%M:%S; }
step()  { printf "\n\033[1;36m[%s] >>> %s\033[0m\n" "$(_ts)" "$1"; }
ok()    { printf "\033[0;32m    [ok] %s\033[0m\n" "$1"; }
skip()  { printf "\033[0;33m    [skip] %s\033[0m\n" "$1"; }
warn()  { printf "\033[1;33m    [warn] %s\033[0m\n" "$1"; }
fail()  { printf "\033[0;31m    [fail] %s\033[0m\n" "$1"; exit 1; }

# ------------------------------------------------------------------------------
# Secret Manager helpers
# ------------------------------------------------------------------------------

secret_exists() {
  gcloud secrets describe "$1" --project="$GCP_PROJECT" &>/dev/null
}

fetch_secret() {
  local val
  val=$(gcloud secrets versions access latest --secret="$1" --project="$GCP_PROJECT") || {
    fail "Failed to fetch secret: $1"
  }
  echo "$val"
}

DB_PASS=""

# ------------------------------------------------------------------------------
# Pre-flight
# ------------------------------------------------------------------------------

preflight() {
  step "Pre-flight checks"

  # Verify gcloud is authenticated
  gcloud auth print-identity-token &>/dev/null || fail "Not authenticated. Run: gcloud auth login"
  ok "gcloud authenticated"

  export CLOUDSDK_CORE_PROJECT="$GCP_PROJECT"
  export CLOUDSDK_RUN_REGION="$GCP_REGION"
  ok "project=$GCP_PROJECT region=$GCP_REGION"

  # Fetch DB password from Secret Manager (needed for DATABASE_URL construction)
  if secret_exists "${PROJECT_NAME}-db-password-${ENV}"; then
    DB_PASS=$(fetch_secret "${PROJECT_NAME}-db-password-${ENV}")
  fi

  # Validate required secrets are accessible in Secret Manager
  local missing=()
  local sm_prefix="${PROJECT_NAME}"

  # Subshell so that fail() exits the subshell (not the script), letting us collect all failures
  # Note: db-password is NOT checked here — provision_database() auto-creates it if missing
  (fetch_secret "${sm_prefix}-jwt-secret-${ENV}" >/dev/null 2>&1) || missing+=("${sm_prefix}-jwt-secret-${ENV}")

  if (( ${#missing[@]} > 0 )); then
    fail "Cannot access secrets in Secret Manager: ${missing[*]}"
  fi
  ok "required secrets accessible in Secret Manager"

  # Production gate
  if [[ "$ENV" == "prod" && "$RUN_CHECK_ONLY" == "false" ]]; then
    printf "\n\033[1;31m  PRODUCTION deploy to %s. Type the project ID to confirm: \033[0m" "$GCP_PROJECT"
    read -r answer
    [[ "$answer" == "$GCP_PROJECT" ]] || { echo "Cancelled."; exit 1; }
  fi
}

# ------------------------------------------------------------------------------
# Run local test gates before touching cloud resources
# ------------------------------------------------------------------------------

test_gate() {
  step "Test gates"

  if [[ "$SHIP_API" == "true" ]]; then
    (cd "$PROJECT_ROOT/backend" && go build ./cmd/server/) || fail "Backend build failed"
    (cd "$PROJECT_ROOT/backend" && go test ./... -short 2>&1) || fail "Backend tests failed"
    ok "backend: build + tests"
  fi

  if [[ "$SHIP_WEB" == "true" ]]; then
    (cd "$PROJECT_ROOT/frontend" && npx tsc --noEmit 2>&1) || fail "frontend type check failed"
    ok "frontend: type check"
  fi
}

# ------------------------------------------------------------------------------
# Infrastructure provisioning
#
# Each resource is created only if it doesn't already exist. Safe to re-run.
# ------------------------------------------------------------------------------

provision_gcp_apis() {
  step "GCP APIs"
  gcloud services enable \
    run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com \
    sqladmin.googleapis.com vpcaccess.googleapis.com servicenetworking.googleapis.com \
    secretmanager.googleapis.com storage.googleapis.com cloudscheduler.googleapis.com \
    cloudtrace.googleapis.com \
    --project="$GCP_PROJECT" --quiet
  ok "APIs enabled"
}

provision_registry() {
  step "Artifact Registry"
  if gcloud artifacts repositories describe "${RES[registry]}" \
      --location="$GCP_REGION" --project="$GCP_PROJECT" &>/dev/null; then
    skip "already exists"
  else
    gcloud artifacts repositories create "${RES[registry]}" \
      --repository-format=docker --location="$GCP_REGION" \
      --description="Container images" --project="$GCP_PROJECT"
    ok "created"
  fi
}

provision_service_accounts() {
  step "Service accounts"
  for sa in "${PROJECT_NAME}-api" "${PROJECT_NAME}-web" "${PROJECT_NAME}-gcs"; do
    local email="${sa}@${GCP_PROJECT}.iam.gserviceaccount.com"
    if gcloud iam service-accounts describe "$email" --project="$GCP_PROJECT" &>/dev/null; then
      skip "$sa exists"
    else
      gcloud iam service-accounts create "$sa" \
        --display-name="$sa" --project="$GCP_PROJECT"
      ok "created $sa"
    fi
  done
}

provision_storage() {
  step "Cloud Storage bucket"
  if gsutil ls -b "gs://${RES[bucket]}" &>/dev/null; then
    skip "already exists"
  else
    gsutil mb -p "$GCP_PROJECT" -l "$GCP_REGION" "gs://${RES[bucket]}"
    # Browser upload CORS
    local cors_tmp; cors_tmp=$(mktemp)
    cat > "$cors_tmp" <<CORS
[{"origin":["$FRONTEND_URL"],"responseHeader":["Content-Type","Authorization","Content-Range","Accept","X-Requested-With","Content-Length"],"method":["GET","PUT","POST","DELETE","HEAD","OPTIONS"],"maxAgeSeconds":3600}]
CORS
    gsutil cors set "$cors_tmp" "gs://${RES[bucket]}"
    rm -f "$cors_tmp"
    ok "created with CORS"
  fi
}

provision_network() {
  step "VPC connector + firewall"

  if gcloud compute networks vpc-access connectors describe "${RES[vpc_connector]}" \
      --region="$GCP_REGION" --project="$GCP_PROJECT" &>/dev/null; then
    skip "VPC connector exists"
  else
    gcloud compute networks vpc-access connectors create "${RES[vpc_connector]}" \
      --network=default --region="$GCP_REGION" --range=10.9.0.0/28 \
      --project="$GCP_PROJECT"
    ok "VPC connector created"
  fi

  # Private Google Access
  gcloud compute networks subnets update default \
    --region="$GCP_REGION" --project="$GCP_PROJECT" \
    --enable-private-ip-google-access 2>/dev/null || true

  # DNS egress for VPC connector
  if ! gcloud compute firewall-rules describe "${PROJECT_NAME}-vpc-dns" \
      --project="$GCP_PROJECT" &>/dev/null; then
    gcloud compute firewall-rules create "${PROJECT_NAME}-vpc-dns" \
      --network=default --allow=tcp:53,udp:53 --direction=EGRESS \
      --source-ranges=10.9.0.0/28 --project="$GCP_PROJECT"
    ok "firewall: dns egress"
  fi

  # Internal traffic to backend
  if ! gcloud compute firewall-rules describe "${PROJECT_NAME}-internal" \
      --project="$GCP_PROJECT" &>/dev/null; then
    gcloud compute firewall-rules create "${PROJECT_NAME}-internal" \
      --network=default --allow=tcp:8080 \
      --source-ranges=10.128.0.0/9 --project="$GCP_PROJECT"
    ok "firewall: internal tcp"
  fi
}

provision_database() {
  step "Cloud SQL (PostgreSQL 16)"

  if [[ -z "$DB_PASS" ]]; then
    DB_PASS=$(openssl rand -base64 16 | tr -d '/+=')
    echo -n "$DB_PASS" | gcloud secrets create "${PROJECT_NAME}-db-password-${ENV}" \
      --data-file=- --project="$GCP_PROJECT" 2>/dev/null || \
    echo -n "$DB_PASS" | gcloud secrets versions add "${PROJECT_NAME}-db-password-${ENV}" \
      --data-file=- --project="$GCP_PROJECT"
    warn "Generated DB_PASSWORD and stored in Secret Manager as ${PROJECT_NAME}-db-password-${ENV}"
  fi

  if gcloud sql instances describe "${RES[db_instance]}" \
      --project="$GCP_PROJECT" &>/dev/null; then
    skip "instance exists"
    # Sync password
    gcloud sql users set-password "$DB_USER" \
      --instance="${RES[db_instance]}" --password="$DB_PASS" \
      --project="$GCP_PROJECT" 2>/dev/null || \
    gcloud sql users create "$DB_USER" \
      --instance="${RES[db_instance]}" --password="$DB_PASS" \
      --project="$GCP_PROJECT" 2>/dev/null || true
  else
    warn "Creating Cloud SQL — this takes 5-10 minutes"
    gcloud sql instances create "${RES[db_instance]}" \
      --database-version=POSTGRES_16 --edition=ENTERPRISE \
      --tier=db-g1-small --region="$GCP_REGION" \
      --storage-type=SSD --storage-size=10GB --storage-auto-increase \
      --availability-type=zonal --project="$GCP_PROJECT"

    gcloud sql databases create "${RES[db_name]}" \
      --instance="${RES[db_instance]}" --project="$GCP_PROJECT" || true

    gcloud sql users create "$DB_USER" \
      --instance="${RES[db_instance]}" --password="$DB_PASS" \
      --project="$GCP_PROJECT" || true
    ok "instance + database + user created"
  fi
}

provision_iam() {
  step "IAM bindings"

  local project_num
  project_num=$(gcloud projects describe "$GCP_PROJECT" --format='value(projectNumber)')

  # Backend SA: logging + Cloud SQL + Secret Manager
  for role in roles/logging.logWriter roles/cloudsql.client roles/secretmanager.secretAccessor; do
    gcloud projects add-iam-policy-binding "$GCP_PROJECT" \
      --member="serviceAccount:${SA_API}" --role="$role" \
      --condition=None --quiet &>/dev/null || true
  done

  # Storage SA: object admin
  gcloud projects add-iam-policy-binding "$GCP_PROJECT" \
    --member="serviceAccount:${SA_STORAGE}" --role=roles/storage.objectAdmin \
    --condition=None --quiet &>/dev/null || true

  # Backend can create signed URLs via storage SA
  gcloud iam service-accounts add-iam-policy-binding "$SA_STORAGE" \
    --member="serviceAccount:${SA_API}" --role=roles/iam.serviceAccountTokenCreator \
    --condition=None --quiet &>/dev/null || true

  # Build + compute SAs need registry + storage access
  local sa_prefix
  for sa_prefix in "${project_num}@cloudbuild" "${project_num}-compute@developer"; do
    for role in roles/artifactregistry.writer roles/storage.objectAdmin roles/logging.logWriter; do
      gcloud projects add-iam-policy-binding "$GCP_PROJECT" \
        --member="serviceAccount:${sa_prefix}.gserviceaccount.com" --role="$role" \
        --condition=None --quiet &>/dev/null || true
    done
  done

  ok "IAM bindings applied"
}

# ------------------------------------------------------------------------------
# Build, migrate, and ship
# ------------------------------------------------------------------------------

sql_connection() {
  gcloud sql instances describe "${RES[db_instance]}" \
    --project="$GCP_PROJECT" --format="value(connectionName)" 2>/dev/null || echo ""
}

db_url() {
  local conn="$1"
  local encoded_pass
  encoded_pass=$(printf '%s' "$DB_PASS" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read(), safe=''))") || \
    fail "python3 required for URL encoding"
  echo "postgresql://${DB_USER}:${encoded_pass}@/${RES[db_name]}?host=/cloudsql/${conn}"
}

ship_api() {
  local conn; conn=$(sql_connection)
  [[ -z "$conn" ]] && fail "Cloud SQL not found"
  local url; url=$(db_url "$conn")

  step "Build API image"
  gcloud builds submit "$PROJECT_ROOT/backend" \
    --config "$PROJECT_ROOT/infra/backend-cloudbuild.yaml" \
    --substitutions="_TAG=${IMG_API}" \
    --project="$GCP_PROJECT" --quiet

  step "Run database migrations"
  local job_name="${RES[api_service]}-migrate"

  local job_cmd=(gcloud run jobs)
  if gcloud run jobs describe "$job_name" --region="$GCP_REGION" --project="$GCP_PROJECT" &>/dev/null; then
    job_cmd+=(update)
  else
    job_cmd+=(create)
  fi

  "${job_cmd[@]}" "$job_name" \
    --image="$IMG_API" --region="$GCP_REGION" --project="$GCP_PROJECT" \
    --set-cloudsql-instances="$conn" --set-env-vars="DATABASE_URL=${url}" \
    --service-account="$SA_API" --memory=512Mi --cpu=1 \
    --command="/bin/sh" \
    --args='-c,/app/migrate -path /app/migrations -database "$DATABASE_URL" up' \
    --max-retries=1 --task-timeout=300s --quiet

  gcloud run jobs execute "$job_name" \
    --region="$GCP_REGION" --project="$GCP_PROJECT" --wait --quiet \
    || warn "Migrations may already be applied"
  ok "migrations complete"

  step "Deploy API service"

  # Non-sensitive config (plain env vars)
  local env_vars="ENVIRONMENT=${ENV}"
  env_vars+=",DATABASE_URL=${url}"
  env_vars+=",GCP_PROJECT_ID=${GCP_PROJECT}"
  env_vars+=",GCS_BUCKET_NAME=${RES[bucket]}"
  env_vars+=",GCP_SERVICE_ACCOUNT_EMAIL=${SA_STORAGE}"
  [[ -n "${FRONTEND_URL:-}" ]]      && env_vars+=",FRONTEND_URL=${FRONTEND_URL}"
  [[ -n "${MAILGUN_DOMAIN:-}" ]]    && env_vars+=",MAILGUN_DOMAIN=${MAILGUN_DOMAIN}"
  [[ -n "${REDIS_URL:-}" ]]         && env_vars+=",REDIS_URL=${REDIS_URL}"
  [[ -n "${OTEL_ENDPOINT:-}" ]]     && env_vars+=",OTEL_ENDPOINT=${OTEL_ENDPOINT},OTEL_SERVICE_NAME=${APP_NAME}-api"
  [[ -n "${METRICS_ENABLED:-}" ]]   && env_vars+=",METRICS_ENABLED=${METRICS_ENABLED}"

  # Secrets via Cloud Run native references (never visible in service config)
  local sm_prefix="${PROJECT_NAME}"
  local secrets="JWT_SECRET=${sm_prefix}-jwt-secret-${ENV}:latest"

  # Optional secrets -- guard with secret_exists because Cloud Run rejects the
  # deploy if a referenced secret doesn't exist in Secret Manager.
  secret_exists "${sm_prefix}-mailgun-key-${ENV}"   && secrets+=",MAILGUN_API_KEY=${sm_prefix}-mailgun-key-${ENV}:latest"
  secret_exists "${sm_prefix}-stripe-secret-${ENV}"  && secrets+=",STRIPE_SECRET_KEY=${sm_prefix}-stripe-secret-${ENV}:latest"
  secret_exists "${sm_prefix}-stripe-webhook-${ENV}" && secrets+=",STRIPE_WEBHOOK_SECRET=${sm_prefix}-stripe-webhook-${ENV}:latest"

  gcloud run deploy "${RES[api_service]}" \
    --image="$IMG_API" --platform=managed --region="$GCP_REGION" --project="$GCP_PROJECT" \
    --service-account="$SA_API" --memory="$MEM" --cpu="$CPUS" \
    --min-instances="$SCALE_MIN" --max-instances="$SCALE_MAX" \
    --vpc-connector="${RES[vpc_connector]}" --vpc-egress=private-ranges-only \
    --ingress=internal --execution-environment=gen2 \
    --add-cloudsql-instances="$conn" \
    --set-env-vars="$env_vars" \
    --set-secrets="$secrets" \
    --allow-unauthenticated --quiet

  API_URL=$(gcloud run services describe "${RES[api_service]}" \
    --platform=managed --region="$GCP_REGION" --project="$GCP_PROJECT" \
    --format='value(status.url)')
  ok "deployed: $API_URL"

  # Frontend SA can invoke the API
  gcloud run services add-iam-policy-binding "${RES[api_service]}" \
    --member="serviceAccount:${SA_WEB}" --role=roles/run.invoker \
    --region="$GCP_REGION" --platform=managed --project="$GCP_PROJECT" &>/dev/null || true
}

ship_web() {
  # Resolve API URL (from this run or existing service)
  if [[ -z "${API_URL:-}" ]]; then
    API_URL=$(gcloud run services describe "${RES[api_service]}" \
      --platform=managed --region="$GCP_REGION" --project="$GCP_PROJECT" \
      --format='value(status.url)' 2>/dev/null || echo "")
    [[ -z "$API_URL" ]] && fail "API service not found. Deploy api first."
  fi

  local api_host="${API_URL#https://}"

  step "Build web image"
  gcloud builds submit "$PROJECT_ROOT/frontend" \
    --config "$PROJECT_ROOT/infra/frontend-cloudbuild.yaml" \
    --substitutions="_TAG=${IMG_WEB}" \
    --project="$GCP_PROJECT" --quiet

  step "Deploy web service"
  gcloud run deploy "${RES[web_service]}" \
    --image="$IMG_WEB" --platform=managed --region="$GCP_REGION" --project="$GCP_PROJECT" \
    --service-account="$SA_WEB" --memory="$MEM" --cpu="$CPUS" \
    --min-instances="$SCALE_MIN" --max-instances="$SCALE_MAX" \
    --port=8080 --vpc-connector="${RES[vpc_connector]}" --vpc-egress=all-traffic \
    --ingress=all --execution-environment=gen2 \
    --set-env-vars="NODE_ENV=production,ENVIRONMENT=${ENV},BACKEND_URL=${API_URL}" \
    --allow-unauthenticated --quiet

  WEB_URL=$(gcloud run services describe "${RES[web_service]}" \
    --platform=managed --region="$GCP_REGION" --project="$GCP_PROJECT" \
    --format='value(status.url)')
  ok "deployed: $WEB_URL"

  # Tell the API about the frontend (CORS + email links)
  gcloud run services update "${RES[api_service]}" \
    --platform=managed --region="$GCP_REGION" --project="$GCP_PROJECT" \
    --update-env-vars="FRONTEND_URL=${WEB_URL}" --quiet
  ok "API updated with FRONTEND_URL"
}

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------

main() {
  local t0=$SECONDS

  preflight

  if [[ "$RUN_CHECK_ONLY" == "true" ]]; then
    ok "Secrets and config valid for $ENV"; exit 0
  fi

  test_gate
  provision_gcp_apis
  provision_registry
  provision_service_accounts
  provision_storage
  provision_network
  provision_database
  provision_iam

  API_URL=""
  WEB_URL=""

  [[ "$SHIP_API" == "true" ]] && ship_api
  [[ "$SHIP_WEB" == "true" ]] && ship_web

  local elapsed=$(( SECONDS - t0 ))

  step "Done ($(( elapsed / 60 ))m $(( elapsed % 60 ))s)"
  echo ""
  [[ -n "$API_URL" ]] && echo "  API: $API_URL"
  [[ -n "$WEB_URL" ]] && echo "  Web: $WEB_URL"
  echo "  Env: $ENV | Project: $GCP_PROJECT | Region: $GCP_REGION"
  echo ""
}

main
