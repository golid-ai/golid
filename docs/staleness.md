# Documentation Staleness Tracker

> Check this table during audits. If a verification trigger has occurred
> since the last verified date, the document needs review.
>
> Last updated: 2026-06-07

## Cross-Cutting Documents

| Document | Stale when... | Last verified |
|----------|---------------|---------------|
| `docs/architecture.md` | Auth flow, middleware stack, SSE hub, or data-fetching pattern changes | 2026-06-07 |
| `docs/best-practices.md` | SolidJS fetching pattern, error handling, or testing conventions change | 2026-06-06 |
| `docs/cli-reference.md` | Makefile targets, health/ready endpoints, or test DB setup change | 2026-06-06 |
| `docs/testing-checklist.md` | Module business rules or critical integration scenarios change | 2026-06-06 |
| `docs/example-module.md` | Scaffold output layout, wire paths, or frontend page patterns change | 2026-06-07 |
| `docs/flows.md` | Cross-module request chains or auth/SSE ticket flow changes | 2026-06-07 |
| `docs/glossary.md` | New domain terms or renamed concepts | 2026-06-07 |
| `docs/schema.md` | Migrations, enums, or table relationships change | 2026-06-07 |
| `docs/permissions.md` | Module spec permission rows change | 2026-06-07 |
| `docs/error-contracts.md` | apperror codes, HTTP mapping, or frontend error handling change | 2026-06-07 |
| `docs/dependency-graph.md` | Module Depends On sections or new modules added | 2026-06-07 |
| `docs/cursor-rules.md` | Rules added, removed, or glob/thesis changes | 2026-06-07 |
| `docs/patterns/tailwind/1-Page.md` | Tailwind major version or `app.css` / `tailwind.config.js` setup changes | 2026-06-07 |

## Per-Module Documents

| Document | Stale when... | Last verified |
|----------|---------------|---------------|
| `docs/modules/auth/spec.md` | Auth service business logic or API surface changes | 2026-06-07 |
| `docs/modules/users/spec.md` | User service business logic or API surface changes | 2026-06-07 |
| `docs/modules/feature/spec.md` | Feature service business logic or API surface changes | 2026-06-07 |
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
| Tailwind major version bump | `docs/patterns/tailwind/1-Page.md`, `app.css`, `tailwind.config.js`, component utility classes | 2026-06-07 |
| New or removed Cursor rule | `docs/cursor-rules.md`, `docs/start-here.md`, `docs/rules-health.md` | — |

## Automated Checks

| Script | What it catches |
|--------|-----------------|
| `scripts/check_spec_drift.sh` | Handler/service code changed without matching `docs/modules/<module>/spec.md` update |
| `scripts/check_citation_freshness.sh` | Line-number Verified citations pointing at missing files or out-of-bounds line numbers |
| `scripts/check_rule_health.sh` | Rules missing thesis lines, broken globs, or stale references (runs in CI spec-drift job) |

Run all three before merging PRs that touch module-owned code, cursor rules, or docs with line-number citations.
