# Deploying Vidhya — Netlify (frontend) + Render (backend)

> **Use this when:** you want the frontend on Netlify (great free tier, instant CDN, automatic HTTPS, branch deploy previews) but need to host the Node backend somewhere else.
>
> **Don't use this when:** you want a single-vendor deploy. [`DEPLOY.md`](./DEPLOY.md) (Render only) is simpler — one click, one URL, one bill. Pick that unless you have a specific reason for Netlify.
>
> **Cannot use:** Netlify alone. The backend is a long-running Node server with flat-file persistence and MCP stdio runners — it does not run on Netlify Functions. Porting would require rewriting it as Lambdas, which is out of scope.

---

## What you'll have at the end

```
  Netlify           https://your-site.netlify.app
    └── frontend/dist (static React SPA)
        │
        │  every /api/* request gets proxied to:
        ▼
  Render            https://your-service.onrender.com
    └── Node server + flat-file .data/ + MCP stdio runners
```

The browser sees one origin (Netlify) — same-origin auth cookies and JWTs work normally. Netlify's edge proxies `/api/*` to Render. No CORS dance.

**Trade-offs honestly:**

- ✅ Frontend gets Netlify's CDN, instant deploys, branch previews
- ✅ Backend keeps full Node runtime + persistent disk
- ✅ One frontend can point at different backend environments (staging vs prod) just by changing one env var
- ⚠️  Two services to monitor instead of one
- ⚠️  Two cold-start latencies to think about (Render's free tier sleeps after 15 min of inactivity; first request takes ~30 seconds)
- ⚠️  Two free-tier limits, two billing pages eventually
- ❌ Channel webhooks (Telegram / WhatsApp) must point at the Render URL directly. They cannot proxy through Netlify; the bot platforms hit your URL synchronously and Netlify's redirect adds latency that occasionally times out.

---

## Step-by-step

### 1. Deploy the backend to Render first

Follow [`DEPLOY.md`](./DEPLOY.md). You'll end up with a URL like `https://vidhya-demo.onrender.com`. **Copy this URL** — you'll paste it into Netlify in step 3.

Verify the backend is healthy:

```bash
curl https://your-service.onrender.com/health
# → {"status":"ok", ...}
```

### 2. Connect the repo to Netlify

In the Netlify dashboard:

1. **Add new site** → **Import an existing project**
2. Pick **GitHub** → authorise → select `mathconcepts/project-vidhya`
3. Netlify auto-detects [`netlify.toml`](./netlify.toml) at the repo root and shows:
   - **Base directory:** `frontend`
   - **Build command:** `npm ci && npm run build`
   - **Publish directory:** `frontend/dist`
4. Click **Deploy site**

The first build will succeed but **the proxy will point at the example URL** (`vidhya-demo.onrender.com`) baked into `netlify.toml`. Step 3 fixes that.

### 3. Set BACKEND_URL

In the Netlify dashboard:

1. **Site settings** → **Environment variables** → **Add a variable**
2. Set:
   - Key: `BACKEND_URL`
   - Value: `https://your-service.onrender.com` (no trailing slash)
3. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

After the rebuild, every `/api/*` request from your frontend now proxies to your Render backend.

### 4. Verify end-to-end

```bash
# Direct backend health (Render):
curl https://your-service.onrender.com/health

# Same path proxied through Netlify (your URL):
curl https://your-site.netlify.app/api/orchestrator/health
```

Both should succeed. The second call is what the frontend actually uses at runtime.

### 5. (Optional) Custom domain

In Netlify: **Domain settings** → **Add custom domain**. Netlify provisions Let's Encrypt automatically. Point your DNS at Netlify's nameservers or set up a CNAME — both work.

---

## Updating the proxy without touching code

The redirect rules in `netlify.toml` use a `__BACKEND_URL__` placeholder. The repo's [`scripts/netlify-prebuild.sh`](./scripts/netlify-prebuild.sh) substitutes that placeholder with the value of `BACKEND_URL` before each build.

**This is necessary because** Netlify does NOT natively substitute env-var values inside `[[redirects]]` `to` fields. (Quoting Netlify's docs: *"Using environment variables directly as values in your netlify.toml isn't supported."*) The recommended pattern is exactly what this repo does — sed-replace a placeholder string from the build command. Confusingly, this repo had documentation prior to this commit that suggested Netlify did substitute env vars natively. That was wrong; this section corrects it.

To switch backends:

1. Update `BACKEND_URL` in Netlify dashboard
2. Trigger a redeploy (the prebuild script reruns automatically)

The script also fails the build loudly if `BACKEND_URL` is missing or non-HTTPS. This is intentional: a deploy without `BACKEND_URL` would silently 404 every API call from the frontend — failing fast at build time is much easier to debug than a deployed site where login mysteriously doesn't work.

The same `netlify.toml` works for staging, production, or any operator's fork — only the env var differs per deployment.

---

## What about the demo seed?

Render runs `npm run demo:seed` on first boot (this is what creates Nisha, Arjun, Kavita, Priya, Rahul, Aditya). The Netlify side is purely the frontend — it has no `.data/` and no seed step.

When you visit `https://your-site.netlify.app/demo.html`, the frontend fetches the demo-tokens manifest from `/api/...` (proxied to Render). If the Render service hasn't seeded yet, you'll see an empty role-picker. Visiting the Render URL directly (`https://your-service.onrender.com/demo.html`) once is enough to trigger the seed — and from then on Netlify's proxy serves the data correctly.

---

## Troubleshooting

### Build fails with "BACKEND_URL environment variable is not set"

The prebuild script (`scripts/netlify-prebuild.sh`) refuses to build without `BACKEND_URL`. Set it in **Site settings → Environment variables** in the Netlify dashboard, then trigger a redeploy. Use the HTTPS URL of your backend, no trailing slash.

### Build fails with "BACKEND_URL must start with https://"

Browsers block mixed-content requests from an HTTPS Netlify frontend to an HTTP backend. Use the HTTPS URL your backend host provides (Render, Fly.io, etc. provide one by default).

If you really need HTTP for testing, set `ALLOW_HTTP_BACKEND=1` as a second env var. This is a deliberate footgun — production deploys should never use it.

### `502 Bad Gateway` from Netlify

The backend isn't responding. Check:
1. Is the Render service awake? (free tier sleeps after 15 min — visit the Render URL directly to wake it)
2. Did you set `BACKEND_URL` correctly with `https://` and no trailing slash?
3. Did you redeploy after setting `BACKEND_URL`? Env var changes need a fresh build to take effect.

### Auth requests succeed locally but fail on Netlify

Check:
1. The `BACKEND_URL` matches the URL the backend was deployed to
2. CORS isn't blocking — should not happen with the proxy approach (browser sees same-origin), but if you bypassed the proxy and called the backend URL directly from JS, CORS would block

### Channel webhooks time out

Telegram / WhatsApp webhooks should point **directly at the Render URL**, not the Netlify URL:

```
Telegram setWebhook URL: https://your-service.onrender.com/telegram/webhook
WhatsApp callback URL:    https://your-service.onrender.com/whatsapp/webhook
```

The Netlify proxy adds latency that occasionally exceeds the bot platforms' synchronous timeout window.

### Frontend shows stale code after a deploy

Netlify's edge cache may have an old version. In dashboard: **Deploys** → **Clear cache and deploy site**.

### Demo doesn't appear at `/demo.html`

The backend hasn't seeded yet. Visit `https://your-service.onrender.com/demo.html` directly once to trigger the seed, then revisit the Netlify URL.

---

## Where to go next

- [`DEPLOY.md`](./DEPLOY.md) — single-vendor Render deploy if Netlify isn't a hard requirement
- [`INSTALL.md`](./INSTALL.md) — local development setup
- [`DEMO.md`](./DEMO.md) — multi-role demo walkthrough
