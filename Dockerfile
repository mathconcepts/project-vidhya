# ── Project Vidhya — Multi-arch Dockerfile (supports linux/arm64 for M1 Mac) ──
# Usage:
#   docker build -t vidhya .
#   docker run -p 8080:8080 --env-file .env vidhya
#
# M1 Mac: docker compose up --build  (arm64 native via docker-compose.yml)

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app

# Install root dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

# Copy source
COPY . .

# Regenerate the DB-less static bundles (concept-graph.json, pyq-bank.json)
# from the current code/YAML BEFORE the frontend build, so Vite's public/ →
# dist/ copy ships a fresh client concept graph instead of whatever was last
# committed. Must run from /app (repo root) — export-bundles.ts's OUT_DIR is
# process.cwd()-relative (frontend/public/data).
RUN npx tsx scripts/export-bundles.ts

# Build frontend (Vite outputs to frontend/dist/)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN cd frontend && \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    npx vite build

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Copy built frontend + backend source + deps
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/tsconfig.json ./

# Copy migrations + curriculum YAML + config + demo seeder so runtime
# auto-migrator, exam-pack loader, and /demo-login auto-seed work without
# host bind-mounts.
COPY --from=builder /app/supabase ./supabase

# The founder's 116-topic content-generation specification, read at runtime
# by src/content/atomic-topic-spec.ts (which resolves ../../docs/content-spec
# from its own module URL) and served by GET /api/admin/content-spec/*.
# Only this subdirectory, not all of docs/ — the rest is prose for humans and
# has no runtime consumer.
#
# Without it the loader's two readFileSync calls throw, and it is written to
# swallow that: a missing spec file is treated as "no spec available", never
# an error. That is right for a DB-less local run and wrong for a shipped
# image, where the effect was an admin API that answered 200 with an empty
# catalogue and said nothing about why. The feature was dead in every
# deployed image from the day it shipped.
COPY --from=builder /app/docs/content-spec ./docs/content-spec
COPY --from=builder /app/data ./data
COPY --from=builder /app/demo ./demo
COPY --from=builder /app/config ./config

# Pre-authored engineering math atom files (82 concepts × up to 8 atoms).
# Required by atom-responder.ts for LLM-free chat responses.
COPY --from=builder /app/modules ./modules

# The orchestrator module registry, read from process.cwd()/modules.yaml by
# src/orchestrator/registry.ts. NOT the same thing as the modules/ directory
# above — that is content, this is the registry that names every module and
# its health probe. Without it loadRegistry() throws
# "modules.yaml not found — orchestrator cannot boot without it", which the
# scheduler's healthScan hit every five minutes in every deploy.
COPY --from=builder /app/modules.yaml ./modules.yaml

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-8080}/health || exit 1

EXPOSE ${PORT:-8080}
ENV NODE_ENV=production

CMD ["npx", "tsx", "src/server.ts"]
