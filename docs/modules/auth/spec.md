# Module: Auth

> **Thesis:** Manages user authentication — registration, login, JWT access/refresh tokens, password reset, and email verification — using the selector/verifier pattern for security tokens.

| | |
|---|---|
| **Domain** | Core |
| **Complexity** | Critical |
| **Status** | Complete |
| **Last Verified** | 2026-06-07 (commit: 9c7a12b) |

---

## Scope

**Includes:**
- `backend/internal/handler/auth.go` — `AuthHandler`
- `backend/internal/service/auth/auth.go` — registration, login, logout, refresh
- `backend/internal/service/auth/auth_password.go` — change password, forgot/reset password
- `backend/internal/service/auth/auth_verify.go` — email verification, resend verification
- `refresh_tokens` table and auth-owned columns on `users` (password reset, verification selector/verifier)

**Excludes:**
- `users` profile fields and `/me` endpoints (Users module)
- JWT middleware (`middleware.JWTAuth`, token generation) — infrastructure
- Email delivery (`EmailService`, queue workers) — Email module (handler orchestrates dispatch only)
- SSE, pagination, retry helpers — infra (no spec)

**Depends On:**
- **Users** — FK `users(id)`; registration inserts the user row
- **Email** — verification and password-reset email dispatch (best-effort, non-blocking)
- **Queue** — async email tasks when Redis is configured

---

## Overview

The Auth module handles the full authentication lifecycle: user registration (transactional user + token creation), credential-based login, JWT access/refresh token issuance, atomic refresh-token rotation, logout (revoke all sessions), authenticated password change, password reset via email, and email verification. Security tokens use the selector/verifier pattern — selector for indexed lookup, SHA-256 hashed verifier compared with `subtle.ConstantTimeCompare`. Forgot-password and resend-verification endpoints always return success to prevent email enumeration.

---

## API Surface

| Method | Path | Handler | Auth | Notes |
|--------|------|---------|------|-------|
| POST | /api/v1/auth/register | `Auth.Register` | Public | Strict rate limit; sends verification email (best-effort) |
| POST | /api/v1/auth/login | `Auth.Login` | Public | Strict rate limit |
| POST | /api/v1/auth/refresh | `Auth.Refresh` | Public | Strict rate limit; rotates refresh token atomically |
| POST | /api/v1/auth/forgot-password | `Auth.ForgotPassword` | Public | Always 200; no email enumeration |
| GET | /api/v1/auth/verify-reset-token | `Auth.VerifyResetToken` | Public | Query param `token` |
| POST | /api/v1/auth/reset-password | `Auth.ResetPassword` | Public | |
| GET | /api/v1/auth/verify-email | `Auth.VerifyEmail` | Public | Query param `token` |
| POST | /api/v1/auth/resend-verification | `Auth.ResendVerification` | Public | Always 200; no email enumeration |
| POST | /api/v1/auth/logout | `Auth.Logout` | JWT | Revokes all refresh tokens for user |
| PUT | /api/v1/auth/password | `Auth.ChangePassword` | JWT | Requires current password |

---

## Business Rules

### Registration & credentials
- [Verified: service/auth/auth.go, Register()] Normalizes email to lowercase; validates email format, password length (8–72 chars), and required name fields before insert.
- [Verified: service/auth/auth.go, Register()] Creates user with `type = 'user'` in a transaction; returns 409 on duplicate email (`23505`).
- [Verified: service/auth/auth.go, Login()] Returns generic `Unauthorized` for unknown email or wrong password (no enumeration).
- [Verified: service/auth/auth.go, Refresh()] Atomically revokes old refresh token via `UPDATE ... RETURNING` inside a transaction to prevent TOCTOU races on concurrent refresh.
- [Verified: service/auth/auth.go, Logout()] Sets `revoked = TRUE` on all active refresh tokens for the user.

### Password reset
- [Verified: service/auth/auth_password.go, ForgotPassword()] Returns empty token (not error) when email is not found — prevents enumeration.
- [Verified: service/auth/auth_password.go, ChangePassword()] Revokes all refresh tokens after successful password change.

### Email verification
- [Verified: service/auth/auth_verify.go, VerifyEmail()] Requires `email_verified = FALSE` and matching selector/verifier; clears verification columns on success.

---

## Tests

- Unit: `backend/internal/service/auth/auth_test.go`, `auth_concurrency_test.go`
- Integration: `backend/internal/service/auth/auth_integration_test.go`, `auth_verify_integration_test.go`
- Handler: `backend/internal/handler/auth_test.go`
