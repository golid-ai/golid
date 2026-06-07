#!/usr/bin/env bash
# check_citation_freshness.sh — verify every [Verified: file:line] citation in
# docs/ points at a real file and a real line.
#
# Usage:
#   scripts/check_citation_freshness.sh
#
# Exit codes:
#   0 — every citation in docs/ resolves to a real file and the cited line is
#       within that file's actual size
#   1 — at least one citation is stale (file missing OR line out of bounds OR
#       still uses the pre-refactor flat `service/<file>.go:N` layout)
#
# Only validates [Verified: path:line] citations. Symbol citations
# ([Verified: service/auth/auth.go, Register()]) are enforced by spec-drift
# and review — this script skips non-numeric line suffixes by design.
#
# Golid module map (auth, users, feature) — line citations use
# `service/<pkg>/<file>.go` paths under backend/internal/.

set -u

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

fail=0
checked=0
files_with_failures=()

resolve_path() {
  local cited="$1"
  for prefix in "" "backend/internal/" "backend/" "backend/migrations/" "frontend/src/" "frontend/"; do
    local candidate="${prefix}${cited}"
    if [ -f "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

check_one_citation() {
  local src_file="$1"
  local src_line="$2"
  local pair="$3"

  if [[ "$pair" =~ ^(backend/internal/)?service/[a-z_]+\.go:[0-9] ]]; then
    echo "FLAT-LAYOUT:  ${src_file}:${src_line} cites ${pair} (pre-refactor flat layout; use service/<pkg>/<file>.go)"
    return 1
  fi

  local cited_path cited_lines line_start line_end
  cited_path="${pair%%:*}"
  cited_lines="${pair#*:}"

  if [[ "$cited_lines" =~ ^([0-9]+)-([0-9]+)$ ]]; then
    line_start="${BASH_REMATCH[1]}"
    line_end="${BASH_REMATCH[2]}"
  elif [[ "$cited_lines" =~ ^[0-9]+$ ]]; then
    line_start="$cited_lines"
    line_end="$cited_lines"
  else
    return 0
  fi

  local full_path
  if full_path=$(resolve_path "$cited_path"); then
    local actual_lines
    actual_lines=$(wc -l < "$full_path")
    if [ "$line_end" -gt "$actual_lines" ]; then
      echo "STALE-LINE:   ${src_file}:${src_line} cites ${cited_path}:${cited_lines} but ${full_path} has only ${actual_lines} lines"
      return 1
    fi
    return 0
  else
    echo "MISSING-FILE: ${src_file}:${src_line} cites ${cited_path} (no such file under repo root, backend/internal/, backend/, frontend/src/, or frontend/)"
    return 1
  fi
}

while IFS= read -r entry; do
  src_file="${entry%%:*}"
  rest="${entry#*:}"
  src_line="${rest%%:*}"
  match="${rest#*:}"

  if [[ "$src_file" =~ ^docs/golid-backport/ ]]; then
    continue
  fi

  inner="${match#*\[Verified:}"
  inner="${inner%%\]*}"
  inner="${inner#"${inner%%[![:space:]]*}"}"

  IFS=',' read -ra pairs <<< "$inner"
  for raw_pair in "${pairs[@]}"; do
    pair="${raw_pair#"${raw_pair%%[![:space:]]*}"}"
    pair="${pair%"${pair##*[![:space:]]}"}"
    pair="${pair%% *}"
    [ -z "$pair" ] && continue
    [[ "$pair" != *:* ]] && continue

    if check_one_citation "$src_file" "$src_line" "$pair"; then
      checked=$((checked + 1))
    else
      fail=$((fail + 1))
      files_with_failures+=("$src_file")
    fi
  done
done < <(grep -rEno '\[Verified:[[:space:]]+[^]]+\]' docs/ --include='*.md' 2>/dev/null)

echo "---"
echo "Citations checked: $checked | failures: $fail"

if [ "$fail" -gt 0 ]; then
  echo ""
  echo "Citation freshness check failed. To fix:"
  echo "  1. Open each flagged citation."
  echo "  2. Locate the cited symbol in the current code (rg -n '<symbol>' backend/internal/...)."
  echo "  3. Update the [Verified: path:line] to match the new file + line."
  echo ""
  echo "Affected files:"
  printf '  %s\n' "${files_with_failures[@]}" | sort -u
  exit 1
fi

exit 0
