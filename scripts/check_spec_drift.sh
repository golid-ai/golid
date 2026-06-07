#!/usr/bin/env bash
# check_spec_drift.sh — flag handler/service changes that don't update their module spec
#
# Usage:
#   scripts/check_spec_drift.sh [base_ref]
#
#   base_ref defaults to origin/main.
#
# Exit codes:
#   0 — clean (or every flagged module had [skip-spec(<module>): ...] or [skip-spec: ...] in a commit message in range)
#   1 — drift detected
#   2 — usage / git error
#
# Escape hatch:
#   To intentionally land a code change without a spec update, include
#       [skip-spec(<module>): <one-line reason>]
#   or
#       [skip-spec: <one-line reason>]
#   in a commit message in the range. The script lists which modules were
#   skipped and why; reviewers can challenge weak reasons in PR review.
#
# Module mapping (Golid v0.3.0):
#   auth, auth_password, auth_verify -> auth
#   user                               -> users
#   feature                            -> feature
#   Unknown stems (sse, email, pagination, retry, context, wire, etc.) are ignored.

set -u  # unset vars are errors; deliberately not -e (we want to keep accumulating findings)

base_ref="${1:-origin/main}"

if ! git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
  echo "error: base ref '$base_ref' not found. Try 'origin/main' or HEAD~N." >&2
  exit 2
fi

# --- helpers -----------------------------------------------------------------

# Map a handler/service file basename (without .go, without _test, without _integration_test)
# to its docs/modules/<dir>/spec.md folder name.
file_to_module() {
  local stem="$1"
  case "$stem" in
    auth_password|auth_verify) echo auth ;;
    user)                      echo users ;;
    auth|feature)              echo "$stem" ;;
    # Unknown — emit empty so the caller can ignore (infra helpers: sse, email, pagination, etc.)
    *)                         echo "" ;;
  esac
}

# Strip _test.go and _integration_test.go from a basename, return the stem.
basename_stem() {
  local f
  f="$(basename "$1" .go)"
  f="${f%_integration_test}"
  f="${f%_test}"
  echo "$f"
}

# --- gather changed files ----------------------------------------------------

mapfile -t changed_files < <(git diff --name-only "$base_ref"...HEAD)

if [ "${#changed_files[@]}" -eq 0 ]; then
  echo "No changes vs $base_ref. Nothing to check."
  exit 0
fi

# Set of module names with spec changes in this diff
declare -A specs_changed=()
for f in "${changed_files[@]}"; do
  if [[ "$f" =~ ^docs/modules/([^/]+)/ ]]; then
    specs_changed["${BASH_REMATCH[1]}"]=1
  fi
done

# Set of modules with [skip-spec: ...] in any commit message in range.
# Allow either "[skip-spec: <reason>]" (any module) or "[skip-spec(<module>): <reason>]".
declare -A skip_modules=()
declare -A skip_reasons=()
commit_messages="$(git log --format=%B "$base_ref"...HEAD)"
# Module-scoped skips first
while IFS=$'\t' read -r module reason; do
  [ -z "$module" ] && continue
  skip_modules["$module"]=1
  skip_reasons["$module"]="$reason"
done < <(printf '%s' "$commit_messages" | grep -oE '\[skip-spec\([a-z_]+\):[^]]+\]' | \
         sed -E 's/\[skip-spec\(([a-z_]+)\):[[:space:]]*(.+)\]/\1\t\2/')
# Then unscoped (catch-all)
while IFS= read -r reason; do
  [ -z "$reason" ] && continue
  skip_modules["__all__"]=1
  skip_reasons["__all__"]="$reason"
done < <(printf '%s' "$commit_messages" | grep -oE '\[skip-spec:[^]]+\]' | \
         sed -E 's/\[skip-spec:[[:space:]]*(.+)\]/\1/')

# Modules touched by handler/service code in this diff
declare -A modules_touched=()
declare -A first_file_for_module=()
for f in "${changed_files[@]}"; do
  case "$f" in
    backend/internal/handler/*.go|backend/internal/service/*/*.go)
      stem=$(basename_stem "$f")
      module=$(file_to_module "$stem")
      if [ -n "$module" ]; then
        modules_touched["$module"]=1
        # Remember first file for nicer reporting
        if [ -z "${first_file_for_module[$module]:-}" ]; then
          first_file_for_module["$module"]="$f"
        fi
      fi
      ;;
  esac
done

# --- report ------------------------------------------------------------------

drift=0
clean=0
skipped=0
for module in "${!modules_touched[@]}"; do
  if [ -n "${specs_changed[$module]:-}" ]; then
    clean=$((clean + 1))
    continue
  fi
  if [ -n "${skip_modules[$module]:-}" ]; then
    echo "skip: $module — '${skip_reasons[$module]}' (via [skip-spec($module): ...])"
    skipped=$((skipped + 1))
    continue
  fi
  if [ -n "${skip_modules[__all__]:-}" ]; then
    echo "skip: $module — '${skip_reasons[__all__]}' (via [skip-spec: ...])"
    skipped=$((skipped + 1))
    continue
  fi
  echo "drift: $module — ${first_file_for_module[$module]} changed but docs/modules/$module/spec.md did not"
  drift=$((drift + 1))
done

total=$((drift + clean + skipped))
if [ "$total" -eq 0 ]; then
  echo "No handler/service files changed in this diff."
  exit 0
fi

echo "---"
echo "Modules touched: $total | spec-synced: $clean | skipped: $skipped | drift: $drift"

if [ "$drift" -gt 0 ]; then
  echo ""
  echo "Spec drift detected. Either:"
  echo "  1. Update the listed docs/modules/<module>/spec.md in this PR, or"
  echo "  2. Add '[skip-spec(<module>): <reason>]' to a commit message in range"
  echo "     (or '[skip-spec: <reason>]' to skip all modules)."
  echo ""
  echo "See document-module rule, 'Same-Commit Spec Sync'."
  exit 1
fi

exit 0
