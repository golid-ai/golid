# Permission Matrix

> Compiled from module specs' Business Rules sections. Update when adding
> new endpoints or changing authorization logic.
>
> Last updated: 2026-06-07

## Legend

- ✅ = allowed
- — = not allowed
- **JWT** = valid access token required
- **Admin** = JWT + `user_type = 'admin'`

## Roles

| Role | `users.type` | Notes |
|------|--------------|-------|
| User | `user` | Default role at registration |
| Admin | `admin` | Platform administrator (seeded in dev) |

Handler middleware:

- `requireUserID` — any authenticated user
- `RequireRole("admin")` — admin-only routes under `/api/v1/admin/*`

---

## Auth

Public routes (no JWT): register, login, refresh, forgot-password, verify-reset-token, reset-password, verify-email, resend-verification. All use strict rate limiting.

| Action | User | Admin | Auth |
|--------|------|-------|------|
| Register / login / refresh | ✅ | ✅ | Public |
| Forgot / reset password | ✅ | ✅ | Public |
| Verify / resend email | ✅ | ✅ | Public |
| Logout | ✅ | ✅ | JWT |
| Change password | ✅ | ✅ | JWT |

Sources: [Verified: backend/internal/wire/routes.go] public auth group; protected logout and password routes behind JWT.

---

## Users (profile)

| Action | User | Admin | Auth |
|--------|------|-------|------|
| GET /me | ✅ (own) | ✅ (own) | JWT |
| PUT /me | ✅ (own) | ✅ (own) | JWT |

Sources: [Verified: handler/user.go] uses `requireUserID`; no cross-user profile access.

---

## Feature flags

| Action | User | Admin | Auth |
|--------|------|-------|------|
| GET /features (enabled map) | ✅ | ✅ | Public |
| GET /admin/features (full list) | — | ✅ | Admin |
| PUT /admin/features/:key | — | ✅ | Admin |

Sources: [Verified: handler/feature.go] admin handlers check `userType == "admin"`; [Verified: wire/routes.go] admin group uses `RequireRole("admin")`.

---

## SSE

| Action | User | Admin | Auth |
|--------|------|-------|------|
| POST /events/ticket | ✅ | ✅ | JWT |
| GET /events/stream | ✅ | ✅ | One-time ticket (not JWT in URL) |
| POST /events/demo | ✅ (dev only) | ✅ (dev only) | JWT + `ENVIRONMENT=development` |

Sources: [Verified: wire/routes.go] SSE route registration; ticket auth pattern in SSE handler.

---

## What this matrix does not cover

- **Resource-level ACLs** — Golid is a starter; modules use role checks only, not per-row ownership beyond "own profile via JWT user_id".
- **Feature flags for auth** — flags are product toggles, not permission substitutes (see `feature-flags` rule).

When adding a module, extend this matrix in the same slice as the spec and OpenAPI update.
