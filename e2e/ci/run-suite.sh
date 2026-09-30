#!/usr/bin/env bash
#
# CI suite runner — executed INSIDE `firebase emulators:exec`, so the emulator
# suite is already up and torn down afterwards.
#
# Steps: clean+seed (deterministic) -> data tests -> build+serve web -> Playwright.
# Fails fast on any non-zero exit.
set -euo pipefail

echo "==> Clean + seed emulator (deterministic dataset)"
node bin/data/clean.js || true
node bin/data/seed.js

echo "==> Data-layer tests"
./node_modules/.bin/tsx --test e2e/data/*.test.ts

echo "==> Building the web app (emulator env already copied to .env)"
npx expo export -p web --output-dir dist-e2e >/dev/null

echo "==> Serving the web build on :8082"
npx --yes serve -s dist-e2e -l 8082 >/tmp/web-server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

echo "==> Waiting for the web server"
for i in $(seq 1 60); do
  if curl -sf http://localhost:8082 >/dev/null 2>&1; then echo "web up"; break; fi
  sleep 2
  if [ "$i" -eq 60 ]; then echo "web server did not start"; cat /tmp/web-server.log; exit 1; fi
done

echo "==> Playwright web specs"
E2E_BASE_URL="http://localhost:8082" npx playwright test -c e2e/playwright.config.ts

echo "==> Suite complete"
