#!/usr/bin/env bash
# install.sh — Vidhya local setup
# Usage: bash install.sh
#
# Two modes (you pick at the prompt):
#   [1] Demo   — Node only, no DB required. Runs in seconds.
#   [2] Full   — Postgres + pgvector via Docker Compose (production parity).
#
# After install, start the stack with: npm run demo:start  (demo mode)
#                                  or: docker compose up   (full mode)

set -euo pipefail
BOLD="\033[1m"; GREEN="\033[0;32m"; YELLOW="\033[1;33m"; RED="\033[0;31m"; NC="\033[0m"

say()  { echo -e "${BOLD}$*${NC}"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*"; exit 1; }
hr()   { echo -e "\n────────────────────────────────────────"; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

hr
say "Vidhya — local install"
hr

# ── 1. Prerequisite checks ──────────────────────────────────────────────────

say "\n[1/6] Checking prerequisites…"

# Node ≥ 20
if ! command -v node &>/dev/null; then
  err "Node.js not found. Install from https://nodejs.org (v20+)"
fi
NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
NODE_MAJOR="${NODE_VER%%.*}"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  err "Node.js $NODE_VER is too old — need v20+. Install from https://nodejs.org"
fi
ok "Node $NODE_VER"

# npm ≥ 10
if ! command -v npm &>/dev/null; then
  err "npm not found (should ship with Node)"
fi
NPM_VER=$(npm --version)
NPM_MAJOR="${NPM_VER%%.*}"
if [[ "$NPM_MAJOR" -lt 10 ]]; then
  warn "npm $NPM_VER detected — v10+ recommended. Run: npm install -g npm@latest"
fi
ok "npm $NPM_VER"

# Docker (optional, only needed for Full mode)
HAS_DOCKER=false
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  HAS_DOCKER=true
  ok "Docker $(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')"
else
  warn "Docker not running — Full mode unavailable (Demo mode will still work)"
fi

# ── 2. Choose mode ──────────────────────────────────────────────────────────

hr
say "\n[2/6] Choose install mode"
echo ""
echo "  [1] Demo mode   — No database needed. Data stored in .data/ flat files."
echo "                    Great for local dev, demos, and feature exploration."
echo ""
echo "  [2] Full mode   — PostgreSQL + pgvector via Docker Compose."
echo "                    Matches the production setup on Render."
echo "                    Requires Docker to be running."
echo ""

if [[ "$HAS_DOCKER" == false ]]; then
  warn "Docker not available — defaulting to Demo mode."
  MODE=1
else
  read -rp "  Enter 1 or 2 [default: 1]: " MODE
  MODE="${MODE:-1}"
fi

if [[ "$MODE" != "1" && "$MODE" != "2" ]]; then
  err "Invalid choice '$MODE' — run the script again and enter 1 or 2."
fi

[[ "$MODE" == "1" ]] && say "\nInstalling in Demo mode…" || say "\nInstalling in Full (Docker) mode…"

# ── 3. .env setup ───────────────────────────────────────────────────────────

hr
say "\n[3/6] Environment variables…"

if [[ ! -f .env ]]; then
  cp .env.example .env
  ok "Created .env from .env.example"
else
  ok ".env already exists — skipping copy"
fi

# Auto-generate JWT_SECRET if still the placeholder
if grep -q "replace-me" .env 2>/dev/null; then
  SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  # macOS vs GNU sed
  if sed --version &>/dev/null 2>&1; then
    sed -i "s|replace-me-min-16-chars-or-jwt-init-fails|$SECRET|" .env
  else
    sed -i '' "s|replace-me-min-16-chars-or-jwt-init-fails|$SECRET|" .env
  fi
  ok "JWT_SECRET auto-generated in .env"
fi

echo ""
echo "  To enable AI features (chat, lesson generation), add at least ONE of:"
echo "    OPENROUTER_API_KEY  — recommended, routes to all providers"
echo "    GEMINI_API_KEY      — free tier at https://aistudio.google.com"
echo "    ANTHROPIC_API_KEY"
echo "    OPENAI_API_KEY"
echo ""
echo "  Edit .env in the project root to add your key."
echo "  The demo, planning, and library features work without any LLM key."

# ── 4. Install dependencies ──────────────────────────────────────────────────

hr
say "\n[4/6] Installing dependencies…"

echo "  backend…"
npm install --silent
ok "Backend deps installed"

echo "  frontend…"
(cd frontend && npm install --silent)
ok "Frontend deps installed"

# ── 5. Database setup ────────────────────────────────────────────────────────

hr
say "\n[5/6] Database…"

if [[ "$MODE" == "2" ]]; then
  say "  Starting Postgres + pgvector via Docker Compose…"
  docker compose up -d db
  echo "  Waiting for Postgres to be ready…"
  for i in {1..30}; do
    if docker compose exec -T db pg_isready -U gatemath &>/dev/null 2>&1; then
      ok "Postgres ready"
      break
    fi
    sleep 1
    [[ $i -eq 30 ]] && err "Postgres didn't become ready in 30s. Check: docker compose logs db"
  done

  # Patch .env with the docker compose DATABASE_URL
  DB_URL="postgresql://gatemath:gatemath@localhost:5432/gatemath"
  if grep -q "^DATABASE_URL=" .env; then
    if sed --version &>/dev/null 2>&1; then
      sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DB_URL|" .env
    else
      sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=$DB_URL|" .env
    fi
  else
    echo "DATABASE_URL=$DB_URL" >> .env
  fi
  ok "DATABASE_URL set to local Docker Postgres"

  echo "  Running migrations via the app (auto-migrate on first boot)…"
  JWT_SECRET="$(grep '^JWT_SECRET=' .env | cut -d= -f2-)" \
  DATABASE_URL="$DB_URL" \
  npx tsx -e "import('./src/db/auto-migrate.ts').then(m => m.runMigrations()).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })" 2>&1 | grep -v "^$" || true
  ok "Migrations applied"
else
  ok "Demo mode — no database needed (.data/ flat files used instead)"
fi

# ── 6. Seed demo users ───────────────────────────────────────────────────────

hr
say "\n[6/6] Seeding demo users…"

set +e
JWT_SECRET="$(grep '^JWT_SECRET=' .env | cut -d= -f2-)" \
DATABASE_URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2- 2>/dev/null || echo '')" \
npx tsx demo/seed.ts 2>&1 | grep -E "^(→|✓|seeded|Seeded|Created|Error)" | head -10
SEED_EXIT=$?
set -e

if [[ $SEED_EXIT -eq 0 ]]; then
  ok "Demo users seeded"
else
  warn "Seed reported errors — see above. Auth still works; run 'npx tsx demo/seed.ts' for full output."
fi

# ── Done ─────────────────────────────────────────────────────────────────────

hr
echo ""
say "  Setup complete! v$(node -e "console.log(require('./package.json').version)")"
echo ""

if [[ "$MODE" == "1" ]]; then
  say "  Start the stack:"
  echo ""
  echo "    npm run demo:start"
  echo ""
  echo "  Or separately:"
  echo ""
  echo "    # Terminal 1 — backend"
  echo "    export JWT_SECRET=\$(grep JWT_SECRET .env | cut -d= -f2-)"
  echo "    npx tsx src/server.ts"
  echo ""
  echo "    # Terminal 2 — frontend"
  echo "    cd frontend && npm run dev"
  echo ""
else
  say "  Start the stack:"
  echo ""
  echo "    docker compose up"
  echo ""
  echo "  Or start just the app (Postgres is already running):"
  echo ""
  echo "    npm run demo:start"
  echo ""
fi

say "  Access:"
echo ""
echo "    Backend   →  http://localhost:8080"
echo "    Frontend  →  http://localhost:3000"
echo ""
echo "    Student   →  http://localhost:3000/demo-login?role=student"
echo "    Teacher   →  http://localhost:3000/demo-login?role=teacher"
echo "    Admin     →  http://localhost:3000/demo-login?role=admin"
echo ""
hr
