# Architecture

This document describes the layered architecture of Golid.

## Overview

```
┌─────────────────────────────────────────────┐
│              Frontend (SolidStart SSR)       │
│  routes/ → components/ → lib/api.ts         │
│         ↓ fetch /api/v1/*                   │
├─────────────────────────────────────────────┤
│              Backend (Go + Echo)             │
│  handler → middleware → service → db (pgx)  │
│         ↓ SQL                               │
├─────────────────────────────────────────────┤
│              PostgreSQL 16                   │
└─────────────────────────────────────────────┘
```

## Backend Layers

### Handlers (`internal/handler/`)

HTTP-level concerns only:

- Parse and validate request body (`c.Bind`)
- Extract auth context (`requireUserID`)
- Call the appropriate service method
- Return JSON response with correct status code

Handlers never contain business logic or SQL. They delegate everything to services.

### Middleware (`internal/middleware/`)

The middleware stack is configured in `middleware/stack.go`:

1. **Recovery** — panic recovery
2. **Request ID** — unique ID per request
3. **CORS** — configurable origins
4. **Gzip** — response compression
5. **Timeout** — request deadline (30s default)
6. **Rate Limiter** — per-IP rate limiting
7. **JWT Auth** — token validation, sets `user_id` and `user_type` in context

Auth middleware runs only on the `protected` route group. Public routes (login, register, etc.) use `StrictRateLimiter()` instead.

### Services (`internal/service/`)

Business logic lives here. Services:

- Receive validated input from handlers
- Execute database queries (via pgxpool directly or sqlc-generated code)
- Return domain types or `apperror` errors
- Never import `echo` or any HTTP types

Current services:
- **AuthService** — registration, login, JWT generation, password reset, email verification, change password
- **UserService** — profile lookup, profile updates
- **EmailService** — Mailgun integration with `IsConfigured()` graceful degradation

### Database (`internal/db/`)

- **Pool** (`pool.go`) — pgxpool connection management with health checks
- **Models** (`models.go`) — sqlc-generated Go types matching the DB schema
- **Querier** (`querier.go`) — sqlc-generated interface for all queries
- **Query files** (`queries/*.sql`) — raw SQL with sqlc annotations

### Migrations (`migrations/`)

Sequential numbered migrations using golang-migrate:

```
000001_init.up.sql          — users table, user_type enum, triggers
000002_auth_tokens.up.sql   — verification_token, password_reset columns
000003_refresh_tokens.up.sql — refresh_tokens table
000004_feature_flags.up.sql — feature_flags table
000005_verification_token_hash.up.sql — verification token selector.verifier pattern
```

Every `.up.sql` has a matching `.down.sql` for rollback.

### Error Handling (`internal/apperror/`)

All errors use the `apperror` package — never `echo.NewHTTPError`:

```go
apperror.BadRequest("message")
apperror.Unauthorized("message")
apperror.Forbidden("message")
apperror.NotFound("message")
apperror.Conflict("message")
apperror.Validation("message", map[string]string{"field": "error"})
apperror.Internal(err)
```

The error middleware converts these to consistent JSON responses.

### Config (`internal/config/`)

All configuration reads from environment variables with sensible defaults. The `Config` struct is validated at startup — missing required values (like `DATABASE_URL`, `JWT_SECRET`) cause a fast failure.

## Frontend Layers

### Routing (`src/routes/`)

SolidStart file-based routing with two layout groups:

- `(public)/` — no auth required (login, signup, landing, password reset)
- `(private)/` — JWT required (dashboard, settings, components showcase)

The `(private).tsx` layout checks auth state and redirects to login.

### API Client (`src/lib/api.ts`)

Centralized API client with:

- Automatic `Authorization: Bearer` header injection
- 401 → automatic token refresh using the refresh token
- Typed request/response wrappers (`authApi`, `usersApi`)
- Error parsing into `ApiError` type

### Auth (`src/lib/auth.ts`)

Client-side auth state management:

- Stores tokens in `localStorage`
- Sets `app_authenticated` cookie for SSR middleware
- Exposes `auth.user`, `auth.login()`, `auth.logout()`, `auth.updateUser()`

### SSR Middleware (`src/middleware.ts`)

