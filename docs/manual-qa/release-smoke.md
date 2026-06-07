# Manual QA — Release Smoke

> Pre-tag checklist. Complements CI — does not replace it.

## Automated (must be green)

- [ ] CI green on release branch
- [ ] `scripts/check_spec_drift.sh` locally if specs touched
- [ ] `scripts/check_rule_health.sh` passes
- [ ] `make verify-scaffold` passes

## Local full check (optional, recommended)

```bash
make lint
make test-backend
cd frontend && npm run typecheck && npm run test:run
```

## Manual

- [ ] Complete [auth-smoke.md](auth-smoke.md)
- [ ] README quick start steps work on fresh clone (or devcontainer)
- [ ] CHANGELOG version and date match intended tag

## Tag

```bash
git tag -a v0.3.1 -m "v0.3.1"
git push origin v0.3.1
```

Adjust version as needed.

**Result:** PASS / FAIL — date — tag — notes
