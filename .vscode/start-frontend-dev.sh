#!/usr/bin/env bash
# Started by VS Code/Cursor "Frontend Dev Server" task on devcontainer folderOpen.
set -euo pipefail

ROOT="${WORKSPACE_FOLDER:-/workspace}"
FRONTEND="${ROOT}/frontend"

echo "Waiting for npm install..."
while [ ! -f "${FRONTEND}/.npm-ready" ]; do
  sleep 2
done

echo "Waiting for backend (port 8080)..."
while ! curl -sf http://localhost:8080/health >/dev/null 2>&1; do
  sleep 2
done

if pgrep -f 'vinxi dev' >/dev/null 2>&1; then
  echo "Stopping stale frontend from prior devcontainer session..."
  pkill -f 'dev-watch.mjs' 2>/dev/null || true
  pkill -f 'vinxi dev' 2>/dev/null || true
  sleep 2
fi

echo "Backend ready, starting frontend with restart guard..."
cd "${FRONTEND}"
export PORT=3000
export VITE_SSE_URL=http://localhost:8080
exec npm run dev:watch -- --host
