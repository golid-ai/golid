# Manual QA — Devcontainer Smoke

> Run after Dockerfile, devcontainer.json, or frontend dev script changes.

- [ ] Rebuild container (normal rebuild sufficient if only postCreate changed)
- [ ] `node --version` ≥ 24 inside container
- [ ] postCreate completes without `EBADENGINE`
- [ ] Backend Air starts; `curl -sf http://localhost:8080/health` and `curl -sf http://localhost:8080/ready` return 200
- [ ] Frontend task starts on :3000 without manual kill
- [ ] HMR: edit a route file — browser updates without full reload failure
- [ ] SSE reconnect: stop backend briefly, restart — dashboard SSE reconnects within ~30s (repeat once)
- [ ] Rebuild container again — frontend restarts (stale process guard)

**Result:** PASS / FAIL — date — tester — notes
