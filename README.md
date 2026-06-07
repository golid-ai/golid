<p align="center">
  <img src="docs/images/Golid.png" alt="Golid" width="200">
</p>

<h1 align="center">Golid</h1>

<p align="center">
  <a href="https://github.com/golid-ai/golid/actions/workflows/ci.yml"><img src="https://github.com/golid-ai/golid/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/golid-ai/golid"><img src="https://codecov.io/gh/golid-ai/golid/branch/main/graph/badge.svg" alt="codecov" /></a>
  <img src="https://img.shields.io/badge/Go-1.26-00ADD8?logo=go&logoColor=white" alt="Go" />
  <img src="https://img.shields.io/badge/Echo-v4-1B9AAA?logo=go&logoColor=white" alt="Echo" />
  <img src="https://img.shields.io/badge/SolidJS-1.8-2C4F7C?logo=solid&logoColor=white" alt="SolidJS" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

<p align="center"><strong>An AI-native software factory</strong> for cloud-hosted <strong>Go + SolidJS</strong> apps.</p>

<p align="center">Production harness — plans, module specs, 45 Cursor rules, drift CI, integration test harness — plus a runnable starter app and GCP deploy scripts.</p>

<p align="center"><strong>Live example:</strong> <a href="https://golid.ai">golid.ai</a> — marketing site built with this factory; clone the repo for the harness and template app.</p>

<p align="center">
  <a href="#how-the-factory-works">Factory</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#fork-and-customize">Fork</a> ·
  <a href="#why-golid">Why Golid</a> ·
  <a href="#deployment">Deploy</a> ·
  <a href="#documentation">Docs</a>
</p>

---

## Tech Stack

| Layer         | Technology                              | Layer          | Technology                            |
| ------------- | --------------------------------------- | -------------- | ------------------------------------- |
| Backend       | Go 1.26 · Echo v4 · pgx/v5              | Frontend       | SolidJS · SolidStart · Tailwind CSS 4 |
| Database      | PostgreSQL 16                           | Infrastructure | Cloud Run · Cloud SQL · GCS           |
| Auth          | JWT rotation · selector/verifier tokens | Real-time      | SSE hub with ticket auth              |
| Email         | Mailgun (`IsConfigured()`)              | Job Queue      | asynq + Redis (goroutine fallback)    |
| Observability | OpenTelemetry · Prometheus (opt-in)     | Feature Flags  | DB-backed with 30s cache              |
| Hot Reload    | Air (Go) + Vite HMR                     | DevContainer   | One-click setup, zero config          |
| Testing       | 995 tests (353 Go unit + 622 Vitest + 20 E2E) | Factory harness | Plans · spec-drift · rule-health · plan loop |
| AI Rules      | 45 Cursor rules (auto-activate on edit)       | Integration     | `TEST_DATABASE_URL` · per-package schemas (separate `go test -tags integration` run) |

---

## How the factory works

Agents and humans share the same production contract — not prompt memory, not ad-hoc CI.

**1. Classify & plan** — [`workflow-routing`](.cursor/rules/workflow-routing.mdc) picks risk tier (T0–T3). Write slices in `docs/plans/` under [`planning-standards`](.cursor/rules/planning-standards.mdc) guardrails: verify schema and file claims against migrations and source; acceptance criteria per slice. New modules: [`plan-feature`](.cursor/rules/plan-feature.mdc). Calibration: [golden-slices](docs/golden-slices.md).

**2. Execute slices** — [`slice-and-ship`](.cursor/rules/slice-and-ship.mdc) per slice: implement → test → spec/OpenAPI sync → [`audit-bugs`](.cursor/rules/audit-bugs.mdc) pre-merge gate → commit. For multi-slice plans, invoke [`plan-execution-loop`](.cursor/rules/plan-execution-loop.mdc) to orchestrate subagents: implement → audit (≥90/100) → fix → re-audit before the next slice. Archive completed plans under `docs/plans/archive/`.

| Step | What | Where |
| ---- | ---- | ----- |
| **Spec** | Current behavior (updated as slices land) | `docs/modules/*/spec.md` |
| **Build** | Rules + scaffold enforce patterns | `.cursor/rules/` · `make new-module` |
| **Verify** | Unit + integration harness, race detector | Per-package `it_<pkg>_<pid>` schemas · sharded CI |
| **Gate** | Spec + rules stay aligned with code | `check_spec_drift.sh` · `check_citation_freshness.sh` · `check_rule_health.sh` on every PR |
| **Ship** | Cloud deploy + full rebrand | `./scripts/deploy.sh` · `make rename` (20+ file categories) |

