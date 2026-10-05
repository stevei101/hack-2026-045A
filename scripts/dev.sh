#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PORT="${PORT:-43211}"
export FRONTEND_DIST="${FRONTEND_DIST:-frontend/dist}"
if [[ ! -f "$FRONTEND_DIST/index.html" ]]; then
  bun install --cwd frontend
  bun run --cwd frontend build
fi
exec python3 -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port "$PORT"
