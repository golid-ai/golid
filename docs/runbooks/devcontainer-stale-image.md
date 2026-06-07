# Runbook: Devcontainer Stale Image

## Symptoms

- `npm warn EBADENGINE` — package requires Node `>=24`, container has Node 20.x
- Backend starts fine but frontend tooling behaves oddly
- Dockerfile was updated but rebuild still shows `CACHED` for the Node install layer

## Diagnosis

Inside the devcontainer:

```bash
node --version   # expect v24.x
```

If Node is below 24, the image predates the Node 24 Dockerfile change.

## Fix

1. **Rebuild without cache:** Command Palette → *Dev Containers: Rebuild Container Without Cache*
2. Or from the host:

```bash
docker compose -f docker-compose.yml -f .devcontainer/docker-compose.yml build --no-cache backend
```

Then reopen the container.

## Prevention

- `postCreateCommand` fails fast when Node &lt; 24 (see `.devcontainer/devcontainer.json`).
- After pulling devcontainer changes, rebuild once without cache.
- Document in PR body when `Dockerfile` Node or Go version bumps.

## Not this issue

- `npm warn deprecated` — transitive dependency noise; not a startup blocker.
- Backend `/health` 200 with npm warnings — backend is fine; fix Node for frontend.
