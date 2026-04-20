# Dependencies — Project Vidhya

Complete inventory of everything Vidhya depends on, grouped by whether it's
required, recommended, or optional. Every item is tagged so you can
install exactly what you need.

**Legend:**
- 🔴 **Required** — Vidhya won't start without this
- 🟡 **Recommended** — Vidhya runs without this but key features are disabled
- 🟢 **Optional** — Extras that unlock specific features or alternative paths

---

## Host toolchain

| Item        | Tier | Version   | Notes                                         |
|-------------|------|-----------|-----------------------------------------------|
| Node.js     | 🔴   | ≥ 20.0.0  | Runtime for server and build tools            |
| npm         | 🔴   | ≥ 10.0.0  | Ships with Node                               |
| git         | 🔴   | ≥ 2.30    | For clone and version control                 |
| openssl     | 🟡   | any       | Used once to generate `JWT_SECRET` (or use any random-string tool) |
| PostgreSQL  | 🟢   | ≥ 14      | Only for persistent sessions; core runtime is DB-less |
| Docker      | 🟢   | ≥ 24      | Alternative deploy path that skips Node entirely |

### Installing the host toolchain

**macOS (Homebrew)**
```bash
brew install node@20 git openssl
# optional:
brew install postgresql@16
brew install --cask docker
```

**Ubuntu / Debian**
```bash
# Node 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git openssl
# optional:
sudo apt install -y postgresql-16
```

**Windows**
```powershell
# Via winget
winget install OpenJS.NodeJS.LTS Git.Git ShiningLight.OpenSSL
# optional:
winget install PostgreSQL.PostgreSQL Docker.DockerDesktop
```

**Windows (WSL2 — recommended)**
Use the Ubuntu instructions inside WSL2.

---

## Environment variables

Only `JWT_SECRET` is strictly required. Everything else is graceful.

### 🔴 Required

| Variable     | Description                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `JWT_SECRET` | 32+ byte random string used to sign authentication tokens. Generate: `openssl rand -hex 32` |

### 🟡 Recommended

| Variable         | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| `GEMINI_API_KEY` | Enables Tier-2 problem generation, error classification, vision OCR, chat tutor. Get from https://aistudio.google.com — free tier available. |

### 🟢 Optional

| Variable             | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| `WOLFRAM_APP_ID`     | Tier-3 computational verification. Get from https://developer.wolframalpha.com/access — free tier is 2k queries/month. |
| `ANTHROPIC_API_KEY`  | Claude fallback when Gemini rate-limits. Get from https://console.anthropic.com |
| `DATABASE_URL`       | Postgres connection string. When set, auth sessions persist across restarts. When absent, JWT-only mode. |
| `SUPABASE_URL` + `SUPABASE_ANON_KEY` | Use Supabase's managed Postgres as the `DATABASE_URL` provider. |
| `OPENAI_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`, `TOGETHER_API_KEY`, `OPENROUTER_API_KEY` | Additional LLM providers in the fallback router. |
| `RESEND_API_KEY`     | Email sends (password reset, admin alerts). Get from https://resend.com |
| `CRON_SECRET`        | Bearer token for `/api/cron/*` endpoints. Only needed if running scheduled jobs. |
| `PORT`               | Server port. Defaults to 8080.                                             |
| `NODE_ENV`           | `development` or `production`. Controls logging verbosity.                 |

The canonical list with getters is in [`.env.example`](./.env.example).

---

## Backend npm dependencies

All installed automatically via `npm ci`. Listed in [`package.json`](./package.json).

### 🔴 Runtime (11 packages)

| Package                    | Purpose                                                                 |
|---------------------------|-------------------------------------------------------------------------|
| `express`                 | HTTP server framework                                                   |
| `@google/generative-ai`   | Gemini SDK for Tier-2 generation, classification, vision                |
| `@anthropic-ai/sdk`       | Claude SDK for LLM fallback                                             |
| `pg` + `@types/pg`        | PostgreSQL driver. Only loaded when `DATABASE_URL` is set.             |
| `tsx`                     | TypeScript runtime used by `npm run start` and `npm run dev`           |
| `typescript`              | Type system                                                             |
| `katex`                   | Server-side LaTeX rendering for static content                          |
| `resend`                  | Transactional email                                                     |
| `web-push`                | Browser notification protocol                                           |
| `yaml`                    | Config parsing                                                          |

### 🟢 Dev (3 packages)

| Package             | Purpose                       |
|--------------------|-------------------------------|
| `@types/express`   | Type definitions for Express  |
| `@types/node`      | Node.js type definitions      |
| `vitest`           | Test runner                   |

---

## Frontend npm dependencies

Installed via `cd frontend && npm ci`. Listed in [`frontend/package.json`](./frontend/package.json).

### 🔴 Runtime (21 packages)

**UI framework**
| Package            | Purpose                              |
|-------------------|--------------------------------------|
| `react` + `react-dom` | Core UI library (v18)            |
| `react-router-dom`    | Client-side routing               |

**Local-first capabilities** (the core moat)
| Package              | Purpose                                                                        |
|---------------------|--------------------------------------------------------------------------------|
| `@xenova/transformers` | Client-side embeddings (all-MiniLM-L6-v2, 22 MB WASM). Zero API cost for RAG. |
| `idb`                | IndexedDB wrapper. Client-side database for student state + materials.         |
| `pdfjs-dist`         | PDF parsing in the browser.                                                   |
| `mammoth`            | DOCX parsing in the browser.                                                  |

