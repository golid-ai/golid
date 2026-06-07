# Testing Checklist

> Critical scenarios for Golid's three starter modules (auth, users, feature).
> Derived from integration tests and module spec business rules.
> Use for manual QA passes and release verification.

---

## Auth

| # | Given | When | Then |
|---|-------|------|------|
| 1 | Valid refresh token exists | Two concurrent refresh requests arrive with the same token | Exactly one succeeds (atomic `UPDATE…RETURNING`); the other gets 401 |
| 2 | User has active sessions on multiple devices | Password is changed via authenticated endpoint | All refresh tokens are revoked; all sessions invalidated |
| 3 | Password reset token is generated | Token is used once to reset password | Reset columns are NULLed; same token cannot be reused (anti-replay) |
| 4 | Email verification token exists | `VerifyEmail` is called with correct selector.verifier | `email_verified` set to TRUE; verification columns NULLed; same token cannot re-verify |
| 5 | Non-existent email submitted to ForgotPassword | Request completes | 200 returned with generic message; no token generated; no email enumeration |
| 6 | User registers with duplicate email | `Register` is called | Returns 409 Conflict (`23505`) |
| 7 | User logs in with wrong password | `Login` is called | Returns generic Unauthorized (no email enumeration) |
| 8 | Expired or invalid reset token submitted | `ResetPassword` is called | Returns 400 Bad Request |

---

## Users

| # | Given | When | Then |
|---|-------|------|------|
| 1 | Authenticated user with existing profile | `UpdateProfile` with empty first/last name strings | Existing names preserved (`COALESCE(NULLIF` pattern) |
| 2 | Authenticated user | `UpdateProfile` with `AvatarURLSet=true` and empty avatar URL | `avatar_url` cleared to NULL |
| 3 | Authenticated user | `UpdateProfile` with `AvatarURLSet=false` | `avatar_url` unchanged |
| 4 | Authenticated user | `GET /me` with valid `If-None-Match` ETag | Returns 304 Not Modified |
| 5 | User ID does not exist | `GetByID` is called | Returns 404 Not Found |
| 6 | Profile update with name > 100 characters | `PUT /me` is called | Returns validation error |

---

## Feature

| # | Given | When | Then |
|---|-------|------|------|
| 1 | Feature flag key does not exist in DB | `IsEnabled("unknown_key")` is called | Returns `false` (safe default) |
| 2 | Feature flag exists and cache TTL has expired | `IsEnabled` is called | Cache refreshes via `singleflight`; returns current DB value |
| 3 | Admin user | `GET /api/v1/admin/features` | Returns full flag list with descriptions |
| 4 | Non-admin user | `GET /api/v1/admin/features` | Returns 403 Forbidden |
| 5 | Admin user | `PUT /api/v1/admin/features/:key` with `{"enabled": true}` | Flag upserted; local cache updated immediately |
| 6 | Public client | `GET /api/v1/features` | Returns `map[string]bool` only (no descriptions) |

---

## Infra Smoke (not module-owned)

| # | Given | When | Then |
|---|-------|------|------|
| 1 | Backend process running | `GET /health` | Returns 200 with `status: healthy` (liveness, no DB check) |
| 2 | Backend running with DB connected | `GET /ready` | Returns 200 with `database: healthy` |
| 3 | Backend running without DB | `GET /ready` | Returns 503 with `database: unhealthy` |
| 4 | Logged-in user with valid SSE ticket | SSE stream connects | Events delivered; ticket burned on use (single-use) |
