# Manual QA — Release Smoke

> Pre-tag checklist. Complements CI — does not replace it.

## Automated (must be green)

- [ ] CI green on release branch
- [ ] `scripts/check_spec_drift.sh origin/main` if handlers/services or specs touched
- [ ] `scripts/check_citation_freshness.sh` if line-number citations changed
- [ ] `scripts/check_rule_health.sh` passes
- [ ] `make verify-scaffold` passes
- [ ] For major releases: [`audit-codebase`](../.cursor/rules/audit-codebase.mdc) spot-check (7 categories)

## Local full check (optional, recommended)

```bash
make lint
make test-backend
cd frontend && npm run typecheck && npm run test:run
```

## Manual

- [ ] Complete [auth-smoke.md](auth-smoke.md)
- [ ] Complete [devcontainer-smoke.md](devcontainer-smoke.md) if devcontainer or Docker frontend images changed
- [ ] README quick start steps work on fresh clone (or devcontainer)
- [ ] CHANGELOG version and date match intended tag

## Tag

```bash
git tag -a v0.3.2 -m "v0.3.2"
git push origin v0.3.2
```

Adjust version as needed.

**Result:** PASS / FAIL — date — tag — notes
