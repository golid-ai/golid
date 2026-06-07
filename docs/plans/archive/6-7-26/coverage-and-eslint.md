# Coverage Recovery + TypeScript-ESLint 8

> **Status:** Complete (archived 2026-06-07) — Codecov project **82.98%**; `target: 80%` gate locked (B3b)  
> **Risk tier:** T2 — toolchain and test expansion, no auth/schema/migration changes  
> **Thesis:** Close the gap between honest Codecov reporting (~68% project at start) and
> documented quality bars (~80%) by testing uncovered backend wiring/observability,
> aligning Codecov paths with Vitest excludes, and upgrading `@typescript-eslint`
> v8 (on existing ESLint 8) to clear dev-tooling audit noise.

## Verified baseline (2026-06-07, branch `steve-dev`)

**Pre-B4d CI (commit `f5fcb34`):** project **78.68%**, frontend **77%**, backend **81.44%**, 4,720 tracked lines.

**Post-B4d local (`npm run test:coverage`):** **622** Vitest tests; **91.54%** stmts / **74.12%** branches / **93.72%** lines (included files). **993** total tests (351 Go + 622 Vitest + 20 E2E).

## Original baseline (2026-06-07, commit `f0a1dc1`)

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
| Codecov project target | repo | `codecov.yml` | `target: 80%`, `threshold: 2%` |

**Why Vitest (74%) ≠ Codecov frontend (65%):** Vitest excludes showcase/heavy components
(`vitest.config.ts:26-39`); Codecov frontend flag counts **all** `frontend/src/` including
excluded paths that never appear in `lcov.info` as covered → drags flag average down.

**Why unit-only backend (56%) ≠ Codecov backend (74%):** `COVERPKG` spans handler/service/wire;
integration shards (`ci.yml:208-215`) add coverage unit tests never hit. B1 targets must
use **merged CI profile**, not `go test ./...` alone.

### Stale documentation (fixed in A3; counts refreshed post-B4d)

| Doc | Was | Fixed |
|-----|-----|-------|
| `docs/decisions/002-deferred-capabilities.md` | "82%+ test coverage" | `993 tests; Codecov ~78% recovering toward 80%+` |
| `docs/patterns/testing/1-Page.md` | 80/75/80% pyramid + "Coverage > 80%" DoD | Vitest floors 75/54/78/75 + plan link + post-B4d local % |
| `README.md` / `CHANGELOG.md` | 831 tests | **993** tests (351 Go + 622 Vitest + 20 E2E) |
| `write-tests-frontend.mdc` | 68/47/73/68 thresholds | 75/54/78/75 + plan link |

### Reproducible output (post-B4d, local)

