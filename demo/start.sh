#!/usr/bin/env bash
#
# demo/start.sh -- boot backend + frontend with the demo JWT secret set.
#
# The seed script uses the same JWT_SECRET default. If the backend isn't
# started with a matching secret, the seeded token is rejected as invalid.
#
# Prerequisite: `npm run demo:seed` has been run at least once.
#
# Stop: Ctrl-C (kills both processes via the trap below)

set -euo pipefail

# Match the JWT_SECRET used in demo/seed.ts.
export JWT_SECRET="${JWT_SECRET:-demo-secret-for-local-testing-only-min-16ch}"

# Clean up child processes on exit.
cleanup() {
  echo ""
  echo "Stopping demo servers..."
  if [ -n "${BACKEND_PID:-}" ];  then kill "$BACKEND_PID"  2>/dev/null || true; fi
  if [ -n "${FRONTEND_PID:-}" ]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
  wait 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM EXIT

# Check the seed has run (seed.ts writes demo/demo-tokens.json).
if [ ! -f demo/demo-tokens.json ]; then
  echo "Demo has not been seeded yet."
  echo "Run:  npm run demo:seed"
  exit 1
fi

# Check the frontend dependencies are installed.
if [ ! -d frontend/node_modules ]; then
  echo "Frontend dependencies not installed."
  echo "Run:  cd frontend && npm install"
  exit 1
fi

echo "================================================================"
echo " Vidhya demo"
echo "================================================================"
echo ""
echo "  Backend:   http://localhost:8080"
echo "  Frontend:  http://localhost:3000"
echo "  Demo:      http://localhost:3000/demo.html"
echo ""
echo "  Ctrl-C to stop both."
echo ""
echo "================================================================"
echo ""

# Start backend in the background.
echo "[backend] starting..."
npx tsx watch src/server.ts > /tmp/vidhya-demo-backend.log 2>&1 &
BACKEND_PID=$!
echo "[backend] pid=$BACKEND_PID -- logs: /tmp/vidhya-demo-backend.log"

# Wait for backend to respond (up to 10 seconds).
for i in $(seq 1 20); do
  if curl -sS -o /dev/null http://localhost:8080/health 2>/dev/null; then
    echo "[backend] ready."
    break
  fi
  sleep 0.5
done

# Start frontend in the background.
echo "[frontend] starting..."
( cd frontend && npx vite > /tmp/vidhya-demo-frontend.log 2>&1 ) &
FRONTEND_PID=$!
echo "[frontend] pid=$FRONTEND_PID -- logs: /tmp/vidhya-demo-frontend.log"

# Wait for frontend (up to 10 seconds).
for i in $(seq 1 20); do
  if curl -sS -o /dev/null http://localhost:3000 2>/dev/null; then
    echo "[frontend] ready."
    break
  fi
  sleep 0.5
done

echo ""
echo "================================================================"
echo "  Ready. Open: http://localhost:3000/demo.html"
echo "================================================================"

# Keep alive until Ctrl-C (compatible with bash 3.2 on macOS).
while kill -0 "$BACKEND_PID" 2>/dev/null || kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 2
done
