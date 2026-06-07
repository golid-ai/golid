# Documentation

> Start here. Links to every doc in the project.

---

## Getting Started

| Doc | Description |
|-----|-------------|
| [Start Here](start-here.md) | Orientation: app flow, common directories, API contract, devcontainer, rules |
| [Quick Start](quick-start.md) | Docker Compose / DevContainer setup in 5 minutes, test accounts, common commands |
| [Architecture](architecture.md) | Backend/frontend layers, web/API split, middleware stack, auth flow |
| [Example Module](example-module.md) | Step-by-step guide to building a "notes" CRUD feature across the full stack |
| [Best Practices](best-practices.md) | Codebase-specific rules with real bad/good examples |
| [Components](components.md) | Design system reference (70+ components) |

---

## Cross-Cutting Documentation

| Doc | Description |
|-----|-------------|
| [Organism Pattern](organism-pattern.md) | How rules, specs, plans, and drift checks wire together |
| [Domain Glossary](glossary.md) | Terms with codebase-specific meanings |
| [Dependency Graph](dependency-graph.md) | Module dependency map for auth, users, and feature |
| [Cross-Module Flows](flows.md) | Request chains across modules |
| [Permission Matrix](permissions.md) | Who can do what — compiled from module specs |
| [Error Contracts](error-contracts.md) | apperror → HTTP status → response shape → frontend handling |
| [Schema ERD](schema.md) | Database tables, enums, and migration index |
| [CLI Reference](cli-reference.md) | Make targets, health endpoints, `TEST_DATABASE_URL`, test DB init |
| [Git Reference](git-reference.md) | Commit prefixes, branch naming, sweep-up exception |
| [Testing Checklist](testing-checklist.md) | Auth, users, feature scenarios + infra smoke |
| [Golden Slices](golden-slices.md) | Example slice definitions for common change types |
| [Staleness Tracker](staleness.md) | When each doc needs review — verification triggers and dates |
| [Architecture Decisions](decisions/) | ADRs — selector/verifier, SSE, onMount+signals, bcrypt, IsConfigured |
| [Plans](plans/README.md) | Feature planning tiers, iterations, archive |
| [Manual QA](manual-qa/README.md) | Pre-release smoke checklists |
| [Runbooks](runbooks/README.md) | Operational procedures (CSRF rollout, devcontainer) |
| [Rules Health](rules-health.md) | Quarterly rule audit checklist |
| [Cursor Rules](cursor-rules.md) | Full rule index with thesis lines and globs |

---

## Reference

| Doc | Description |
|-----|-------------|
| [API Versioning](api-versioning.md) | Version strategy and migration path |
| [Accessibility](accessibility.md) | Accessibility guidelines and patterns |
| [Demo Deployment](demo-deployment.md) | Demo deployment guide |
| [Deployment Options](deployment-options.md) | Cloud Run, Docker, and local deployment |
| [Routing Eval](routing-eval.md) | Workflow-routing tier calibration examples |
| [Rule Effectiveness](rule-effectiveness.md) | Measuring whether description-triggered rules fire |

---

## API Reference

| Doc | Description |
|-----|-------------|
| [OpenAPI Spec](../backend/openapi.yaml) | Full REST API definition (OpenAPI 3.1) |

Paste the spec into [Swagger Editor](https://editor.swagger.io/) to browse endpoints interactively.

---

## Module Specs

Starter modules. Specs are the source of truth for implemented behavior; optional business context and 1-page docs use `_templates/`.

| Module | Spec | Templates |
|--------|------|-----------|
| [Auth](modules/auth/) | [spec](modules/auth/spec.md) | [business](modules/_templates/business-context.md) · [1-page](modules/_templates/1-page.md) |
| [Users](modules/users/) | [spec](modules/users/spec.md) | [business](modules/_templates/business-context.md) · [1-page](modules/_templates/1-page.md) |
| [Feature](modules/feature/) | [spec](modules/feature/spec.md) | [business](modules/_templates/business-context.md) · [1-page](modules/_templates/1-page.md) |

---

## Cursor Rules

37 rules in `.cursor/rules/` that give the AI agent context about this codebase. Every rule opens with a thesis statement — one sentence stating what it enforces and why.

| Type | Count | Examples |
|------|-------|---------|
| Always active | 3 | `codebase-standards`, `git-commits`, `parallel-subagents` |
| File-scoped (auto-activate via glob) | 24 | `go-service`, `go-handler`, `solidjs-pages`, `write-tests` |
| Description-triggered (on-demand) | 10 | `plan-feature`, `slice-and-ship`, `audit-bugs`, `write-rules` |

**Full reference with thesis lines, globs, and design principles:** [Cursor Rules](cursor-rules.md)

---

## Infrastructure

| Doc | Description |
|-----|-------------|
| [DevOps](infrastructure/devops.md) | GCP setup, secrets, deployment |
| [Networking](infrastructure/networking.md) | VPC, Cloud Run networking |

## Patterns & References

> 1-page summaries for each technology in the stack. For project-specific coding rules, see [Best Practices](best-practices.md) and the [Cursor Rules](#cursor-rules) above.

| Topic | Quick Reference | Official Docs |
|-------|----------------|---------------|
| Go | [1-Page](patterns/go/1-Page.md) | [go.dev/doc](https://go.dev/doc/effective_go) |
| SolidJS | [1-Page](patterns/solidjs/1-Page.md) | [solidjs.com/docs](https://www.solidjs.com/docs/latest) |
| Tailwind | [1-Page](patterns/tailwind/1-Page.md) | [tailwindcss.com/docs](https://tailwindcss.com/docs) |
| PostgreSQL | [1-Page](patterns/postgresql/1-Page.md) | [postgresql.org/docs](https://www.postgresql.org/docs/16/) |
| Docker | [1-Page](patterns/docker/1-Page.md) | [docs.docker.com](https://docs.docker.com/build/) |
| Monorepo | [1-Page](patterns/monorepo/1-Page.md) | — |
| Testing | [1-Page](patterns/testing/1-Page.md) | — |

### Libraries

| Library | Doc |
|---------|-----|
| Zod | [zod-1page.md](patterns/libraries/zod-1page.md) |

### Services

| Service | Full Guide | 1-Page Summary |
|---------|-----------|----------------|
| Email (Mailgun) | [email.md](patterns/services/email/email.md) | [1-Page](patterns/services/email/1-Page.md) |
| Realtime (SSE) | [realtime.md](patterns/services/realtime/realtime.md) | [1-Page](patterns/services/realtime/1-Page.md) |
