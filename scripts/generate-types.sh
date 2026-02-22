#!/bin/bash
# ==============================================================================
# Generate TypeScript Types from OpenAPI Spec
# ==============================================================================
#
#   ./scripts/generate-types.sh
#
#   Generates TypeScript interfaces from the backend OpenAPI spec so frontend
#   types stay in sync with the Go backend.
#
#   Requirements: Node.js / npx
#
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ------------------------------------------------------------------------------
# Config
# ------------------------------------------------------------------------------

OPENAPI_SPEC="${PROJECT_ROOT}/backend/openapi.yaml"
OUTPUT_FILE="${PROJECT_ROOT}/frontend/src/lib/api.generated.ts"

# ------------------------------------------------------------------------------
# Logging (mirrors deploy.sh)
# ------------------------------------------------------------------------------

_ts() { date +%H:%M:%S; }
step()  { printf "\n\033[1;36m[%s] >>> %s\033[0m\n" "$(_ts)" "$1"; }
ok()    { printf "\033[0;32m    [ok] %s\033[0m\n" "$1"; }
fail()  { printf "\033[0;31m    [fail] %s\033[0m\n" "$1"; exit 1; }

# ------------------------------------------------------------------------------
# Pre-flight
# ------------------------------------------------------------------------------

preflight() {
  step "Pre-flight checks"

  command -v npx &>/dev/null || fail "npx not found. Install Node.js."
  ok "npx available"

  [[ -f "$OPENAPI_SPEC" ]] || fail "OpenAPI spec not found: $OPENAPI_SPEC"
  ok "spec exists: $OPENAPI_SPEC"
}

# ------------------------------------------------------------------------------
# Generate
# ------------------------------------------------------------------------------

generate() {
  step "Generate TypeScript types"

  npx --yes openapi-typescript@7.8.0 "$OPENAPI_SPEC" -o "$OUTPUT_FILE"
  ok "written: $OUTPUT_FILE"
}

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------

main() {
  local t0=$SECONDS

  preflight
  generate

  local elapsed=$(( SECONDS - t0 ))

  step "Done (${elapsed}s)"
  echo ""
  echo "  Output: $OUTPUT_FILE"
  echo ""
  echo "  Usage:"
  echo '    import type { paths, components } from "./api.generated";'
  echo '    type User = components["schemas"]["User"];'
  echo ""
}

main
