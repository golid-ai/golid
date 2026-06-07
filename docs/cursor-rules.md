# Cursor Rules

> 38 rules in `.cursor/rules/` that give the AI agent context about this codebase.

## System Philosophy

The documentation system follows an **organism pattern**: rules are the nervous system (reflexive responses to stimuli), module specs are the anatomy (current-state structure and constraints), plans are the growth layer (intended change and slicing), cross-cutting docs are circulation (flows, dependencies, permissions), audits and drift checks are the immune system, archived plans and ADRs are institutional memory, and consumption paths are the synapses that ensure the right knowledge fires at the right moment. No layer functions in isolation. A rule without a spec is a reflex without understanding. A plan without same-slice spec sync becomes stale intent. The system works because each layer validates and activates the others. For the full conceptual framework, see [Organism Pattern](organism-pattern.md).

## Design Principles

- **Every rule opens with a thesis** — one sentence stating what the rule enforces and why. The thesis enables generalization to novel situations; a pointer to a reference file only enables pattern-matching.
- **Three activation types:** `alwaysApply` for universal guardrails, glob-triggered for domain rules (auto-activates when editing matching files), description-triggered for workflow rules (invoked by task description or explicit mention).
- **Plans drive execution; specs state truth** — plans in `docs/plans/` are first-class inputs to `slice-and-ship`; module specs (`docs/modules/{module}/spec.md`) remain the current-state truth for implemented behavior.
- **Workflow routing before ceremony** — classify T0-T3 risk before choosing plan, slice, audit, or review depth. Process should scale with blast radius.
- **Spec consumption paths** — domain rules include "Before modifying..." instructions that point the AI to module specs before editing services, handlers, routes, or tests. The module-to-folder mapping lives in `codebase-standards.mdc` (always-applied).
- **Infrastructure files use guardrails only** — files like `cmd/server/main.go`, `internal/db/*.go`, and `frontend/src/app.tsx` are edited rarely and don't match any domain rule's thesis. The Core Guardrails in `codebase-standards.mdc` cover their highest-consequence patterns.
- **Thesis + refrain for method-flow rules** — `go-service` and `go-handler` have verb-driven refrains (`Validate → Authorize → Execute → Respond`) that compress the method lifecycle into a memorable sequence.
- **Cross-cutting reference docs** — [Permission matrix](permissions.md), [error contracts](error-contracts.md), and [staleness tracker](staleness.md) are maintained alongside module specs.
- **Description-trigger monitoring** — if a description-triggered rule (`frontend-forms`, `refactor-large-files`) fails to fire for 2+ consecutive relevant tasks, escalate to a narrow glob targeting the most common files for that concern. This is a fallback, not the default.

## Always Active

These fire on every interaction. Every line costs context, so they're kept compact.

| Rule | Thesis |
|------|--------|
| `codebase-standards` | Universal guardrails that apply regardless of which file you're editing — the principles that every other rule assumes you follow. |
| `git-commits` | Atomic commits with consistent prefixes make history scannable, bisectable, and reviewable. |
| `parallel-subagents` | Sequential edits across many files waste time and lose context. Split independent work across subagents, verify after completion. |

## File-Scoped (auto-activate via glob)

| Rule | Fires on | Thesis |
|------|----------|--------|
| `go-service` | `service/**/*.go` | Services own business logic and data access. They are framework-agnostic, verify resource membership, and never trust the caller to have checked permissions. |
| `go-handler` | `handler/**/*.go`, `middleware/**/*.go` | Handlers are thin translators between HTTP and services. They validate input, extract auth, delegate to services, and return JSON — nothing more. |
| `solidjs-pages` | `routes/**/*.tsx` | Pages fetch data on mount, guard against stale async with alive checks, and use flat Switch/Match for content states — never nested Show. |
| `solidstart-routing` | `app.tsx`, `routes/**/*.tsx`, navigation organisms, `constants.ts` | Path-transparent route groups and global app chrome make product boundaries a shell concern, not just a page concern. |
| `frontend-components` | `components/**/*.tsx` | Components are stateless building blocks. Atoms compose into molecules, molecules into organisms. Every component exports from the barrel. |
| `frontend-forms` | form-heavy auth/settings routes and form/modal components | Display page-load errors in Switch/Match states, submission errors via toast, and field-level errors inline. |
| `frontend-lib` | `lib/**/*.ts` | Lib files are the shared foundation: typed API client, auth store, constants, and utilities. Every API call is typed, every protected route is registered. |
| `sql-migrations` | `migrations/*.sql` | Migrations are the source of truth for the data model. Every table gets UUIDs, TIMESTAMPTZ, FK indexes, and an updated_at trigger. |
| `seed-data` | `seeds/*.sql` | Seed data uses stable UUIDs, idempotent upserts, and realistic content. Every new migration gets seed data immediately. |
| `write-tests` | `backend/**/*_test.go` | Test the contract, not the implementation. Integration tests hit real PostgreSQL; unit tests are table-driven; every service method has error path coverage. |
| `write-tests-frontend` | `frontend/**/*.test.ts(x)` | Frontend tests verify behavior through props, callbacks, and rendered content — not rendering existence alone. Know jsdom's limits. |
| `write-tests-e2e` | `frontend/tests/e2e/*.spec.ts` | E2E tests verify browser-visible user journeys against the full stack, so they wait for rendered UI, use stable role selectors, and run serially against shared state. |
| `planning-standards` | `docs/plans/**/*.md` | Plans should be short enough to execute and specific enough to prevent predictable mistakes. |
| `ci-workflow` | `.github/workflows/*` | CI catches what developers forget: type errors, test regressions, stale generated types, and vulnerable dependencies. Jobs must not have cross-job dependencies. |
| `deploy-infra` | `scripts/*`, `infra/*`, `Dockerfile*`, `config.go` | Every env var follows a full chain: config struct, env file, deploy script, service constructor. Secrets go through Secret Manager, never hardcoded. |
| `common-commands` | `scripts/*`, `Makefile`, `config/.env*` | Shared commands should be discoverable, copy-safe, and tied to current project scripts so agents do not invent risky shell invocations. |
| `openapi` | `openapi.yaml` | The OpenAPI spec is hand-maintained and drives frontend type generation. Update it whenever endpoints change, then regenerate types. |
| `sse-realtime` | `sse*.go`, `sse.ts` | SSE uses one-time ticket auth (never JWT in URLs), per-user buffered channels, and frontend reconnect with exponential backoff. |
| `external-api` | `email/**/*.go` | External services are wrapped with IsConfigured(), env-sourced credentials, and graceful degradation when unconfigured. |
| `job-queue` | `queue/*.go`, `worker/**` | The queue is opt-in via Redis. Every enqueue site checks IsConfigured() and falls back to retry-wrapped goroutines when Redis is absent. |
| `feature-flags` | `feature*.go`, `features.ts` | Flags are database-backed with a 30-second cache. IsEnabled() returns false for unknown keys. Never use flags for auth decisions. |
| `observability` | `observability/*.go`, `metrics*.go` | Metrics and tracing are opt-in via env vars. Zero overhead when disabled. Label cardinality stays under 100 unique sets. |
| `rename-tool` | `cmd/rename/*.go` | A missed file means a downstream user ships with the wrong brand. A naive replacement corrupts domain URLs. Every rename must be domain-safe and total. |
| `dynamic-image-endpoints` | dynamic image route handlers | Dynamic image endpoints must validate inputs, set cache headers, and never leak internal paths. |