**vs blank repo + AI:** OpenAPI + module specs + drift CI (not prompt memory) · `planning-standards` → `slice-and-ship` / `plan-execution-loop` · path-filtered CI + E2E + Codecov 80% gate · `make rename` rebrands the whole factory.

Full map: [Organism Pattern](docs/organism-pattern.md) · [Plans](docs/plans/README.md) · [routing eval](docs/routing-eval.md)

---

## What's Inside

Starter modules the factory extends — use `make new-module` or follow [example-module.md](docs/example-module.md).

| Module            | What it does                                                                  |
| ----------------- | ----------------------------------------------------------------------------- |
| **Auth**          | Registration, login, JWT refresh rotation, password reset, email verification |
| **Users**         | Profile (`/me`), settings, admin `user_type` gates                            |
| **Feature flags** | Public `GET /features`, admin CRUD, cached reads                              |
| **SSE**           | Per-user channels, one-time ticket auth, reconnect + backpressure             |
| **Components**    | 70+ atoms/molecules/organisms — charts, grids, date pickers, modals           |
| **Opt-in infra**  | Email, queue, Redis rate limiting, tracing, metrics — off by default          |

**Also included:** OpenAPI 3.1 + TypeScript codegen, sqlc queries, golang-migrate (with down migrations), CSRF + dual-tier rate limiting, scaffold generator, domain-safe rename tool, GCP deploy/teardown scripts.

<p align="center">
  <img src="docs/images/showcase-charts.png" alt="Data visualization components" width="49%" />
  <img src="docs/images/showcase-components.png" alt="Interactive UI components" width="49%" />
</p>

---

