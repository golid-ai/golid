# Coverage Recovery + TypeScript-ESLint 8

> **Status:** Ready (execution readiness ~93/100 after audit 2026-06-07)  
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
| Vitest (included files only) | local | `cd frontend && npm run test:coverage` | **76.57%** stmts / **55.43%** branches / **80.18%** funcs |
| Vitest CI floors | repo | `frontend/vitest.config.ts:41-45` | **75 / 54 / 78 / 75** |
| Backend unit (`COVERPKG`, CI merge) | local | See B0 commands | **56.1%** unit-only (see output below) |
| Backend unit + integration | Codecov | CI merges unit + handler + service shards | **73.82%** (Codecov backend flag) |
| `npm audit --audit-level=high` | local | `cd frontend && npm audit --audit-level=high` | **5** (4 moderate, **1 high** — h3 only after A1) |
| ESLint stack | repo | `frontend/package.json:59-64` | `eslint@^8.57`, `@typescript-eslint/*@^8.60`, `eslint-plugin-solid@^0.14` |
| npm audit CI gate | repo | `.github/workflows/ci.yml:340-347` | **Non-blocking** (warn + exit 0) |
| Codecov project target | repo | `codecov.yml:4-7` | `target: auto`, `threshold: 2%` |

**Why Vitest (74%) ≠ Codecov frontend (65%):** Vitest excludes showcase/heavy components
(`vitest.config.ts:26-39`); Codecov frontend flag counts **all** `frontend/src/` including
excluded paths that never appear in `lcov.info` as covered → drags flag average down.

**Why unit-only backend (56%) ≠ Codecov backend (74%):** `COVERPKG` spans handler/service/wire;
integration shards (`ci.yml:208-215`) add coverage unit tests never hit. B1 targets must
use **merged CI profile**, not `go test ./...` alone.

### Stale documentation (fixed in A3)

| Doc | Was | Fixed |
|-----|-----|-------|
| `docs/decisions/002-deferred-capabilities.md` | "82%+ test coverage" | `784 tests; Codecov ~68% project (0.3 baseline)` |
| `docs/patterns/testing/1-Page.md` | 80/75/80% pyramid + "Coverage > 80%" DoD | Vitest floors 75/54/78/75 + plan link |

Not stale: `README.md` (784 tests, no % claim), `vitest.config.ts` (matches measured floors).

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
| Vitest branches | 55.43% | **≥55%** | Primary frontend quality lever |
| `npm run lint` | pass | pass | TS-eslint 8 + plugin-solid 0.14 |
| npm audit high (informational) | 7 | **≤2** | TS-eslint chain cleared; h3 may remain |
| Stale coverage docs | 2 files | 0 | ADR 002 + testing 1-pager |

**80% project target — how we get there:**

1. **B0:** Top-level Codecov `ignore` aligned with Vitest excludes → frontend flag should rise
   toward Vitest's **73.83%** (same files instrumented).
2. **B1:** `internal/wire/` tests (+4–6 pts on backend flag) → backend **73.82% → ~80%**.
3. **B2:** Branch tests — likely **required** for project ≥80%, not optional. Rough weighted
   math from baselines: B0+B1 alone land ~**76–78% project**; B2 closes the gap.
4. **B3:** Lock `codecov.yml` `target: 80%` only when an interim PR shows Codecov **project
   ≥79.5%**; otherwise run more B2 before raising gates.

Codecov project % is LOC-weighted across both flags — B0 records exact weights from the
component tree in **Progress** before B3.

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
| `docs/decisions/002-deferred-capabilities.md:9,190` | Replace "82%+" with "784 tests; Codecov ~68% project (0.3 baseline)" |
| `CHANGELOG [Unreleased]` | TS-eslint 8; accepted `h3` dev-dep risk |

**Verification:** `rg '82%|Coverage > 80%' docs/` returns only this plan or archive.

**Rollback:** `git checkout docs/ CHANGELOG.md`

### Slice A4 — (Optional) Blocking audit gate

