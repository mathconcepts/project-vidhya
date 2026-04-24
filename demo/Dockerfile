# demo/Dockerfile — self-contained Vidhya multi-role demo image.
#
# Build:  docker build -f demo/Dockerfile -t vidhya-demo .
# Run:    docker run -p 8080:8080 \
#           -e JWT_SECRET=demo-secret-for-local-testing-only-min-16ch \
#           -v vidhya-demo-data:/app/.data \
#           vidhya-demo
#
# Visit:  http://localhost:8080/demo.html

FROM node:20-slim

WORKDIR /app

# --- backend deps ---------------------------------------------------
COPY package*.json ./
RUN npm ci --omit=dev || npm ci

# --- frontend deps --------------------------------------------------
COPY frontend/package*.json frontend/
RUN cd frontend && (npm ci --omit=dev || npm ci)

# --- source ---------------------------------------------------------
COPY . .

# --- frontend build -------------------------------------------------
# Gate-server will serve frontend/dist statically on every non-API path.
RUN cd frontend && npm run build

# --- runtime --------------------------------------------------------
EXPOSE 8080

# Volume for the flat-file stores. Mount a docker volume here to
# persist users + plans + templates across container restarts.
VOLUME ["/app/.data"]

# Seed-then-serve. JWT_SECRET must be supplied via -e or --env-file.
# Set to something like a 32-character random string in production demos.
ENV NODE_ENV=production
ENV PORT=8080

CMD ["sh", "-c", "npm run demo:seed && tsx src/gate-server.ts"]
