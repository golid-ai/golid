# Coverage Recovery + TypeScript-ESLint 8

> **Status:** Draft  
> **Risk tier:** T2 — toolchain and test expansion, no auth/schema/migration changes  
> **Thesis:** Close the gap between honest Codecov reporting (~68% project) and
> documented quality bars (~80%) by testing uncovered backend wiring/observability,
> aligning Codecov paths with Vitest excludes, and upgrading `@typescript-eslint`
> v8 (on existing ESLint 8) to clear dev-tooling audit noise.

## Verified baseline (2026-06-07, branch `steve-dev`, commit `f0a1dc1`)

Record new numbers in **Progress** when re-running after slices land.

| Metric | Source | Command / location | Measured |
|--------|--------|-------------------|----------|
| Codecov project (combined) | Codecov UI | PR #27 upload | **68.24%** |
| Codecov backend flag | Codecov UI | `flags.backend` → `backend/` | **73.82%** |
| Codecov frontend flag | Codecov UI | `flags.frontend` → `frontend/src/` | **64.83%** |
| Vitest (included files only) | local | `cd frontend && npm run test:coverage` | **73.83%** stmts / **52.03%** branches / **78.11%** funcs |
| Vitest CI floors | repo | `frontend/vitest.config.ts:41-45` | 68 / 47 / 73 / 68 |
| Backend unit (`COVERPKG`, CI merge) | local | See B0 commands | **56.1%** unit-only (see output below) |
| Backend unit + integration | Codecov | CI merges unit + handler + service shards | **73.82%** (Codecov backend flag) |
| `npm audit --audit-level=high` | local | `cd frontend && npm audit --audit-level=high` | **11** (4 moderate, **7 high**) |
| ESLint stack | repo | `frontend/package.json:59-64` | `eslint@^8.56`, `@typescript-eslint/*@^6.13`, `eslint-plugin-solid@^0.13` |
| npm audit CI gate | repo | `.github/workflows/ci.yml:340-347` | **Non-blocking** (warn + exit 0) |
| Codecov project target | repo | `codecov.yml:4-7` | `target: auto`, `threshold: 2%` |

**Why Vitest (74%) ≠ Codecov frontend (65%):** Vitest excludes showcase/heavy components
(`vitest.config.ts:26-39`); Codecov frontend flag counts **all** `frontend/src/` including
excluded paths that never appear in `lcov.info` as covered → drags flag average down.

**Why unit-only backend (56%) ≠ Codecov backend (74%):** `COVERPKG` spans handler/service/wire;
integration shards (`ci.yml:208-215`) add coverage unit tests never hit. B1 targets must
use **merged CI profile**, not `go test ./...` alone.

### Stale documentation (fix in B0)

| Doc | Issue | Citation |
|-----|-------|----------|
| `docs/decisions/002-deferred-capabilities.md` | Claims "82%+ test coverage" | lines 9, 190 |
| `docs/patterns/testing/1-Page.md` | Claims 80/75/80% pyramid + "Coverage > 80%" DoD | lines 102-106, 123 |
| This plan's earlier draft | Wrong route paths (`register.tsx`) | superseded below |

Not stale: `README.md` (752 tests, no % claim), `vitest.config.ts` (matches measured floors).

### Reproducible output (`f0a1dc1`, local)

```text
# frontend — npm run test:coverage (tail)
Statements   : 73.83% ( 2802/3795 )
Branches     : 52.03% ( 919/1766 )
Functions    : 78.11% ( 1017/1302 )
Lines        : 73.68% ( 2078/2820 )

# backend — CI unit merge only (no integration DB locally)
total: (statements) 56.1%

# frontend — npm audit --audit-level=high
11 vulnerabilities (4 moderate, 7 high)
```

## Context

### npm audit chains (7 high after `npm audit fix`, commit `f0a1dc1`)

| Chain | Prod risk | Fix |
|-------|-----------|-----|
| `minimatch` → `@typescript-eslint` v6 | None (lint devDep) | Track A — TS-eslint 8 + `eslint-plugin-solid@0.14.5` (`^8.0.0` utils) |
| `h3` → `vinxi` → `@solidjs/start` | Low (dev/SSR build) | Upstream; **never** `npm audit fix --force` (downgrades vinxi) |

Dependabot PR #14 failed on TS-eslint 8 because `eslint-plugin-solid@0.13` pins
`@typescript-eslint/utils ^6.4.0` (`frontend/package.json:64`).

## Non-goals

