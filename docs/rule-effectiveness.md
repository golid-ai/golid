# Rule Effectiveness Log

> **Purpose:** Record evidence about which Cursor rules helped, missed, added
> ceremony, or stayed right-sized during real work.

Use for meaningful agent tasks, audits, CI fixes, and rule changes. Skip T0
typos unless they show rule drag or a gap.

Tier cross-references: `docs/routing-eval.md`, `docs/golden-slices.md`.

Newest entries first. Archive beyond ~200 lines to `docs/plans/archive/rule-effectiveness-YYYY-MM.md`.

## Log format

```markdown
### YYYY-MM-DD — task title

- Tier: T0/T1/T2/T3 (reason)
- Expected rules: `rule-a`, `rule-b`
- Used rules: `rule-a`, `rule-b`
- Helpful: `rule-a` (evidence)
- Missed: none | gap with evidence
- Outcome: prevented issue | missed issue | unnecessary ceremony | right-sized
```

## Closeout template

```markdown
Rule effectiveness:
- Tier:
- Expected rules:
- Used rules:
- Helpful:
- Missed:
- Outcome:
```

---

### 2026-06-07 — v0.3.0 platform backport closeout

- Tier: T3 (cross-cutting CI, wire, rules, docs organism)
- Expected rules: `slice-and-ship`, `parallel-subagents`, `ci-workflow`, `write-rules`
- Used rules: `codebase-standards`, `parallel-subagents`, `planning-standards`, `audit-codebase`
- Helpful: `parallel-subagents` for 5+ file audits; `ci-workflow` for path-filter job design
- Missed: none material at ship gate
- Outcome: right-sized — process weight matched a multi-week infra migration

### 2026-06-07 — Devcontainer Node 24 stale image

- Tier: T1 (local dev fix)
- Expected rules: `deploy-infra`, `common-commands`
- Used rules: ad hoc diagnosis
- Helpful: `deploy-infra` env chain awareness
- Missed: no fail-loud Node gate in `postCreateCommand` (added in v0.3.1 closeout)
- Outcome: missed issue — stale Docker cache looked like a broken backend
