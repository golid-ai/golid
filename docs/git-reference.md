# Git Reference

> **Purpose:** Detailed examples and edge-case guidance for the compact
> `git-commits` rule.

Use this when the commit rule tells you the shape but you need examples or the
full sweep-up exception checklist.

## Commit Examples

```text
feat: add user profile avatar upload

Validates MIME type and size server-side, stores URL on users row,
and refreshes the navbar avatar after save.
```

```text
fix: prevent duplicate feature flag on concurrent create

Two simultaneous create requests could both pass the uniqueness check.
Added a unique constraint on feature key.
```

```text
refactor: extract pagination parsing into shared helper

Three handlers duplicated limit/offset validation. Moved to
service/pagination.go for reuse.
```

```text
chore: remove unused auth middleware import
```

```text
test: add integration tests for password reset flow
```

## Legitimate Sweep-Up Commits

The "one logical change" rule has one narrow exception: cross-cutting touches
produced by parallel subagents working on shared files such as `openapi.yaml`,
module specs, barrels, `frontend/src/lib/api.ts`, `frontend/src/lib/constants.ts`,
or `main.go`. See `parallel-subagents` before using this exception.

When a parallel batch produces shared-file edits that do not fit cleanly into a
single feature commit, one sweep-up commit per batch is correct. Do not split it
into N tiny commits that each touch the same shared file.

A sweep-up commit is legitimate when all of these hold:

- It collects edits to shared files only.
- Each included change is small and additive, such as a new OpenAPI path, new
  spec section, or new barrel export.
- It contains no behavior changes, bug fixes, or opportunistic refactors.
- The commit body lists which subagent or feature each edit belongs to.
- It lands in the same push as the feature commits it supports.

Name it explicitly:

```text
chore: sweep-up shared-file edits from <batch-name>
```

A sweep-up commit is not legitimate cover for:

- Bug fixes discovered during the batch. Those get their own `fix:` commits.
- Refactors that touched shared files as a side effect. Extract those into a
  `refactor:` commit landed before the feature batch.
- "I didn't want to split this." If the changes are not shared-file edits from
  parallel work, the normal one-logical-change rule applies.
