# ADR-001: Package Extraction Strategy

**Status:** Deferred (revisit when 3+ downstream projects exist)
**Date:** 2026-02-19
**Decision makers:** Steven Frank

## Context

Golid is a full-stack Go + SolidJS framework. Downstream projects fork it and diverge. When bugs are fixed or infrastructure is improved in Golid, there is no mechanism for downstream projects to pull those changes other than manual cherry-picking.

The question: should we extract shared infrastructure into publishable packages (`golid-go` Go module + `@golid/ui` npm package) so downstream projects can upgrade via `go get -u` and `npm update`?

## Decision

**Not now. Use the template-repo + cherry-pick model for V1.**

Extraction is deferred until at least 3 downstream projects exist or external users request independent package access. The current monolithic template is the right architecture for launch and early traction.

## Rationale

### Why not extract now

- **Only 2 consumers** (Golid + one downstream project). The maintenance cost of 4 repos, 4 CI pipelines, publish workflows, semver discipline, and speculative API design exceeds the cherry-picking cost for 2 projects.
- **Auth service has a hard DB coupling.** `AuthService` does raw SQL against a `users` table with specific columns (`password_hash`, `verification_token`, `password_reset_selector`). Extracting it into a package requires either forcing every downstream project to have that exact schema (fragile) or designing a repository interface layer (`type UserStore interface`) that downstream projects implement. That interface design should be informed by real downstream variation, not speculation.
- **APIs would be designed speculatively.** Golid isn't publicly launched yet. Extracting packages before having real consumers means committing to interfaces before understanding how they'll be used. Premature abstraction.
- **Golid would become trivially thin.** If all the interesting code lives in packages, the starter is just docker-compose + example routes + CI config. At that point it's closer to a CLI scaffolder (`create-golid-app`) than a template repo — but building a CLI is even more work.

### Why cherry-pick works for now

- Golid and downstream projects share the same file structure, so `git cherry-pick` applies cleanly for shared infrastructure files (`internal/middleware/`, `internal/apperror/`, components, etc.).
- Setup: `git remote add starter <url>` in downstream repos. Then `git fetch starter && git cherry-pick <sha>` to pull specific fixes.
- Conflicts are a signal: if cherry-picks conflict frequently, that's evidence the projects have diverged enough to justify extraction.

## Future Architecture (V2/V3)

When extraction is justified, the plan has three phases:

### V2: Extract packages (3+ consumers)

**Go module** (`github.com/golid-ai/golid-go`):

- Leaf packages first (zero DB dependencies): `apperror`, `logger`, `validate`, `retry`
- Then: `middleware`, `email`, `sse`, `queue`, `observability`, `dbpool`
- Last (hardest): `auth` — requires designing a `UserStore` interface informed by real downstream schemas

**npm package** (`@golid/ui`):

- Component library (atoms, molecules, organisms) with Tailwind CSS preset
- Core API client (`createApiClient` factory) + SSE client + notification stores
- `authApi` included (it's infrastructure, not project-specific — paired with `golid-go/auth`)
- Built with `tsup`, ESM-only, `solid-js` as peer dependency

**Key design decisions for V2:**

- Config structs with `Validate() error` over positional constructor args
- Repository interfaces for DB-dependent packages (auth needs `UserStore`, not raw `*pgxpool.Pool`)
- Tailwind preset/plugin for consistent design tokens across downstream projects
- `authApi` lives in the npm package alongside the Go auth service
- Auth migrations ship as embeddable SQL files (`embed.FS`), applied by downstream projects in their migration sequence
- Incremental adoption: downstream projects can switch one package at a time (`apperror` first, then `middleware`, etc.)
- Internal `replace` directive validation before public publish

### V3: CLI scaffolder (public adoption)

`create-golid-app` that generates a project importing from the V2 packages:

- Interactive prompts: auth (yes/no), email provider, queue (Redis/goroutine), SSE (yes/no)
- Generates only the code needed for selected features
- Makes sense when configuration permutations are real (multiple DB backends, multiple email providers, etc.)

## Signals to Revisit

- A third project forks the starter
- The same infrastructure bug is fixed independently in 3+ forks
- An external user asks to use just the backend or just the component library
- Cherry-pick conflicts become frequent enough to slow development

## References

- Detailed extraction plan with package tables and code examples: see project git history
- Review critique with scoring (74/100) identifying auth/DB coupling and premature extraction risks
