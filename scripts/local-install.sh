#!/usr/bin/env bash
#
# scripts/local-install.sh
#
# One-shot local setup + start for Vidhya.
#
# Usage:
#   bash scripts/local-install.sh
#
# What it does:
#   1. Installs backend dependencies  (npm install)
#   2. Installs frontend dependencies (cd frontend && npm install)
#   3. Seeds demo users + tokens      (npm run demo:seed)
#   4. Starts backend  on :8080
#   5. Starts frontend on :3000
#   6. Opens the app in your browser (if 'open' or 'xdg-open' is available)
#
# Stop: Ctrl-C  (kills both servers cleanly)
#
# Optional env overrides:
#   JWT_SECRET   — defaults to the shared demo secret; fine for local dev
#   PORT         — backend port (default 8080)
#   VITE_PORT    — frontend port (default 3000)

set -euo pipefail

BACKEND_PORT="${PORT:-8080}"
FRONTEND_PORT="${VITE_PORT:-3000}"
export JWT_SECRET="${JWT_SECRET:-demo-secret-for-local-testing-only-min-16ch}"

# ── colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RESET='\033[0m'

step()  { echo -e "\n${CYAN}▶ $*${RESET}"; }
ok()    { echo -e "${GREEN}✓ $*${RESET}"; }
warn()  { echo -e "${YELLOW}⚠ $*${RESET}"; }

# ── cleanup on exit ───────────────────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Stopping servers..."
  [ -n "$BACKEND_PID"  ] && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM EXIT

# ── require node ─────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "Node.js not found. Install it from https://nodejs.org (v18+) and re-run."
  exit 1
fi

# ── step 1: backend deps ─────────────────────────────────────────────────────
step "Installing backend dependencies..."
npm install --prefer-offline --no-fund --no-audit 2>&1 | tail -3
ok "Backend deps ready."

# ── step 2: frontend deps ─────────────────────────────────────────────────────
step "Installing frontend dependencies..."
( cd frontend && npm install --prefer-offline --no-fund --no-audit 2>&1 | tail -3 )
ok "Frontend deps ready."

# ── step 3: seed demo users ───────────────────────────────────────────────────
step "Seeding demo users (admin / teacher / student)..."
npx tsx demo/seed.ts
ok "Demo users seeded."

# ── step 4: start backend ─────────────────────────────────────────────────────
step "Starting backend on :${BACKEND_PORT}..."
npx tsx watch src/server.ts > /tmp/vidhya-backend.log 2>&1 &
BACKEND_PID=$!

# wait up to 15 s for backend
for i in $(seq 1 30); do
  if curl -sf "http://localhost:${BACKEND_PORT}/health" &>/dev/null; then
    ok "Backend ready  →  http://localhost:${BACKEND_PORT}"
    break
  fi
  sleep 0.5
done

if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  warn "Backend failed to start. Check /tmp/vidhya-backend.log"
  cat /tmp/vidhya-backend.log | tail -20
  exit 1
fi

# ── step 5: start frontend ────────────────────────────────────────────────────
step "Starting frontend on :${FRONTEND_PORT}..."
( cd frontend && npx vite --port "${FRONTEND_PORT}" > /tmp/vidhya-frontend.log 2>&1 ) &
FRONTEND_PID=$!

# wait up to 15 s for frontend
for i in $(seq 1 30); do
  if curl -sf "http://localhost:${FRONTEND_PORT}" &>/dev/null; then
    ok "Frontend ready →  http://localhost:${FRONTEND_PORT}"
    break
  fi
  sleep 0.5
done

# ── step 6: open browser ──────────────────────────────────────────────────────
APP_URL="http://localhost:${FRONTEND_PORT}/?demo"
if command -v open &>/dev/null; then          # macOS
  open "$APP_URL"
elif command -v xdg-open &>/dev/null; then    # Linux
  xdg-open "$APP_URL" &>/dev/null &
fi

# ── ready banner ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}================================================================${RESET}"
echo -e "${GREEN}  Vidhya is running${RESET}"
echo -e "${GREEN}================================================================${RESET}"
echo ""
echo -e "  App      →  ${CYAN}http://localhost:${FRONTEND_PORT}/?demo${RESET}"
echo -e "  API      →  ${CYAN}http://localhost:${BACKEND_PORT}${RESET}"
echo -e "  Admin    →  ${CYAN}http://localhost:${FRONTEND_PORT}/admin${RESET}"
echo ""
echo "  Sign in with one click: Admin / Teacher / Student buttons on the login page"
echo ""
echo "  Backend log:  /tmp/vidhya-backend.log"
echo "  Frontend log: /tmp/vidhya-frontend.log"
echo ""
echo -e "${YELLOW}  Ctrl-C to stop both servers.${RESET}"
echo ""

# ── keep alive ────────────────────────────────────────────────────────────────
while kill -0 "$BACKEND_PID" 2>/dev/null || kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 2
done