```text
# frontend — npm run test:coverage (tail)
Statements   : 91.54% ( 3474/3795 )
Branches     : 74.12% ( 1309/1766 )
Functions    : 91.47% ( 1191/1302 )
Lines        : 93.72% ( 2643/2820 )
Tests        : 622 passed

# totals
Go unit      : 351 test cases (go test ./... -json RUN events)
Playwright   : 20 E2E (frontend/tests/e2e/)
Combined     : 993

# frontend — npm audit --audit-level=high
0 high (h3@1.15.9 override)
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
| Codecov **project** | **78.68%** (CI pre-B4d) → **~80%** (expected post-B4d) | **≥80%** (stretch **82%**) | `codecov.yml` `target: 80%` in **B3b** after CI upload |
| Codecov **backend** flag | **81.44%** (CI) | **≥80%** | **Met** — hold, don't chase |
| Codecov **frontend** flag | **77%** (CI pre-B4d) | **≥79%** (stretch **82%**) | **B4 done** — await upload |
| Vitest included statements | **91.54%** (local post-B4d) | **≥75%** | **Met** (B3 floors) |
| Vitest branches | **74.12%** (local post-B4d) | **≥55%** | **Met** |
| `npm run lint` | pass | pass | TS-eslint 8 + plugin-solid 0.14 |
| npm audit high (informational) | 7 | **≤2** | TS-eslint chain cleared; h3 may remain |
| Stale coverage docs | 2 files | 0 | ADR 002 + testing 1-pager |

**80% project target — how we get there (updated post-CI upload):**

1. **B0–B2:** Project **68.24% → 73.17%** (+4.9 pp). Backend **81.44%** ✓. Frontend **68.11%** — bottleneck.
2. **B4:** Frontend component branch tests → frontend **~79–82%** → project **~80–82%**.
3. **B3b:** Lock `codecov.yml` `target: 80%` when project **≥79.5%** on PR.

**LOC weights (Codecov `steve-dev`, 4,720 tracked lines):**

| Flag | Tracked | Weight | Coverage | Covered lines |
|------|---------|--------|----------|---------------|
| `backend/` | 1,794 | **38.0%** | 81.44% | ~1,461 |
| `frontend/src/` | 2,928 | **62.0%** | 68.11% | ~1,993 |

**To hit project targets (backend held at 81.44%):**

| Project target | Frontend flag needed | +Covered lines (≈) |
|----------------|---------------------|-------------------|
| **80%** | **~79%** | **+320** |
| **82%** (stretch) | **~82%** | **+420** |

Backend gains are capped (~74 missed lines in `service/auth/*`); **B4 is frontend-only**.

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

### Slice B4 — Frontend components 68% → 79–82% (project 80–82%)

**Verified gap (Codecov `steve-dev`, commit `1476ded`):**

| Path | Coverage | Missed | Notes |
|------|----------|--------|-------|
| `components/molecules/` (folder) | **56.75%** | **473** | Primary drag |
| `components/organisms/navigation/` | **58.33%** | **45** | Tests exist, branches thin |
| `components/atoms/` | 72.04% | 102 | Lower priority |

**Tier 1 — highest LOC × gap (target ~+320 lines → project 80%):**

| File | Codecov % | Missed | Tests to extend | Branch targets |
|------|-----------|--------|-----------------|----------------|
| `molecules/Menu/Menu.tsx` | **30%** | **157** | `Menu.test.tsx` | `Submenu`/`SubmenuTrigger`/`SubmenuContent`; keyboard (`ArrowDown`, `ArrowUp`, `Escape`, `ArrowLeft`); item `onClick`; close on outside click; `aria-expanded` toggle |
| `molecules/MultiSelect/MultiSelect.tsx` | **47%** | **77** | `MultiSelect.test.tsx` | Select/deselect items; clear; keyboard nav; empty state |
| `molecules/Select/Select.tsx` | **51%** | **62** | `Select.test.tsx` | Change handler; disabled option; placeholder vs value |
| `molecules/Combobox/Combobox.tsx` | **49%** | **57** | `Combobox.test.tsx` (create if missing) | Filter/typeahead; select; clear input |
| `organisms/navigation/Sidebar.tsx` | **50%** | **23** | `Sidebar.test.tsx` | Mobile overlay (`subscribeMobile` true); `collapsed` prop; non-admin hides admin items; `isActive` nested path; `displayName` fallback when no user |
| `organisms/navigation/Navbar.tsx` | **62%** | **22** | `Navbar.auth.test.tsx` | Extend existing — mobile drawer open/close branches not hit |

**Tier 2 — stretch to 82% (+~100 lines):**

| File | Codecov % | Missed | Action |
|------|-----------|--------|--------|
| `molecules/LoadingOverlay/LoadingOverlay.tsx` | **5%** | **36** | New `LoadingOverlay.test.tsx` — show/hide, message prop |
| `molecules/RadioGroup/RadioGroup.tsx` | 58% | 23 | Extend tests — controlled value change |
| `molecules/Tabs/Tabs.tsx` | 67% | 23 | Tab switch, disabled tab |
| `service/auth/auth_password.go` | 61% | 36 | Optional integration paths — low project weight (~0.5 pp) |

**Do not test (showcase — already Codecov-ignored):** Charts, AgGrid, Canvas3D, GeoPlot, DatePicker, etc.

**Do not rewrite:** existing happy-path tests in `Navbar.test.tsx`, `Footer.test.tsx`, `Menu.test.tsx` open/click cases.

**Sub-slice split (parallel subagents OK):**

```
B4a (navigation) ─┐
B4b (Menu)       ─┼→ re-measure Codecov → B3b
B4c (Select family) ─┘
B4d (stretch)    — optional if project < 80% after B4a–c
```

**B4a — Navigation** (~1 session)

- `Sidebar.test.tsx`: mock `ui.subscribeMobile` → `true`; assert overlay + close buttons; `collapsed` opacity branch; mock `auth.isAdmin` false → no Components link; `useLocation` nested path for `isActive`
- `Navbar.auth.test.tsx`: branches for drawer content after mobile menu click

**B4b — Menu** (~1 session)

- `Menu.test.tsx`: render `Submenu` + `SubmenuTrigger` + `SubmenuContent`; fire keyboard events on trigger/content; assert `Escape` closes; item click calls handler

**B4c — Select family** (~1 session)

- Extend `MultiSelect.test.tsx`, `Select.test.tsx`; add `Combobox.test.tsx` if absent
- Pattern: `createSignal` harness, `fireEvent` + `waitFor` for portal content

**Acceptance:**

| Tier | Codecov project | Codecov frontend | Vitest |
|------|-----------------|----------------|--------|
| **Commit** | **≥80%** | **≥79%** | `npm run test:coverage` exit 0 |
| **Stretch** | **≥82%** | **≥82%** | branches ≥58% (optional floor raise) |

**Verification:** CI upload after B4a–c; file tree unchanged (no new ignores). Run `npm run test:coverage` locally before push.

**Budget:** 2–3 sessions (B4a ∥ B4b ∥ B4c, then B4d if needed).

---

### Slice B3b — Codecov gate (after B4)

Only when B4 upload shows Codecov **project ≥79.5%**:

```yaml
# codecov.yml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%
```

**Acceptance:** Codecov project ≥80% green on PR.

---

## Execution order

```
B0 → A1 → A2 → B1 ─┐
         ↘ B2 ─────┴→ A3 → B3 (Vitest floors)
                              ↓
                    B4a ∥ B4b ∥ B4c → (re-measure) → B4d? → B3b
```

- **B4** — frontend component branches; backend on hold at 81%.
- **B3b** — Codecov `target: 80%` only after B4 confirms ≥79.5% project.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| `eslint-plugin-solid` 0.14 still crashes charts | Keep `solid/reactivity: off`; file upstream issue |
| TS-eslint 8 rule flood | Rollback A1; fix in batches |
| Wire route tests brittle | Assert named routes via `e.Routes()`, not snapshots |
| Codecov `ignore` nested under `coverage:` (silent no-op) | Top-level `ignore:` sibling of `coverage:`; validate + UI file-tree check |
| Codecov path change hides real gaps | Document excluded paths; match `vitest.config.ts` list exactly |
| 80% project unreachable after B0+B1 alone | B4 required; B3b gated on ≥79.5% after B4 |
| Menu/portal tests flaky | `waitFor` + `fireEvent`; static wrapper per `write-tests-frontend` |
| `h3` highs never clear | Accepted dev risk in CHANGELOG; revisit on `@solidjs/start` bump |
| Threshold raise blocks PRs | B3 in isolated commit after metrics met |

## Progress

| Slice | Status | Measured result |
|-------|--------|-----------------|
| B0 | Done | Top-level `ignore:` (16 paths). CI upload: frontend showcase paths excluded; frontend flag **68.11%** (not 74% — remaining drag is real UI in `components/`, not showcase) |
| A1 | Done | `eslint@8.57.1`, `@typescript-eslint/*@8.60.1`, `eslint-plugin-solid@0.14.5`; audit high **7 → 1** (minimatch/TS-eslint chain cleared; remaining: h3/vinxi); lint/typecheck/test:run pass; deps bump only — rule drift fixes in A2 |
| A2 | Done | 8 TS-eslint 8 code fixes (empty interfaces → type aliases, void pathname track); `.eslintrc.cjs` rule comments documented; `solid/reactivity` stays off — 0.14.5 safe, 22 false-positive warns if enabled; lint/typecheck/test:run exit 0 |
| A3 | Done | ADR 002 + testing 1-pager stale % claims replaced; CHANGELOG [Unreleased] TS-eslint 8 + accepted h3 risk; `rg '82%|Coverage > 80%' docs/` clean (plan + archive only) |
| A4 | Skipped (optional) | — |
| B1 | Done | CI backend flag **81.44%** ✓. Wire **100%**, handler error branches, `InitTracer` **90.5%** |
| B2 | Done | Vitest included: **76.57%** stmts / **55.43%** branches (was 74.28% / 52.94%); branch tests in `validation.ts` (`validate`, `getFirstError`), `auth.ts`/`auth.initialize.test.ts` (error paths, initialize, session-expired), `api.ts` (401 refresh, `getErrorMessage`, parseError), `settings.test.tsx` (explicit expects, save retry/success), `format.ts`, `ui.ts`, `use-breakpoint.ts`; Vitest branches gate **≥55% met** |
| B3 | Done (Vitest floors) | Thresholds **75 / 54 / 78 / 75**. Codecov `target: auto` — deferred to **B3b** after B4 |
| B4 | Done | CI post-B4d: project **82.98%**, frontend **83.94%**, backend **81.44%**. Local Vitest **91.54%** stmts / **74.12%** branches / **93.72%** lines; **622** Vitest tests (**993** total) |
| B4a | Done | `Sidebar.test.tsx` + `Navbar.auth.test.tsx`: mobile overlay/close, collapsed opacity, non-admin hides Components, nested `isActive`, `displayName` fallback, auth drawer branches. **+16 tests** (522 total). Vitest **77.65%** stmts / **56.62%** branches; `Sidebar.tsx` **95.87%** / **93.87%**; `Navbar.tsx` **78.12%** / **66.66%** |
| B4b | Done | `Menu.test.tsx`: Submenu/SubmenuTrigger/SubmenuContent, keyboard (ArrowDown/Up/Escape/ArrowLeft), item onClick, SubmenuTrigger `aria-expanded` toggle, outside mousedown close, `aria-controls` open-state link. **+15 tests** (554 total). Vitest **85.84%** stmts / **65.91%** branches; `Menu.tsx` **86.62%** / **57.55%** |
| B4c | Done | `Select.test.tsx` + `MultiSelect.test.tsx` + `Combobox.test.tsx`: select/deselect, chip clear, keyboard nav (Arrow/Enter/Escape/Home/End), disabled trigger, filter/typeahead, empty filter. **+17 tests** (554 total). Vitest **85.53%** stmts / **65.4%** branches; `Select.tsx` **88.48%** / **63.88%**; `MultiSelect.tsx` **84.97%** / **61.2%**; `Combobox.tsx` **83.72%** / **58.16%** |
| B4d | Done | Stretch offenders: new `LoadingOverlay.test.tsx`; extended `Tooltip`, `Textarea`, `RadioGroup`, `Tabs`, `Menu`, `MultiSelect`, `sse.test.ts`. **+68 tests** (622 Vitest / 993 total). Offender lines (local): `LoadingOverlay` **100%**, `Textarea` **100%**, `RadioGroup` **100%**, `Tabs` **100%**, `Tooltip` **~94%**, `sse` **~94%**, `MultiSelect` **~95%**, `Menu` **~92%** |
| B3b | Done | `codecov.yml` `target: 80%`; removed deprecated top-level `notify:` (CI upload **82.98%** project) |

## Execution readiness audit (2026-06-07)

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Completeness | 98 | B0–B4d + B3b complete; plan archived 2026-06-07 |
| Accuracy | 96 | Codecov **82.98%**; docs and `codecov.yml` aligned |
| Actionability | 91 | Copy-paste commands; per-slice acceptance |
| Slice independence | 90 | B4a–d split validated |
| Verification | 98 | 622 Vitest + typecheck + CI Codecov **82.98%** |
| **Overall** | **~95** | **Complete** — archived under `6-7-26/` |

## Retro hook (fill when complete)

One lesson for the next plan: _Vitest line % and Codecov headline % diverge when partial branches count as uncovered — test keyboard/viewport branches for Codecov lift, not just render paths._

## Related

- `docs/plans/archive/6-7-26/v0.3.0-platform-hardening.md` — Vitest 4 recalibration
- `.cursor/rules/write-tests.mdc`, `write-tests-frontend.mdc`, `ci-workflow.mdc`
- `frontend/vitest.config.ts`, `codecov.yml`, `.github/workflows/ci.yml:18,140-347`
- `frontend/.eslintrc.cjs:14` — `solid/reactivity` off
