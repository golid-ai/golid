# ADR-003: Selector/Verifier Pattern for Security Tokens

**Status:** Accepted
**Date:** 2026-02-28
**Decision makers:** Steven Frank

## Context

Golid uses security tokens for password reset and email verification. Both follow the selector/verifier split-token pattern.

**Password reset** (`backend/internal/service/auth/auth_password.go`): `generateResetToken()` creates a 16-byte random selector and a 32-byte random verifier, concatenated as `selector.verifier`. The selector is stored in `password_reset_selector` for DB lookup; the verifier is SHA-256 hashed via `hashVerifier()` and stored in `password_reset_verifier_hash`. On redemption, `VerifyResetToken()` looks up the row by selector, then compares the incoming verifier against the stored hash using `subtle.ConstantTimeCompare` in `verifyHash()`.

**Email verification** (`backend/internal/service/auth/auth_verify.go`): `generateVerificationToken()` uses the same selector/verifier structure. `VerifyEmail()` looks up by `verification_selector` and verifies with the same `verifyHash()` function. Both token types are burned on use (fields set to NULL after successful verification).

**Refresh tokens** (`backend/internal/service/auth/auth.go`): `generateAuthResult()` hashes the full refresh token via `hashVerifier()` and stores it as `token_hash`. The `Refresh()` method uses `UPDATE … WHERE token_hash = $1` to atomically revoke and verify inside a transaction.

## Decision

**Use the selector/verifier split-token pattern for all security tokens that are stored server-side (password reset, email verification), and hash-then-lookup for refresh tokens.**

## Alternatives Considered

1. **Hash full token + lookup by hash** — requires a full-table scan or index on the hash column for every lookup. Works for refresh tokens (low volume, indexed) but scales poorly for high-volume token types.
2. **Store tokens as plaintext with expiry** — a database breach exposes all unexpired tokens.
3. **JWT-based stateless tokens** — eliminates DB lookups but tokens can't be revoked before expiry without a revocation list (which reintroduces server state).

## Rationale

The selector/verifier split provides constant-time lookup on the indexed selector, constant-time compare on the verifier hash, database-breach resilience (only the hash of the verifier is stored), and single-use semantics enforced by NULLing columns on redemption.

Refresh tokens use hash-and-lookup instead because volume is one-per-session, `token_hash` is indexed, and rotation issues a new token while revoking the old one atomically — single-use burn semantics are not required.

## Revisit Conditions

- If `password_reset_*` or `verification_*` lookups become a measured hot path (>1% of total DB queries).
- If the password-reset flow drops single-use semantics (e.g. allows multi-use within a window).
