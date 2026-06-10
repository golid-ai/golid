# CLI Reference

> **Purpose:** Copy-safe commands for local development, testing, debugging,
> and deployment. Prefer project scripts and Makefile targets over invented shell.

## Local Development

```bash
# First-time setup (env file, JWT secret, test DB, frontend deps)
make setup

# Start full stack (DB + backend via Docker Compose)
make dev

# Frontend dev server (devcontainer task uses port 3000)
cd frontend && PORT=3000 npm run dev -- --host

# Backend with hot reload (devcontainer)
cd backend && air -c .air.toml
```

## Health Endpoints

| Endpoint | Purpose | Consumer |
|----------|---------|----------|
| `GET /health` | Liveness — process up, no DB check | Devcontainer task, local debugging |
| `GET /ready` | Readiness — DB reachable | Docker Compose backend healthcheck, E2E wait |

```bash
curl -sf http://localhost:8080/health
curl -sf http://localhost:8080/ready
```

## Test Database

Integration tests use a **separate database** (`golid_test`), not the dev `golid` database.
Each test package migrates an isolated schema (`it_<pkg>_<pid>`) via testutil.

```bash
# Create golid_test if missing (also runs during make setup)
scripts/init-test-db.sh

# Or with explicit URL (CI / custom Postgres)
export TEST_DATABASE_URL='postgres://dev:dev@localhost:5432/golid_test?sslmode=disable'
scripts/init-test-db.sh

# Run integration tests (requires golid_test + migrations path)
cd backend && TEST_DATABASE_URL="$TEST_DATABASE_URL" \
  TEST_MIGRATIONS_PATH="$(pwd)/migrations" \
  go test -tags integration ./internal/service/... -race

# Compile integration tests without executing (when DB safety is uncertain)
cd backend && go test -tags=integration ./internal/service/auth -run '^$'
```

**Safety rule:** Never point `TEST_DATABASE_URL` at a production or shared dev database.
The harness creates and drops per-package schemas but still requires a dedicated test DB.

## Makefile Targets

```bash
make help              # List all targets
make setup             # .env.local + init-test-db.sh + npm install
make dev               # docker compose up
make test              # Backend + frontend tests
make test-backend      # go test -race ./...
make test-frontend     # vitest run
make lint              # golangci-lint + eslint + typecheck
make build             # Backend + frontend production build
make check             # lint + test + build (full local CI)
make new-module name=X # Scaffold a CRUD module
make verify-scaffold   # CI: generate test module, build, clean up
make rename name=X module=Y domain=Z  # Rebrand forked project (domain optional)
make migrate-up        # Requires DATABASE_URL
make migrate-down      # Rollback one migration
make seed              # Load dev_seed.sql
make benchmark         # k6 load test
make clean             # Remove build artifacts
```

## Frontend Testing

```bash
cd frontend && npm run test:run          # Vitest (~622 component + lib tests)
cd frontend && npm run test:coverage     # With coverage (floors 75/54/78/75; see docs/plans/archive/6-7-26/coverage-and-eslint.md)
cd frontend && npm run typecheck         # tsc --noEmit (run before push)
cd frontend && npm run generate:types    # Regenerate from openapi.yaml

# E2E (requires full stack)
cd frontend && npx playwright install chromium
cd frontend && npx playwright test
```

## Backend Testing

```bash
cd backend && go test ./...                              # Unit only
cd backend && go test -race ./...                        # With race detector
cd backend && go vet ./...
cd backend && golangci-lint run ./...

# Integration (see Test Database section above)
cd backend && go test -tags integration ./internal/handler/... -race
cd backend && go test -tags integration ./internal/service/... -race
```

## Spec Drift & Citations

`check_spec_drift.sh` requires **bash 4+** (`mapfile`, associative arrays). On macOS, use Homebrew bash — default `/bin/bash` is 3.2:

```bash
# Before committing handler/service changes
/opt/homebrew/bin/bash scripts/check_spec_drift.sh origin/main

# Verify line-number citations in docs/ (symbol citations in module specs are skipped by design)
/opt/homebrew/bin/bash scripts/check_citation_freshness.sh
```

Skip markers (use sparingly, document in PR):

- `[skip-spec(auth): reason]` — skip drift check for one module
- `[skip-spec: reason]` — skip all modules in range

## Database & Migrations

```bash
# Manual migrate (dev DB)
export DATABASE_URL='postgres://dev:dev@localhost:5432/golid?sslmode=disable'
make migrate-up

# Re-seed dev data
make seed

# Direct psql
psql "$DATABASE_URL" -f backend/seeds/dev_seed.sql
```

## SSE Development

When frontend and backend run on different origins, set the SSE base URL:

```bash
VITE_SSE_URL=http://localhost:8080 npm run dev -- --host
```

## GCP Deployment

```bash
./scripts/deploy.sh qa          # QA (both services)
./scripts/deploy.sh qa api      # Backend only
./scripts/deploy.sh prod        # Production
```

See [deployment-options.md](deployment-options.md) and [infrastructure/devops.md](infrastructure/devops.md) for full deployment docs.

## Git

```bash
git log --oneline origin/main..HEAD   # Commits ahead of remote
```
