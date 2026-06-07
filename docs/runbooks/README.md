# Runbooks

> Operational procedures for debugging and recovering Golid in dev, CI, and production.

Runbooks are **how to fix it**, not **why it works** — architecture lives in
`docs/architecture.md`; module behavior in `docs/modules/*/spec.md`.

## When to add a runbook

- A production or dev incident required more than one non-obvious command to resolve.
- CI has a failure mode that is easy to misdiagnose (stale image, wrong DB URL).
- A rollout has ordered steps (CSRF enforce, migration backfill).

## Index

| Runbook | Use when |
|---------|----------|
| [devcontainer-stale-image.md](devcontainer-stale-image.md) | `EBADENGINE` Node version, old toolchain after Dockerfile change |
| [csrf-production-rollout.md](csrf-production-rollout.md) | Enabling `CSRF_ENFORCE` in production |

## Style

- Lead with symptoms, then diagnosis, then fix, then prevention.
- Copy-paste commands must match `docs/cli-reference.md`.
- Link to the relevant ADR or spec when behavior is intentional.
