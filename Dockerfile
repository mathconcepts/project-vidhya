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
COPY --from=builder /app/data ./data
COPY --from=builder /app/demo ./demo
COPY --from=builder /app/config ./config

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-8080}/health || exit 1

EXPOSE ${PORT:-8080}
ENV NODE_ENV=production

CMD ["npx", "tsx", "src/server.ts"]
