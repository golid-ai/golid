# Cross-Module Flows

> How requests cascade across modules. Update when adding endpoints or status transitions.
>
> Last updated: 2026-06-07

## 1. Registration

```text
Browser POST /auth/register
  → handler.Auth.Register (validate body, rate limit)
  → service.auth.Register (tx: insert users row, issue JWT + refresh token)
  → optional: email queue/goroutine if Mailgun configured
  → 200 { access_token, refresh_token, user }
```

**Failure paths:** duplicate email → 409; validation → 400 with `details`.

## 2. Login + session refresh

```text
Login: POST /auth/login → auth.Login → tokens

Authenticated API call with expired access token:
  api() sees 401 → POST /auth/refresh (X-Requested-With: golid-app)
  → auth.Refresh (atomic rotate refresh_tokens row)
  → retry original request once

Refresh fails → clear tokens → auth:session-expired → redirect /login
```

## 3. Password reset

```text
POST /auth/forgot-password → always 200 (no enumeration)
  → selector/verifier stored on users row

GET /auth/verify-reset-token?token=selector.verifier
POST /auth/reset-password → hash password, clear token columns, revoke refresh tokens
```

## 4. Email verification

```text
Register sends verification email (best-effort)
GET /auth/verify-email?token=selector.verifier → email_verified = true
POST /auth/resend-verification → always 200 if email unknown
```

## 5. Profile (Users module)

```text
GET /me (JWT) → user.GetByID → ETag support
PUT /me (JWT) → user.UpdateProfile (partial update, avatar nullable)
```

## 6. Feature flags

```text
Public: GET /features → map[key]enabled (cached 30s)

Admin: GET/PUT /admin/features/* (JWT + user_type admin)
  → feature.Set invalidates local cache entry
```

Frontend: `features.ts` loads public map; never branch auth on flags.

## 7. SSE realtime

```text
POST /events/ticket (JWT) → one-time ticket
GET /events/stream?ticket=... → SSE hub subscribes user channel
Frontend: connectSSE on auth, exponential backoff reconnect
```

## 8. Scaffold new module (adopter flow)

```text
make new-module name=notes
  → migrations + service + handler + frontend route
  → wire into services.go, handlers.go, routes.go, api.ts, PRIVATE_ROUTES
  → module spec in docs/modules/notes/spec.md
```

See `docs/example-module.md` for the full checklist.
