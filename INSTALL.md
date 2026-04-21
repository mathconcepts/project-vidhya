# Installation Guide — Project Vidhya

This guide will get Vidhya running on any machine in under 15 minutes. It
covers three installation paths: **Minimum** (runs the app with canned
content, zero external services), **Recommended** (full four-tier content
engine with LLM routing), and **Production** (everything, including
computational verification).

---

## Requirements at a glance

Every requirement is classified by tier — install only what your target
setup needs.

### Host toolchain

| Tool      | Version    | Tier        | Why |
|-----------|-----------|-------------|-----|
| Node.js   | ≥ 20.0.0  | **Required**    | Runtime for server + build tools |
| npm       | ≥ 10.0.0  | **Required**    | Ships with Node — package manager |
| Git       | ≥ 2.30    | **Required**    | Clone, pull, commit |
| PostgreSQL| ≥ 14      | Optional    | Only for legacy auth; core runtime is DB-less |
| Docker    | ≥ 24      | Optional    | Alternative deploy path, skips host toolchain entirely |

Verify your toolchain:

```bash
node --version    # should print v20.x or higher
npm --version     # should print 10.x or higher
git --version     # should print 2.30 or higher
```

### Runtime dependencies (installed via `npm ci`)

These are listed in `package.json` (backend) and `frontend/package.json` (client).
You don't install these manually — `npm ci` handles them.

**Backend** — 11 production deps:
- `@google/generative-ai` — Gemini SDK, used by the LLM router and proxy
- `@anthropic-ai/sdk` — Claude fallback provider
- `express` — HTTP server
- `pg` + `@types/pg` — PostgreSQL driver (only loaded when DATABASE_URL is set)
- `katex` — LaTeX math rendering utilities
- `resend` — transactional email (password resets, alerts)
- `tsx` — TypeScript runtime for server entrypoint
- `typescript` — type system
- `web-push` — browser notification support
- `yaml` — config file parsing

**Frontend** — 21 production deps, most notable:
- `react` + `react-dom` 18 — UI framework
- `react-router-dom` 6 — client-side routing
- `@xenova/transformers` — **client-side embeddings** (all-MiniLM-L6-v2 in WebAssembly). This is the reason we need no embedding API key.
- `idb` — IndexedDB wrapper, the whole client-side database
- `pdfjs-dist` + `mammoth` — parse uploaded PDFs and Word docs in-browser
- `framer-motion` — animations
- `recharts` — charts on the admin dashboards
- `react-markdown` + `remark-math` + `rehype-katex` — markdown with math
- `lucide-react` — icons
- `zustand` — lightweight state
- `tailwindcss` (dev) — styling
- `vite` (dev) — build tool

### External services (all optional)

| Service    | What it unlocks                           | Tier        | Cost |
|-----------|-------------------------------------------|-------------|------|
| Gemini API | Tier-2 problem generation, error classification, vision OCR, chat tutoring | **Recommended** | $0.10–$0.40 per 1M tokens |
| Wolfram Alpha | Tier-3 computational verification       | Optional    | Free 2k/mo, then $5/mo flat |
| Anthropic Claude | LLM fallback when Gemini is unavailable | Optional    | Pay per use |
| Supabase   | Hosted Postgres + auth                    | Optional    | Free tier available |
| PostgreSQL | Legacy auth + analytics persistence       | Optional    | Free, self-hosted |
| Render / similar | Production hosting                  | Optional    | Free tier available |

**If you set zero external service keys, Vidhya still works** — it falls
back to the bundled content (Tier 0 only), placeholder explainers, and
logs warnings instead of breaking.

---

## Path 1: Minimum install (5 minutes, no external services)

The fastest way to see Vidhya working. No accounts, no API keys, no database.

```bash
# 1. Clone
git clone https://github.com/mathconcepts/project-vidhya.git
cd project-vidhya

# 2. Install backend deps
npm ci

# 3. Install frontend deps
cd frontend && npm ci && cd ..

# 4. Create minimal .env
cat > .env <<EOF
JWT_SECRET=$(openssl rand -hex 32)
PORT=8080
NODE_ENV=development
EOF

# 5. Build frontend
cd frontend && npm run build && cd ..

# 6. Start the server
npm run dev:server
```

