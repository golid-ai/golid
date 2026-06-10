# Rename Tool Hardening (Golid Factory Patch)

> **Status:** Complete (2026-06-07)  
> **Risk tier:** T2 — tooling + deploy ergonomics; no auth/schema changes  
> **Thesis:** The Tidestone rebrand exposed systematic gaps in `make rename` and first-prod
> deploy defaults — patch the tool and factory scripts so the next fork ships with the
> correct brand, domain, assets, and deploy path without a multi-hour manual cleanup.

## Non-goals

- Rewriting Tidestone-specific homepage copy or business docs (downstream concern).
- Auto-generating OG images or favicons (rename should *rename/replace paths*, not design assets).
- Changing Golid upstream branding in historical ADRs, archive plans, or rename-tool source constants.
- Supporting arbitrary TLD swaps beyond an explicit `new-domain` argument (no DNS automation).

## Success metrics

| Metric | Target |
|--------|--------|
| Post-rename grep | `rg -i 'golid' --glob '!backend/cmd/rename/**' --glob '!docs/plans/**' --glob '!docs/decisions/**'` returns zero hits in **shipped** paths (config, scripts, frontend, infra, community files) |
| Domain coverage | All `golid.ai` fallbacks and hardcoded preview URLs replaced when `new-domain` is passed |
| macOS deploy | `./scripts/deploy.sh check prod` succeeds on `/bin/bash` 3.2 with `set -u` |
| Prod build | `cd frontend && npm run build` passes without manual test/type fixes after rename |
| Rename self-test | Running rename on a fixture repo leaves `cmd/rename/main.go` `old*` constants unchanged |
| Post-rename checklist | Tool prints a checklist that matches real remaining work (domain, assets, prod env) |

## Evidence: Tidestone rebrand (2026-06)

`make rename name=tidestone module=github.com/tidestone/tidestone/backend` updated **165 files**.
Manual follow-up still required across meta/assets, docs prose, domain, prod config, and deploy.

---

## Part A — Rename tool misses

Source of truth: `backend/cmd/rename/main.go` and `.cursor/rules/rename-tool.mdc`.

### A1. Incomplete string coverage by file category

The tool uses three replacement shapes: lowercase (`golid`), titled (`Golid` via `toPascalCase`),
and upper (`GOLID`). Not every category gets all three.

| Category | Current behavior | Miss observed in Tidestone |
|----------|------------------|----------------------------|
| `README.md` | GitHub repo + titled only | `golid/` tree, `golid?sslmode`, `#why-golid` anchor, `golid_test` in examples |
| `CONTRIBUTING.md` | GitHub repo + titled only | `cd golid` |
| `docs/**/*.md` | module path + lowercase safe | **Titled `Golid` in prose** still in ~20 docs (`architecture.md`, `glossary.md`, ADRs, etc.) |
| `infra/*.yaml` | lowercase safe only | `run.googleapis.com/description: "Golid API backend"` (titled, not lowercase) |
| Community files | GitHub + titled only | `CODE_OF_CONDUCT.md` ("Golid maintainers") |
| `.github/ISSUE_TEMPLATE/**` | **not walked** | `about: Suggest a feature for Golid` |
| `frontend/tests/**` | **not walked** | `chunk-recovery.test.ts` hardcoded `https://golid.ai/...`; e2e expected heading `"Golid"` |
| `frontend/public/**` | **not walked** | `golid-og.png`, `meta.png`, legacy favicon artwork |
| `frontend/app.config.ts` | **not walked** | env injection surface (no golid strings today, but uncategorized) |
| `config/.env.local` | **not in env list** | `APP_NAME=Golid`, `DB_NAME=golid` (local-only, high confusion) |

**Root cause:** `replaceInFileSafe` only substitutes lowercase `oldProjectName`. Titled
occurrences in docs/infra/README need `replaceInFile(f, oldTitled, newTitled)` added to
those walk steps.

### A2. Domain handling is protect-only, not replace

`replaceInFileSafe` protects `golid.ai` from corruption but never writes the **new**
production domain. Downstream forks must manually edit:

| File | Manual fix |
|------|------------|
| `frontend/src/lib/og-meta.tsx` | `OG_SITE_BASE` fallback |
| `frontend/src/entry-server.tsx` | `og:url`, `og:image`, `twitter:image` fallbacks |
| `frontend/src/lib/chunk-recovery.test.ts` | hardcoded preview URLs |
| `scripts/setup-domain.sh` | `DOMAIN` default |
| `config/.env.prod` | `FRONTEND_URL`, `ALLOWED_ORIGINS`, `VITE_OG_URL` |
| `infra/frontend-cloudbuild.yaml` | `_VITE_OG_URL` substitution default |
| `frontend/Dockerfile.prod` | `ARG VITE_OG_URL` default |

