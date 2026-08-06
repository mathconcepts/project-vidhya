# Installation

> **Goal:** running Project Vidhya — locally, on Render, or on a Netlify + Render hybrid.
> Start in whichever environment you'll actually use; you can switch later without changes.

This guide is the single reference for **getting Vidhya running**. There are three deployment paths and three local install profiles.

## Pick a deployment path

| | When to use | Setup time | Walk-through |
|---|---|---|---|
| **Local** | development, evaluating, demoing offline | 5 min | This file (below) |
| **Render** | one-click public URL, single vendor, single bill | 5 min | [`DEPLOY.md`](./DEPLOY.md) |
| **Netlify + Render** | want Netlify's CDN / branch previews + Render's Node runtime | 10 min | [`DEPLOY-NETLIFY.md`](./DEPLOY-NETLIFY.md) |

**Short version: try Render first.** Click the Deploy button in the [README](./README.md), wait three minutes, share the URL. The Netlify hybrid is for teams that have a specific reason to want Netlify (CDN, branch previews, one-frontend-many-backends). Local install is what you want for development.

The rest of this file covers **local installation** in detail.

---

## Local install — three profiles

Pick the profile that matches what you want to try:

- **Minimal** — runs the app with shipped content, no keys (planning, templates, trailing stats, admin views, lifecycle reports all work)
- **Recommended** — plus BYOK LLM for full AI tutor experience (chat, Snap solve, explainer generation)
- **Full** — plus Wolfram for maths verification, Telegram/WhatsApp for channel delivery

Flat-file storage (`.data/`) is the default. **No database required.**

---

## Requirements

### Required

| Tool | Version | Why |
|---|---|---|
| Node.js | ≥ 20.0.0 | Runtime |
| npm | ≥ 10 | Comes with Node 20 |

### Optional (enables extras)

