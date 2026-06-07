# Cursor Rules

> 45 rules in `.cursor/rules/` that give the AI agent context about this codebase.

## System Philosophy

The documentation system follows an **organism pattern**: rules are the nervous system (reflexive responses to stimuli), module specs are the anatomy (current-state structure and constraints), plans are the growth layer (intended change and slicing), cross-cutting docs are circulation (flows, dependencies, permissions), audits and drift checks are the immune system, archived plans and ADRs are institutional memory, and consumption paths are the synapses that ensure the right knowledge fires at the right moment. No layer functions in isolation. A rule without a spec is a reflex without understanding. A plan without same-slice spec sync becomes stale intent. The system works because each layer validates and activates the others. For the full conceptual framework, see [Organism Pattern](organism-pattern.md).

## Design Principles

- **Every rule opens with a thesis** — one sentence stating what the rule enforces and why. The thesis enables generalization to novel situations; a pointer to a reference file only enables pattern-matching.
- **Three activation types:** `alwaysApply` for universal guardrails, glob-triggered for domain rules (auto-activates when editing matching files), description-triggered for workflow rules (invoked by task description or explicit mention).
- **Split by concern, not by file count** — large domains use sibling rules with overlapping globs (e.g. `solidjs-pages` + `solidjs-data-fetching`, `go-service` + `go-service-errors`). Both fire when editing matching files.
- **Plans drive execution; specs state truth** — plans in `docs/plans/` are first-class inputs to `slice-and-ship`; module specs (`docs/modules/{module}/spec.md`) remain the current-state truth for implemented behavior.
- **Workflow routing before ceremony** — classify T0-T3 risk before choosing plan, slice, audit, or review depth. Process should scale with blast radius.
- **Pre-merge audit gate** — before declaring a slice or feature done, run `audit-bugs` (module-scoped) or `audit-codebase` (cross-cutting). See `codebase-standards.mdc` and `slice-and-ship.mdc`.
- **Infrastructure files use guardrails only** — files like `cmd/server/main.go`, `internal/wire/*.go`, `internal/db/*.go`, and `frontend/src/app.tsx` are edited rarely and don't match any domain rule's thesis. The Core Guardrails in `codebase-standards.mdc` cover their highest-consequence patterns.
- **Thesis + refrain for method-flow rules** — `go-service` and `go-handler` have verb-driven refrains that compress the method lifecycle into a memorable sequence.
- **Cross-cutting reference docs** — [Permission matrix](permissions.md), [error contracts](error-contracts.md), and [staleness tracker](staleness.md) are maintained alongside module specs.

## Always Active

These fire on every interaction. Every line costs context, so they're kept compact.

| Rule | Thesis |
|------|--------|
| `codebase-standards` | Universal guardrails that apply regardless of which file you're editing — the principles that every other rule assumes you follow. |
| `git-commits` | Atomic commits with consistent prefixes make history scannable, bisectable, and reviewable. |

## File-Scoped (auto-activate via glob)