Tidestone also needed `.com` → `.co` after an initial guess — the tool should accept
`new-domain` explicitly rather than inferring TLD from the project name.

**Proposed CLI:**

```bash
go run ./cmd/rename <name> <module-path> [new-domain]
# e.g. go run ./cmd/rename tidestone github.com/tidestone/tidestone/backend tidestone.co
```

When `new-domain` is provided:

1. Replace `oldDomain` → `new-domain` in all domain-safe files (after project-name pass).
2. Replace `https://{new-name}.com` heuristic fallbacks if present (optional, logged).
3. Print env vars to set: `FRONTEND_URL`, `ALLOWED_ORIGINS`, `VITE_OG_URL`.

### A3. Marketing / starter copy not in scope

Rename swaps **identifiers**, not positioning. These stayed Golid-themed until manually rewritten:

| File | Starter copy removed manually |
|------|-------------------------------|
| `frontend/src/entry-server.tsx` | "Go + SolidJS Production Starter", "70+ components" |
| `frontend/src/lib/og-meta.tsx` | `DEFAULT_OG_DESCRIPTION` starter paragraph |
| `frontend/tests/e2e/auth.spec.ts` | Landing heading assertion |

**Recommendation:** Add a post-rename **warning** (not auto-replace) listing files with
known starter boilerplate (`entry-server.tsx`, `og-meta.tsx`, `(public)/index.tsx`, e2e
specs). Optionally gate behind `--starter-copy-hint`.

### A4. Public assets not renamed

| Asset | Action needed |
|-------|---------------|
| `frontend/public/images/golid-og.png` | Rename to `{name}-og.png` or delete + warn |
| `frontend/public/images/meta.png` | Same |
| `favicon.svg` / `.ico` / PNG sizes | Warn — binary; cannot string-replace |

**Proposed:** After rename, if `golid-og.png` exists, rename to `{newName}-og.png` and
update references in `og-meta.tsx` / `entry-server.tsx` (already use `DEFAULT_OG_IMAGE_URL`
— ensure that constant uses `{newName}-og.png`).

### A5. Rename tool self-corruption bug

`cmd/rename/main.go` is excluded from lowercase `oldProjectName` replacement but **not**
from `oldModule` replacement. After Tidestone rename, the file contains:

```go
const oldModule = "github.com/tidestone/tidestone/backend" // should still be golid baseline
const oldProjectName = "golid"
```

A second rename on a fork would use the wrong `oldModule` baseline.

**Fix:** Skip **all** replacements in `backend/cmd/rename/main.go` (or maintain constants
in a separate `rename_baseline.go` that is never walked).

### A6. No verification pass

The tool prints "review git diff" but does not grep for survivors. Add a final step:

```bash
rg -l -i 'golid' --glob '!backend/cmd/rename/**' ...
```

Exit non-zero (or print warnings) when hits remain in configured categories.

---

## Part B — Infra / first-prod deploy misses

These are factory-script issues surfaced during Tidestone's GCP deploy to project `tidestone`
and domain `tidestone.co`. Fixes were applied on the **Tidestone fork**; **Golid upstream**
(`main` as of 2026-06) still needs Slice 5 backports — do not treat Part B items as done
until verified on this repo.

### B1. macOS Bash 3.2 — associative arrays in `deploy.sh`

**Symptom:** `./scripts/deploy.sh check prod` → `api_service: unbound variable` (line 81).

**Cause:** `declare -A RES=(...)` is Bash 4+. macOS `/bin/bash` is 3.2; with `set -u`,
`[api_service]=` parses as the `[` test command.

**Tidestone fix → upstream backport (Slice 5):** Replace `declare -A RES` with plain
variables (`RES_API_SERVICE`, `RES_WEB_SERVICE`, etc.). Golid `scripts/deploy.sh:81` still
uses associative arrays. Document in `scripts/README.md` — deploy/teardown/setup-domain
scripts must stay Bash 3.2-safe; audit `teardown.sh` for `declare -A`.

### B2. `VITE_OG_URL` not passed into frontend prod image

**Symptom:** Social previews and `og:url` fall back to wrong origin after deploy.