Server-side middleware that checks the `app_authenticated` cookie:

- Unauthenticated users hitting private routes → redirect to `/login?redirectTo=...`
- Authenticated users hitting `/login` or `/signup` → redirect to `/dashboard`

This prevents the flash of unauthenticated content before client-side JS hydrates.

### Stores (`src/lib/stores/`)

Reactive state containers:

- **toast** — toast notification queue
- **snackbar** — snackbar notifications (success/error/info)
- **ui** — theme toggle, sidebar state

### Components (`src/components/`)

Atomic design hierarchy:

- **Atoms** — Button, Input, Card, Modal, Badge, Icon, etc.
- **Molecules** — Accordion, Alert, Combobox, DatePicker, PlotGraph, Tabs, etc.
- **Organisms** — Navbar, Sidebar, Footer

70+ components total, all visible at `/components` when logged in.

## Data Fetching Pattern

The project uses `onMount` + `createSignal` + `alive` guard for all data fetching (not `createResource`):

```tsx
const [data, setData] = createSignal(null);
const [loading, setLoading] = createSignal(true);

onMount(async () => {
  let alive = true;
  onCleanup(() => { alive = false; });

  try {
    const result = await api.get("/endpoint");
    if (alive) {
      batch(() => {
        setData(result);
        setLoading(false);
      });
    }
  } catch (err) {
    if (alive) setLoading(false);
  }
});
```

This pattern prevents orphaned computation warnings during route transitions.

## Auth Flow

```
Register → hash password → insert user → generate JWT + refresh token
                                        → send verification email

Login → verify password → generate JWT + refresh token

Refresh → validate refresh token → revoke old → issue new pair

Change Password → verify current → hash new → update → revoke all tokens

Reset Password → selector/verifier pattern → email link → update password
```

JWT tokens contain `user_id` and `user_type`. Access tokens expire in 15 minutes, refresh tokens in 7 days. Refresh tokens are stored as SHA-256 hashes in the `refresh_tokens` table.

## SSE (Server-Sent Events)

Golid includes a complete SSE pattern for real-time server-to-client push.

### Architecture

```
SSEHub (singleton)
  ├── clients: map[userID] → set of channels (buffered, size 16)
  ├── tickets: map[ticket] → {userID, expiresAt}
  └── methods: Subscribe, Unsubscribe, Send, Broadcast, CreateTicket, ValidateTicket
```

### Auth: One-Time Ticket

`EventSource` doesn't support `Authorization` headers. Rather than putting JWTs in URLs (which leak into logs), we use a short-lived ticket:

1. Client calls `POST /api/v1/events/ticket` with JWT auth → gets a 32-byte random ticket (30s TTL)
2. Client opens `EventSource("/api/v1/events/stream?ticket=<ticket>")`
3. Server validates and burns the ticket (single-use), begins streaming

### Backpressure

Each client channel is buffered (16 events). If a slow client's buffer fills up, new events are **dropped** for that client — one slow tab never blocks delivery to other users. Max 5 connections per user prevents resource exhaustion.

### Scaling

The SSE hub is in-memory — all connected clients must be on the same instance. For multi-instance deployments (Cloud Run auto-scaling), add a pub/sub layer (Redis, NATS, Cloud Pub/Sub) between services and the hub. `Send()` and `Broadcast()` are the integration points — publish to the bus instead of directly to channels.

### Keepalive

A `: keepalive\n\n` comment is sent every 30 seconds to prevent Cloud Run from closing idle connections (15-minute timeout).

### Frontend Reconnect

On disconnect, the client refreshes its access token (it may have expired), requests a new ticket, and reconnects with exponential backoff (1s → 2s → 4s → ... → 30s max).

### Demo

`POST /api/v1/events/demo` (JWT-authed, development only) sends a "notification" event to the calling user's stream, which triggers a toast notification on the frontend. This endpoint is only registered when `ENVIRONMENT=development` — it is not available in production builds.

### Middleware

SSE endpoints are excluded from gzip and timeout middleware via path checks in `middleware/stack.go`.

## Query Strategy

The backend uses two query approaches side by side:

