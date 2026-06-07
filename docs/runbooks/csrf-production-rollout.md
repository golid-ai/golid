# Runbook: CSRF Production Rollout

## Context

CSRF middleware checks `X-Requested-With: golid-app` on state-changing API
requests. Default is **monitor** (`CSRF_ENFORCE=false`): violations log a
warning but pass. Production should run **enforce** after the frontend that
sends the header is deployed.

Frontend: `frontend/src/lib/api.ts` sets the header on all `api()` calls and
token refresh.

## Rollout order

1. Deploy **frontend** with `X-Requested-With` header (already in repo).
2. Deploy **backend** with `CSRF_ENFORCE=false` — confirm no unexpected warn volume in logs.
3. Set `CSRF_ENFORCE=true` in production env (see `config/.env.prod`).
4. Redeploy backend; verify login, register, settings save, and password change.

## Verify

```bash
# Should fail without header when enforce=true
curl -X POST https://api.example.com/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"x@y.com","password":"y"}'

# Should succeed with header
curl -X POST https://api.example.com/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Requested-With: golid-app' \
  -d '{"email":"x@y.com","password":"y"}'
```

## Rollback

Set `CSRF_ENFORCE=false` and redeploy backend. No migration or data change.

## Bypass paths

- `GET`, `HEAD`, `OPTIONS` — always allowed
- `/api/v1/webhooks/*` — reserved for future signed webhooks
