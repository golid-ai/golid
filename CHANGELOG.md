# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Opt-in job queue** — asynq + Redis with `IsConfigured()` gate. `REDIS_URL` set = persistent queue with retries. Unset = goroutine fallback. Worker process via `cmd/worker/main.go`
- **Opt-in persistent rate limiting** — Redis fixed-window counter when `REDIS_URL` set. In-memory fallback when not. Fail-open on Redis errors with logging
- **Opt-in observability** — OpenTelemetry distributed tracing via `OTEL_ENDPOINT` (no-op when unset). Prometheus metrics via `METRICS_ENABLED` (`/metrics` endpoint, request count/duration, SSE connections gauge)
- **Feature flags** — DB-backed toggles with 30s in-memory cache. Public `GET /features` endpoint, admin CRUD endpoints. Migration 000004
- **API versioning** — `/api/v1` + `/api/v2` route groups with `X-API-Version` response header. Strategy doc at `docs/api-versioning.md`
- **Docker Compose production profile** — `docker compose --profile production up` adds Redis + worker. Default `docker compose up` unchanged (db + backend)
- 3 new Cursor AI rules: `job-queue.mdc`, `feature-flags.mdc`, `observability.mdc` (23 total)
- Queue package with typed task payloads, `EmailSender` interface, 8 unit tests
- Feature flag handler tests (5 tests: admin list, non-admin list, public listEnabled, admin set, non-admin set)
- API versioning middleware tests (2 tests: v1 header, v2 header)
- Observability tests (tracer no-op, metrics counter, metrics duration)
- Codebase standard: `IsConfigured()` opt-in modules pattern documented in `.cursor/rules/codebase-standards.mdc`
- ESLint config (`.eslintrc.cjs`) with TypeScript + SolidJS plugins
- golangci-lint config (`.golangci.yml`) with 6 explicit linters
- CI: lint + typecheck for frontend, golangci-lint-action for backend, govulncheck + npm audit security scanning
- CI: Playwright E2E job with Docker Compose (blocking gate)
- CI: stale generated types check
- Pre-commit hooks (husky) with prettier check + go vet
- Root Makefile with `make test`, `make lint`, `make dev`, `make build`
- Settings page tests (5 tests: render, form data, buttons, save, error state)
- Auth guard rendering tests (3 tests: loading, authenticated, unauthenticated)
- UserService.UpdateProfile integration tests (profile update + avatar set/clear)
- Retry() helper unit tests (immediate success, flaky success, exhausted attempts, edge cases)
- ETag handler tests (304 Not Modified, 200 on data change)
- Component unit tests for Button, Card, Badge, Input, Spinner (16 tests)

### Changed

- Settings page: added alive guards on async operations (codebase standard)
- Settings page: refactored save/password buttons with Switch/Match for error/loading/default states
- Settings page: `snackbar` -> `toast` for TypeScript compatibility
- Auth handler email sends: queue when Redis available, goroutine fallback when not
- Rate limiter: Redis-backed when `REDIS_URL` set, in-memory when not
- Coverage thresholds set to production gates (80/84/77/80 statements/branches/functions/lines)
- CSRF cookie documented with SameSite=Lax intent comment
- Pagination helper documented with intent comments
- Go scaffold tool replaced bash script (portable, uses text/template)
- **Rename tool** — `make rename` to rebrand the project (Go module paths, package.json, Docker files, CI configs, docs)
- 23 Cursor AI rules (was 14): added sse-realtime.mdc, rename-tool.mdc + updated 6 existing rules

### Fixed

- `authApi.me` -> `usersApi.me` (runtime error on login)
- Seed password hash corrected (bcrypt of `Password123!`)
- AG Grid enterprise errors (dynamic import, community-only defaults)
- TypeScript types: added `vitest/globals` to tsconfig
- ESLint: disabled crashing `solid/reactivity` rule (plugin 0.13 bug with TSAsExpression)

## [1.0.0] - 2026-02-18

### Added

- Go 1.26 backend with Echo, pgx/v5, JWT auth, Mailgun email
- SolidJS frontend with SolidStart SSR, Tailwind CSS, 70+ components
- SSE real-time events with per-user hub, one-time ticket auth, auto-reconnect
- PostgreSQL 16 with golang-migrate migrations and sqlc code generation
- Full auth suite: registration, login, JWT rotation, password reset (selector/verifier), email verification, change password
- GitHub Actions CI (build, vet, test for backend and frontend)
- Module scaffolding: `make new-module name=notes`
- Docker Compose dev environment with VS Code DevContainer
- Cloud Run deploy/teardown scripts
- 14 Cursor AI rules for automated code quality
- Comprehensive documentation: architecture guide, example module walkthrough, best practices, component reference
- MIT License
