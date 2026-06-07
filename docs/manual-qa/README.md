# Manual QA

> Checklists for verifying behavior the automated suite does not fully cover (browser UX, deploy smoke, third-party integrations).

Run these before a release tag or after touching auth, deploy, or devcontainer tooling.

## Index

| Checklist | When |
|-----------|------|
| [auth-smoke.md](auth-smoke.md) | Auth, session, or CSRF changes |
| [devcontainer-smoke.md](devcontainer-smoke.md) | Devcontainer, Node, or frontend dev script changes |
| [release-smoke.md](release-smoke.md) | Pre-tag verification |

## How to record results

Add a dated line to the checklist file or note in the release PR:

```text
2026-06-07 — auth-smoke — PASS — steve — v0.3.1 candidate
```

Automated gates (CI, spec-drift, rule-health) must be green before manual QA is considered sufficient.
