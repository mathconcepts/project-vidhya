# Deploying the Vidhya demo

> **Goal:** one live URL where all three exams (BITSAT, JEE Main, UGEE)
> are immediately usable, and the full AI tutor / chat / Snap / explainer
> pipeline lights up as soon as any BYOK LLM key is provided.
>
> **Target:** Render (free tier). Render is what this repo's deployment
> config targets natively; Fly.io works too via the same Dockerfile.
>
> **Hybrid Netlify option:** If you want the frontend on Netlify (CDN,
> branch previews, instant deploys) and the backend on Render, see
> [`DEPLOY-NETLIFY.md`](./DEPLOY-NETLIFY.md). Netlify cannot host the
> backend alone — it's a long-running Node server with flat-file
> persistence and MCP stdio runners — but the hybrid pattern works
> well and is fully supported.

This doc is the authoritative path from *"clone the repo"* to *"live
demo URL you can share"*. Three clicks after signing into Render.

> **Live demo URL:** _none yet — operator action required._
>
> Once someone clicks the Deploy button below, run `bash scripts/update-readme-url.sh https://your-service.onrender.com` to fill this line in across the README and DEPLOY docs in one command.
>
> Once someone clicks the Deploy button below, run `bash scripts/update-readme-url.sh https://your-service.onrender.com` to fill this line in across the README and DEPLOY docs in one command.

---

## Three-click checklist (operator-facing)

For the maintainer or any operator who wants to produce the live URL right now:

