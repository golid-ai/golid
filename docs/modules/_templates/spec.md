# Module: [Name]

> **Thesis:** [One sentence — what this module does and why it exists]

| | |
|---|---|
| **Domain** | [e.g., Core, User Management] |
| **Complexity** | Low / Medium / High / Critical |
| **Status** | Complete / In Progress / Not Started |
| **Last Verified** | YYYY-MM-DD (commit: [short-hash]) |

---

## Scope

**Includes:**
- [handlers + service subpackage files this spec covers]

**Excludes:**
- [infra modules with no spec: sse, email, pagination, retry, context, wire, etc.]

**Depends On:**
- [other modules referenced by FK or service call]

---

## Overview

[One paragraph: what this module does and why it exists]

---

## Entities

Derived from `backend/migrations/*.sql`:

| Table | Key Columns | Relationships | Notes |
|-------|-------------|---------------|-------|
| | | | |

---

## Business Rules

Derived from service methods. Citations use paths under `backend/internal/`:
`[Verified: service/<module>/<file>.go, FunctionName()]`. Use `[NEEDS VERIFICATION]`
when inferred from naming or partial evidence.

### Validation
- [Verified: service/<module>/<module>.go, ValidateInput()] Rule description

### Auth / Permissions
- Handler: `requireUserID` / `requireUserType` (authn)
- Service: resource-level checks where applicable (authz)

### Side Effects
- Emails, queue tasks, SSE events — note which module owns dispatch

---

## API Surface

Derived from handler route registration in `backend/internal/wire/routes.go`:

| Method | Path | Handler | Auth | Notes |
|--------|------|---------|------|-------|
| GET | /api/v1/x | List | JWT | |
| POST | /api/v1/x | Create | JWT | |
| GET | /api/v1/x/:id | GetByID | JWT | |
| PUT | /api/v1/x/:id | Update | JWT | |
| DELETE | /api/v1/x/:id | Delete | JWT + Admin | |

---

## Tests

- Unit: `backend/internal/service/<module>/*_test.go`
- Integration: `backend/internal/service/<module>/*_integration_test.go`
- Handler: `backend/internal/handler/<module>_test.go`

---

## Current Implementation

| Layer | Files |
|-------|-------|
| Handler | `backend/internal/handler/<module>.go` |
| Service | `backend/internal/service/<module>/<module>.go` |
| Migration | `backend/migrations/NNNNNN_<module>.up.sql` |
| Frontend | `frontend/src/routes/...` |
| Tests | see **Tests** above |
