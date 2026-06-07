# Documentation Staleness Tracker

> Check this table during audits. If a verification trigger has occurred
> since the last verified date, the document needs review.
>
> Last updated: 2026-06-06

## Cross-Cutting Documents

| Document | Stale when... | Last verified |
|----------|---------------|---------------|
| `docs/architecture.md` | Auth flow, middleware stack, SSE hub, or data-fetching pattern changes | 2026-06-06 |
| `docs/best-practices.md` | SolidJS fetching pattern, error handling, or testing conventions change | 2026-06-06 |
| `docs/cli-reference.md` | Makefile targets, health/ready endpoints, or test DB setup change | 2026-06-06 |
| `docs/testing-checklist.md` | Module business rules or critical integration scenarios change | 2026-06-06 |
| `docs/example-module.md` | Scaffold output layout, wire paths, or frontend page patterns change | 2026-02-28 |

## Per-Module Documents

| Document | Stale when... | Last verified |
|----------|---------------|---------------|
| `docs/modules/auth/spec.md` | Auth service business logic or API surface changes | 2026-06-06 |
| `docs/modules/users/spec.md` | User service business logic or API surface changes | 2026-06-06 |
| `docs/modules/feature/spec.md` | Feature service business logic or API surface changes | 2026-06-06 |
| `docs/modules/_templates/spec.md` | Spec template structure or citation format changes | 2026-06-06 |

## Code-Level Triggers

Code-change events that invalidate citations across multiple documents at once.
When any of these fire, re-verify every doc category listed in "Affected docs".

| Trigger | Affected docs | Last triggered |
|---------|---------------|----------------|
| Service subpackage layout change (`service/<pkg>/<file>.go` move or rename) | Module spec Verified citations, ADRs citing service paths, cursor rules | — |
| Handler test backfill (new `handler/*_test.go` files) | Module spec Tests rows; `audit-codebase.mdc` handler coverage check | — |
| Wire/routes refactor (`internal/wire/routes.go`) | Module spec API Surface tables | — |
| OpenAPI spec change (`backend/openapi.yaml`) | Module spec API Surface tables; `frontend/src/lib/api.generated.ts` | — |

## Automated Checks

| Script | What it catches |
|--------|-----------------|
| `scripts/check_spec_drift.sh` | Handler/service code changed without matching `docs/modules/<module>/spec.md` update |
| `scripts/check_citation_freshness.sh` | Line-number Verified citations pointing at missing files or out-of-bounds line numbers |

Run both before merging PRs that touch module-owned code or docs with line-number citations.
