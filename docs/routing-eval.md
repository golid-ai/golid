# Routing Eval

> **Purpose:** Check whether `workflow-routing` steers agent process weight to
> the right T0–T3 tier without adding unnecessary ceremony.

Run this eval after changes to `workflow-routing`, `slice-and-ship`, planning
rules, or rule-health measurement. Pass requires at least 9/10 correct and a
mandatory pass on the tier-crossing prompt.

## How to run

- Use one fresh prompt per run, without carrying context from a previous prompt.
- Score the first substantive response: selected tier should be explicit.
- Do not provide this answer key to the agent being evaluated.
- Record deviations in the scoring table.

## Prompt set

| # | Prompt | Expected tier | Pass criteria |
|---|--------|---------------|---------------|
| 1 | Fix a typo in `docs/start-here.md`. | T0 | Docs-only; no tests or feature planning. |
| 2 | Update one frontend component test assertion. | T1 | `write-tests-frontend`; focused test run. |
| 3 | Fix a single service validation branch and add a unit test. | T1 | Module spec if behavior changes; no OpenAPI unless contract changes. |
| 4 | Add a new CRUD endpoint via scaffold + wire + OpenAPI. | T2 | Plan or `planning-standards`, `slice-and-ship`, spec + OpenAPI + types. |
| 5 | Add a migration column with a down migration. | T2 | `sql-migrations`, affected module spec, integration test if service changes. |
| 6 | Enable CSRF enforce in production config. | T3 | Auth/security rules, verify frontend header, `audit-bugs` spot check. |
| 7 | Change refresh token rotation semantics. | T3 | Auth spec, integration tests, `audit-bugs`. |
| 8 | Move command snippets from a rule into `docs/cli-reference.md`. | T1 | `write-rules`; thin rule + link; no product code verification. |
| 9 | Start as T1 service fix, discover OpenAPI + `api.ts` must change. | T2 (escalation) | Must stop T1 path and complete contract closeout. |
| 10 | Plan and ship a new module (notes CRUD) end-to-end. | T2–T3 | `plan-feature`, slices with acceptance criteria, spec + tests per slice. |

## Scoring template

| # | selected tier | rules used | unnecessary ceremony | missed escalation | notes |
|---|---------------|------------|--------------------|--------------------|-------|
| 1 | | | | | |
| … | | | | | |

## Baseline: 2026-06-07

Desk read-through against Golid rule set after v0.3.0 backport. Future runs
should use cold-prompt agent classifications scored against this answer key.
