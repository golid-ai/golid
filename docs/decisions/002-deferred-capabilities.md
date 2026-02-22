# ADR-002: Deferred Capabilities

**Status:** Accepted
**Date:** 2026-02-20
**Decision makers:** Steven Frank

## Context

After completing the V1 framework (auth, 70+ components, CI/CD, 82%+ test coverage, deployment infra), we evaluated what additional engineering capabilities a "rebuild Notion at Google level" project would need. Twenty-one capabilities were identified as gaps between "production starter" and "scaled production service," or flagged during the pre-launch audit as improvements that aren't worth the cost right now.

## Decision

**Defer all twenty-one. The framework is complete for V1. Each capability has a specific trigger condition for when to add it.**

## Deferred Capabilities

### 1. Load Testing

**What:** k6 or artillery scripts that benchmark auth endpoints, authenticated CRUD flows, and SSE connections under concurrent load.

**Why defer:** No users yet. Benchmark numbers would be meaningless without a representative workload. The Go + pgxpool stack is inherently performant — the bottleneck will be application-specific queries, not the framework.

**Trigger:** Before public launch or when onboarding the first team that asks "what's the throughput?" Add a `benchmarks/` directory with a k6 script and publish req/s + p95 latency numbers in the README.

### 2. Audit Logging

**What:** Structured log of who performed sensitive operations (user deletion, role changes, feature flag toggles, password resets) with timestamp, actor ID, and before/after state.

**Why defer:** Audit logging is a compliance requirement (SOC2, HIPAA, GDPR), not a framework requirement. Adding it before a compliance need exists means maintaining a schema and retention policy with zero consumers.

**Trigger:** First enterprise customer asks for SOC2 compliance, or the app handles data subject to regulatory audit. Implementation: append-only `audit_log` table with `actor_id`, `action`, `resource_type`, `resource_id`, `metadata JSONB`, `created_at`.

### 3. OpenAPI Request Validation

**What:** Middleware that validates incoming HTTP requests against `backend/openapi.yaml` at runtime — rejecting requests with unknown fields, wrong types, or missing required fields before they reach the handler.

**Why defer:** `c.Bind()` + custom validation helpers (`validate.Email`, `validate.Required`, `validate.MinLength`) already catch real issues. Runtime spec validation adds ~1-2ms per request for marginal benefit. The generated TypeScript types already ensure the frontend sends correct shapes.