Only if product wants audit as CI gate: remove `|| exit 0` wrapper in `ci.yml:342-347`,
set target ≤2 highs, document accepted `h3` exceptions in runbook. **Default: skip** (stay informational).

---

## Track B — Coverage recovery

### Slice B0 — Baseline and gate alignment

**Scope:** Measure, align Codecov paths, fill **Progress** table. **Do not** edit ADR 002 or
testing 1-pager here — doc rewrites are slice **A3** only (avoids merge conflicts).

**1. Record CI-equivalent backend coverage** (matches `ci.yml:140-264`):

```bash
cd backend
export COVERPKG='./internal/apperror/...,./internal/config/...,./internal/handler/...,./internal/middleware/...,./internal/observability/...,./internal/pagination/...,./internal/queue/...,./internal/retry/...,./internal/service/...,./internal/validate/...,./internal/wire/...'
export TEST_MIGRATIONS_PATH="$(pwd)/migrations"   # required — ci.yml:218, testutil/schema.go

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

# Integration (requires Postgres + TEST_DATABASE_URL — see docs/cli-reference.md, scripts/init-test-db.sh)
export TEST_DATABASE_URL='postgres://...'   # per local test DB
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

**2. Align Codecov frontend flag** with Vitest intentional excludes — add **top-level** `ignore:`
to `codecov.yml` (sibling of `coverage:`, not nested — see Codecov "Ignoring Paths" docs).
Mirror every path in `vitest.config.ts:14-40`:

```yaml
# Top-level — NOT under coverage:
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

coverage:
  status:
    # ... existing project/patch blocks unchanged