Open `http://localhost:8080`. Smart Practice at `/smart-practice` works
entirely from the bundled content. The admin dashboard at `/admin/content`
shows tier hit rates.

**What works in this mode:**
- Tier 0 (bundled problems + placeholder explainers) — `/smart-practice`
- Client-side materials upload (PDFs parsed entirely in-browser) — `/materials`
- Student model + error taxonomy (runs in the browser)
- Static marketing pages

**What is disabled:**
- On-demand problem generation (needs Gemini key)
- Computational verification (needs Wolfram key)
- Full-content explainers (placeholders only — the 82 concepts load from
  `frontend/public/data/explainers.json` which ships with canned text)
- Email sends

---

## Path 2: Recommended install (10 minutes, BYO AI provider)

Unlocks chat, image understanding, and on-demand content generation.

**Vidhya is LLM-agnostic** — it works with Google Gemini, Anthropic Claude, OpenAI, OpenRouter, Groq, DeepSeek, Mistral, or a local Ollama server. Configuration happens in the browser, not in a `.env` file.

### Option A — Configure through the UI (recommended for most users)

1. Start the server (Path 1 above)
2. Open the app in your browser
3. Navigate to `/llm-config`
4. Pick a provider and paste your API key
5. Click **Test & save** — you're done

Your key stays in your browser's localStorage and is sent only as an authentication header on outbound API calls. The server never persists it.

**Getting a key** — fastest path is Google Gemini (generous free tier):
1. Visit https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy the key (starts with `AIzaSy...`)
4. Paste it into `/llm-config`

See `docs/LLM-CONFIGURATION.md` for the full list of providers and per-provider setup details.

### Option B — Server-side env var (for shared/team deploys)

If you're running Vidhya for multiple users and want a shared default provider (users can still override in their browser):

```bash
# Any ONE of these works (auto-detected in priority order):
echo "GEMINI_API_KEY=AIzaSy..." >> .env
# or
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
# or explicit:
echo "VIDHYA_LLM_PRIMARY_PROVIDER=google-gemini" >> .env
echo "VIDHYA_LLM_PRIMARY_KEY=AIzaSy..." >> .env
```

Client-provided configs (browser) always win over env vars. Use env vars only as a floor.

### Optional one-time content generation

Once an LLM is configured, you can generate the full 82-concept explainer library offline:

```bash
# One-time, ~$0.08 on Gemini Flash-Lite
GEMINI_API_KEY=AIzaSy... npx tsx scripts/build-explainers.ts

# Rebuild bundle to pick up the fresh explainers
npx tsx scripts/build-bundle.ts
npx tsx scripts/restore-wolfram-flags.ts   # preserve verification flags
```

---

## Path 3: Production install (with Wolfram verification)

For deploys where correctness matters (mock exams, graded practice).

**Extra step: get a Wolfram AppID**

1. Visit https://developer.wolframalpha.com/access
2. Sign up, click "Get an AppID"
3. Select **Full Results API**
4. Wait ~5 minutes for activation

```bash
# Additions to your .env
WOLFRAM_APP_ID=XXXXXX-XXXXXXXXXX

# Verify all bundled problems computationally (one-time, ~$0)
npx tsx scripts/verify-wolfram-batch.ts

# Rebuild bundle with verification flags
npx tsx scripts/build-bundle.ts
```

Now Tier 3 works: students see the emerald "Wolfram-Verified" badge on
computationally-checked problems. The Tier-0 picker prefers verified
problems over unverified ones for the same concept.

---

## Path 4: Multi-user install (role-based access + owner bootstrap)

For deploys where you want identity, role-based permissions, and/or
multi-channel access (web + Telegram + WhatsApp).

### Step 1 — Create a Google OAuth client

