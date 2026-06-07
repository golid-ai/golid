# ADR-007: IsConfigured() Graceful Degradation

**Status:** Accepted
**Date:** 2026-02-28
**Decision makers:** Steve Frank
**Rationale due:** 2026-03-14

## Context

Several services in the backend are opt-in: they require external credentials or
infrastructure that may not be available in all environments (local dev, CI,
staging). Each uses an `IsConfigured()` method to gate functionality and degrade
gracefully.

**Queue** (`backend/internal/queue/queue.go`): `IsConfigured()` returns true when
the `asynq.Client` is non-nil (i.e., `REDIS_URL` was valid). `Enqueue()` returns
`ErrNotConfigured` when Redis is absent. Callers fall back to fire-and-forget
goroutines with `service.Retry()` — see `backend/internal/handler/auth.go`.

**Email** (`backend/internal/service/email/email.go`): `IsConfigured()` checks
that both `APIKey` and `Domain` are set. When unconfigured, `sendEmail()` logs
the email details and returns nil — development mode sees what would be sent
without a Mailgun account.

**Common pattern**: constructors accept the credential/URL, log a warning when
empty, and return a valid (non-nil) service instance. Callers never check
`service != nil` — they always call `service.IsConfigured()`.

## Decision

**Opt-in services use `IsConfigured()` gates with graceful fallback. Services
are always instantiated (never nil); callers check `IsConfigured()`, not nil.**

## Alternatives Considered

1. **Feature flags (database-backed)** — more flexible at runtime but adds complexity. Infrastructure availability is binary at deployment time, not a product toggle.
2. **Fail-hard when not configured** — blocks local development and CI where not all services are needed.
3. **Service == nil checks** — risks nil-pointer panics if a callsite forgets the check.

## Rationale

Local dev typically has no Mailgun credentials and often no Redis. Developers
need to start the app and exercise auth flows without standing up the entire
third-party stack. CI runs integration tests against a fresh DB without live
external services. Production has all credentials wired and the configured
path runs.

The cost accepted: two code paths per opt-in service. The pattern is codified in
`codebase-standards.mdc` ("Dual-path pattern for queue").

## Revisit Conditions

- **If a hot-reload-of-credentials requirement appears** (e.g. rotating API keys without restart).
- **If the number of opt-in services grows past ~10** and the dual-path branching tax adds up.
- **If an opt-in service starts having product-level toggle semantics** — move it to `FeatureService` instead.
- **If a production incident is traceable to a missing `IsConfigured()` check** on a new opt-in service.