| Rule | Fires on | Thesis |
|------|----------|--------|
| `go-service` | `backend/internal/service/**/*.go` | Services own business logic and data access. Framework-agnostic, verify resource membership. |
| `go-service-errors` | `backend/internal/service/**/*.go` | Constraint violations and scan mistakes are expected — translate to `apperror`, never swallow as 500s. |
| `go-handler` | `handler/**/*.go`, `middleware/**/*.go` | Handlers are thin translators between HTTP and services. |
| `solidjs-pages` | `frontend/src/routes/**/*.tsx` | Route UI uses flat `Switch/Match`, signal modals, and auth gates — never nested Show or early returns. |
| `solidjs-data-fetching` | `frontend/src/routes/**/*.tsx` | Route data loads via `onMount` + signals + `alive` + `batch`; never `createResource`. |
| `solidstart-routing` | `app.tsx`, `routes/**/*.tsx`, navigation, `constants.ts` | `(private)` / `(public)` groups and global app chrome must stay aligned with `PRIVATE_ROUTES`. |
| `frontend-components` | `components/**/*.tsx`, barrel | Atoms compose into molecules into organisms. Every component exports from the barrel. |
| `frontend-components-advanced` | `components/**/*.tsx`, barrel | Lazy loading, demo-state traps, raw-input exceptions. |
| `frontend-forms` | form-heavy routes and form/modal components | Page-load errors in Switch/Match; submission errors via toast; field errors inline. |
| `frontend-lib` | `lib/**/*.ts` | Typed API client, auth store, constants, utilities. |
| `sql-migrations` | `migrations/*.sql` | Migrations are the source of truth for the data model. |
| `seed-data` | `seeds/*.sql` | Stable UUIDs, idempotent upserts, realistic content. |
| `write-tests` | `backend/**/*_test.go` | Integration tests hit real PostgreSQL; unit tests are table-driven. |
| `write-tests-planning` | `backend/**/*_test.go` | Derive test plans from predicates and discriminators before writing code. |
| `write-tests-frontend` | `frontend/**/*.test.ts(x)` | Verify behavior through props, callbacks, and rendered content. |
| `write-tests-frontend-workflow` | `frontend/**/*.test.ts(x)` | Coverage thresholds, sync discipline, pre-push typecheck. |
| `write-tests-e2e` | `frontend/tests/e2e/*.spec.ts` | Browser-visible journeys with stable role selectors. |
| `planning-standards` | `docs/plans/**/*.md` | Plans should be short enough to execute and specific enough to prevent mistakes. |
| `ci-workflow` | `.github/workflows/*.yml`, `codecov.yml` | CI catches forgotten type errors, regressions, stale types, and vulnerable deps. |
| `deploy-infra` | `scripts/*`, `infra/*`, Docker, `config.go` | Every env var follows config → env → deploy → constructor. |
| `common-commands` | `scripts/*`, `Makefile`, `config/.env*` | Use known-good repo commands; don't invent risky shell. |
| `openapi` | `openapi.yaml` | Hand-maintained spec drives frontend type generation. |
| `sse-realtime` | `sse*.go`, `sse.ts` | One-time ticket auth, per-user channels, reconnect with backoff. |
| `external-api` | `email/**/*.go` | IsConfigured(), env credentials, graceful degradation (Mailgun). |
| `job-queue` | `queue/*.go`, `worker/**` | Opt-in via Redis; goroutine fallback when absent. |
| `feature-flags` | `feature*.go`, `features.ts` | DB-backed cache; false for unknown keys. |
| `observability` | `observability/*.go`, `metrics*.go` | Opt-in metrics/tracing; zero overhead when disabled. |
| `rename-tool` | `cmd/rename/*.go` | Domain-safe, total rebrand across 20+ file categories. |
| `dynamic-image-endpoints` | dynamic image handlers | Pure deterministic renderers; version the renderer in the ETag. |

## Description-Triggered (on-demand)

These fire when the task description matches, or when explicitly invoked.

| Rule | When to use | Thesis |
|------|-------------|--------|
| `workflow-routing` | Choosing plan/audit/review depth | Match process weight to blast radius. |
| `plan-feature` | Planning a new module | Plan data model and permission model upfront. |
| `plan-feature-execution` | After plan structure is drafted | Readiness gates, critique loop, permissions, handoff to slice-and-ship. |
| `slice-and-ship` | Implementing a planned feature | One acceptance criterion end-to-end; audit before commit. |
| `plan-execution-loop` | Running `docs/plans/*.md` slices | implement → audit (≥90) → fix → re-audit per slice. |
| `plan-infra` | Planning deploy/env/ops work | Start from operator commands and environment boundaries. |
| `audit-bugs` | Bug/security review | Pre-merge checklist against touched files. |
| `audit-codebase` | Release readiness | Score across 7 categories with file citations. |
| `refactor-large-files` | Splitting large files | Split route files at 600+ lines; props/callbacks only. |
| `document-module` | Documenting a module | Document backward; same-commit spec sync. |
| `write-rules` | Creating/editing rules | Thesis is the contract; body is implementation. |
| `iteration-surface` | Slow feedback loops | Build preview harness before iterating on visuals. |
| `dynamic-image-http` | Dynamic image HTTP posture | Cache headers, render budget, max bytes. |
| `parallel-subagents` | 5+ independent files or parallel plan slices | Split independent work across subagents; verify after. |

## Workflow Sequences

Canonical version maintained in the Rule Index section of `codebase-standards.mdc`.

## Maintaining Rules

See `write-rules.mdc` for full guidance. Run `scripts/check_rule_health.sh` quarterly or when any rule crosses 150 lines. See [Rules Health Audit](rules-health.md).

### Known oversized rules (>120 lines)

All rules are at or under 150 lines except `go-handler` (153). These exceed 120 and are monitored:

- `go-handler` (153) — handler flow, validation, wire registration pointers
- `plan-execution-loop` (145) — subagent orchestration, worktree isolation
- `write-tests-e2e` (143) — E2E setup
- `slice-and-ship` (140), `dynamic-image-endpoints` (138), `audit-codebase` (135)
- `write-tests`, `solidjs-data-fetching`, `refactor-large-files` (130 each)
- `solidjs-pages` (123)

Split candidates if any cross 150: trim lookup material into reference docs first.
