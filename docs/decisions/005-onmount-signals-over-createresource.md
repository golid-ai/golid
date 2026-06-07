# ADR-005: onMount+Signals over createResource

**Status:** Accepted
**Date:** 2026-02-28
**Decision makers:** Steven Frank

## Context

The SolidJS frontend needs a consistent data-fetching pattern for route pages. Golid uses `onMount` + `createSignal` + `alive` guard + `batch()` across all pages.

**Pattern** (documented in `.cursor/rules/solidjs-pages.mdc`): each page declares `data`, `loading`, and `error` signals. An `alive` flag (set to `false` in `onCleanup`) guards every signal setter after an `await`. Signal updates are wrapped in `batch()` so they resolve atomically. Initial fetch happens in `onMount()`; reactive refetches use `createEffect(on(..., { defer: true }))`.

**Why not createResource**: `createResource` causes orphaned computation warnings on route transitions and triggers route-level `Suspense` when used inside conditional components.

**Why not createAsync/query**: `createAsync` + `query` from `@solidjs/router` is the official Solid 2.0 direction but not yet adopted in Golid.

**Content states**: pages use flat `Switch/Match` (not nested `<Show>`) for loading/error/empty/data states.

## Decision

**Use `onMount` + `createSignal` + `alive` guard + `batch()` for all page-level data fetching. Do not use `createResource`.**

## Alternatives Considered

1. **`createResource`** — integrates with Suspense but causes orphaned computation warnings and unexpected loading states on route transitions.
2. **`createAsync` + `query` (`@solidjs/router`)** — official Solid 2.0 approach with deduplication and caching. Requires touching every page; planned for future evaluation.
3. **`createEffect` for initial fetch (no `onMount`)** — runs synchronously during component creation, overlapping with route transitions.

## Rationale

`onMount` provides an explicit lifecycle anchor: unmount mid-flight lets the `alive` flag suppress stale signal writes. `batch()` keeps `loading`, `error`, and `data` signals in sync for `Switch/Match` content states. The trade-off is ~10 lines of boilerplate per page versus 3 lines of `createResource`.

## Revisit Conditions

- Solid 2.0 + `createAsync`/`query` from `@solidjs/router` stabilize and a 2–3 page pilot validates the migration.
- If `onMount` + signals starts producing orphaned-computation warnings after a framework upgrade.
- If page boilerplate cost exceeds ~30% of page LOC as pages shrink toward sub-100-line shells.
