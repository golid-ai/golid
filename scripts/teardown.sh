#!/usr/bin/env bash
# ==============================================================================
# Cloud Run Teardown
# ==============================================================================
#
#   ./scripts/teardown.sh [env] [scope]
#
#   env:   qa (default), prod
#   scope: services (default), full
#
#   "services" removes Cloud Run services + service accounts.
#   "full" also removes Artifact Registry, VPC connector, and firewall rules.
#
#   Cloud SQL and GCS buckets are NEVER deleted by this script (data loss risk).
#   Delete them manually in the console if needed.
#
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ------------------------------------------------------------------------------
# Arguments
# ------------------------------------------------------------------------------

ENV="${1:-qa}"
SCOPE="${2:-services}"

if [[ "$ENV" != "qa" && "$ENV" != "prod" ]]; then
  echo "Usage: $0 [qa|prod] [services|full]"; exit 1
fi
if [[ "$SCOPE" != "services" && "$SCOPE" != "full" ]]; then
  echo "Usage: $0 [qa|prod] [services|full]"; exit 1
fi

# ------------------------------------------------------------------------------
# Config (mirrors deploy.sh naming)
# ------------------------------------------------------------------------------

PROJECT_NAME="golid"

# Load env file for PROJECT_ID override
env_file="${PROJECT_ROOT}/config/.env.${ENV}"
[[ -f "$env_file" ]] && { set -a; source "$env_file"; set +a; }

GCP_PROJECT="${PROJECT_ID:-${GCP_PROJECT_ID:-"${PROJECT_NAME}-${ENV}"}}"
GCP_REGION="${REGION:-us-central1}"

API_SVC="${PROJECT_NAME}-api$([ "$ENV" = "qa" ] && echo "-qa")"
WEB_SVC="${PROJECT_NAME}-web$([ "$ENV" = "qa" ] && echo "-qa")"
REGISTRY="${PROJECT_NAME}"
VPC_CONN="${PROJECT_NAME}-vpc"

SA_NAMES=("${PROJECT_NAME}-api" "${PROJECT_NAME}-web" "${PROJECT_NAME}-gcs")

# ------------------------------------------------------------------------------
# Confirmation
# ------------------------------------------------------------------------------

echo ""
printf "\033[1;31m"
echo "  TEARDOWN: $ENV environment in $GCP_PROJECT"
echo ""
echo "  Will delete:"
echo "    - Cloud Run: $API_SVC, $WEB_SVC"
echo "    - Service accounts: ${SA_NAMES[*]}"
if [[ "$SCOPE" == "full" ]]; then
  echo "    - Artifact Registry: $REGISTRY"
  echo "    - VPC connector: $VPC_CONN"
  echo "    - Firewall rules: ${PROJECT_NAME}-vpc-dns, ${PROJECT_NAME}-internal"
fi
echo ""
echo "  NOT deleted (manual only): Cloud SQL, GCS buckets"
printf "\033[0m\n"

if [[ "$ENV" == "prod" ]]; then
  printf "  Type the project ID to confirm: "
  read -r answer
  [[ "$answer" == "$GCP_PROJECT" ]] || { echo "Cancelled."; exit 1; }
else
  printf "  Type 'yes' to confirm: "
  read -r answer
  [[ "$answer" == "yes" ]] || { echo "Cancelled."; exit 1; }
fi

echo ""

# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------

try_delete() {
  local label="$1"; shift
  if "$@" 2>/dev/null; then
    printf "  \033[0;32m[deleted]\033[0m %s\n" "$label"
  else
    printf "  \033[0;33m[not found]\033[0m %s\n" "$label"
  fi
}

# ------------------------------------------------------------------------------
# Remove services
# ------------------------------------------------------------------------------

echo "Removing Cloud Run services..."

# Migration job (if exists)
try_delete "${API_SVC}-migrate (job)" \
  gcloud run jobs delete "${API_SVC}-migrate" \
    --region="$GCP_REGION" --project="$GCP_PROJECT" --quiet

try_delete "$API_SVC" \
  gcloud run services delete "$API_SVC" \
    --region="$GCP_REGION" --project="$GCP_PROJECT" --quiet

try_delete "$WEB_SVC" \
  gcloud run services delete "$WEB_SVC" \
    --region="$GCP_REGION" --project="$GCP_PROJECT" --quiet

echo ""
echo "Removing service accounts..."

for sa in "${SA_NAMES[@]}"; do
  try_delete "$sa" \
    gcloud iam service-accounts delete "${sa}@${GCP_PROJECT}.iam.gserviceaccount.com" \
      --project="$GCP_PROJECT" --quiet
done

# ------------------------------------------------------------------------------
# Full teardown (shared infra)
# ------------------------------------------------------------------------------

if [[ "$SCOPE" == "full" ]]; then
  echo ""
  echo "Removing shared infrastructure..."

  try_delete "registry: $REGISTRY" \
    gcloud artifacts repositories delete "$REGISTRY" \
      --location="$GCP_REGION" --project="$GCP_PROJECT" --quiet

  try_delete "vpc: $VPC_CONN" \
    gcloud compute networks vpc-access connectors delete "$VPC_CONN" \
      --region="$GCP_REGION" --project="$GCP_PROJECT" --quiet

  try_delete "firewall: ${PROJECT_NAME}-vpc-dns" \
    gcloud compute firewall-rules delete "${PROJECT_NAME}-vpc-dns" \
      --project="$GCP_PROJECT" --quiet

  try_delete "firewall: ${PROJECT_NAME}-internal" \
    gcloud compute firewall-rules delete "${PROJECT_NAME}-internal" \
      --project="$GCP_PROJECT" --quiet
else
  echo ""
  echo "  Shared infra preserved (registry, VPC, firewall)."
  echo "  Use: $0 $ENV full"
fi

echo ""
printf "\033[0;32m  Teardown complete: %s (%s)\033[0m\n" "$GCP_PROJECT" "$ENV"
echo "  Redeploy: ./scripts/deploy.sh $ENV"
echo ""
