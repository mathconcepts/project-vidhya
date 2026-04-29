# Deploying the Vidhya demo

> **Goal:** one live URL where all seven exams (BITSAT, JEE Main, UGEE,
> NEET Biology/Physics/Chemistry, GATE) are immediately usable, and the
> full AI tutor / chat / Snap / explainer pipeline lights up as soon as
> any BYOK LLM key is provided.
>
> **Primary target:** Render (free tier). Render is what this repo's
> deployment config targets natively, with the free tier giving you a
> public URL in ~3 minutes. If your Render free-tier quota is
> exhausted, see [If Render's free tier doesn't work for you](#if-renders-free-tier-doesnt-work-for-you)
> below for current always-free alternatives (Oracle Cloud Always
> Free, Google Cloud Run) and paid options under $10/month.
>
> **Fly.io** still works via the same Dockerfile but is no longer
> free for new accounts (Fly.io ended its free tier on
> October 7, 2024). Existing legacy accounts retain their allowances.
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

> **Free tier — ephemeral state:** Render's free tier does not support
> persistent disks. The app's `.data/` directory lives in the container's
> ephemeral filesystem and resets whenever the service restarts or spins
> down after 15 minutes of inactivity. The container CMD runs
> `npm run demo:seed` on every boot, so the 6 demo users are always
> recreated fresh. **For a demo this is fine** — each restart gives a
> clean slate. For persistent state (real sign-ups accumulate over time,
> teaching turns survive restarts), upgrade to the Starter plan ($7/month)
> and add a disk block back to `render.yaml` (instructions in that file).

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
- Auto-generated `JWT_SECRET` (Render picks a random 32-char string)
- A list of optional env vars (all LLM / Wolfram / channel keys)
  marked for the operator to fill in

Click **Apply**.

> **No disk on the free plan.** The free tier provisions ephemeral
> storage only. State resets on restart. See the note at the top of
> this file for the upgrade path if you need persistence.

### 3. Wait ~3 minutes

Render does the following:

1. Clones the repo
2. Runs the Dockerfile — stage 1 builds the frontend, stage 2 bundles
   the runtime
3. Starts the container, which runs `npm run demo:seed && npx tsx
   src/gate-server.ts`
4. The seed creates 6 demo users (Nisha, Arjun, Kavita, Priya, Rahul,
   Aditya), issues their JWTs, writes `/demo.html` and `/demo-api-keys.html`
   into `frontend/dist/` (the only served path in Docker)
5. The server binds to port 8080 (Render proxies to 443 externally)
6. Health check at `/health` flips green

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

Render occasionally recycles free-tier instances (after 15 min of
idle). Important behaviour:

- **State resets on restart** — the free tier has no persistent disk.
  `.data/` is ephemeral. When the service restarts, the seed runs
  fresh and creates a new set of demo users with new IDs.
- **Seed is idempotent within a single run** — `upsertFromGoogle`
  upserts by google_sub, so running the seed twice in one boot is
  safe. Across cold starts, state is reset.
- **JWT_SECRET survives** — Render sticks with the secret it generated
  on first deploy, even across restarts. Demo JWTs minted by a
  previous boot are still valid until they expire (30 days).
- **First request after sleep cold-starts in ~30 s** — free-tier
  instances sleep after 15 min idle; the next visitor triggers a boot.
  Upgrade to starter ($7/mo) to eliminate cold starts AND get a
  persistent disk for lasting state.

---

## Deploying elsewhere

### Fly.io (paid, no longer free)

Fly.io ended its free tier for new accounts on **October 7, 2024**.
Existing legacy Hobby-plan customers retained their 3 shared-cpu-1x
256MB VMs + 3 GB volume allowances; new accounts get a free trial of
2 VM-hours OR 7 days, whichever expires first, then pay-as-you-go.

The same `demo/Dockerfile` still works fine on Fly. Expect roughly
$2–5/month for a small always-on machine + 1 GB volume:

```bash
fly launch                            # autodetects the Dockerfile
                                      # → say yes when it asks about volumes,
                                      # mount at /app/.data
fly secrets set JWT_SECRET=$(openssl rand -hex 16)
```

If you want strictly $0/month, see
[Always-free alternatives](#always-free-alternatives) below.

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

### Netlify alone — backend cannot run there

Netlify hosts static sites + serverless functions. Vidhya's backend
is a long-running Node server with MCP stdio runners and flat-file
persistence — the Netlify Functions model can't host it without
rewriting the server as Lambdas (and losing the MCP runner with the
stdio-based agent execution).

**However, the Netlify+Render hybrid is fully supported** — frontend
on Netlify's CDN, backend on Render. See
[`DEPLOY-NETLIFY.md`](./DEPLOY-NETLIFY.md) for the walkthrough.

---

## If Render's free tier doesn't work for you

Hosting platforms have shifted in 2024–2026. Several alternatives
that used to be the standard "free Heroku replacement" answers have
changed terms quietly. Here's the current state, verified against
official docs in April 2026.

### First, check whether your Render quota actually reset

Render's free tier is **750 instance-hours per workspace per month**,
resetting at 00:00 UTC on the 1st of each calendar month. "Free tier
seems over" usually means one of three things:

- **Combined hours across active services hit 750.** Open the Render
  dashboard → Account Settings → Usage. If active services have eaten
  the cap, deleting unused services that were *running* frees those
  hours immediately. Services that already spun down for inactivity
  don't accumulate hours — deleting those won't help your cap, only
  your project list.
- **It's late in the month and you're waiting for the rollover.**
  Hours reset at the start of the next calendar month, not on a
  rolling 30-day window.
- **You've hit a different limit** — e.g., a free Postgres database
  paused for inactivity, or the workspace requires a card on file
  for new free services (since 2024 Render asks for verification —
  no charge, just a card).

If after cleanup or the next rollover Render still won't host the
service, look at the alternatives below.

### Always-free alternatives

| Option | Compute | Persistent disk | Cold start | Setup time | Fits Vidhya? |
|---|---|---|---|---|---|
| **Render free tier** | 0.1 vCPU + 512 MB RAM | 1 GB (config'd in `render.yaml`) | 30–60s after 15min idle | 5 min | ✓ already wired |
| **Oracle Cloud Always Free** | up to 4 ARM vCPU + 24 GB RAM | 200 GB block storage | None — always-on VM | ~30 min | ✓ best fit if you can do the setup |
| **Google Cloud Run** | 180,000 vCPU-seconds/mo | None — stateless only | ~5s scale-from-zero | 15 min + adaptation | ⚠ needs persistence workaround |

Sources verified April 2026:
[Render pricing](https://render.com/pricing),
[Oracle Always Free docs](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm),
[Cloud Run pricing](https://cloud.google.com/run/pricing).

**Honest recommendation for "demo URL up at all times, $0/month":**

1. **Oracle Cloud Always Free** — best fit. Real always-on VM (no
   cold starts), 4 ARM cores + 24 GB RAM is overkill for Vidhya. The
   `demo/Dockerfile` runs as-is. Trade-off: ~30 min initial setup
   (VM provisioning, NGINX + Let's Encrypt for HTTPS, systemd or PM2
   to keep the container up). One known gotcha: ARM A1 capacity is
   tight in popular regions; try off-peak or pick less-popular
   regions (Phoenix, Tokyo). Convert the account to "Pay As You Go"
   (still no charge if you stay within free limits) to prevent
   Oracle from reclaiming idle instances — a documented community
   pattern.
2. **Render free tier** (existing path) — 5 min setup, 30–60s cold
   starts after 15 min idle. Acceptable for a demo where the first
   visitor each cycle waits a bit.
3. **Google Cloud Run with stateless mode** — 5 min deploy, 5s
   cold starts (much faster than Render). Catch: Cloud Run is
   stateless, and Vidhya's `.data/` flat-file store needs
   persistence. Simplest workaround: let every cold start re-run
   `npm run demo:seed` — fine for a *demo* (you're showing the
   product, not collecting real user sessions) but not for anything
   that needs to remember user state. Mounting Cloud Storage with
   FUSE preserves data across cold starts but slows down the many
   small writes Vidhya's flat-file store does.

If you want to pursue Oracle Cloud or Cloud Run, the focused
walkthroughs (`DEPLOY-OCI.md`, `DEPLOY-CLOUDRUN.md`) aren't yet
written — open a request and they're a doc-PR's worth of work each.

### Hosts that are no longer free for new accounts

The repo's earlier docs treated some of these as free options. As of
April 2026 they're not:

- **Fly.io** — free tier ended October 7, 2024 for new accounts.
  Legacy customers retained allowances. Still works as a paid host
  via the same Dockerfile (~$2–5/month). See the Fly.io section
  above.
- **Railway** — dropped its 500-hour free plan in 2023. Now offers a
  one-time $5 trial credit (30 days), then $5/month Hobby plan
  minimum.
- **Koyeb** — removed its free *compute* tier in 2024. Free Postgres
  database is still available, but a free web service for Vidhya
  isn't.
- **Heroku** — discontinued its free tier in November 2022. Paid
  Eco/Basic dynos start at $5/month.

### Paid options under $10/month

If "always-on, no cold starts, but tiny budget" is the right shape
for you:

| Host | Plan | Notes |
|---|---|---|
| Render | Starter | $7/month, always-on, 1 GB persistent disk, runs `render.yaml` unchanged |
| Fly.io | Pay-as-you-go | ~$2–5/month for shared-cpu-1x 256MB + 1 GB volume |
| Railway | Hobby | $5/month + usage; usually stays at $5–10/month for Vidhya's footprint |
| DigitalOcean App Platform | Basic | $5/month for a 512 MB container; Vidhya needs adapting since DO App Platform doesn't expose a true persistent disk on basic — use DO Droplet ($4/month) + Docker if you want flat-file persistence |

Render Starter is the path of least change — same `render.yaml`,
same `demo/Dockerfile`, just toggle the plan in the dashboard from
Free to Starter. Cold starts disappear, the 750-hour cap goes away,
and persistence behaves the same.

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

### Render says you've exceeded the free tier

Free tier is 750 instance-hours per workspace per month, resetting
on the 1st (UTC). To free hours immediately:

1. Render dashboard → Account Settings → Usage. See which services
   consumed the cap.
2. Delete services you don't actively need. Note: only services
   that were *running* contribute to the cap. Already-spun-down
   services don't count, so deleting those tidies your project list
   but doesn't free hours.
3. Wait ~5 minutes for usage to refresh in the dashboard, then
   redeploy.

If the cap is still saturated after cleanup and the rollover is far
away, see [If Render's free tier doesn't work for you](#if-renders-free-tier-doesnt-work-for-you).

---

## Why Render, not Netlify alone

| Property | Vidhya needs | Render | Netlify alone |
|---|---|---|---|
| Long-running Node server | ✓ | ✓ | ✗ (serverless only) |
| MCP stdio runners | ✓ | ✓ | ✗ |
| Flat-file persistent disk | ✓ | ✓ (disks) | ✗ (stateless functions) |
| Dockerfile support | ✓ | ✓ | ✗ (only "build hooks") |
| Free tier | nice-to-have | ✓ (with cold starts) | ✓ |

The backend must live on a Node-runtime host. Render is the
simplest single-vendor path; the alternatives section above covers
when other hosts make sense. The Netlify+Render hybrid documented
in [`DEPLOY-NETLIFY.md`](./DEPLOY-NETLIFY.md) gets you Netlify's
CDN for the frontend without trying to wedge the backend into
Lambda — that's the right way to use Netlify with Vidhya, and it's
fully supported.
