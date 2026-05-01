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
# with a populated disk are safe.
#
# JWT_SECRET is required; Render's render.yaml sets it via generateValue.
# Locally, pass it via -e or --env-file.
CMD ["sh", "-c", "npm run demo:seed && npx tsx src/server.ts"]