- 80% coverage on showcase UI excluded from Vitest (`Charts`, `AgGrid`, `Canvas3D`, etc.)
- ESLint 9 flat config (ADR 002 defers; stay on `.eslintrc.cjs` + ESLint 8)
- `h3`/`vinxi` force-fix or production SSR attack-surface hardening in this plan
- Raising Vitest thresholds before slices land (B3 is last)
- Making `npm audit` a **blocking** CI gate unless explicitly added in A4

## Success metrics

| Metric | Baseline | Target | Gate |
|--------|----------|--------|------|
| Codecov **project** | 68.24% | **≥80%** | `codecov.yml` `target: 80%` in B3 |
| Codecov **backend** flag | 73.82% | **≥80%** | Merged `COVERPKG` profile in CI |
| Codecov **frontend** flag | 64.83% | **≥72%** | After path alignment (B0) or targeted tests (B2) |
| Vitest included statements | 73.83% | **≥75%** | Optional raise in B3 |
| Vitest branches | 52.03% | **≥55%** | Primary frontend quality lever |
| `npm run lint` | pass | pass | TS-eslint 8 + plugin-solid 0.14 |
| npm audit high (informational) | 7 | **≤2** | TS-eslint chain cleared; h3 may remain |
| Stale coverage docs | 2 files | 0 | ADR 002 + testing 1-pager |

**80% project target — how we get there:**

1. **B0:** Align Codecov frontend `ignore` with Vitest excludes → frontend flag should rise
   toward Vitest's **73.83%** (same files instrumented).
2. **B1:** `internal/wire/` tests (+4–6 pts on backend flag) → backend **73.82% → ~80%**.
3. **B2:** Branch tests only where B0 re-measure shows gap (login `redirectTo`, settings errors).
4. **B3:** Lock `codecov.yml` `target: 80%` only after B0+B1 upload confirms ≥80% on a PR.

Codecov project % is LOC-weighted across both flags — B0 step records exact weights from the
component tree before B3.

## Track A — TypeScript-ESLint 8 (ESLint 8 unchanged)

### Slice A1 — Dependency bump

```bash
cd frontend
npm install -D eslint@^8.57.0 \
  @typescript-eslint/eslint-plugin@^8.60.0 \
  @typescript-eslint/parser@^8.60.0 \
  eslint-plugin-solid@^0.14.5
```

**Acceptance:**
- `npm run lint` exits 0
- `npm audit --audit-level=high` no longer lists `minimatch` via `@typescript-eslint/*`
- Re-evaluate `solid/reactivity` (`.eslintrc.cjs:14` — off for `TSAsExpression` crash on 0.13)

**Verification:** `npm run lint`, `npm run typecheck`, `npm run test:run`

**Rollback:** `git checkout frontend/package.json frontend/package-lock.json frontend/.eslintrc.cjs`

### Slice A2 — Rule drift cleanup

Fix new TS-eslint 8 violations. Document intentional rule offs in `.eslintrc.cjs` comments.
No new `eslint-disable` without justification comment.

**Acceptance:** CI Frontend job green.

**Verification:** `npm run lint`, `npm run typecheck`, `npm run test:run`

**Rollback:** Revert `.eslintrc.cjs` rule changes; keep A1 deps if violations are few.

### Slice A3 — Docs + changelog

| File | Change |
|------|--------|
| `docs/patterns/testing/1-Page.md:102-123` | Replace 80/75/80% pyramid with measured floors + link here |
| `docs/decisions/002-deferred-capabilities.md:9,190` | Replace "82%+" with "752 tests; Codecov ~68% project (0.3 baseline)" |
| `CHANGELOG [Unreleased]` | TS-eslint 8; accepted `h3` dev-dep risk |

**Verification:** `rg '82%|Coverage > 80%' docs/` returns only this plan or archive.

**Rollback:** `git checkout docs/ CHANGELOG.md`

### Slice A4 — (Optional) Blocking audit gate

Only if product wants audit as CI gate: remove `|| exit 0` wrapper in `ci.yml:342-347`,
set target ≤2 highs, document accepted `h3` exceptions in runbook. **Default: skip** (stay informational).

---

## Track B — Coverage recovery

### Slice B0 — Baseline and gate alignment

**1. Record CI-equivalent backend coverage** (matches `ci.yml:140-264`):