## Quick Start

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) 24+, [Node.js](https://nodejs.org/) 24+, [Go](https://go.dev/dl/) 1.26+

### DevContainer (recommended)

```bash
git clone https://github.com/golid-ai/golid.git my-project && cd my-project
# Open in VS Code/Cursor → "Reopen in Container"
```

Migrations and seed data run automatically (`entrypoint.dev.sh`). Backend starts on **8080**. Frontend starts as a VS Code task — open the **Terminal** tab and wait until the frontend dev server prints its local URL before opening **http://localhost:3000**.

### Docker Compose (local)

```bash
git clone https://github.com/golid-ai/golid.git my-project && cd my-project
make setup

# First run only — migrate + seed the dev database
export DATABASE_URL=postgres://dev:dev@localhost:5432/golid?sslmode=disable
make migrate-up seed

docker compose up          # DB + backend on :8080
cd frontend && npm run dev # frontend on :3000
```

**Test accounts** (after seed): `admin@example.com` / `Password123!` (admin) · `user@example.com` / `Password123!` (user)

**Guides:** [Quick Start](docs/quick-start.md) · [Start Here](docs/start-here.md) · **Forking?** [`make rename`](#fork-and-customize) · **Upgrading?** [CHANGELOG](CHANGELOG.md) (0.3.x breaking changes in [0.3.0](CHANGELOG.md#030---2026-06-07))

---

## Project Structure

```
golid/
├── backend/
│   ├── cmd/server/main.go       # Bootstrap, shutdown, background jobs
│   ├── internal/
│   │   ├── wire/                # BuildServices, BuildHandlers, RegisterRoutes
│   │   ├── service/             # Business logic (auth, user, feature, sse, email)
│   │   ├── handler/             # HTTP handlers
│   │   ├── middleware/          # JWT, CSRF, rate limiting, security
│   │   ├── pagination/          # Query normalization
│   │   ├── retry/               # Exponential backoff for fire-and-forget
│   │   └── apperror/            # Typed error responses
│   ├── migrations/              # SQL migration pairs (up + down)
│   ├── openapi.yaml             # REST API contract (OpenAPI 3.1)
│   └── seeds/                   # Development seed data
├── frontend/
│   └── src/
│       ├── components/          # 70+ components (atoms/molecules/organisms)
│       ├── lib/                 # api.ts, auth.ts, constants, validation
│       └── routes/
│           ├── (public)/        # login, signup, forgot-password, verify-email
│           └── (private)/       # dashboard, settings, component showcase
├── docs/
│   ├── modules/                 # Auth, users, feature specs (+ drift CI)
│   ├── plans/                   # Feature plans (active + archive/)
│   ├── architecture.md          # Layers, auth, SSE, wire
│   └── patterns/                # Stack quick references (Go, SolidJS, …)
├── .cursor/rules/               # 38 AI coding rules
├── config/                      # Environment files
├── scripts/                     # Deploy, drift checks, init-test-db, teardown
└── infra/                       # Cloud Run, Cloud Build configs
```

---

## Commands

```bash
# First run: make setup && migrate-up seed (see Quick Start)
make dev                           # DB + backend (docker compose up)
cd frontend && npm run dev         # Frontend dev server (port 3000)
make test                          # Backend + frontend unit tests
make check                         # lint + test + build (local CI parity)

export TEST_DATABASE_URL='postgres://dev:dev@localhost:5432/golid_test?sslmode=disable'
scripts/init-test-db.sh
cd backend && TEST_MIGRATIONS_PATH="$(pwd)/migrations" \
  go test -tags integration ./internal/handler/... ./internal/service/... -race
make new-module name=notes         # Scaffold CRUD module
make rename name=myapp module=github.com/user/myapp/backend
make help                          # All Makefile targets

./scripts/deploy.sh                # Deploy to QA (Cloud Run)
./scripts/deploy.sh check          # Validate config before deploy
```

Integration test setup: [CLI Reference](docs/cli-reference.md) (`init-test-db.sh`, `TEST_DATABASE_URL`).

---

## Why Golid?

### vs blank repo + AI

| | Golid | Blank repo + AI |
| --- | --- | --- |
| **Contract** | OpenAPI + module specs + drift CI | Prompt memory |
| **Integration safety** | `TEST_DATABASE_URL`, isolated schemas | Easy to wipe dev DB |
| **Agent ops** | `workflow-routing` → `planning-standards` → `slice-and-ship` / `plan-execution-loop` (45 rules) | Ad-hoc |
| **Production CI** | Path-filtered, E2E, Codecov 80% gate | Often none |
| **Fork factory** | `make rename` rebrands harness + app | Manual find-and-replace |

### vs other stacks

|                        | Golid                                       | Next.js + API         | Go-only starters |
| ---------------------- | ------------------------------------------- | --------------------- | ---------------- |
| Full-stack type safety | Go + TypeScript (OpenAPI → generated types) | TypeScript (tRPC/Zod) | Go only          |
| Production UI          | 70+ components                              | BYO                   | None             |
| SSR + real-time        | SolidStart SSR + SSE                        | Partial               | None             |
| Deploy                 | One-command GCP (`deploy.sh`); Docker elsewhere | Vercel-centric        | BYO              |
| Memory                 | ~30MB binary                                | ~200MB+               | ~30MB            |

Opt-in complexity: `docker compose up` works with zero Redis, Mailgun, or OTEL. Set one env var per module when you need it — see [Opt-In Modules](#opt-in-modules) below.

---

## Opt-In Modules

| Module        | Trigger           | Zero-config        | Production         |
| ------------- | ----------------- | ------------------ | ------------------ |
| Email         | `MAILGUN_API_KEY` | Logs to stdout     | Mailgun delivery   |
| Job Queue     | `REDIS_URL`       | Goroutine + Retry  | asynq + Redis      |
| Rate Limiting | `REDIS_URL`       | In-memory          | Redis fixed-window |
| Tracing       | `OTEL_ENDPOINT`   | No tracing         | OTLP export        |
| Metrics       | `METRICS_ENABLED` | No `/metrics`      | Prometheus         |
| Feature Flags | Always on         | PostgreSQL + cache | Same               |

`docker compose --profile production up` adds Redis + worker (see [CHANGELOG](CHANGELOG.md)).

---

## Architecture

Handlers → Middleware → Services → PostgreSQL. Wiring lives in `internal/wire/` (`BuildServices`, `BuildHandlers`, `RegisterRoutes`); business logic in `internal/service/<pkg>/`. Frontend uses SolidStart SSR with file-based routing.

**API surface today:** `/api/v1` (versioning middleware + migration path in [api-versioning.md](docs/api-versioning.md)).

Full breakdown: [architecture.md](docs/architecture.md) — auth flow, SSE ticket exchange, shutdown order, observability.

---

## Fork and Customize

```bash
git clone https://github.com/YOUR_USER/my-app.git && cd my-app
make rename name=myapp module=github.com/YOUR_USER/my-app/backend
git diff && make check
```

The rename tool updates 20+ file categories (imports, Docker, CI, Cursor rules, branding, OpenAPI) with domain-safe replacements. Details: [cmd/rename](backend/cmd/rename/).

---

## Deployment

```bash
./scripts/deploy.sh              # QA (default)
./scripts/deploy.sh prod         # Production (confirmation gate)
./scripts/deploy.sh qa api       # Backend only
./scripts/teardown.sh            # Teardown QA resources
```

[scripts/README.md](scripts/README.md) · [deployment-options.md](docs/deployment-options.md) (Fly.io, Railway, Render, bare metal)

---

## Code Quality

| Pattern        | Backend                                                 | Frontend                                     |
| -------------- | ------------------------------------------------------- | -------------------------------------------- |
| Error handling | `apperror`, no leaked internals                         | `alive` guard + `batch()` on async           |
| Content states | —                                                       | `Switch/Match`, no nested `<Show>`           |
| SQL            | Parameterized queries, `rows.Err()`, transactions       | —                                            |
| Auth           | TOCTOU-safe refresh, selector/verifier                  | SSR redirects, reactive 401 logout           |
| Linting        | golangci-lint (see `backend/.golangci.yml`)             | ESLint + `eslint-plugin-solid`               |
| Testing        | Unit + integration (real DB), race tests                | Vitest 4 + axe-core + Playwright E2E         |
| Coverage       | Codecov project (see badge); `target: 80%` gate          | Vitest floors **75/54/78/75** (included files) |
| Pre-merge      | `audit-bugs` / `audit-codebase` before declaring done   | Same checklists; T2+ and security slices mandatory |
| CI             | Path filters, spec-drift, rule-health, sharded coverage | lint, typecheck, build, audit (non-blocking) |

---

## Documentation

| Guide                                               | What it covers                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| [Start Here](docs/start-here.md)                    | Orientation: app flow, directories, devcontainer, rules               |
| [Architecture](docs/architecture.md)                | Layers, auth flow, SSE, wire, observability                           |
| [Module Specs](docs/README.md#module-specs)         | Auth, users, feature — rules, API surface, test scenarios             |
| [Quick Start](docs/quick-start.md)                  | Setup in 5 minutes                                                    |
| [CLI Reference](docs/cli-reference.md)              | Make targets, health endpoints, `TEST_DATABASE_URL`                   |
| [Example Module](docs/example-module.md)            | Build a feature end-to-end                                            |
| [Best Practices](docs/best-practices.md)            | Coding standards with real examples                                   |
| [Components](docs/components.md)                    | 70+ UI components reference                                           |
| [Organism Pattern](docs/organism-pattern.md)        | How rules, specs, plans, and drift checks connect                     |
| [GCP Networking](docs/infrastructure/networking.md) | Cloud Run frontend/API network diagram                                |
| [Deployment Options](docs/deployment-options.md)    | Cloud Run, Fly.io, Railway, Render                                    |
| [API Reference](backend/openapi.yaml)               | OpenAPI 3.1 — paste into [Swagger Editor](https://editor.swagger.io/) |
| [Changelog](CHANGELOG.md)                           | Release history (latest: 0.3.2; breaking changes in 0.3.0)          |
| [Full Index](docs/README.md)                        | Complete documentation map                                            |

**Cursor rules:** 45 rules in `.cursor/rules/` — full index in [cursor-rules.md](docs/cursor-rules.md). Factory workflow: `workflow-routing` → `planning-standards` → `slice-and-ship` / `plan-execution-loop`; pre-merge [`audit-bugs`](.cursor/rules/audit-bugs.mdc) before declaring slices done. Split examples: `solidjs-pages` + `solidjs-data-fetching`, `go-service` + `go-service-errors`.

---

## License

[MIT](LICENSE). Some frontend dependencies (AG Grid Community, Observable Plot, Three.js) have their own licenses — review `frontend/package.json` before commercial use.

## Troubleshooting

Docker or DevContainer won't start? **Docker Desktop → Troubleshoot → Clean / Purge data**, then retry.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