**Cause:** `Dockerfile.prod` and `infra/frontend-cloudbuild.yaml` built without
`VITE_OG_URL`; SSR meta baked at build time.

**Tidestone fix → upstream backport (Slice 5):**

- `ARG VITE_OG_URL` in `frontend/Dockerfile.prod`
- `_VITE_OG_URL` substitution in `infra/frontend-cloudbuild.yaml`
- `deploy.sh` passes `VITE_OG_URL` from `config/.env.prod` into Cloud Build

Not present on Golid `main` yet. Also add `VITE_OG_URL` to rename post-deploy checklist
and `.env.example` comments (Slice 2/6).

### B3. `deploy.sh` overwrote custom domain with `*.run.app`

**Symptom:** API `FRONTEND_URL` pointed at Cloud Run default URL after web deploy,
breaking CORS/email links when `tidestone.co` was already configured.

**Tidestone fix → upstream backport (Slice 5):** Prefer `FRONTEND_URL` from
`config/.env.{env}` when set; only fall back to discovered `WEB_URL`. Document that
`FRONTEND_URL` + `ALLOWED_ORIGINS` must be set before first prod deploy with a custom
domain.

### B4. `ALLOWED_ORIGINS` and `CSRF_ENFORCE` not forwarded

**Symptom:** Prod CORS rejected browser requests until `ALLOWED_ORIGINS` was uncommented
and passed to `gcloud run deploy`.

**Tidestone fix → upstream backport (Slice 5):** `deploy.sh` includes both in API env var
assembly (not on Golid `main` yet).

### B5. Placeholder GCP project id

**Symptom:** `config/.env.prod` had `GCP_PROJECT_ID=your-gcp-project`.

**Tidestone fix (manual) → rename checklist (Slice 2/3):** Set real project in env;
rename tool should print a prominent "set GCP_PROJECT_ID" step (optional `--gcp-project`
deferred).

### B6. `setup-domain.sh` defaults

**Miss:** Default `GCP_PROJECT` was `golid-app`; `DOMAIN` needed `.co` not `.com`.

**Tidestone fix → upstream backport (Slice 5):** Defaults derived from renamed project;
domain always explicit via env — verify `setup-domain.sh` on Golid `main`.

### B7. Custom domain + TLS latency

**Observed:** Cloud Run domain mapping stays `CertificatePending` until DNS propagates.
Cloudflare required:

- Apex `A` / `AAAA` records → Google load balancer IPs (grey cloud / DNS only)
- `www` CNAME → apex
- Redirect rule `www` → apex

**Upstream patch:** Expand `setup-domain.sh` output with Cloudflare-specific notes and
"cert pending is normal for 15–60 min" guidance. Link from `docs/infrastructure/devops.md`.

### B8. Frontend typecheck blocked deploy

**Symptom:** `npm run build` failed on `home.test.tsx` mock typing during Cloud Build.

**Cause:** New homepage test added without `vi` import / `MetaProvider` wrapper; strict TS.

**Upstream patch:** `deploy.sh check` should run `npm run typecheck` (or `build`) for web
deploys, not only `go build` for API.

---

## Slices (implementation order)

### Slice 1 — Rename coverage parity

**Acceptance criteria:**