**sqlc** (`internal/db/`, `queries/*.sql`) — type-safe generated code for standard CRUD queries. The `queries/users.sql` and `queries/refresh_tokens.sql` files define SQL with sqlc annotations, and `sqlc generate` produces Go code with typed parameters and results. Use sqlc for straightforward single-table queries where the SQL is static.

**Raw SQL in services** (`internal/service/*.go`) — for complex queries with dynamic WHERE clauses, multi-table joins, subqueries, and computed fields. Services use `pool.QueryRow` / `pool.Query` / `pool.Exec` directly with parameterized `$N` placeholders. Use raw SQL when sqlc's static analysis would require multiple query variants for what's logically one operation.

**When to use which:** If your query is a static single-table CRUD operation, add it to `queries/*.sql` and run `sqlc generate`. If it has dynamic WHERE clauses, joins, or complex aggregations, write raw SQL in the service with `$N` placeholders. Golid uses both — this is intentional, not inconsistent. Never `fmt.Sprintf` with user values into SQL.

## API Versioning

All routes are grouped under `/api/v1/`. When breaking changes are needed:

1. Add a new route group (`/api/v2/`) for the affected endpoints only — don't duplicate everything
2. Keep v1 working during the deprecation period
3. Set a `Sunset` HTTP header on deprecated v1 endpoints with the removal date
4. Document the migration path in the changelog

Non-breaking changes (new fields, new endpoints) go directly into v1 without versioning.

## Domain vs DB Models

The codebase has two model packages — this is intentional:

- `internal/db/models.go` — **sqlc-generated**, uses `pgtype.Text`, `pgtype.Timestamptz`, `pgtype.Bool` for nullable DB columns. These types implement `sql.Scanner` for direct row scanning. Never edit this file manually — it's regenerated by `sqlc generate`.

- `internal/models/models.go` — **hand-written**, uses standard Go types (`*string`, `time.Time`, `bool`) with JSON tags. These are the types used in service return values and API responses.

Services convert inline — SQL uses `COALESCE` for nullable fields, scanning directly into domain response types (`UserProfile`). This avoids an intermediate conversion step while keeping the API layer clean (no `pgtype` in JSON responses).

## Observability

The current observability stack:

- **Logging** — structured logging with `slog`. Every request gets a unique request ID (set by the RequestID middleware), included in all log entries for that request. Log output is JSON in production, text in development.

- **Trace context** — the request ID serves as a lightweight trace identifier. It's set in the Echo context and propagated through the middleware chain. For distributed tracing across services, add OpenTelemetry (see below).

- **Metrics and OpenTelemetry** — opt-in via the `OTEL_ENDPOINT` and `METRICS_ENABLED` environment variables. When configured, OpenTelemetry exports traces via OTLP and Prometheus exposes a `/metrics` endpoint. When not configured, both are no-ops.

## CSRF Protection

The API uses Bearer token auth (not cookies), which is inherently CSRF-resistant — the browser never automatically attaches the token. The `SameSite=Lax` cookie (`app_authenticated`) is auth-status only, used by the SSR middleware for redirects. It doesn't grant API access.

If you add cookie-based session auth, add CSRF middleware: `e.Use(middleware.CSRFWithConfig(middleware.CSRFConfig{TokenLookup: "header:X-CSRF-Token"}))`.

## Health Checks

Two endpoints serve different purposes:

- `GET /health` — returns 200 if the process is alive. No dependency checks. Use for **liveness probes** — should never fail unless the process is deadlocked.
- `GET /ready` — returns 200 if the DB is reachable. Use for **readiness/startup probes** — fails when dependencies are unavailable, which tells the load balancer to stop routing traffic.

## Production Checklist

- [ ] Set `minScale: 1` if using SSE (in-memory hub requires sticky instances)
- [ ] Configure `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` for email delivery
- [ ] Set `ALLOWED_ORIGINS` for CORS in production
- [ ] Review `JWT_SECRET` length (32+ chars)
- [ ] Set up log aggregation (Cloud Logging, Datadog, etc.)
- [ ] If migration fails: check `schema_migrations` table for dirty state
- [ ] Review request body size limit (default 1MB in `stack.go`)
- [ ] Set `APP_NAME` for email branding