## Description-Triggered (on-demand)

These fire when the task description matches, or when explicitly invoked.

| Rule | When to use | Thesis |
|------|-------------|--------|
| `workflow-routing` | Choosing plan/audit/review depth | Match process weight to blast radius so small changes stay light and high-risk work still gets full contract, audit, and rollback gates. |
| `plan-feature` | Planning a new module | Plan the data model and permission model upfront. Everything else — API surface, frontend, tests — follows from those two decisions. |
| `slice-and-ship` | Implementing a planned feature | Ship one acceptance criterion end-to-end before starting the next. The slice is the unit of audit and review. |
| `plan-execution-loop` | Running `docs/plans/*.md` slices | One slice at a time: implement → audit (≥90/100) → fix → re-audit before the next slice. Parent orchestrates; subagents implement and audit. |
| `plan-infra` | Planning deploy/env/ops work | Infra plans start from operator commands and environment boundaries; code changes follow from making those commands safe. |
| `audit-bugs` | Bug/security review | Run this checklist against any file or module being reviewed. Each item references a real bug found in this codebase. |
| `audit-codebase` | Release readiness | Score the codebase across 7 categories with exact file citations. Check ADRs before flagging documented design decisions. |
| `refactor-large-files` | Splitting large files | Split route files at 600+ lines. Extracted components receive data via props and callbacks — they never import the parent's signals. |
| `document-module` | Documenting a module | Use this when documenting an existing module. plan-feature plans forward. This documents backward. |
| `write-rules` | Creating/editing rules | Every rule opens with a thesis. The thesis is the contract — everything below it is the implementation. |
| `iteration-surface` | Choosing what to change in a slice | Minimize the iteration surface so each slice stays reviewable and reversible. |

## Workflow Sequences

Canonical version maintained in the Rule Index section of `codebase-standards.mdc`.

Do not copy the executable sequence here. Use `codebase-standards.mdc` as the
single source of truth for which workflow rule to invoke.

## Maintaining Rules

See `write-rules.mdc` for full guidance. Key principles:

- **Thesis required** — every rule opens with one sentence stating what it enforces and why
- **Update in the same pass** — when a code change reveals a rule gap, fix the rule immediately, not as a follow-up
- **40-80 lines** — over 120 suggests the rule covers two concerns and should be split
- **Rule Index** — when adding a workflow rule, add it to the Rule Index in `codebase-standards.mdc`
- **Rule health** — run [Rules Health Audit](rules-health.md) quarterly, or whenever any rule crosses 150 lines

### Known oversized rules

Several rules exceed the 120-line guideline. These are candidates for future splitting but are functional as-is:

- `solidjs-pages` — data fetching, modals, auth, content states, route registration, and build recovery
- `write-tests` — backend unit/integration test patterns and safety notes
- `go-service` — service flow, auth, transactions, and SQL guardrails
- `frontend-components` — component hierarchy, exports, styling, and accessibility
- `write-tests-frontend` — component tests, jsdom limits, mocking, and coverage thresholds
- `go-handler` — handler flow, validation, auth extraction, and responses
- `plan-feature` — feature plan checklist, decisions, and execution readiness
- `refactor-large-files` — route file split strategy and extraction patterns
- `slice-and-ship` — implementation loop, contract closeout, and slice audit gates
