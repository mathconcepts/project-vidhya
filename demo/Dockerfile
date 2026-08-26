# demo/Dockerfile — self-contained Vidhya multi-role demo image.
#
# Two-stage: build frontend in stage 1, ship only what's needed in stage 2.
# Stage 2 runs tsx directly — no TypeScript build step for backend (tsx
# transpiles at startup, which keeps Dockerfile simple and startup fast
# enough for a demo).
#
# Build:  docker build -f demo/Dockerfile -t vidhya-demo .
# Run:    docker run -p 8080:8080 \
#           -e JWT_SECRET=demo-secret-for-local-testing-only-min-16ch \
#           -v vidhya-demo-data:/app/.data \
#           vidhya-demo
# Visit:  http://localhost:8080/demo.html
#
# On Render:  use render.yaml; uses this Dockerfile automatically.

# ─── Stage 1 — build frontend ────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /build

# Install backend deps (needed because some shared types live in src/)
COPY package*.json ./
RUN npm ci

# Install frontend deps + build
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci

COPY frontend/ frontend/
COPY src/ src/
COPY tsconfig*.json ./
# scripts/ + data/ — needed to regenerate the DB-less static bundles below
# (export-bundles.ts reads data/curriculum/gate-ma.yml via concept-graph.ts
# and writes frontend/public/data/*.json, which Vite then copies into
# frontend/dist/data/ as part of its normal public/ → dist/ copy).
COPY scripts/ scripts/
COPY data/ data/

# Regenerate the DB-less static bundles from the current code/YAML BEFORE
# the frontend build, so the deployed demo ships a fresh client concept
# graph instead of whatever was last committed to frontend/public/data/.
# Must run from /build (this stage's WORKDIR) — export-bundles.ts's
# OUT_DIR is process.cwd()-relative (frontend/public/data).
RUN npx tsx scripts/export-bundles.ts

RUN cd frontend && npm run build


# ─── Stage 2 — runtime ───────────────────────────────────────────────
FROM node:20-slim AS runtime

WORKDIR /app

# Install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src/ src/
COPY demo/ demo/
# Curriculum YAMLs (gate-ma.yml etc.) — read at runtime by exam-loader.
# Without this, getConceptsInExam('gate-ma') returns empty and Studymate /
# session-engine fail with "No concepts found for exam 'gate-ma'".
COPY data/ data/
# Atom-based content modules (ContentAtom v2 lessons) and seed concepts.
COPY modules/ modules/
# The orchestrator module registry, read from process.cwd()/modules.yaml by
# src/orchestrator/registry.ts. NOT the same thing as the modules/ directory
# above — that is content, this is the registry that names every module and
# its health probe. Without it loadRegistry() throws
# "modules.yaml not found — orchestrator cannot boot without it", which the
# scheduler's healthScan hit every five minutes in every deploy.
COPY modules.yaml ./
# Runtime config read from process.cwd()/config. demo-rails.json is the whole
# journey deck: src/api/demo-routes.ts reads it on every GET /api/demo/rails.
# Without it the endpoint answers 503 "demo rails config is not available on
# this instance", so the walkthrough is empty even with DEMO_MODE_ENABLED set —
# which is exactly how it shipped: the flag and the file were both missing, and
# fixing only one of them would still have produced an empty deck.
COPY config/ config/
# SQL migrations — read at boot by src/db/auto-migrate.ts (server.ts calls
# it before serving traffic, gated on DATABASE_URL being set). Without this,
# autoMigrate() finds no supabase/migrations directory and silently skips,
# so pyq_questions/generated_problems/etc. never get created even once a
# real DATABASE_URL is configured.
COPY supabase/ supabase/
# Supabase's public root CA. NODE_EXTRA_CA_CERTS (render.yaml) points here so
# `sslmode=require` can verify the pooler's certificate instead of failing
# with "self-signed certificate in certificate chain". See certs/README.md.
COPY certs/ certs/
COPY --from=frontend-builder /build/frontend/dist frontend/dist
COPY tsconfig*.json ./

# Ensure .data exists (Render mounts a disk here; local runs need it too)
RUN mkdir -p /app/.data && chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
VOLUME ["/app/.data"]

# Seed-then-serve. demo:seed is idempotent (upsertFromGoogle updates
# existing users by google_sub rather than duplicating), so restarts
# with a populated disk are safe. demo:seed-history (T20) writes Elo/
# FSRS/XP persona history onto the demo accounts demo:seed just created —
# it applies its own migrations first (needs Postgres tables the server's
# boot-time autoMigrate() hasn't created yet at this point in the chain)
# and degrades to an honest no-op skip when DATABASE_URL isn't set, so it
# never aborts this chain on a DB-less deploy.
#
# JWT_SECRET is required; Render's render.yaml sets it via generateValue.
# Locally, pass it via -e or --env-file.
# Serve, and seed alongside. The seeds run in a background subshell and the
# server is exec'd immediately, so the port binds in seconds.
#
# They used to run ahead of the server, first chained with `&&` (one failing
# seed then killed the container) and then with `;`. Both put the port behind
# them. That is survivable while seeding is fast and fatal once it is not: with
# a real database attached, demo:seed-history writes thousands of rows one
# round trip at a time, and against a database in another region that is many
# minutes. The platform scanned for an open port, found none, marked the deploy
# failed, and kept serving the previous instance — which is what made corrected
# environment variables look like they were being ignored.
#
# Seeding is a nice-to-have; serving is not. A demo whose sample history fills
# in over the first minute is fine. A demo that never binds a port is nothing.
# Each seed keeps its own failure notice so a skip stays visible in the logs.
CMD ["sh", "-c", "{ npm run demo:seed || echo '[boot] demo:seed failed — continuing without fresh demo accounts'; npm run demo:seed-media || echo '[boot] demo:seed-media failed — continuing without rendered media'; npm run demo:seed-history || echo '[boot] demo:seed-history failed — continuing without persona history'; } & exec npx tsx src/server.ts"]