```

**Post-upload validation:** Open Codecov file tree on the B0 PR — excluded showcase paths
must be absent. Frontend flag should approach Vitest **73.83%**. Validate locally:

```bash
cat codecov.yml | curl --data-binary @- https://codecov.io/validate
```

CI uses `skip_validation: true` (`ci.yml:278,338`); still run validate before merge.

**Acceptance:** Progress table filled; Codecov path alignment PR uploaded; file tree confirms
ignores applied.

**B0 post-upload checklist** (Codecov UI on B0 PR — closes slice):
- Excluded showcase paths absent from file tree (`Charts/`, `AgGrid/`, `Canvas3D/`, `entry-*.tsx`, etc.)
- Frontend flag ~**73.83%** (matches Vitest included stmts baseline)
- Project % re-measured for B3 gate (uses LOC weights in Progress row)

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
| `observability/tracer.go` `InitTracer` | low | Extend `tracer_test.go`: OTEL endpoint set vs unset (`OTEL_ENDPOINT` empty → noop) |
| `service/auth/*.go` | ~13% unit | Covered by integration — extend handler tests for error branches, not duplicate service integration |

**Out of scope:** `cmd/server/bootstrap.go` `MetricsEnabled` (`config.go:110`) — `cmd/server`
is not in `COVERPKG`. `middleware/metrics.go` already has `metrics_test.go`.

**Do not duplicate:** `auth_integration_test.go`, `queue_test.go`, `csrf_test.go`,
`rate_limiter_redis_test.go`, `login.test.tsx` failed-login cases (`login.test.tsx:73-109`).

**Wire test harness (no repo precedent — starter sketch):**

```go
// internal/wire/routes_test.go
func TestRegisterRoutes_MountsV1Groups(t *testing.T) {
    pool := testutil.WithTestDB(t) // or minimal mocks if integration-free
    svcs := BuildServices(pool, testCfg())
    h := BuildHandlers(svcs, testCfg())
    e := echo.New()
    wire.RegisterRoutes(e, h, svcs, testCfg(), stubJWTMW())
    routes := e.Routes()
    assertRoute(t, routes, "POST", "/api/v1/auth/register")
    assertRoute(t, routes, "GET", "/api/v1/me")
    // ... per routes.go:17-69; assert X-API-Version via httptest if needed
}
```

**Acceptance (two-tier):**

1. **Implementation (slice done locally):** `internal/wire/*` **100%**; `InitTracer` **≥90%**;
   auth handler error branches (`ForgotPassword`, `ResendVerification`, `VerifyEmail`) **≥95%**.
2. **Metric gate (CI):** Codecov **backend flag** ≥80% on PR upload — requires CI integration
   merge + wire lift. Local unit-only `COVERPKG` (~67%) will not reach 80% because
   `internal/service/*` is integration-covered in CI, not unit tests.

**Budget:** ~1 session (wire tests + observability branches + handler error paths).

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
| `src/routes/(public)/login/index.tsx` | 95% | **50%** | Mock `useSearchParams` with `{ redirectTo: '%2Fsettings' }` (`login.test.tsx:16` currently `[{}]`) — assert `mockNavigate` receives decoded `/settings` (`index.tsx:29-31`) |
| `src/routes/(private)/settings/index.tsx` | 95% | **59%** | Password-change API failure, avatar upload error branches |
| `src/routes/(public)/reset-password/index.tsx` | 86% | 68% | Invalid/expired token path |
| `src/routes/(public)/signup/index.tsx` | 87% | 64% | Validation error branches not covered |

**Skip (already tested):** `toast.test.ts` (multi-toast/dismiss `:29-115`), login error
display (`login.test.tsx:73-109`), `auth.test.ts`, `api.test.ts`, navigation organisms.

**Codecov path alignment (B0)** is the primary frontend lift — re-measure before adding tests.

**Acceptance:** Codecov frontend flag ≥72% **and** Vitest branches ≥55%; re-measure after B0
before scoping rows (skip any file already ≥60% branches).

**Budget:** ~1 session (branch tests). Treat as **required** for 80% project gate unless B0+B1
upload already shows project ≥79.5%.

---

### Slice B3 — Raise gates (last)

Only after B0–B2 measured on CI **and** an interim PR shows Codecov **project ≥79.5%**:

```typescript
// frontend/vitest.config.ts — example after recovery (lines 41-46)
thresholds: { statements: 75, branches: 55, functions: 78, lines: 75 }
```

```yaml
# codecov.yml — add to existing coverage.status block
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%
```

If project is still below 79.5% after B0+B1, run B2 before touching gates.

**Acceptance:** Full CI green including Codecov project ≥80%.

**Rollback:** Revert `codecov.yml` `target` to `auto`; restore prior `vitest.config.ts` thresholds.

---

## Execution order

```
B0 → A1 → A2 → B1 ─┐
         ↘ B2 ─────┴→ (re-measure project %) → A3 → B3
```

- **B0 first** — Codecov ignore + baseline (no doc edits).
- **A1 → A2** — TS-eslint bump + rule cleanup.
- **B1 ∥ B2** — backend wire + frontend branches (parallel subagents OK).
- **Re-measure** — Codecov project % on PR before A3/B3.
- **A3** — stale doc fixes + CHANGELOG (after metrics known).
- **B3** — raise gates only if project ≥79.5% on interim PR.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| `eslint-plugin-solid` 0.14 still crashes charts | Keep `solid/reactivity: off`; file upstream issue |
| TS-eslint 8 rule flood | Rollback A1; fix in batches |
| Wire route tests brittle | Assert named routes via `e.Routes()`, not snapshots |
| Codecov `ignore` nested under `coverage:` (silent no-op) | Top-level `ignore:` sibling of `coverage:`; validate + UI file-tree check |
| Codecov path change hides real gaps | Document excluded paths; match `vitest.config.ts` list exactly |
| 80% project unreachable after B0+B1 alone | B2 required; B3 gated on ≥79.5% interim PR |
| `h3` highs never clear | Accepted dev risk in CHANGELOG; revisit on `@solidjs/start` bump |
| Threshold raise blocks PRs | B3 in isolated commit after metrics met |

## Progress

| Slice | Status | Measured result |
|-------|--------|-----------------|
| B0 | In progress — codecov.yml landed locally; post-upload validation pending CI/PR | Top-level `ignore:` (16 paths, mirrors `vitest.config.ts:14-40`); **LOC weight** (`find`/`wc` on `frontend/src`): ignored showcase **11,210 / 25,459** lines (**44.0%** of tree, **55.9%** included — B3 gate math); unit `COVERPKG` **60.3%** (2026-06-07); integration skipped (`TEST_DATABASE_URL` unset). Validate API: `notify` unknown field (pre-existing; CI `skip_validation: true`). **Post-upload verifies:** frontend flag → ~**73.83%**; Codecov file tree excludes showcase paths |
| A1 | Done | `eslint@8.57.1`, `@typescript-eslint/*@8.60.1`, `eslint-plugin-solid@0.14.5`; audit high **7 → 1** (minimatch/TS-eslint chain cleared; remaining: h3/vinxi); lint/typecheck/test:run pass; deps bump only — rule drift fixes in A2 |
| A2 | Done | 8 TS-eslint 8 code fixes (empty interfaces → type aliases, void pathname track); `.eslintrc.cjs` rule comments documented; `solid/reactivity` stays off — 0.14.5 safe, 22 false-positive warns if enabled; lint/typecheck/test:run exit 0 |
| A3 | Done | ADR 002 + testing 1-pager stale % claims replaced; CHANGELOG [Unreleased] TS-eslint 8 + accepted h3 risk; `rg '82%|Coverage > 80%' docs/` clean (plan + archive only) |
| A4 | Skipped (optional) | — |
| B1 | Done (impl) — backend flag ≥80% pending CI | Unit `COVERPKG` **66.9%**; wire/* **100%**; `InitTracer` **90.5%**; `ForgotPassword`/`ResendVerification` **95%**, `VerifyEmail` **100%** (+15 handler unit tests); `tracer.go` schemaless fix; integration skipped locally (host→docker DB EOF). **Impl tier met.** Metric tier: verify Codecov backend flag ≥80% on PR |
| B2 | Done | Vitest included: **76.57%** stmts / **55.43%** branches (was 74.28% / 52.94%); branch tests in `validation.ts` (`validate`, `getFirstError`), `auth.ts`/`auth.initialize.test.ts` (error paths, initialize, session-expired), `api.ts` (401 refresh, `getErrorMessage`, parseError), `settings.test.tsx` (explicit expects, save retry/success), `format.ts`, `ui.ts`, `use-breakpoint.ts`; Vitest branches gate **≥55% met** |
| B3 | Done (Vitest gates) — Codecov 80% pending CI | **Audit 2026-06-07:** `npm run test:coverage` exit 0 (507 tests). Thresholds **75 / 54 / 78 / 75** — margin **1.6 / 1.4 / 2.2 / 1.7** pts below measured **76.57% / 55.43% / 80.18% / 76.73%**. `codecov.yml` **`target: auto`** (not 80%) — correct deferral; project ≥79.5% unproven (baseline **68.24%**; B0 ignore + B1 backend flag pending CI upload). Next: interim PR → confirm project ≥79.5% → then `target: 80%` |

## Execution readiness audit (2026-06-07)

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Completeness | 92 | B0 harness, TEST_MIGRATIONS_PATH, wire sketch, B3 gate |
| Accuracy | 93 | Codecov top-level `ignore`; B1 scope corrected |
| Actionability | 91 | Copy-paste commands; per-slice acceptance |
| Slice independence | 90 | B0 docs deduped → A3 only |
| Verification | 92 | validate API + Codecov file tree |
| **Overall** | **~93** | **GO** — start B0 |

## Retro hook (fill when complete)

One lesson for the next plan: _TBD after execution._

## Related

- `docs/plans/archive/v0.3.0-platform-hardening.md` — Vitest 4 recalibration
- `.cursor/rules/write-tests.mdc`, `write-tests-frontend.mdc`, `ci-workflow.mdc`
- `frontend/vitest.config.ts`, `codecov.yml`, `.github/workflows/ci.yml:18,140-347`
- `frontend/.eslintrc.cjs:14` — `solid/reactivity` off