Full walkthrough in `docs/MULTI-CHANNEL-SETUP.md` section 1. Summary:

1. https://console.cloud.google.com → APIs & Services → Credentials
2. Create OAuth client ID, **Web application** type
3. Add your deployment URL(s) to **Authorized JavaScript origins**
4. Copy the Client ID

### Step 2 — Configure the server

```bash
# Add to .env
GOOGLE_OAUTH_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")
PUBLIC_URL=https://your-deploy-domain.com   # or http://localhost:5173 for dev
```

Restart the server. `/sign-in` will now show the Google button.

### Step 3 — Claim ownership (the bootstrap rule)

**The first user to sign in becomes the owner automatically.** Make sure
that first user is you:

1. Open the app
2. Visit `/sign-in`
3. Sign in with Google
4. Check `.data/users.json` — your record should have `"role": "owner"`

If the wrong person signed in first, reset via shell:

```bash
npx tsx scripts/admin/assign-owner.ts --email you@example.com
```

This requires shell access — intentional, since filesystem control IS
the ultimate ownership proof.

### Step 4 — Manage users from the UI

Signed in as owner or admin, visit:

- `/admin/users` — roster, role changes, teacher assignment
- `/owner/settings` — transfer ownership, see channel integration status

Role matrix (see `docs/ROLES-AND-ACCESS.md` for full details):

| Role | Can do |
|------|--------|
| Owner | Everything, including transfer ownership |
| Admin | Manage users + teachers, edit curriculum |
| Teacher | Review assigned students, read-only content |
| Student | Normal app usage |

### Step 5 (optional) — Enable Telegram and WhatsApp channels

See `docs/MULTI-CHANNEL-SETUP.md` for step-by-step setup. Summary env vars:

```bash
# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_WEBHOOK_SECRET=<random-string>

# WhatsApp Business
WHATSAPP_ACCESS_TOKEN=<permanent-token>
WHATSAPP_PHONE_NUMBER_ID=<numeric-id>
WHATSAPP_VERIFY_TOKEN=<random-string>
```

Once set, users see your bot in `/owner/settings → Channel integrations`
as **enabled**.

### What users see

- **Anonymous visitor** — app works as before, no account required,
  state stays in IndexedDB
- **Signed-in student** — same experience plus cross-device sync via
  account ID, can access via Telegram/WhatsApp once linked
- **Teacher** — plus `/admin/users` showing their roster (students
  assigned to them)
- **Admin** — plus full user management UI
- **Owner** — plus `/owner/settings`

The app **does not force sign-in**. Existing anonymous flows continue
working. Sign-in is additive for users who want cross-device sync or
cross-channel access.

---

## Path 5: Docker install (zero host setup)

If you don't want to install Node + npm on your host, use the container.

```bash
git clone https://github.com/mathconcepts/project-vidhya.git
cd project-vidhya

# Build
docker build -t vidhya .

# Run with just a JWT secret
docker run -p 8080:8080 -e JWT_SECRET=$(openssl rand -hex 32) vidhya

# OR with the full env
docker run -p 8080:8080 --env-file .env vidhya
```

The Dockerfile is a multi-stage build producing a ~250 MB image with only
runtime deps.

---

## Environment variables reference

The canonical list is `.env.example`. Copy it to `.env` and fill in the values
you need.

### Required (always)

| Variable     | Description                                    |
|--------------|------------------------------------------------|
| `JWT_SECRET` | Random 32+ byte string used to sign auth tokens. Generate with `openssl rand -hex 32`. |

### Required for Path 2+

| Variable         | Description                                    |
|------------------|------------------------------------------------|
| `GEMINI_API_KEY` | Google AI Studio API key. Enables tier-2 generation, error classification, vision OCR, chat. |

### Required for Path 3+

| Variable          | Description                                    |
|-------------------|------------------------------------------------|
| `WOLFRAM_APP_ID`  | Wolfram Alpha Full Results API App ID. Enables tier-3 verification. |

### Optional

