# Rules Health Audit

> **Purpose:** Keep Cursor rules useful by pruning stale, redundant, or
> over-broad guidance before adding more process.

Run this quarterly, or whenever any rule crosses 150 lines.

Run `scripts/check_rule_health.sh` for the mechanical checks: oversized rules,
missing frontmatter/thesis, missing reference docs, and duplicate guidance
candidates.

Use `docs/routing-eval.md` to check whether `workflow-routing` still classifies
T0-T3 work at the right process weight.

Use `docs/golden-slices.md` as non-normative calibration examples for common
T0-T3 and parallel-subagent slices.

Use `docs/rule-effectiveness.md` to inspect which rules helped, missed, or
added ceremony during meaningful tasks.

## Refrain

Measure → Prune → Narrow → Move → Add last.

## Checklist

1. **Activation:** Which rules fired and helped in recent work?
2. **Misses:** Which rules were ignored or redundant, and which loaded too late?
3. **Escapes:** Which audit findings escaped despite existing rules?
4. **Size:** Which rules exceed 120 lines, and which crossed 150 lines?
5. **Duplication:** Which guidance appears in three or more places?
6. **Routing:** Did `workflow-routing` classify recent tasks at the right T0-T3
   level?
7. **Cost:** Did any always-applied or broad glob rule grow without protecting a
   new failure mode?

## Pruning Bias

For every finding, prefer the first applicable action:

1. Delete stale guidance.
2. Move lookup material to a reference doc and link it from the rule.
3. Narrow activation with a tighter glob or description trigger.
4. Merge duplicate guidance into the owner rule and leave one-line pointers.
5. Add or expand a rule only when the trigger, cost, and protected failure are
   explicit.

Intentional duplication can stay when the duplicated guidance serves disjoint
activation globs and would otherwise disappear from one context. Keep those
copies short and annotate them in both places.

## After Pruning

Re-run `scripts/check_rule_health.sh` and spot-check one recent task against
the updated rule set. If a rule no longer fires when it should, tighten its
glob or description trigger before adding new guidance elsewhere.
