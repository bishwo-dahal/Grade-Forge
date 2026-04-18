#!/usr/bin/env bash
# Build the manual, start VitePress preview, capture /docs/* PNGs from localhost:5173.
# App pages (/, /signin, /signup) still use SCREENSHOT_APP_BASE_URL or SCREENSHOT_BASE_URL
# from your environment or docs-site/.env.screenshots (for example local Vite on 5173).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run docs:build
npm run docs:preview -- --host 127.0.0.1 --port 5173 &
PREVIEW_PID=$!
cleanup() { kill "$PREVIEW_PID" 2>/dev/null || true; }
trap cleanup EXIT
for _ in $(seq 1 30); do
  if curl -sf -o /dev/null "http://127.0.0.1:5173/docs/"; then
    break
  fi
  sleep 1
done
export SCREENSHOT_DOCS_BASE_URL="http://127.0.0.1:5173"
node scripts/capture-manual-screenshots.mjs