| Tool / service | What it enables | Get it from |
|---|---|---|
| **OpenRouter API key** | AI tutor via any model — Gemini, Claude, GPT-4o — through one key (recommended) | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Gemini API key** | AI tutor, Snap solve, explainer generation (free tier available) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Anthropic API key** | Same (paid) | [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI API key** | Same (paid) | [platform.openai.com](https://platform.openai.com/api-keys) |
| Wolfram App ID | Live maths verification, solve-for-me intent | [wolframalpha.com/developers](https://products.wolframalpha.com/api) |
| Telegram Bot Token | Telegram delivery channel | `/newbot` with [@BotFather](https://t.me/BotFather) |
| WhatsApp credentials | WhatsApp delivery channel | Meta for Developers → WhatsApp Business API |

No key is strictly needed — the baseline demo (planner, trailing stats, templates, admin views, lifecycle reports) works without any.

---

## Minimal install

```bash
# 1. Clone
git clone https://github.com/mathconcepts/project-vidhya
cd project-vidhya

# 2. Install
npm install
(cd frontend && npm install)

# 3. Set a JWT secret (random 32+ chars)
export JWT_SECRET=$(openssl rand -hex 16)

# 4. Run
npm run build:frontend
npx tsx src/server.ts
```

Visit `http://localhost:8080/` — the web app serves.

To verify everything loaded:
```bash
curl http://localhost:8080/health
# → {"status":"ok", ...}
curl http://localhost:8080/api/orchestrator/health
# → {"ok": true, "modules": [...], "summary": {...}}
```

---

## Running the demo

The demo seeds six users (owner, admin, teacher, 3 students) and exposes a role-picker page. One command gets everything:

```bash
npm run demo:setup      # install + seed (first time only)
npm run demo:start      # boot backend + frontend
# open http://localhost:3000/demo.html
```

Click any role card to be auto-logged-in. Full walkthrough in [`DEMO.md`](./DEMO.md).

To reset and re-seed:
```bash
npm run demo:reset && npm run demo:seed
```

To verify the demo is healthy:
```bash
npm run demo:verify
# runs 14 end-to-end checks across all roles
```

---

## Docker install (full stack — production parity)

Runs Postgres + pgvector + auto-migrations + the app in one command. Best for local development that mirrors what Render runs.

### Quick start

```bash
# 1. Copy the env file
cp .env.example .env

# 2. Add your LLM key (OpenRouter recommended — one key, many models)
#    Edit .env and set OPENROUTER_API_KEY=sk-or-v1-...
#    (or GEMINI_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY — any one works)

# 3. Start
docker compose up --build
# → http://localhost:8080
```

> **pgvector is optional.** The default Compose file uses `pgvector/pgvector:pg16` (pgvector pre-installed). If you point `DATABASE_URL` at a plain Postgres instance without pgvector, the server still starts and all features work — Tier 1 RAG returns empty results and the cascade falls through to the LLM (Tier 2). See [`docs/PLATFORM.md`](./docs/PLATFORM.md) §3 for details.

### M1 Mac (Apple Silicon)

The Compose file defaults to `linux/arm64` — native on M1, no Rosetta emulation needed:

```bash
# Default — works out of the box on M1:
docker compose up --build

# Intel Mac / Linux x86 — override the platform:
PLATFORM=linux/amd64 docker compose up --build
```

If you see a `platform mismatch` warning, set `PLATFORM=linux/arm64` explicitly in your `.env`.

### What the stack runs

| Service | Image | Port |
|---|---|---|
| `db` | `pgvector/pgvector:pg16` | 5432 (internal) |
| `migrate` | runs SQL files in `supabase/migrations/` | — |
| `app` | built from `Dockerfile` | 8080 |

Flat-file data lives in a `vidhya_data` Docker volume (survives container restarts). If host port 5432 is taken by your own Postgres, create a `docker-compose.override.yml` that remaps `db.ports` to `"5433:5432"` (gitignored by default).

---

## Recommended install (with AI tutor)

Add **one** BYOK LLM key. OpenRouter is the easiest starting point — one key reaches Gemini, Claude, GPT-4o, and more:

```bash
# Minimum from above, plus:
export OPENROUTER_API_KEY=<your-key>          # https://openrouter.ai/keys
# OR use any single provider directly:
export GEMINI_API_KEY=<your-key>              # https://aistudio.google.com/apikey (free tier)
export ANTHROPIC_API_KEY=<your-key>           # https://console.anthropic.com/settings/keys
export OPENAI_API_KEY=<your-key>              # https://platform.openai.com/api-keys
```

The server auto-detects which key is set. No `VIDHYA_LLM_PRIMARY_PROVIDER` needed — `config/providers.yaml` picks the first provider that has a key.

Now `/gate/llm-config` works, chat surfaces light up, Snap solve is functional, concept explainers generate live via the router.

Router behaviour reference: [`CONTENT.md`](./CONTENT.md).

---

## Full install

Add everything:

```bash
export JWT_SECRET=$(openssl rand -hex 16)

# LLM — set any one (or more). OpenRouter covers all providers with one key.
export OPENROUTER_API_KEY=<your-key>     # recommended
# export GEMINI_API_KEY=<your-key>       # alternative
# export ANTHROPIC_API_KEY=<your-key>    # alternative
# export OPENAI_API_KEY=<your-key>       # alternative

# Wolfram
export WOLFRAM_APP_ID=<your-wolfram-id>

# Telegram
export TELEGRAM_BOT_TOKEN=<your-bot-token>
export PUBLIC_URL=<your-public-url>  # needed for Telegram webhook

# WhatsApp
export WHATSAPP_ACCESS_TOKEN=<token>
export WHATSAPP_PHONE_NUMBER_ID=<phone-id>
export WHATSAPP_VERIFY_TOKEN=<your-chosen-verify-token>
```

See [`demo/CHANNELS.md`](./demo/CHANNELS.md) for Telegram + WhatsApp setup.

---

## Env-var quick reference

| Variable | Required? | Default | What it enables |
|---|---|---|---|
| `JWT_SECRET` | **yes** (≥ 16 chars) | — | Auth tokens. Skipped when `VIDHYA_AUTH_MODE=external-jwks`. |
| `PORT` | no | `8080` | Server port |
| `NODE_ENV` | no | `development` | Production mode |
| `DATABASE_URL` | no | — | Postgres connection. Without it, flat-file `.data/` is used. |
| `OPENROUTER_API_KEY` | no | — | OpenRouter (recommended — routes to Gemini, Claude, GPT-4o via one key) |
| `GEMINI_API_KEY` | no | — | Gemini provider (free tier available) |
| `ANTHROPIC_API_KEY` | no | — | Anthropic Claude provider |
| `OPENAI_API_KEY` | no | — | OpenAI provider |
| `VIDHYA_LLM_PROVIDER` | no | — | **Override** all of `config/providers.yaml`: `gemini` / `anthropic` / `openai` / `openrouter` / `ollama`. Set together with `VIDHYA_LLM_API_KEY`. |
| `VIDHYA_LLM_API_KEY` | no | — | API key for `VIDHYA_LLM_PROVIDER` (omit for keyless providers like `ollama`). |
| `VIDHYA_LLM_BASE_URL` | no | — | Custom endpoint — required for Azure OpenAI, Vertex AI, private gateways, Ollama. |
| `VIDHYA_LLM_MODEL` | no | — | Model ID for the override provider (e.g. `gpt-4o`, `claude-sonnet-4-5`). |
| `VIDHYA_AUTH_MODE` | no | `supabase` | `external-jwks` enables RS256 JWT verification via your own IdP (Auth0, Cognito, Clerk). |
| `VIDHYA_JWKS_URI` | no | — | Required when `VIDHYA_AUTH_MODE=external-jwks`. Your IdP's JWKS endpoint URL. |
| `VIDHYA_ROLE_CLAIM_PATH` | no | `role` | Dot-notation path to the role claim in the JWT (e.g. `app_metadata.role`). |
| `VIDHYA_SKIP_DB_ROLE_LOOKUP` | no | — | `true` trusts the IdP role claim directly, skipping the `user_profiles` DB lookup. |
| `WOLFRAM_APP_ID` | no | — | Maths verification + solve intents |
| `TELEGRAM_BOT_TOKEN` | no | — | Telegram delivery |
| `WHATSAPP_ACCESS_TOKEN` | no | — | WhatsApp delivery |
| `WHATSAPP_PHONE_NUMBER_ID` | no | — | WhatsApp delivery |
| `WHATSAPP_VERIFY_TOKEN` | no | — | WhatsApp webhook verification |
| `PUBLIC_URL` | no (needed for channels) | — | Your public-facing URL |
| `DEPLOYMENT_PROFILE` | no | `full` | One of the profiles in `modules.yaml` |

All optional keys have `sync: false` in `render.yaml` — on Render you paste them in the Environment tab without editing code.

A reference file is at [`.env.deploy.example`](./.env.deploy.example).

---

## Enable / disable features

In addition to the env vars above, individual modules expose **feature flags** that toggle behaviour without changing code. Flags are read once at server boot — flipping one means changing the env var on your host (or in your local `.env`) and restarting the server.

### Auth module flags

The auth module ships with 4 flags. Defaults preserve existing behaviour, so a fresh clone runs identically to before any flag is touched.

> **Bringing your own IdP?** If your deployment already issues JWTs (Auth0, Cognito, Clerk, etc.), set `VIDHYA_AUTH_MODE=external-jwks` and point `VIDHYA_JWKS_URI` at your IdP's JWKS endpoint. RS256 verification runs entirely via Node.js built-in `crypto` — no extra packages. Full setup guide: [`docs/PLATFORM.md`](./docs/PLATFORM.md) §1.

| Flag | Env var | Default | Off-state effect |
|---|---|---|---|
| `auth.google_oidc` | `VIDHYA_AUTH_GOOGLE_OIDC` | `on` | Google sign-in disabled. Unless another auth path is implemented, **nobody can log in.** |
| `auth.demo_seed` | `VIDHYA_AUTH_DEMO_SEED` | `on` | `npm run demo:seed` exits cleanly without creating users. Use for production deployments where the 6 demo personas would confuse real users. |
| `auth.parent_role` | `VIDHYA_AUTH_PARENT_ROLE` | `on` | Assigning the `parent` role is rejected. Existing parent users keep their record but lose access until re-enabled. |
| `auth.institution_role` | `VIDHYA_AUTH_INSTITUTION_ROLE` | `off` | Scaffolding for the multi-tenant B2B role (deferred). Default off until tenancy isolation lands. |

Flag values accept `1`/`true`/`yes`/`on` (case-insensitive) for true and `0`/`false`/`no`/`off`/empty for false.

Examples:

```bash
# Production deployment — turn off the demo seed
export VIDHYA_AUTH_DEMO_SEED=0
npm run demo:seed   # exits with "demo seed disabled"

# Disable parent-role linkage (e.g. coaching centre for adult students)
export VIDHYA_AUTH_PARENT_ROLE=0
# subsequent POSTs to /api/admin/users/:id/role with new_role=parent now reject
```

### Inspecting flag state

Once the server is running:

```bash
# As the owner (any admin works)
TOKEN=$(jq -r .owner.token demo/demo-tokens.json)
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/orchestrator/features | jq
```

Or open `http://localhost:8080/admin/features` in a browser — the Feature flags page shows every flag's current state, default, env-var name, description, and which ones are overridden from default. Admin-only.

### Why not toggle from the UI?

The Feature flags page is intentionally read-only. Flipping a flag through the UI would mean:

1. Adding a write API (more attack surface)
2. Designing the audit trail (who flipped what, when)
3. Handling the case where a flag flip leaves a deployment in a state where nobody can log in

Restart-required is the safer default. See [DESIGN.md](./DESIGN.md) §"4. Feature flags as env-var toggles, read once at boot" for the full reasoning.

---

## Data directory — `.data/`

Everything persistent lives under `.data/` as flat JSON files:

```
.data/
├── users.json                        user accounts + channels
├── student-exam-profiles.json        per-student exam registrations
├── session-plans.json                plan history
├── plan-templates.json               saved templates
├── practice-sessions.json            practice log (trailing stats source)
├── demo-usage-log.json               owner-visible demo telemetry
├── content-subscriptions.json        per-user bundle subscriptions
├── user-uploads.json                 upload metadata index
├── user-uploads/<user_id>/           private upload blobs
└── community-content/                synced community content (live mode)
```

**No database required.** Deployments reset flat-files are isolated; flat-file persistence survives container restarts if mounted as a volume (Render persistent disks work).

---

## Updating content

The main repo pulls community content from a separate repo (`project-vidhya-content`, built in [`modules/project-vidhya-content/`](./modules/project-vidhya-content/)).

Three `content.pin` modes:

- `sha: pending` — stub mode, no community content
- `sha: local` — reads `modules/project-vidhya-content/` (current default for development)
- `sha: <40-char>` — reads from `.data/community-content/` after sync

To pull the latest pinned content:
```bash
npx tsx scripts/content-sync.ts
```

In local mode (current default), this is a no-op. In live mode (after the operator creates the GitHub subrepo), it clones the pinned SHA into `.data/community-content/`. Full flow in [`CONTENT.md`](./CONTENT.md).

---

## Running checks

```bash
npm run typecheck                     # backend typecheck
(cd frontend && npx tsc --noEmit)     # frontend typecheck
npm test                              # vitest unit tests (107)
npm run smoke:stdio                   # MCP stdio smoke (49 checks)
npm run smoke:sdk-compat              # SDK compat smoke (65 checks)
npm run demo:verify                   # multi-role demo verify (14 checks)
python3 agents/validate-graph.py      # agent-org invariants
node modules/project-vidhya-content/scripts/check.js   # content subrepo validation
```

Full seven-gate regression = all of the above passing.

---

## Troubleshooting

### `JWT_SECRET must be at least 16 characters`

Server refuses to boot without a sufficiently-long secret. Set one:
```bash
export JWT_SECRET=$(openssl rand -hex 16)
```

### Demo roles don't appear at `/demo.html`

The seed didn't run. Reseed:
```bash
npm run demo:reset && npm run demo:seed
```

### Frontend shows "not found" at `/`

Build the frontend:
```bash
(cd frontend && npm run build)
```

Gate-server serves `frontend/dist/` statically. The dist directory must exist before boot.

### LLM calls return 503

No configured LLM provider has a valid key. Check that at least one of `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY` is set — or if using the override path, that `VIDHYA_LLM_PROVIDER` + `VIDHYA_LLM_API_KEY` are both present.

### Port conflict

Another process is on 8080. Change with `PORT=8081 npx tsx src/server.ts`.

---

## Platform team integration

If you're dropping Vidhya into an existing edtech stack — your own auth, your own LLM gateway, your own Postgres — three env vars cover the common cases:

```bash
# Bring your own IdP (Auth0, Cognito, Clerk, ...)
VIDHYA_AUTH_MODE=external-jwks
VIDHYA_JWKS_URI=https://company.auth0.com/.well-known/jwks.json

# Bring your own LLM endpoint (Azure OpenAI, Vertex AI, Ollama, ...)
VIDHYA_LLM_PROVIDER=openai
VIDHYA_LLM_API_KEY=<key>
VIDHYA_LLM_BASE_URL=https://company.openai.azure.com/openai/deployments/gpt-4o
VIDHYA_LLM_MODEL=gpt-4o
```

LLM API endpoints are available at both `/api/llm/*` (provider-neutral, preferred) and `/api/gemini/*` (legacy alias kept for backwards compatibility).

Full reference — all three integration points with examples: [`docs/PLATFORM.md`](./docs/PLATFORM.md).

---

## Tenant provisioning

To provision a new school on its own database (recommended for multi-tenant deployments):

```bash
npm run provision-tenant -- \
  --db-url  postgres://user:pass@host:5432/mydb \
  --tenant-id  acme-school \
  --admin-email  admin@acme.com
```

This runs all pending migrations (idempotent), seeds an admin user, and prints a ready-to-use `.env` stub. Add `--dry-run` to preview without writing to the database.

---

## Where to go next

- **Running a demo?** → [`DEMO.md`](./DEMO.md) — the multi-role walkthrough
- **Deploying live (Render)?** → [`DEPLOY.md`](./DEPLOY.md) — single-vendor, one click
- **Deploying live (Netlify + Render)?** → [`DEPLOY-NETLIFY.md`](./DEPLOY-NETLIFY.md) — hybrid, frontend on Netlify CDN
- **Platform team / bringing your own IdP + LLM?** → [`docs/PLATFORM.md`](./docs/PLATFORM.md) — JWKS auth, LLM routing, tenant provisioning, pgvector optionality
- **Adding an exam?** → [`EXAMS.md`](./EXAMS.md) — the two-file adapter pattern
- **Contributing content?** → [`CONTENT.md`](./CONTENT.md) + [`modules/project-vidhya-content/CONTRIBUTING.md`](./modules/project-vidhya-content/CONTRIBUTING.md)
- **Architecture / modules?** → [`MODULARISATION.md`](./MODULARISATION.md)
- **What's not done yet?** → [`CHANGELOG.md`](./CHANGELOG.md) (shipped) + [`docs/100x-blueprint.md`](./docs/100x-blueprint.md) (in-flight roadmap)
