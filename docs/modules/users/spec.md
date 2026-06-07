# Module: Users

> **Thesis:** Exposes the authenticated user's profile — read with ETag caching and partial updates to name and avatar fields.

| | |
|---|---|
| **Domain** | Core |
| **Complexity** | Low |
| **Status** | Complete |
| **Last Verified** | 2026-06-07 (commit: 9c7a12b) |

---

## Scope

**Includes:**
- `backend/internal/handler/user.go` — `UserHandler` (`Me`, `UpdateProfile`)
- `backend/internal/service/user/user.go` — `UserService`
- `users` table profile columns: `first_name`, `last_name`, `avatar_url`, `email_verified`, `type`

**Excludes:**
- Registration, login, password, and verification flows (Auth module)
- Auth token columns on `users` (password reset, verification selector/verifier — Auth module)
- `refresh_tokens` table (Auth module)
- SSE, email, pagination — infra (no spec)

**Depends On:**
- **Auth** — JWT middleware supplies `userID` via `requireUserID`; user row created at registration

---

## Overview

The Users module serves the current authenticated user's profile. `GET /me` returns the full profile and supports conditional requests via SHA-256 ETag (`304 Not Modified`). `PUT /me` accepts partial updates: trimmed first/last name (max 100 chars) and optional avatar URL (nullable via pointer — set vs omit distinguished by `AvatarURLSet`).

---

## API Surface

| Method | Path | Handler | Auth | Notes |
|--------|------|---------|------|-------|
| GET | /api/v1/me | `User.Me` | JWT | ETag / `If-None-Match` support |
| PUT | /api/v1/me | `User.UpdateProfile` | JWT | Partial update; empty strings preserve existing values |

---

## Business Rules

### Profile read
- [Verified: service/user/user.go, GetByID()] Loads `id`, `email`, `type`, `email_verified`, `first_name`, `last_name`, `avatar_url`, `created_at` from `users`; returns 404 when user not found.

### Profile update
- [Verified: service/user/user.go, UpdateProfile()] Uses `COALESCE(NULLIF($n, ''), first_name)` pattern — empty strings do not clear existing names.
- [Verified: service/user/user.go, UpdateProfile()] Updates `avatar_url` only when `AvatarURLSet` is true; empty string clears to NULL via `nilIfEmpty`.
- [Verified: handler/user.go, validateProfileUpdate()] Rejects `first_name` or `last_name` longer than 100 characters.

---

## Tests

- Unit: `backend/internal/service/user/user_test.go`
- Integration: `backend/internal/service/user/user_integration_test.go`
- Handler: `backend/internal/handler/user_test.go`, `user_deref_test.go`