```bash
cd backend
export COVERPKG='./internal/apperror/...,./internal/config/...,./internal/handler/...,./internal/middleware/...,./internal/observability/...,./internal/pagination/...,./internal/queue/...,./internal/retry/...,./internal/service/...,./internal/validate/...,./internal/wire/...'

# Unit (two-pass merge)
go test ./internal/apperror/... ./internal/config/... ./internal/pagination/... \
  ./internal/retry/... ./internal/validate/... -count=1 \
  -coverprofile=coverage-unit-norace.out -coverpkg=$COVERPKG
go test ./internal/handler/... ./internal/middleware/... ./internal/observability/... \
  ./internal/queue/... ./internal/service/... ./internal/testutil/... ./internal/wire/... \
  -race -count=1 -coverprofile=coverage-unit-race.out -coverpkg=$COVERPKG
head -1 coverage-unit-norace.out > coverage-unit.out
tail -n +2 coverage-unit-norace.out >> coverage-unit.out
tail -n +2 coverage-unit-race.out >> coverage-unit.out

# Integration (requires Postgres + TEST_DATABASE_URL)
go test -tags integration ./internal/handler/... -race -count=1 \
  -coverprofile=coverage-integration-handler.out -coverpkg=$COVERPKG
go test -tags integration ./internal/service/... -race -count=1 \
  -coverprofile=coverage-integration-service.out -coverpkg=$COVERPKG

# Merge all (same as backend-coverage job)
head -1 coverage-unit.out > coverage.out
tail -n +2 coverage-unit.out >> coverage.out
tail -n +2 coverage-integration-handler.out >> coverage.out
tail -n +2 coverage-integration-service.out >> coverage.out
go tool cover -func=coverage.out | tail -1
```

**2. Align Codecov frontend flag** with Vitest intentional excludes — append to `codecov.yml`
(mirror every path in `vitest.config.ts:14-40`):

```yaml
coverage:
  ignore:
    - "frontend/src/routes/(private)/components/**"
    - "frontend/src/lib/animation/**"
    - "frontend/src/**/molecules/Charts/**"
    - "frontend/src/**/molecules/PlotGraph/**"
    - "frontend/src/**/molecules/GeoPlot/**"
    - "frontend/src/**/molecules/Canvas3D/**"
    - "frontend/src/**/molecules/VideoRecorder/**"
    - "frontend/src/**/molecules/SortableList/**"
    - "frontend/src/**/molecules/Dropzone/**"
    - "frontend/src/**/molecules/DatePicker/**"
    - "frontend/src/**/molecules/TimePicker/**"
    - "frontend/src/components/atoms/Calendar.tsx"
    - "frontend/src/components/atoms/Slider.tsx"
    - "frontend/src/components/atoms/AgGrid/**"
    - "frontend/src/**/entry-*.tsx"
    - "frontend/src/routes/api/**"
```

Validate in Codecov UI after upload — frontend flag should approach Vitest **73.83%**.
Current `codecov.yml` is valid YAML; CI uses `skip_validation: true` (`ci.yml:278,338`).
Do not chase external "YAML is invalid" banners without a cited Codecov error string.

**3. Update stale docs** (ADR 002, testing 1-pager) with measured baselines + pointer to this plan.

**Acceptance:** Progress table filled; Codecov path alignment PR uploaded; no doc claims 80%+ without caveat.

---

### Slice B1 — Backend 74% → 80% (gap-driven)

**Primary greenfield (0% today on `COVERPKG`):**

| File | Stmts | Est. lift | Tests to add |
|------|-------|-----------|--------------|
| `internal/wire/routes.go` | 0% | **+3-4%** | `routes_test.go`: mount via `RegisterRoutes`, assert `/api/v1` groups per `routes.go:17-69` — public auth routes (`POST /auth/register`, `POST /auth/login`), protected routes (`GET /me`, `POST /auth/logout`), admin group (`GET /admin/features`), SSE (`GET /events/stream`, `POST /events/ticket`). Assert `X-API-Version: v1` via `middleware.APIVersion`. **No `/api/v2`** — versioning middleware for v2 is tested in `middleware/versioning_test.go` only. |
| `internal/wire/services.go` | 0% | +1-2% | `BuildServices` smoke with `testutil` pool |
| `internal/wire/handlers.go` | 0% | +1% | `BuildHandlers` returns non-nil handlers |

**Extend existing packages:**

| File | Unit `COVERPKG` % | Gap |
|------|-------------------|-----|
| `observability/tracer.go` `InitTracer` | 14.3% | Extend `tracer_test.go`: OTEL endpoint set vs unset (`OTEL_ENDPOINT` empty → noop) |
| `middleware/metrics.go` | partial | Request metrics middleware when `cfg.MetricsEnabled` true/false (`config.go:110`) |
| `service/auth/*.go` | ~13% unit | Covered by integration — extend handler tests for error branches, not duplicate service integration |

