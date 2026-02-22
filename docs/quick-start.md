# Quick Start

> Get Golid running locally in under 5 minutes.

---

## Prerequisites

- **VS Code** or **Cursor** (recommended)
- **Docker Desktop** running
- **Dev Containers extension** installed

That's it. Everything else (Go, Node, PostgreSQL, migrations, seed data) is handled by the DevContainer.

---

## Option A: DevContainer (Recommended)

```bash
git clone https://github.com/golid-ai/golid.git my-project
cd my-project
```

Open in VS Code/Cursor → when prompted, click **"Reopen in Container"** (or run `Dev Containers: Reopen in Container` from the command palette).

The DevContainer will:
- Start PostgreSQL (Docker Compose)
- Install Go + Node.js + all dependencies
- Run database migrations
- Seed development data
- Start the backend via Air hot-reload (port 8080)

---

## Option B: Docker Compose Only

```bash
git clone https://github.com/golid-ai/golid.git my-project
cd my-project
docker compose up
```

This starts PostgreSQL + the Go backend on **http://localhost:8080**.

---

## Start Frontend

The frontend runs outside Docker for fast HMR. In a separate terminal:

```bash
cd frontend && npm install && npm run dev
```

Open **http://localhost:3000**

---

## Test Accounts

| Account | Email | Password |
|---------|-------|----------|
| Admin | admin@example.com | Password123! |
| User | user@example.com | Password123! |

---

## Explore

| Page | What to see |
|------|------------|
| `/login` | Login with test accounts |
| `/dashboard` | Protected dashboard page |
| `/settings` | Profile settings |
| `/components` | Component showcase (70+ components) |

---

## Environment Variables

All env vars are in `config/.env.local` (loaded automatically by the DevContainer).

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing key (min 32 chars) | Yes |
| `APP_NAME` | Branding in emails (default: "Golid") | No |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` | Email delivery | No (emails logged if missing) |

---

## Common Commands

```bash
# Backend (auto-started by DevContainer via Air)
cd backend && go build ./...            # Build check
cd backend && go test ./...             # Unit tests
cd backend && go test -tags integration ./...  # Integration tests

# Frontend
cd frontend && npm run dev              # Dev server (port 3000)
cd frontend && npx tsc --noEmit         # Type check

# Database
psql "$DATABASE_URL"                    # Connect to DB
cd backend && psql "$DATABASE_URL" < seeds/dev_seed.sql  # Re-seed

# Migrations
cd backend && migrate -path migrations -database "$DATABASE_URL" up
cd backend && migrate -path migrations -database "$DATABASE_URL" down 1

# Scaffolding
cd backend && make new-module name=notes   # Generate a new CRUD module
```

### E2E Tests

E2E tests use Playwright and require the full stack (backend + DB + frontend) running.

**In the DevContainer** (browser deps are pre-installed):

```bash
cd frontend
npx playwright install chromium    # Download browser (first time only)
npx playwright test                # Run all E2E tests
npx playwright test --ui           # Interactive mode with trace viewer
```

**Outside the DevContainer** (on your Mac):

```bash
# Start the stack
docker compose up -d
cd frontend && npm run dev &

# Install browser + run tests
cd frontend
npx playwright install --with-deps chromium
npx playwright test
```

---

## Production Mode

To enable Redis-backed job queues and persistent rate limiting:

```bash
docker compose --profile production up
```

This starts Redis + a background worker alongside the standard services. Configure via env vars:

| Env Var | What it enables |
|---------|----------------|
| `REDIS_URL` | Job queue (asynq) + persistent rate limiting |
| `OTEL_ENDPOINT` | Distributed tracing (OpenTelemetry) |
| `METRICS_ENABLED=true` | Prometheus `/metrics` endpoint |
| `MAILGUN_API_KEY` | Real email delivery |

Without these env vars, the app falls back to in-memory rate limiting, goroutine-based email, and no tracing — perfect for development.

> **Production CORS:** Set `ALLOWED_ORIGINS=https://yourdomain.com` in your production env. Without it, all cross-origin requests are rejected (secure default).

---

## Next Steps

- [Architecture](architecture.md) — Backend/frontend layers, auth flow, data fetching
- [Best Practices](best-practices.md) — Coding patterns and rules
- [Components](components.md) — UI component library
- [Index](README.md) — Complete documentation map