**State + data**
| Package              | Purpose                              |
|---------------------|--------------------------------------|
| `zustand`           | Lightweight state management         |
| `@tanstack/react-query` | Server state + caching            |
| `@supabase/supabase-js` | Supabase client (optional usage) |

**Rendering**
| Package                        | Purpose                                   |
|-------------------------------|-------------------------------------------|
| `katex` + `@types/katex`      | LaTeX math rendering                      |
| `remark-math` + `rehype-katex`| Markdown math pipeline                    |
| `react-markdown`              | Markdown renderer                         |
| `react-syntax-highlighter`    | Code block highlighting                   |
| `lucide-react`                | Icon set                                  |
| `framer-motion`               | Animations                                |
| `recharts`                    | Charts on admin dashboards                |
| `clsx`                        | Conditional class names                   |
| `date-fns`                    | Date formatting                           |

### 🟢 Dev (9 packages)

| Package              | Purpose                       |
|---------------------|-------------------------------|
| `vite`              | Build tool + dev server       |
| `@vitejs/plugin-react` | React fast-refresh         |
| `typescript`        | Type system                   |
| `@types/react` + `@types/react-dom` + `@types/react-syntax-highlighter` | TypeScript definitions |
| `tailwindcss`       | Utility-first CSS             |
| `postcss` + `autoprefixer` | Tailwind's processors  |

---

## External APIs and services

All are 🟢 **Optional** — Vidhya runs with zero external services.

### Gemini API

**Tier unlocked:** Tier 2 (on-demand problem generation), error classification, vision OCR, chat tutor

**Cost model:**
- Gemini 2.5 Flash-Lite: $0.10 / 1M input, $0.40 / 1M output tokens
- Typical problem generation: ~500 input + 500 output = ~$0.0003 per problem
- With 80% Tier-0 hit rate, monthly cost at 100 DAU ≈ $3–5

**Setup:** https://aistudio.google.com → "Get API key" → paste into `GEMINI_API_KEY`

### Wolfram Alpha Full Results API

**Tier unlocked:** Tier 3 (computational verification — the emerald badge)

**Cost model:**
- Free tier: 2,000 queries/month — enough for nightly bundle re-verification
- Paid: $5/month flat via Wolfram MCP subscription

**Setup:** https://developer.wolframalpha.com/access → "Get an AppID" → select "Full Results API" → paste into `WOLFRAM_APP_ID`

### Anthropic Claude (optional fallback)

**Purpose:** LLM fallback when Gemini rate-limits. The router auto-picks a
healthy provider.

**Setup:** https://console.anthropic.com → API keys → paste into `ANTHROPIC_API_KEY`

### Supabase / Postgres (optional persistence)

**Purpose:** Persistent user auth sessions. Without this, Vidhya runs in
JWT-only mode where sessions are stateless.

**Setup:** Any Postgres 14+ connection string works. Supabase provides a
free managed instance.

---

## Content data dependencies

The content bundle (`frontend/public/data/content-bundle.json`) is the
source of truth for Tier 0. It carries attribution per-record.

### Included sources

| Source | License | Attribution in bundle |
|--------|---------|----------------------|
| GATE previous year papers | Public domain (Govt of India) | `source: "gate-curated"` |
| OpenStax textbook excerpts | CC-BY 4.0 | `source: "openstax"` with full citation |
| MIT OpenCourseWare | CC-BY-NC-SA 4.0 | `source: "mit-ocw"` with instructor credit |
| Math Stack Exchange | CC-BY-SA 4.0 | `source: "math-stackexchange"` |

### Generated content

When you run `scripts/build-explainers.ts` with a Gemini key, Vidhya
generates 82 concept explainers (200-word deep explanations with 3 worked
examples each). These carry `model: "gemini-2.5-flash-lite"` and
`generated_at: <timestamp>` in the bundle. One-time cost: ~$0.08.

---

## Verification commands

Run these to confirm everything is installed correctly:

```bash
# Host toolchain
node --version      # v20.x+
npm --version       # 10.x+
git --version       # 2.30+

# Backend deps
npm ls --depth=0

# Frontend deps
cd frontend && npm ls --depth=0 && cd ..

# Post-install diagnostic (shows which tiers are unlocked)
node scripts/postinstall-check.cjs

# Bundle present
test -f frontend/public/data/content-bundle.json && echo "bundle OK" || echo "bundle MISSING"

# Server starts
JWT_SECRET=test npm run dev:server &
sleep 5
curl -s http://localhost:8080/health | grep -q '"status":"ok"' && echo "server OK" || echo "server FAILED"
kill %1
```

---

## Upgrade paths

When you add an API key later, no reinstall is needed. Just restart the
server:

```bash
# After adding GEMINI_API_KEY
npm run content:explainers    # regenerates explainers with real content
npm run content:bundle        # assembles into content-bundle.json
# restart server — Tier 2 is now live

# After adding WOLFRAM_APP_ID
npm run content:verify        # marks problems as wolfram_verified
npm run content:bundle
# restart — emerald verified badges appear
```

Each step is idempotent and safe to re-run.
