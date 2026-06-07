#!/usr/bin/env bash
# check_rule_health.sh — lightweight hygiene checks for Cursor rules
#
# Usage:
#   scripts/check_rule_health.sh [--rules-dir <path>] [--required-doc <path>]...
#
# Exit codes:
#   0 — no hard failures
#   1 — missing frontmatter, missing thesis, or missing required docs
#   2 — usage error

set -u

rules_dir=".cursor/rules"
required_docs=(
  "docs/cli-reference.md"
  "docs/git-reference.md"
  "docs/rules-health.md"
  "docs/modules/_templates/spec.md"
)
custom_required_docs=0

usage() {
  echo "usage: scripts/check_rule_health.sh [--rules-dir <path>] [--required-doc <path>]..." >&2
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --rules-dir)
      if [ "$#" -lt 2 ]; then
        usage
        exit 2
      fi
      rules_dir="$2"
      shift 2
      ;;
    --required-doc)
      if [ "$#" -lt 2 ]; then
        usage
        exit 2
      fi
      if [ "$custom_required_docs" -eq 0 ]; then
        required_docs=()
        custom_required_docs=1
      fi
      required_docs+=("$2")
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage
      echo "error: unknown argument '$1'" >&2
      exit 2
      ;;
  esac
done

if [ ! -d "$rules_dir" ]; then
  echo "error: rules dir '$rules_dir' not found" >&2
  exit 2
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
duplicate_candidates="$tmp_dir/duplicate-candidates.tsv"
duplicate_groups="$tmp_dir/duplicate-groups.tsv"
: > "$duplicate_candidates"

hard_fail=0

echo "Rule health check"
echo "Rules dir: $rules_dir"
echo ""

echo "Required docs"
for doc in "${required_docs[@]}"; do
  if [ -f "$doc" ]; then
    echo "ok: $doc"
  else
    echo "fail: missing required doc $doc"
    hard_fail=1
  fi
done
echo ""

echo "Rule size"
# Top-level only: `.cursor/rules/private/` is gitignored personal scope.
while IFS= read -r file; do
  lines="$(wc -l < "$file" | tr -d ' ')"
  if [ "$lines" -gt 150 ]; then
    echo "warn: $file has $lines lines (>150)"
  elif [ "$lines" -gt 120 ]; then
    echo "warn: $file has $lines lines (>120)"
  fi
done < <(find "$rules_dir" -maxdepth 1 -name '*.mdc' -type f | sort)
echo ""

echo "Rule structure"
rules_checked=0
structure_fail=0
# Top-level only: `.cursor/rules/private/` is gitignored personal scope.
while IFS= read -r file; do
  rules_checked=$((rules_checked + 1))
  first_line="$(sed -n '1p' "$file")"
  frontmatter_end="$(sed -n '2,25{/^---$/=;}' "$file" | sed -n '1p')"
  if [ "$first_line" != "---" ] || [ -z "$frontmatter_end" ]; then
    echo "fail: $file missing frontmatter"
    hard_fail=1
    structure_fail=1
  fi
  if ! awk '/^> \*\*Thesis:\*\*/ { found=1 } END { exit found ? 0 : 1 }' "$file"; then
    echo "fail: $file missing thesis"
    hard_fail=1
    structure_fail=1
  fi
done < <(find "$rules_dir" -maxdepth 1 -name '*.mdc' -type f | sort)
if [ "$structure_fail" -eq 0 ]; then
  echo "ok: $rules_checked rules have valid frontmatter and thesis"
fi
echo ""

echo "Duplicate guidance candidates"
awk -v min_words=8 '
function should_skip(line) {
  return line == "" ||
    line ~ /^---$/ ||
    line ~ /^#/ ||
    line ~ /^See / ||
    line ~ /^For / ||
    line ~ /^Reference/ ||
    line ~ /^Full warning lives/ ||
    line ~ /^live in / ||
    line ~ /^use / ||
    line ~ /^`?[A-Za-z0-9_.\/-]+`?$/
}
function emit_windows(file, line_no, line,    normalized, n, i, j, word, words, snippet) {
  normalized = tolower(line)
  gsub(/`/, "", normalized)
  gsub(/[^a-z0-9_\/ -]/, " ", normalized)
  n = split(normalized, words, /[[:space:]]+/)
  delete kept
  j = 0
  for (i = 1; i <= n; i++) {
    word = words[i]
    if (length(word) >= 3) {
      kept[++j] = word
    }
  }
  if (j < min_words) return
  for (i = 1; i <= j - min_words + 1; i++) {
    snippet = kept[i]
    for (n = i + 1; n <= i + min_words - 1; n++) {
      snippet = snippet " " kept[n]
    }
    print snippet "\t" file ":" line_no
  }
}
FNR == 1 {
  in_frontmatter = ($0 == "---")
  next
}
in_frontmatter && /^---$/ {
  in_frontmatter = 0
  next
}
in_frontmatter { next }
{
  line = $0
  sub(/^[[:space:]]*[-*][[:space:]]+/, "", line)
  sub(/^[[:space:]]*[0-9]+[.][[:space:]]+/, "", line)
  sub(/^[[:space:]]+/, "", line)
  if (should_skip(line)) next
  emit_windows(FILENAME, FNR, line)
}
' "$rules_dir"/*.mdc > "$duplicate_candidates"

sort "$duplicate_candidates" | awk -F '\t' '
function flush_group(    i) {
  if (snippet == "" || count < 3) return
  printf "%d\t%s", count, snippet
  for (i = 1; i <= count; i++) {
    printf "\t%s", locations[i]
  }
  printf "\n"
}
BEGIN { snippet = ""; count = 0 }
{
  if ($1 != snippet) {
    flush_group()
    delete locations
    snippet = $1
    count = 0
  }
  locations[++count] = $2
}
END { flush_group() }
' > "$duplicate_groups"

if [ -s "$duplicate_groups" ]; then
  sort -nr "$duplicate_groups" | while IFS=$'\t' read -r count snippet rest; do
    echo "${count}x \"${snippet}\""
    printf '%s\n' "$rest" | tr '\t' '\n' | while IFS= read -r location; do
      [ -n "$location" ] && echo "  $location"
    done
  done
else
  echo "ok: no repeated 8-word snippets found in three or more locations"
fi

echo ""
if [ "$hard_fail" -gt 0 ]; then
  echo "Rule health check failed."
  exit 1
fi

echo "Rule health check completed with warnings only."
exit 0