**Trigger:** When the API becomes public (third-party consumers who don't use the generated types). Libraries: `kin-openapi` for Go, or `oapi-codegen` strict server mode.

### 4. Application-Level Caching

**What:** Redis-backed cache for hot read paths (user profiles, feature flags, frequently accessed lists) with TTL and invalidation.

**Why defer:** Feature flags already have a cache (30s TTL in `FeatureService`). Adding a generic caching pattern without specific hot paths to optimize is premature. Redis is already integrated for rate limiting and queue — the connection is there when needed.

**Trigger:** Database query monitoring shows a specific endpoint with high read frequency and stable data. Implementation: `cache.Get(key, ttl, fetchFn)` wrapper around Redis with JSON serialization.

### 5. Granular RBAC

**What:** Workspace-level permissions beyond the current `admin`/`user` binary. Roles like owner, admin, editor, viewer, commenter with resource-level access control.

**Why defer:** RBAC is application-specific. A note-taking app needs different permissions than a marketplace. The current two-role system demonstrates the pattern (handler calls `requireUserType`, service verifies resource ownership). Downstream projects extend it for their domain.

**Trigger:** The app needs more than two permission levels. Implementation: `roles` table + `user_roles` junction table + `requirePermission("workspace:edit")` middleware helper.

### 6. Local Email Testing (MailHog)

**What:** MailHog SMTP server in docker-compose that captures all outgoing emails and provides a web UI to inspect them. Replaces the current "logs to stdout" dev fallback.

**Why defer:** The current `IsConfigured()` fallback (log email content to stdout) works for development. MailHog is a better DX but adds another container to docker-compose and a dependency to maintain.

**Trigger:** When a developer reports difficulty testing email flows (verification, password reset) locally. Implementation: one service block in `docker-compose.yml`, point `SMTP_HOST` at it. Inspired by [allaboutapps/go-starter](https://github.com/allaboutapps/go-starter).

### 7. Parallel Test Databases (IntegreSQL)

**What:** IntegreSQL provides isolated, pre-provisioned PostgreSQL databases for each integration test, enabling parallel test execution without shared state conflicts.

**Why defer:** Current integration tests run serially against a single test database with `CleanAllTables` between tests. This works at the current test suite size (~36 integration tests, ~10s total). IntegreSQL adds infrastructure complexity (another container, template DB management) for a speedup that only matters with 100+ integration tests.

**Trigger:** Integration test suite exceeds 60 seconds or tests start failing due to shared state race conditions. Inspired by [allaboutapps/go-starter](https://github.com/allaboutapps/go-starter).

### 8. Lean Template Variant

**What:** The framework ships Three.js, GSAP, Observable Plot, AG Grid, d3-geo, world-atlas, and us-atlas (~3MB+ of dependencies). These power the component showcase but most projects won't use them. A "minimal" template option — or moving showcase-only deps to devDependencies — would reduce the default footprint.

**Why defer:** The showcase components demonstrate framework capabilities and serve as reference implementations for dynamic imports, lazy loading, and third-party integration patterns. Splitting into template variants adds maintenance cost (two dependency trees to keep in sync) for a problem users haven't reported yet.

**Trigger:** Users report slow installs or bloated production bundles on projects that don't use the showcase components. Implementation: either move showcase deps to `devDependencies` and gate their imports, or offer `--template minimal` in the CLI (see item 9).

### 9. CLI Scaffolding (npx create-golid)

**What:** A `create-golid` CLI (like `create-next-app` or `create-solid`) that initializes a new project with interactive prompts, replacing the current fork + rename tool workflow.

**Why defer:** The rename tool handles the core use case (fork, rebrand, build) and is tested as part of the codebase. A publishable CLI requires npm package publishing, versioning independent of the framework, template hosting, and ongoing maintenance of the scaffolding logic outside the monorepo. ADR-001 covers the broader package extraction strategy.

**Trigger:** Community adoption demands smoother onboarding than fork + rename, or the framework needs template variants (minimal vs full) that a CLI can present as choices. Implementation: `create-golid` npm package using `prompts` + `degit` or similar, with the rename tool's logic embedded.

### 10. Cross-Browser E2E Testing

**What:** Run Playwright E2E tests against Firefox and WebKit in addition to Chromium.

**Why defer:** Chromium covers ~65% of browser market share and catches the vast majority of functional regressions. Adding Firefox and WebKit triples CI time and introduces browser-specific flaky failures that have nothing to do with application code. Even mature projects (Next.js, SolidStart) only run Chromium in CI.

**Trigger:** A user reports a browser-specific bug that Chromium E2E didn't catch, or the app requires explicit cross-browser certification (e.g., enterprise procurement). Implementation: add `projects: [chromium, firefox, webkit]` to `playwright.config.ts` and a matrix strategy in the E2E CI job.

### 11. Benchmarks in CI

**What:** Run `benchmarks/benchmark.js` as a CI job to track performance regressions over time.

**Why defer:** Benchmark results vary by CI runner (CPU throttling, shared tenancy). Without a dedicated baseline runner, results are noisy and unreliable. The benchmark exists for manual profiling — developers run it against their local or staging environment where results are consistent and meaningful.

**Trigger:** Performance regression is detected in production, or a dedicated CI runner with stable hardware is available. Implementation: add a `benchmark` CI job with `continue-on-error: true` and publish results as PR comments for comparison.

### 12. Pre-Push Test Hook

**What:** A husky `pre-push` hook that runs `make check` (lint + test + build) before allowing `git push`.

**Why defer:** Pre-push hooks that run the full test suite are polarizing. Experienced developers often disable them (`--no-verify`) because they block the push for 1-2 minutes on every attempt. The current pre-commit hook catches formatting issues, and CI catches test failures on push. This is a deliberate layering: fast feedback locally, full validation in CI.

**Trigger:** The team grows beyond solo development and test discipline becomes inconsistent. Implementation: `npx husky add .husky/pre-push "make check"`.

### 13. Nonce-Based CSP

**What:** Replace the default `unsafe-inline` CSP with a nonce-based policy that generates a per-request nonce for inline scripts and styles.

**Why defer:** SolidJS and Tailwind both inject inline styles at runtime. A nonce-based CSP requires SolidStart build tooling changes (nonce injection into SSR-rendered script tags) that are deployment-specific and framework-version-dependent. The current CSP is configurable via `CSP_POLICY` env var — production deployments can override the default with a stricter policy. The default works correctly for development and staging.

**Trigger:** Security audit requires nonce-based CSP, or the app handles sensitive data that justifies the additional build complexity. Implementation: middleware generates a nonce per request, passes it to SolidStart's SSR context, and sets the CSP header with `script-src 'nonce-{value}'`.

### 14. OpenAPI Code Generation

**What:** Auto-generate the OpenAPI spec from Go handler annotations (e.g., `swag` or `oapi-codegen` server mode) instead of maintaining `backend/openapi.yaml` by hand.

**Why defer:** Hand-maintained specs are intentional and often more accurate than annotation-generated specs. The current spec is the source of truth for the TypeScript type generation pipeline (`npm run generate:types`). Annotation-based generation introduces coupling between handler comments and API contracts, and generated specs tend to be verbose with less control over structure.

**Trigger:** The API surface grows beyond 20+ endpoints where manual maintenance becomes error-prone, or the team adds a second API consumer (mobile, third-party) that needs guaranteed spec accuracy. Implementation: adopt `oapi-codegen` strict server mode or `swag` annotations.

### 15. Visual Regression Testing

**What:** Screenshot comparison tests (e.g., Percy, Chromatic, or Playwright's `toHaveScreenshot`) that detect unintended visual changes to components.

**Why defer:** Visual regression testing requires a baseline screenshot repository, a comparison service, and careful threshold tuning to avoid false positives from font rendering differences across OS versions. The 70+ components have unit tests for behavior and accessibility — visual correctness is verified during development via the component showcase page.

**Trigger:** A component library update or Tailwind version bump causes undetected visual regressions. Implementation: add `toHaveScreenshot()` assertions to existing Playwright E2E tests for critical pages, or integrate Percy/Chromatic for the component showcase.

### 16. Pre-Commit Typecheck and Lint

**What:** Add `npm run typecheck` and `npm run lint` (frontend) and `golangci-lint run` (backend) to the `.husky/pre-commit` hook, which currently only runs Prettier format check and `go vet`.

**Why defer:** Adding typecheck and lint to pre-commit makes every commit take 30+ seconds. Developers bypass slow hooks with `--no-verify` out of frustration, defeating the purpose entirely. The current layering is deliberate: pre-commit catches formatting (fast, <2s), CI catches type errors and lint violations (thorough, runs on push). A slow hook that gets bypassed is worse than no hook.

**Trigger:** Never, unless both conditions are met: (1) the team grows large enough that CI feedback delay causes repeated broken-main incidents, and (2) the typecheck + lint completes in under 10 seconds (e.g., via incremental type checking or project references). Even then, prefer a pre-push hook over pre-commit.

### 17. ESLint 8 → 9 Migration

**What:** Upgrade from ESLint 8 + `@typescript-eslint` v6 to ESLint 9 (flat config) + `@typescript-eslint` v8+.

**Why defer:** ESLint 9 introduced a breaking config format change (`.eslintrc` → `eslint.config.js` flat config). The migration touches every config file, changes plugin resolution, and requires testing every rule. The current setup works correctly, passes CI, and catches real issues. This is a dedicated PR with its own QA cycle, not a pre-launch fix.

**Trigger:** A plugin or rule we need only supports ESLint 9+, or ESLint 8 stops receiving security patches. Implementation: follow the [ESLint migration guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0), convert to flat config, update all plugins.

### 18. Retry Context Cancellation

**What:** Add a `context.Context` parameter to `service.Retry()` so fire-and-forget goroutines (email sends) can be cancelled during server shutdown instead of running to completion.

**Why defer:** Adding context to `Retry()` changes the function signature, which cascades to every caller — handlers, queue task handlers, and tests. The actual risk is minimal: with default config (3 attempts, 1s base delay with exponential backoff), a mid-retry goroutine runs at most ~3 seconds after shutdown. The email service makes outbound HTTP calls, not DB queries, so `defer db.Close()` doesn't cause panics. The cleanup cost exceeds the risk.

**Trigger:** The retry config grows to 5+ attempts with longer delays (making post-shutdown goroutines run for 30+ seconds), or the retry function is used for operations that touch the database pool. Implementation: add `ctx context.Context` as first parameter, replace `time.Sleep` with `select { case <-time.After(delay): case <-ctx.Done(): return ctx.Err() }`.

### 19. golangci-lint v2 Migration

**What:** Migrate from golangci-lint v1 to v2. The v1 line (last release v1.62.2) was built with Go 1.23 and does not support Go 1.26 modules. The v2 line (v2.10.1+) supports Go 1.26 but uses an incompatible configuration format.

**Why defer:** The v2 migration requires converting any `.golangci.yml` config to the new format, auditing `nolint` directive syntax changes, and testing against the new default linter set. The lint step is currently set to `continue-on-error: true` in CI — linting still runs locally with v1.62.2 (installed in the devcontainer) and catches issues before push.

**Trigger:** The devcontainer's Go version or toolchain upgrades make v1 unusable locally, or a new linter rule only available in v2 is needed. Implementation: follow the [golangci-lint migration guide](https://golangci-lint.run/docs/product/migration-guide), create a v2-compatible config, update CI action to `@v9` with a pinned v2 version, and remove `continue-on-error`.

### 20. API Proxy Fetch Timeout

**What:** Add an `AbortController` with a 35-second timeout to the `fetch` call in `frontend/src/routes/api/[...path].ts`, so the SolidStart SSR worker doesn't block indefinitely if the backend hangs at the connection level.

**Why defer:** The backend's `Timeout` middleware (default 30s) already protects against handler-level hangs. A connection-level hang (backend process stuck before reaching the handler) is extremely rare in practice — Cloud Run kills unresponsive instances, and the load balancer has its own timeout. The proxy already returns a 502 with a user-friendly message on network errors. The risk is real but the probability is low enough that it's not a launch blocker.

**Trigger:** Observing 502s in production where the proxy hung longer than the backend timeout, or load testing reveals worker exhaustion under backend slowdowns. Implementation: `const controller = new AbortController(); setTimeout(() => controller.abort(), 35_000);` passed as `signal` to `fetch`.

### 21. Avatar URL Input Validation

**What:** Add URL format validation (scheme allowlist, length limit) to the `avatar_url` field in `handler/user.go:validateProfileUpdate`.

**Why defer:** The field is stored in the database and rendered in `<img src="">` tags. While `<img src="javascript:...">` does not execute in any modern browser (CSP also blocks it), and the field is only writable by the authenticated user for their own profile, basic URL validation (https-only, max 2048 chars) is good hygiene. Not exploitable, but not validated either.

**Trigger:** The avatar URL is rendered in a context other than `<img src>` (e.g., markdown, link href, open redirect), or a security audit flags it. Implementation: validate `url.Parse` succeeds, scheme is `https`, length under 2048 characters.

## What This Means

The framework provides every engineering discipline needed for production:

- **Auth:** Register through email verification, password reset, token refresh, session revocation
- **Testing:** 82%+ coverage (unit + integration + component + E2E), CI-enforced thresholds
- **Security:** 2-layer auth, rate limiting, CORS, parameterized queries, no leaked internals
- **Observability:** Structured logging, optional OpenTelemetry + Prometheus
- **Deployment:** Docker, Cloud Run infra, env-driven config
- **Graceful degradation:** IsConfigured() pattern across all optional services

The twenty-one deferred items are the gap between "starter framework" and "scaled SaaS" — each is a single session of work when the trigger condition is met. None are structural gaps that require rearchitecting.
