# Vidhya demo — hosting

The demo runs locally by default. When you need to share it with
testers, here are four deployment paths in rough ascending order of
effort.

---

## Required env vars (every deployment)

```bash
# Minimum viable demo
JWT_SECRET=<any 32-char string>         # seed + server must match
NODE_ENV=production
PORT=8080                               # backend port

# Optional — only if you want the matching feature
ANTHROPIC_API_KEY=                      # admin LLM tools, AI tutor
GEMINI_API_KEY=                         # primary LLM, vision (Snap)
OPENAI_API_KEY=                         # LLM fallback
WOLFRAM_APP_ID=                         # Wolfram-verified maths
TELEGRAM_BOT_TOKEN=                     # Telegram channel delivery
GOOGLE_OAUTH_CLIENT_ID=                 # Google sign-in (non-demo)
DATABASE_URL=                           # persistent vector store
```

**Set `JWT_SECRET` to the same value before seeding.** Otherwise
the seeded demo tokens will not validate on the running server.
On your deployment host, set the env var first, then run the seed
as a one-shot post-deploy step.

---

## Option 1 — Local only (default)

```bash
npm run demo:setup      # install + seed
npm run demo:start      # boot backend + frontend
# open http://localhost:3000/demo.html
```

Zero hosting. Runs on your laptop. Use for pitches on a single machine
or tethered to a projector. Not reachable by colleagues unless they are
on the same LAN (and then via your machine's LAN IP, not localhost).

---

## Option 2 — Render (easiest PaaS)

1. Fork this repo.
2. Create a Web Service on Render → connect the fork.
3. Build command: `npm ci && cd frontend && npm ci && npm run build`
4. Start command: `npm run demo:seed && node --import tsx src/server.ts`
5. Environment variables (in the Render UI):
   - `JWT_SECRET` — a 32+ char random string
   - `NODE_ENV=production`
   - `PORT=8080`
6. Deploy. First boot will run the seed, mint JWTs, and write the
   landing page. Subsequent boots skip seeding unless you clear
   `.data/` on the Render disk first.
7. Open `https://<your-render-domain>/demo.html`.

Render auto-reloads on every git push.

**Caveat.** Render's default disk is ephemeral — each deploy resets
`.data/`. For a stable demo with surviving data between deploys,
attach a Render persistent disk at `/opt/render/project/src/.data`
(that's the project working directory on Render). On restart, existing
users/plans will survive.

---

## Option 3 — Railway (nice CLI)

```bash
railway init
railway variables set JWT_SECRET=<32-char-random> NODE_ENV=production
railway up                              # deploys from local working tree
railway run npm run demo:seed           # one-shot seed on remote
```

Railway's volumes (the equivalent of Render's disks) persist across
deploys by default. Good for demo longevity. Pricing is usage-based;
a small demo deployment typically runs under $5/month at idle.

---

## Option 4 — Fly.io (the most control)

The bundled `demo/Dockerfile` is Fly-compatible.

```bash
fly launch --no-deploy
fly volumes create vidhya_data --size 1     # 1 GB — .data/ persists
fly deploy --remote-only
fly ssh console -C "cd /app && npm run demo:seed"
```

`fly.toml` should include (inside `[[mounts]]`):

```toml
[[mounts]]
  source = "vidhya_data"
  destination = "/app/.data"
```

---

## The bundled Dockerfile

```dockerfile
# demo/Dockerfile — self-contained multi-role demo image.
FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY frontend/package*.json frontend/
RUN cd frontend && npm ci

COPY . .
RUN cd frontend && npm run build

EXPOSE 8080
# Seed-then-serve entrypoint. JWT_SECRET must be passed in at run time.
CMD ["sh", "-c", "npm run demo:seed && node --import tsx src/server.ts"]
```

```bash
# Build
docker build -f demo/Dockerfile -t vidhya-demo .

# Run — volume-mounts .data so data survives container restarts
docker run -p 8080:8080 \
  -e JWT_SECRET=demo-secret-for-local-testing-only-min-16ch \
  -v vidhya-demo-data:/app/.data \
  vidhya-demo
```

Then browse to `http://localhost:8080/demo.html`.

---

## Frontend + backend on one domain — or two?

On all the hosted options above, **one service serves both**. The
backend (`src/server.ts`) is configured to serve the built
frontend from `frontend/dist` on every non-API path. The vite dev
server on port 3000 is a development-only proxy.

If you want to split — frontend on Vercel, backend on Render —
set `VITE_API_BASE` in the frontend build to point at the backend
domain, and add CORS settings to the backend. This isn't needed for
the demo and adds complexity; stick with single-service unless you
have a reason.

---

## Rotating the demo JWT

Once the demo is live, the minted tokens are valid for 30 days. To
rotate:

```bash
npm run demo:reset
npm run demo:seed
# Restart the backend so it picks up any env changes, if relevant.
```

New tokens replace old ones. Any tester still holding the old token
in their browser will get a 401 and be redirected to `/demo.html`
where they can pick a role again.

---

## Shutting down

- **Render / Railway** — pause the service from the dashboard.
- **Fly** — `fly scale count 0`.
- **Docker** — `docker stop <container-id>`.
- **Local** — Ctrl-C.

No per-user data persists after shutdown (flat files only). No
customer PII ever left the machine you ran this on.