| Variable              | Description                                    |
|-----------------------|------------------------------------------------|
| `DATABASE_URL`        | Postgres connection string. When set, auth sessions persist across restarts. When absent, auth runs in JWT-only mode. |
| `ANTHROPIC_API_KEY`   | Claude fallback when Gemini is rate-limited.  |
| `OPENAI_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`, `TOGETHER_API_KEY`, `OPENROUTER_API_KEY` | Additional LLM providers in the router. |
| `RESEND_API_KEY`      | Email sends (password reset, admin alerts).    |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Supabase integration when using its hosted Postgres. |
| `PORT`                | Defaults to 8080.                              |
| `NODE_ENV`            | `development` enables verbose logs. `production` assumes trust in proxy headers. |
| `CRON_SECRET`         | Required if you run the cron endpoints in `/api/cron/*`. Bearer token. |

---

## Post-install verification

Run this checklist after installation to confirm everything works:

```bash
# Backend health
curl http://localhost:8080/health
# Expect: {"status":"ok","service":"gate-math-api", ...}

# Content bundle
curl http://localhost:8080/api/content/stats
# Expect: {"version":2,"total_problems":N,"total_explainers":82,...}

# Tier 0 resolve
curl -X POST http://localhost:8080/api/content/resolve \
  -H "Content-Type: application/json" \
  -d '{"intent":"practice","concept_id":"eigenvalues","difficulty":0.25}'
# Expect: source "tier-0-bundle-exact" with a problem

# Frontend (if served by the same process)
curl http://localhost:8080/
# Expect: HTML with <title>Vidhya</title>
```

---

## Updating content

The content bundle (`frontend/public/data/content-bundle.json`) is the source
of truth for Tier 0. Refresh it any time with:

```bash
# Scrape curated sources (no API keys needed)
npx tsx scripts/scrape-corpus.ts --source gate
npx tsx scripts/scrape-textbooks.ts --source openstax
npx tsx scripts/scrape-textbooks.ts --source ocw

# Regenerate explainer library (needs GEMINI_API_KEY)
npx tsx scripts/build-explainers.ts

# Verify bundle against Wolfram (needs WOLFRAM_APP_ID)
npx tsx scripts/verify-wolfram-batch.ts

# Merge into the deliverable bundle
npx tsx scripts/build-bundle.ts
```

Each script is idempotent — running them twice doesn't duplicate records
(SHA-256 fingerprint dedup in `build-bundle.ts`).

---

## Troubleshooting

**`npm ci` fails with peer dependency errors**
Use `npm install --legacy-peer-deps` once, then `npm ci` subsequently.

**Server starts but `/` returns 404**
The frontend build output is missing. Run `cd frontend && npm run build`
then restart the server.

**`content-bundle.json` not found**
Run `npx tsx scripts/build-bundle.ts`. This assembles the bundle from
`frontend/public/data/pyq-bank.json` + any explainers into
`frontend/public/data/content-bundle.json`.

**Transformers.js takes 20s on first load**
The all-MiniLM-L6-v2 model (22 MB) downloads once from the Hugging Face
CDN and caches in the browser's Cache Storage. Subsequent loads are instant.

**Postgres connection errors when `DATABASE_URL` is set**
The connection must be valid if set. To run in full DB-less mode, remove
`DATABASE_URL` from `.env` entirely.

**Rate-limited by Gemini**
Gemini free tier is 15 req/min on Flash. The content engine already routes
80%+ of requests to tier 0/1 (free). If you hit limits, enable the
`ANTHROPIC_API_KEY` fallback or upgrade the Gemini tier.

---

## Next steps

- **Customize content**: edit `scripts/scrape-corpus.ts` to add your own seed problems
- **Deploy to production**: see `DEPLOYMENT.md` for Render / Fly.io / self-hosted guides
- **Extend the content engine**: new sources go in `scripts/` following the existing JSONL schema
- **Read the architecture**: `PLAN-content-engine.md`, `PLAN-dbless-gbrain.md`, `DESIGN.md`

Welcome to Project Vidhya.
