# Manual QA — Devcontainer Smoke

> Run after Dockerfile, devcontainer.json, or frontend dev script changes.

- [ ] Rebuild container (normal rebuild sufficient if only postCreate changed)
- [ ] `node --version` ≥ 24 inside container
- [ ] postCreate completes without `EBADENGINE`
- [ ] Backend Air starts; `/health` 200
- [ ] Frontend task starts on :3000 without manual kill
- [ ] HMR: edit a route file — browser updates without full reload failure
- [ ] Rebuild container again — frontend restarts (stale process guard)

**Result:** PASS / FAIL — date — tester — notes
