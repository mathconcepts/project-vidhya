#!/usr/bin/env bash
# dev.sh — single-file local bringup for Vidhya
# Usage: bash dev.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ── deps ────────────────────────────────────────────────────────────────────
echo "→ installing backend deps..."
npm install --silent

echo "→ installing frontend deps..."
(cd frontend && npm install --silent)

# ── JWT secret ──────────────────────────────────────────────────────────────
export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 16)}"

# ── seed demo users (idempotent) ─────────────────────────────────────────────
echo "→ seeding demo users..."
npx tsx demo/seed.ts || { echo ""; echo "  seed.ts failed — run: npx tsx demo/seed.ts for full output"; exit 1; }

# ── launch ──────────────────────────────────────────────────────────────────
echo ""
echo "  backend  → http://localhost:8080"
echo "  frontend → http://localhost:3000"
echo ""
echo "  sign in  → http://localhost:3000/demo-login?role=student"
echo "             http://localhost:3000/demo-login?role=teacher"
echo "             http://localhost:3000/demo-login?role=admin"
echo ""
echo "  Ctrl-C to stop both servers."
echo ""

# run backend + frontend concurrently; kill both on Ctrl-C
trap 'kill 0' INT TERM

npx tsx src/server.ts &
(cd frontend && npm run dev -- --port 3000) &

wait