- [x] Add `oldTitled` replacement to: `docs/**/*.md` (except `docs/decisions/`,
  `docs/plans/archive/`), `infra/**/*.yaml`, `README.md`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md` (if present), `.github/ISSUE_TEMPLATE/*`
- [x] Add `replaceInFileSafe(oldProjectName)` to `README.md` and `CONTRIBUTING.md`
- [x] Walk `frontend/tests/**/*.{ts,tsx}` with same replacements as `frontend/src`
- [x] Walk `config/.env.local` via glob `config/.env.*` (gitignored file — create from
  example if missing, or skip with warning)
- [x] Skip **all** edits to `backend/cmd/rename/main.go`

**Verification:**

```bash
cd backend && go test ./cmd/rename/...   # add fixture test (Slice 4)
# Run rename on a clean golid fixture; rg survivors
```

### Slice 2 — Domain argument

**Acceptance criteria:**

- [x] `go run ./cmd/rename <name> <module> <domain>` replaces `golid.ai` → `<domain>`
  in domain-safe files and listed frontend fallbacks
- [x] Post-rename prints `FRONTEND_URL`, `ALLOWED_ORIGINS`, `VITE_OG_URL` values
- [x] `make rename` forwards optional domain arg

**Verification:** Fixture test: after rename with `tidestone.co`, `og-meta.tsx` fallback
contains `tidestone.co`, not `golid.ai`.

### Slice 3 — Public assets + survivor grep

**Acceptance criteria:**

- [x] Rename `golid-og.png` → `{name}-og.png` when present; update `DEFAULT_OG_IMAGE_URL`
- [x] Final step runs ripgrep survivor report; exits 1 on hits in category list (configurable
  `--strict`)
- [x] Expanded "Next steps" checklist (domain, assets, prod env, homepage copy, deploy)

**Verification:** Manual rename on fixture repo → zero strict-mode grep hits.

### Slice 4 — Rename tool tests

**Acceptance criteria:**

- [x] `backend/cmd/rename/rename_test.go` with temp fixture tree
- [x] Cases: titled-only doc line, README tree, domain replace, self-file not mutated,
  `replaceInFileSafe` does not corrupt domain during name replace

**Verification:** `go test ./cmd/rename/...`

### Slice 5 — Deploy factory hardening (Golid upstream backport)

**Acceptance criteria:**

- [x] **Implement** Bash 3.2-safe resource names in `deploy.sh` / `teardown.sh` /
  `setup-domain.sh` (no `declare -A`; Golid `deploy.sh:81` still uses `declare -A`)
- [x] **Implement** `VITE_OG_URL`, `ALLOWED_ORIGINS`, `FRONTEND_URL` preference, and
  `CSRF_ENFORCE` forwarding in `deploy.sh` + frontend prod build chain (Tidestone fixes)
- [x] `deploy.sh check` runs frontend typecheck when `check web` or full deploy
- [x] `config/.env.example` documents `VITE_OG_URL`, `ALLOWED_ORIGINS`, `FRONTEND_URL` as
  required for custom-domain prod
- [x] `docs/infrastructure/devops.md` — Cloudflare + cert-pending runbook (Tidestone notes
  already started; generalize)

**Verification:**

```bash
bash -n scripts/deploy.sh
./scripts/deploy.sh check prod   # on macOS or bash 3.2 container
cd frontend && npm run typecheck
```

### Slice 6 — Rule + doc sync

**Acceptance criteria:**

- [x] Update `.cursor/rules/rename-tool.mdc` file coverage table with new categories
- [x] Update `docs/plans/README.md` — move this plan to archive when complete
- [ ] Optional ADR `docs/decisions/00N-rename-tool-domain-arg.md` (deferred)

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Over-replacing "Golid" in historical ADRs | Exclude `docs/decisions/`, `docs/plans/archive/` from titled pass (or `--preserve-history`) |
| Wrong domain baked into prod image | Domain arg is required in checklist; `deploy.sh` passes `VITE_OG_URL` at build |
| Binary assets corrupted by string replace | Only rename known filenames; never run replaceInFile on `.png`/`.ico` |
| Bash 4 scripts reintroduced | CI job: `bash:3.2 scripts/deploy.sh` syntax + check dry-run |
| Second rename breaks module baseline | Slice 1 skips `cmd/rename/main.go` entirely |

## Rollback

Rename is pre-commit. Rollback = `git checkout -- .` before commit. After commit, revert
the rename commit — do not re-run rename with inverted args.

## Progress

| Slice | Status | Result |
|-------|--------|--------|
| 1 — Coverage parity | Done | `main.go`: titled+safe on docs/infra/README/community/issue templates; `frontend/tests` walk; `findEnvFiles`; skip `cmd/rename/main.go` entirely |
| 2 — Domain argument | Done | Optional `[new-domain]` arg; `replaceDomain()`; Makefile `domain=`; env checklist in output |
| 3 — Assets + survivor grep | Done | `renamePublicAssets`, `reportSurvivors`, `--strict`, expanded checklist |
| 4 — Rename tool tests | Done | `rename_test.go` — 8 cases; `go test ./cmd/rename/...` pass |
| 5 — Deploy backport | Done | Bash 3.2 RES_* vars; VITE_OG build args; ALLOWED_ORIGINS/CSRF; check runs typecheck |
| 6 — Rule + doc sync | Done | `rename-tool.mdc`, devops runbook, scripts README Bash note; ADR deferred |

---

## Related

- `.cursor/rules/rename-tool.mdc` — coverage table to extend
- `backend/cmd/rename/main.go` — implementation
- `docs/infrastructure/devops.md` — Tidestone prod/domain notes (partially updated)
- `scripts/README.md` — macOS Bash note (verify after Slice 5)
- Tidestone commits: `21f8655` (bootstrap), `3c7b30a` (meta/OG assets)
