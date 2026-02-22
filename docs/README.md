# Documentation

> Start here. Links to every doc in the project.

---

## Getting Started

| Doc | Description |
|-----|-------------|
| [Quick Start](quick-start.md) | Docker Compose / DevContainer setup in 5 minutes, test accounts, common commands |
| [Architecture](architecture.md) | Backend/frontend layers, middleware stack, auth flow, data fetching pattern |
| [Example Module](example-module.md) | Step-by-step guide to building a "notes" CRUD feature across the full stack |
| [Best Practices](best-practices.md) | Codebase-specific rules with real bad/good examples |
| [Components](components.md) | Design system reference (70+ components) |

---

## Reference

| Doc | Description |
|-----|-------------|
| [API Versioning](api-versioning.md) | Version strategy and migration path |
| [Accessibility](accessibility.md) | Accessibility guidelines and patterns |
| [Demo Deployment](demo-deployment.md) | Demo deployment guide |
| [Deployment Options](deployment-options.md) | Cloud Run, Docker, and local deployment |

---

## Cursor Rules

Rules in `.cursor/rules/` that give the AI agent context automatically.

### Always Active

| Rule | What it does |
|------|-------------|
| `codebase-standards.mdc` | Core standards: parameterized SQL, transactions, apperror, alive guards, nullable timestamps, external API patterns, testing conventions |
| `parallel-subagents.mdc` | Use parallel subagents when auditing or editing 5+ independent files |

### File-Scoped (auto-activate when editing matching files)

| Rule | Fires on | What it does |
|------|----------|-------------|
| `go-service.mdc` | `service/*.go` | Service layer: auth helpers, SQL, transactions, error handling, pagination, TIMESTAMPTZ pattern |
| `go-handler.mdc` | `handler/*.go` | Handler layer: thin handlers, auth extraction, validation, route registration |
| `solidjs-pages.mdc` | `routes/**/*.tsx` | Pages: data fetching, alive guards, modals, DestructiveModal, container widths |
| `frontend-components.mdc` | `components/**/*.tsx` | Component patterns: atoms vs molecules, props, cn(), accessibility |
| `frontend-lib.mdc` | `lib/*.ts` | API client: typed endpoints, error handling, PRIVATE_ROUTES |
| `sql-migrations.mdc` | `migrations/*.sql` | Migrations: up/down, UUIDs, indexes, triggers, enums |
| `seed-data.mdc` | `seeds/*.sql` | Seed data: stable UUIDs, idempotent inserts, realistic data |
| `write-tests.mdc` | `*_test.go` | Tests: integration with WithTestDB, unit table-driven |
| `ci-workflow.mdc` | `.github/workflows/*` | CI pipeline patterns |
| `deploy-infra.mdc` | `scripts/deploy.sh`, `infra/*` | Infrastructure: env var chain, Docker, Cloud Run, secrets |
| `openapi.mdc` | `api/*.yaml` | OpenAPI spec conventions |
| `refactor-large-files.mdc` | Large route files | When and how to split 600+ line route files |
| `external-api.mdc` | External API integrations | External service wrappers, IsConfigured() pattern |
| `sse-realtime.mdc` | SSE endpoints | SSE patterns, middleware exclusions |
| `observability.mdc` | Tracing/metrics | OpenTelemetry integration, opt-in pattern |
| `job-queue.mdc` | Queue/worker code | Redis queue, dual-path pattern, retry |
| `feature-flags.mdc` | Feature flag code | Feature flag service patterns |
| `rename-tool.mdc` | `cmd/rename/*` | Domain-safe replacement, file coverage, name validation |

### On-Demand

| Rule | When to use |
|------|-------------|
| `plan-feature.mdc` | Planning a new module (`@plan-feature`) |
| `audit-bugs.mdc` | Bug/security audit (`@audit-bugs`) |
| `audit-codebase.mdc` | Release readiness audit (`@audit-codebase`) |

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
