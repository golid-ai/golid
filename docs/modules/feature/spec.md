# Module: Feature

> **Thesis:** Runtime feature flags stored in PostgreSQL with an in-memory TTL cache; public read of enabled keys and admin-only management.

| | |
|---|---|
| **Domain** | Core |
| **Complexity** | Low |
| **Status** | Complete |
| **Last Verified** | 2026-06-07 (commit: 9c7a12b) |

---

## Scope

**Includes:**
- `backend/internal/handler/feature.go` — `FeatureHandler` (`List`, `ListEnabled`, `Set`)
- `backend/internal/service/feature/feature.go` — `FeatureService` (cache, `IsEnabled`, CRUD)
- `feature_flags` table

**Excludes:**
- SSE, email, pagination, auth token logic — infra or other modules
- Frontend feature-flag consumers (documented separately when wired)

**Depends On:**
- **Auth** — admin routes require JWT + `user_type = 'admin'` (`RequireRole` middleware and handler guard)

---

## Overview

Feature flags are key/boolean toggles with optional descriptions. The public endpoint exposes only `{key: enabled}` pairs (no descriptions). Admin endpoints list full flag metadata and allow toggling by key. `FeatureService` caches enabled flags in memory with a configurable TTL (default 30s); `Set()` invalidates the local cache immediately. `IsEnabled()` returns `false` for unknown keys (safe default).

---

## API Surface

| Method | Path | Handler | Auth | Notes |
|--------|------|---------|------|-------|
| GET | /api/v1/features | `Feature.ListEnabled` | Public | Returns `map[string]bool` |
| GET | /api/v1/admin/features | `Feature.List` | JWT + Admin | Full flags with descriptions |
| PUT | /api/v1/admin/features/:key | `Feature.Set` | JWT + Admin | Body: `{"enabled": bool}` |

---

## Business Rules

### Caching
- [Verified: service/feature/feature.go, IsEnabled()] Returns cached value when TTL not expired; otherwise refreshes via `singleflight` to dedupe concurrent refreshes.
- [Verified: service/feature/feature.go, Set()] Upserts with `ON CONFLICT (key) DO UPDATE`; updates local cache entry immediately.

### Access control
- [Verified: handler/feature.go, List()] Requires `userType == "admin"`; returns 403 otherwise.
- [Verified: handler/feature.go, Set()] Requires `userType == "admin"` and non-empty `:key` param.

### Defaults
- [Verified: service/feature/feature.go, IsEnabled()] Unknown keys return `false` (safe default when key absent from cache after refresh).

---

## Tests

- Unit: `backend/internal/service/feature/feature_test.go`
- Integration: `backend/internal/service/feature/feature_integration_test.go`
- Handler: `backend/internal/handler/feature_test.go`