1. **Sign into Render** (free account at https://render.com — Google sign-in works)
2. **Click the Deploy button** in [README.md](./README.md#-render--one-click-public-url) — this opens `https://render.com/deploy?repo=https://github.com/mathconcepts/project-vidhya`
3. **Apply the Blueprint** — Render reads `render.yaml`, provisions everything, ~3 minutes later you have a URL
4. **Verify** with `curl https://your-service.onrender.com/health`
5. **Update the docs** — `bash scripts/update-readme-url.sh https://your-service.onrender.com` and commit

That's the entire happy path. The remaining sections below explain what each step does in detail.

---

## The three-click deploy

### 1. Click the button (in the README)

```
[ ▶ Deploy to Render ]
```

This opens `https://render.com/deploy?repo=https://github.com/mathconcepts/project-vidhya`.
Render prompts for sign-in (free account, Google sign-in is fine),
then presents a Blueprint deploy form.

### 2. Approve the Blueprint

Render reads [`render.yaml`](./render.yaml) from the repo root and
shows:

- One **web service** named `vidhya-demo` (Docker runtime, uses
  `demo/Dockerfile`)
- One **1 GB persistent disk** named `vidhya-demo-data`, mounted at
  `/app/.data`
- Auto-generated `JWT_SECRET` (Render picks a random 32-char string)
- A list of optional env vars (all LLM / Wolfram / channel keys)
  marked for the operator to fill in

Click **Apply**.

### 3. Wait ~3 minutes

Render does the following:

1. Clones the repo
2. Runs the Dockerfile — stage 1 builds the frontend, stage 2 bundles
   the runtime
3. Mounts the persistent disk
4. Starts the container, which runs `npm run demo:seed && npx tsx
   src/gate-server.ts`
5. The seed creates 6 demo users (Nisha, Arjun, Kavita, Priya, Rahul,
   Aditya), issues their JWTs, writes `/demo.html` and `/demo-api-keys.html`
   into `frontend/dist/`
6. The server binds to port 8080 (Render proxies to 443 externally)
7. Health check at `/health` flips green

Your live URL is `https://vidhya-demo-<suffix>.onrender.com`. Share it.

---

## What works immediately (no keys required)

Visit `https://<your-url>/demo.html` and click any of six role cards.
Every one of these works without a single API key:

- Planning a session (any duration, any role)
- Browsing saved templates
- Reading the trailing-stats badge compounding in real time
- Viewing the multi-exam planner (Priya has BITSAT + JEE Main registered)
- Owner dashboard → admin views → teacher roster
- Admin lifecycle reports (`/api/admin/lifecycle/funnel` +
  `/api/admin/lifecycle/retention`)
- Account deletion + data export (`/api/me/delete*`, `/api/me/export`)
- Demo → paid conversion (`/gate/convert-demo`)

This is the **baseline demo**. Students can experience the planner,
the compounding badge, the strategy surface, and the calm UI entirely
without any LLM provider.

---

## Unlocking the AI tutor — paste one BYOK key

To enable chat, Snap solve, explainer generation, concept walkthroughs:

1. Go to your Render service dashboard → **Environment** tab
2. Add **one** of these:
   - `GEMINI_API_KEY` — from [aistudio.google.com](https://aistudio.google.com/apikey). Free tier.
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com). Paid.
   - `OPENAI_API_KEY` — from [platform.openai.com](https://platform.openai.com/api-keys). Paid.
3. Add `VIDHYA_LLM_PRIMARY_PROVIDER` with value matching: `gemini`,
   `anthropic`, or `openai`
4. Click **Save** — Render redeploys (30 seconds). Your chat / Snap /
   lessons now work end-to-end.

You can add all three if you want fallback. The router prefers the
one named in `VIDHYA_LLM_PRIMARY_PROVIDER` and falls back to
whichever others are present.

---

## Optional extras

| Feature | Env var(s) | Where to get |
|---|---|---|
| Maths verification (Wolfram) | `WOLFRAM_APP_ID` | [wolframalpha.com/developers](https://products.wolframalpha.com/api) free tier |
| Telegram bot | `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) in Telegram |
| WhatsApp messaging | `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_VERIFY_TOKEN` | Meta for Developers |
| Public-facing URL (for channel webhooks) | `PUBLIC_URL` | your `.onrender.com` URL, paste it back |

Render lets you set these per-service via the Environment tab. Every
paste triggers a redeploy (~30 s).

---

## Verifying the deployment

Once live, the following curl commands confirm everything works. Replace
`<YOUR-URL>` with your Render URL (e.g. `vidhya-demo-abc123.onrender.com`).

```bash
# Health check — returns {"status":"ok", ...}
curl https://<YOUR-URL>/health

# Three exam adapters loaded — returns count: 3
# (Requires an admin token; sign in as Nisha or Arjun on /demo.html,
#  grab the JWT from browser localStorage, paste below.)
curl -H "Authorization: Bearer <ADMIN-JWT>" \
     https://<YOUR-URL>/api/admin/exam-builder/adapters | jq '.count'

# Demo landing page — returns HTML
curl https://<YOUR-URL>/demo.html | head -5

# Frontend index — returns HTML
curl https://<YOUR-URL>/
```

If all four return as expected, the deployment is confirmed healthy.

---

## What happens on restarts

Render occasionally recycles free-tier instances (once every 15 min of
idle on free, never on starter+). Important behaviour:

- **Persistent disk survives** — your `.data/` flat-file stores stay
  intact across restarts
- **Seed is idempotent** — `upsertFromGoogle` updates existing users
  by google_sub rather than duplicating. Restarts don't multiply the
  demo users.
- **JWT_SECRET survives** — Render sticks with the secret it generated
  on first deploy. Demo JWTs minted by the first seed remain valid.
- **Render's free tier sleeps after 15 min idle** — first request after
  sleep cold-starts in ~30 s. This is a free-tier limitation, not a
  product limitation. Upgrade to starter ($7/mo) to eliminate cold starts.

---

## Deploying elsewhere

### Fly.io

Same Dockerfile works. `fly launch` → it autodetects the Dockerfile,
asks about volumes (say yes, mount at `/app/.data`). Set `JWT_SECRET`
via `fly secrets set JWT_SECRET=$(openssl rand -hex 16)`. Done.

### Docker Hub + any container host

```bash
docker build -f demo/Dockerfile -t your-registry/vidhya-demo .
docker push your-registry/vidhya-demo
```

Then on your host:

```bash
docker run -d \
  -p 8080:8080 \
  -e JWT_SECRET=$(openssl rand -hex 16) \
  -e VIDHYA_LLM_PRIMARY_PROVIDER=gemini \
  -e GEMINI_API_KEY=... \
  -v vidhya-data:/app/.data \
  your-registry/vidhya-demo
```

### Netlify — NOT supported

Netlify hosts static sites + serverless functions. Vidhya's backend
is a long-running Node server with MCP stdio runners and flat-file
persistence. A Netlify port would mean rewriting the server as
individual Lambda-style functions, losing the MCP runner and the
stdio-based agent execution. **Use Render or Fly instead.**

---

## Troubleshooting

### The deploy fails on `npm ci --omit=dev`

Check the Render build logs — it's almost always a lockfile mismatch
because you have `package-lock.json` modifications uncommitted. Fix:
`rm package-lock.json && npm install && git commit && push` → Render
rebuilds.

### Healthcheck fails / service keeps restarting

Check logs for `JWT_SECRET must be at least 16 characters`. Render
auto-generates it, but if you accidentally overwrote it with a shorter
string, the server refuses to boot. Delete the env var; Render regenerates.

### The demo cards don't appear on `/demo.html`

The seed ran but `demo-tokens.json` wasn't written. Check `/app/demo/`
has write access. Shouldn't happen on Render by default, but on some
hosts you may need to chmod the demo dir.

### LLM calls return 503

Your `VIDHYA_LLM_PRIMARY_PROVIDER` points at a provider whose key
isn't set, OR the key is invalid. Check Environment tab; redeploy
after fixing.

---

## Why Render, not Netlify, one more time

| Property | Vidhya needs | Render | Netlify |
|---|---|---|---|
| Long-running Node server | ✓ | ✓ | ✗ (serverless only) |
| MCP stdio runners | ✓ | ✓ | ✗ |
| Flat-file persistent disk | ✓ | ✓ (disks) | ✗ (stateless functions) |
| Dockerfile support | ✓ | ✓ | ✗ (only "build hooks") |
| Free tier | nice-to-have | ✓ | ✓ |

Netlify for a static front-end of Vidhya's SEO pages is possible but
pointless — the backend has to live somewhere else, and once the
backend is somewhere that serves Node, that somewhere can serve the
frontend too. One-service wins.
