# API Versioning Strategy

## Current State

All endpoints live under `/api/v1`. A `/api/v2` group exists but is empty — ready for use when needed.

Every response includes an `X-API-Version` header (`v1` or `v2`).

## When to Create v2

Create a new version for **breaking changes only**:

- Removing a field from a response
- Changing the shape of a response (e.g., flat object → nested)
- Changing authentication semantics
- Renaming an endpoint

## When NOT to Version

These are backwards-compatible and don't need a new version:

- Adding a new field to a response
- Adding a new endpoint
- Adding a new query parameter
- Adding a new optional request field

## How to Add a v2 Endpoint

1. In `cmd/server/main.go`, register the new handler on the v2 group:

```go
v2.GET("/me", userHandler.MeV2)
```

2. Keep the v1 endpoint unchanged

3. Add `Sunset` and `Deprecation` headers to the v1 endpoint when ready to deprecate:

```go
c.Response().Header().Set("Sunset", "Sat, 01 Jan 2027 00:00:00 GMT")
c.Response().Header().Set("Deprecation", "true")
```

## Deprecation Timeline

1. Ship v2 endpoint alongside v1
2. Add `Sunset` header to v1 with a date 6 months out
3. Log warnings when v1 is called after the sunset date
4. After 6 months, return `410 Gone` with a message pointing to v2

## Frontend Migration

The API version is a constant in `frontend/src/lib/api.ts`:

```typescript
const API_VERSION = "v1";
```

To migrate to v2, change this constant. For gradual migration, call specific v2 endpoints directly while keeping the default at v1.
