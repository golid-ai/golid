# ADR-006: Bcrypt Default Cost with 72-byte Limit

**Status:** Accepted
**Date:** 2026-02-28
**Decision makers:** Steve Frank
**Rationale due:** 2026-03-14

## Context

The application hashes user passwords with bcrypt. The 72-byte input limit is
enforced at every password entry point.

**Hashing** (`backend/internal/service/auth/auth.go`): `Register()` calls
`bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)`.
`bcrypt.DefaultCost` is 10 in Go's `golang.org/x/crypto/bcrypt` package.

**72-character validation** (`backend/internal/service/auth/auth.go`):
`validateRegisterInput()` checks `len(input.Password) > 72`. Password change and
reset enforce the same limit in `auth_password.go`.

**Where enforced**:

- `auth.go` — registration
- `auth_password.go` — password change
- `auth_password.go` — password reset

All three use `apperror.Validation` with a field-level error when the limit is
exceeded.

## Decision

**Use bcrypt with `bcrypt.DefaultCost` (10) for password hashing, and enforce
a 72-character input limit at every password entry point.**

## Alternatives Considered

1. **Argon2id** — memory-hard algorithm resistant to GPU/ASIC attacks. More configurable (memory, iterations, parallelism) but requires tuning per deployment. Go's `golang.org/x/crypto/argon2` has no `DefaultCost` equivalent — misconfiguration risk is higher.
2. **Higher bcrypt cost (12-14)** — increases hash time from ~100ms (cost 10) to ~400ms-1.6s. Better brute-force resistance but adds latency to login, registration, and password reset.
3. **No length validation (let bcrypt truncate silently)** — simpler code, but users with long passwords would have weaker-than-expected passwords. Two different passwords sharing the same first 72 bytes would hash identically.

## Rationale

`bcrypt.DefaultCost` is the right default at this stage. Cost 10 produces ~100ms
hashes on modern x86 while keeping login latency below the perceptual threshold.
Explicit validation at registration and password change surfaces the limit to
the client instead of relying on silent truncation.

## Revisit Conditions

- **If the application takes on high-value individual accounts** where per-account ASIC resistance becomes worth the Argon2id tuning cost.
- **If the Go ecosystem standardizes on Argon2id defaults** with consensus parameters.
- **If a credential-stuffing campaign succeeds** that wouldn't have been caught by rate limiting alone.