**Do not duplicate:** `auth_integration_test.go`, `queue_test.go`, `csrf_test.go`,
`rate_limiter_redis_test.go`, `login.test.tsx` failed-login cases (`login.test.tsx:73-109`).

**Acceptance:** `go tool cover -func` on **merged** `coverage.out` ≥80% for `COVERPKG`.

**Budget:** ~1 session (wire tests + observability branches).

---

### Slice B2 — Frontend flag 65% → 72% (branches + Codecov alignment)

**Already well-tested (extend branches, don't rewrite):**
- `src/lib/auth.test.ts`, `api.test.ts` — exist; focus on **branch** gaps
- `src/routes/(public)/login/index.tsx` + `login.test.tsx` — 95% stmts, **50% branches**
- `src/routes/(public)/signup/index.tsx` + `signup.test.tsx` — 87% stmts, **64% branches**
- `src/components/organisms/navigation/*` — tests exist (`Navbar`, `Sidebar`, `Footer`)

**Branch gaps (after B0 re-measure — skip rows already ≥60% branches):**

| File | Stmts | Branches | Action |
|------|-------|----------|--------|
| `src/routes/(public)/login/index.tsx` | 95% | **50%** | Mock `useSearchParams` with `{ redirectTo: '/settings' }` (`login.test.tsx:16` currently `[{}]`) — assert `mockNavigate` receives encoded redirect |
| `src/routes/(private)/settings/index.tsx` | 95% | **59%** | Password-change API failure, avatar upload error branches |
| `src/routes/(public)/reset-password/index.tsx` | 86% | 68% | Invalid/expired token path |
| `src/routes/(public)/signup/index.tsx` | 87% | 64% | Validation error branches not covered |

**Skip (already tested):** `toast.test.ts` (multi-toast/dismiss `:29-115`), login error
display (`login.test.tsx:73-109`), `auth.test.ts`, `api.test.ts`, navigation organisms.

**Codecov path alignment (B0)** is the primary frontend lift — re-measure before adding tests.

**Acceptance:** Codecov frontend flag ≥72% **or** Vitest branches ≥55% if flag alignment suffices.

**Budget:** ~1 session (branch tests) + B0 path fix.

---

### Slice B3 — Raise gates (last)

Only after B0–B2 measured on CI:

```typescript
// frontend/vitest.config.ts — example after recovery
thresholds: { statements: 75, branches: 55, functions: 78, lines: 75 }
```

```yaml
# codecov.yml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%
```

**Acceptance:** Full CI green including Codecov project ≥80%.

**Rollback:** Revert `codecov.yml` `target` to `auto`; restore prior `vitest.config.ts` thresholds.

---

## Execution order

```
B0 → A1 → A2 → A3 → B1 ─┐
              ↘ B2 ───────┴→ B3
```

A1/A2 parallel with B1 if separate subagents. B3 only when both flags meet interim targets.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| `eslint-plugin-solid` 0.14 still crashes charts | Keep `solid/reactivity: off`; file upstream issue |
| TS-eslint 8 rule flood | Rollback A1; fix in batches |
| Wire route tests brittle | Assert named routes via `e.Routes()`, not snapshots |
| Codecov path change hides real gaps | Document excluded paths; match `vitest.config.ts` list exactly |
| `h3` highs never clear | Accepted dev risk in CHANGELOG; revisit on `@solidjs/start` bump |
| Threshold raise blocks PRs | B3 in isolated commit after metrics met |

## Progress

| Slice | Status | Measured result |
|-------|--------|-----------------|
| B0 | Pending | Baseline recorded above (2026-06-07, `f0a1dc1`) |
| A1 | Pending | — |
| A2 | Pending | — |
| A3 | Pending | — |
| A4 | Skipped (optional) | — |
| B1 | Pending | Unit-only `COVERPKG`: 56.1% (`f0a1dc1`) |
| B2 | Pending | Vitest included: 73.83% stmts / 52.03% branches |
| B3 | Pending | — |

## Retro hook (fill when complete)

One lesson for the next plan: _TBD after execution._

## Related

- `docs/plans/archive/v0.3.0-platform-hardening.md` — Vitest 4 recalibration
- `.cursor/rules/write-tests.mdc`, `write-tests-frontend.mdc`, `ci-workflow.mdc`
- `frontend/vitest.config.ts`, `codecov.yml`, `.github/workflows/ci.yml:18,140-347`
- `frontend/.eslintrc.cjs:14` — `solid/reactivity` off
