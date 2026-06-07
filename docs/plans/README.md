# Plans

> **Purpose:** First-class inputs to implementation — not archival README noise.

Plans describe **intended change**. Module specs (`docs/modules/*/spec.md`)
describe **current truth**. When a slice ships, update the spec in the same
pass (see `slice-and-ship` rule).

## When to write a plan

| Situation | Tier | Plan type |
|-----------|------|-----------|
| Typo in docs | T0 | No plan — just fix |
| Single-file bug + unit test | T1 | Optional one-paragraph PR description |
| New endpoint or migration | T2 | Plan with slices + acceptance criteria |
| Auth, security, multi-module release | T3 | Parent plan + sub-plans or phased slices |

Use `workflow-routing` to pick the tier before choosing depth.

## Plan anatomy

Every non-trivial plan should open with:

```markdown
# Title

> **Status:** Draft | Active | Complete | Superseded
> **Risk tier:** T0–T3
> **Thesis:** One sentence — what this plan achieves and why now.

## Non-goals
## Success metrics (how we know we're done)
## Slices (ordered, each with acceptance criteria + verification)
## Risks and mitigations
```

See `.cursor/rules/planning-standards.mdc` for the full checklist.

## Tiers and process weight

| Tier | Process | Rules typically involved |
|------|---------|--------------------------|
| **T0** | Edit + commit | `codebase-standards`, `git-commits` |
| **T1** | Focused test | Domain rule + `write-tests` |
| **T2** | Slice-and-ship loop | `planning-standards`, `slice-and-ship`, OpenAPI, spec sync |
| **T3** | Plan + audit gates | Above + `audit-bugs`, security/migration rules |

Calibration examples: `docs/golden-slices.md`.  
Eval prompts: `docs/routing-eval.md`.

## Iteration model (how we run plans)

This matches the uflex dogfood loop, scaled for a solo OSS maintainer:

```
1. Plan     → thesis, non-goals, slices, risks (plan-feature / planning-standards)
2. Slice    → one acceptance criterion end-to-end (slice-and-ship)
3. Audit    → fresh agent or checklist pass on the slice diff
4. Fix      → address findings before next slice
5. Spec sync→ module spec + OpenAPI + tests in same commit batch
6. Repeat   → until success metrics met
7. Archive  → move completed plan to archive/; log lesson in rule-effectiveness
```

**Parent agent owns decisions.** Subagents audit or implement independent
files; parent merges, verifies, and re-audits when findings change behavior.

For parallel batches (5+ independent files), see `parallel-subagents` and
`docs/git-reference.md` sweep-up commit rules.

## Folder layout

```text
docs/plans/
  README.md              ← this file
  <active-plan>.md       ← in-flight work (0–2 active plans is healthy)
  archive/               ← completed or superseded plans (institutional memory)
```

**Active plans:** keep short and current. If a plan stalls, mark `Superseded`
and archive rather than letting it rot.

**Archive:** completed plans stay readable for bisect and onboarding ("why did
we adopt wire/subpackages?"). Do not delete.

## Example in this repo

- [archive/v0.3.0-platform-hardening.md](archive/v0.3.0-platform-hardening.md) — multi-phase backport program (complete)

## Related

- `docs/organism-pattern.md` — plans as the growth layer
- `docs/cursor-rules.md` — which rules fire during planning vs implementation
- `docs/staleness.md` — when to re-verify specs after plans land
