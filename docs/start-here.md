# Start Here

> Onboarding guide for new developers. Under 5 minutes to running code.

## Quick Setup

**DevContainer (recommended):** Reopen in Container — migrations, seeds, and backend start automatically.

**Docker Compose:**

```bash
make setup
export DATABASE_URL=postgres://dev:dev@localhost:5432/golid?sslmode=disable
make migrate-up seed    # first run only
make dev                # DB + backend (docker compose up)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Test accounts after seed — see `backend/seeds/dev_seed.sql`.

## Codebase Primer

Golid is a web app with a separate web server and API server. The frontend feels
SPA-like after load, but the web server still matters: it serves the SolidStart
app, handles SSR/public metadata, redirects, assets, and proxies `/api/*` to the
Go backend.

Request flow:

```text
Browser -> SolidStart web server -> /api proxy -> Go API -> PostgreSQL
```

In dev, the frontend runs on `:3000` and the backend on `:8080`. In production,
the public Cloud Run frontend proxies API traffic to the private Cloud Run
backend.

## Common Directories

Backend:

- `backend/internal/wire/` — app wiring, route registration, dependency setup.
- `backend/internal/handler/` — HTTP handlers: parse requests, auth context,
  responses.
- `backend/internal/service/` — business logic, permissions, transactions,
  domain rules.
- `backend/internal/db/` — database helpers/query support.
- `backend/internal/apperror/` — standard API error types.
- `backend/migrations/` — PostgreSQL schema changes.
- `backend/openapi.yaml` — API contract.

Frontend:

- `frontend/src/routes/` — SolidStart route tree.
- `frontend/src/routes/(public)/` — public pages.
- `frontend/src/routes/(private)/` — authenticated app pages.
- `frontend/src/routes/api/[...path].ts` — API proxy to the backend.
- `frontend/src/components/` — shared UI components.
- `frontend/src/lib/api.ts` — typed API client.
- `frontend/src/lib/constants.ts` — route lists and shared constants.
- `frontend/src/lib/` — auth, stores, utilities, metadata helpers.

Docs and workflow:

- `docs/modules/*/spec.md` — source of truth for module behavior.
- `docs/plans/` — implementation plans for meaningful features (see `docs/plans/README.md` for tiers and iteration model).
- `docs/manual-qa/` — manual verification checklists.
- `docs/runbooks/` — operational/debugging procedures.
- `.cursor/rules/` — working rules for agents and engineers.

## API Contract

The backend owns the contract in `backend/openapi.yaml`. When backend routes,
request shapes, response shapes, or auth/error behavior change, update the
backend, OpenAPI, frontend API client/types, tests, and relevant docs/specs in
the same slice.

Frontend code should not guess response shapes. If the frontend needs data, the
contract should say so.

## DevContainer

The DevContainer gives everyone the same local setup: Go, Node, PostgreSQL,
scripts, env shape, migrations, seeds, and test/build commands.

Use `config/.env.example` or a redacted checklist for onboarding. Do not share
real `config/.env.local` values.

## Before Modifying a Module

Read the module spec at `docs/modules/{module}/spec.md` before making changes to services, handlers, or routes. The spec documents state machines, business rules, and critical test scenarios. The module-to-folder mapping is in `.cursor/rules/codebase-standards.mdc`.

## Cursor Rules

38 rules in `.cursor/rules/`. Every rule opens with a thesis statement.

- **Always-on (3):** `codebase-standards`, `git-commits`, `parallel-subagents`
- **File-scoped (24):** `go-service`, `go-handler`, `solidjs-pages`, `write-tests`, etc. — auto-activates when editing matching files
- **On-demand (11):** `plan-feature`, `slice-and-ship`, `plan-execution-loop`, `audit-bugs`, `write-rules`, etc. — invoke by name or via task description

Full reference: [Cursor Rules](cursor-rules.md)

## Testing

```bash
cd backend && go test ./...                     # unit tests
cd backend && go test -tags integration ./...   # integration (needs DB)
cd frontend && npm run test:coverage            # Vitest
cd frontend && npm run typecheck                # type check (always run before push)
make test                                       # full suite
```

Integration tests use `//go:build integration` and `testutil.WithTestDB`. Always test error paths, not just happy paths.

## Further Reading

- [Architecture](architecture.md) — layers, auth flow, SSE, middleware stack
- [Example Module](example-module.md) — build a CRUD feature end-to-end
- [Best Practices](best-practices.md) — coding standards with bad/good examples
- [Schema ERD](schema.md) — full database diagram
- [Components](components.md) — 70+ UI components reference
- [Permission Matrix](permissions.md) — who can do what across all modules
- [Error Contracts](error-contracts.md) — apperror → HTTP → response → frontend handling
- [Cross-Module Flows](flows.md) — flow maps showing cascade paths
- [Domain Glossary](glossary.md) — terms that mean something different in this codebase
