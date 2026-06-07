#!/usr/bin/env bash
# ==============================================================================
# Cloud Run Domain Mapping
# ==============================================================================
#
#   ./scripts/setup-domain.sh [--dry-run]
#
# Creates a Cloud Run domain mapping, then prints the DNS records to configure
# in Cloudflare. Override GCP_PROJECT, GCP_REGION, SERVICE_NAME, or DOMAIN for
# renamed projects.
#
# Prerequisites:
#   1. gcloud CLI authenticated: gcloud auth login
#   2. Domain verified: gcloud domains verify "$DOMAIN" --project="$GCP_PROJECT"
#
# ==============================================================================

set -euo pipefail

GCP_PROJECT="${GCP_PROJECT:-golid-app}"
GCP_REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-golid-web}"
DOMAIN="${DOMAIN:-golid.ai}"
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

_ts() { date +%H:%M:%S; }
step()  { printf "\n\033[1;36m[%s] >>> %s\033[0m\n" "$(_ts)" "$1"; }
ok()    { printf "\033[0;32m    [ok] %s\033[0m\n" "$1"; }
warn()  { printf "\033[1;33m    [warn] %s\033[0m\n" "$1"; }
fail()  { printf "\033[0;31m    [fail] %s\033[0m\n" "$1"; exit 1; }

# --------------------------------------------------------------------------

step "Pre-flight"

gcloud auth print-identity-token &>/dev/null || fail "Not authenticated. Run: gcloud auth login"
ok "gcloud authenticated"

gcloud run services describe "$SERVICE_NAME" \
  --region="$GCP_REGION" --project="$GCP_PROJECT" --format='value(status.url)' &>/dev/null \
  || fail "Cloud Run service '$SERVICE_NAME' not found in $GCP_REGION"
ok "service $SERVICE_NAME exists"

# --------------------------------------------------------------------------

step "Domain mapping: $DOMAIN → $SERVICE_NAME"

if gcloud alpha run domain-mappings describe \
    --domain="$DOMAIN" --region="$GCP_REGION" --project="$GCP_PROJECT" &>/dev/null 2>&1; then
  warn "Domain mapping already exists"
elif [[ "$DRY_RUN" == "true" ]]; then
  warn "[dry-run] Would create domain mapping: $DOMAIN → $SERVICE_NAME"
else
  gcloud alpha run domain-mappings create \
    --service="$SERVICE_NAME" \
    --domain="$DOMAIN" \
    --region="$GCP_REGION" \
    --project="$GCP_PROJECT" \
    --quiet
  ok "domain mapping created"
fi

# --------------------------------------------------------------------------

step "DNS records for Cloudflare"

echo ""
if [[ "$DRY_RUN" == "false" ]]; then
  gcloud alpha run domain-mappings describe \
    --domain="$DOMAIN" --region="$GCP_REGION" --project="$GCP_PROJECT" \
    --format='table(resourceRecords.type, resourceRecords.rrdata)' 2>/dev/null || true
fi

cat <<'INSTRUCTIONS'

  ┌─────────────────────────────────────────────────────────────────┐
  │                   Cloudflare DNS Setup                         │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                │
  │  1. Add the A/AAAA records shown above for your DOMAIN         │
  │     IMPORTANT: Set proxy status to DNS-only (grey cloud)       │
  │     Google must reach the domain to provision the SSL cert.    │
  │                                                                │
  │  2. Add a www redirect rule:                                   │
  │     Cloudflare → Rules → Redirect Rules → Create Rule          │
  │     If: hostname = www.<your-domain>                           │
  │     Then: Dynamic redirect to https://<your-domain>/${uri}     │
  │     Status code: 301 (permanent)                               │
  │                                                                │
  │  3. Wait 15-60 min for Google to provision the SSL cert.       │
  │     Check status:                                              │
  │     gcloud run domain-mappings describe \                      │
  │       --domain="$DOMAIN" --region="$GCP_REGION" \              │
  │       --project="$GCP_PROJECT"                                 │
  │                                                                │
  │  4. Deploy the app with updated config:                        │
  │     ./scripts/deploy.sh prod                                   │
  │                                                                │
  │  5. Update external services:                                  │
  │     - Mailgun: sender domain and FRONTEND_URL in env           │
  │     - VITE_OG_URL / VITE_API_URL for link previews             │
  │                                                                │
  └─────────────────────────────────────────────────────────────────┘

INSTRUCTIONS

step "Done"
echo "  Domain: $DOMAIN"
echo "  Service: $SERVICE_NAME"
echo "  Project: $GCP_PROJECT"
echo "  Region: $GCP_REGION"
echo ""
