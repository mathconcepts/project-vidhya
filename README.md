# Project Vidhya

**Your AI study partner — knows your exam, reads your notes, verifies every answer, and respects your privacy.**

Vidhya is a learning app that actually teaches. Upload your class notes,
snap a photo of any problem, and get a step-by-step explanation — with
the common traps flagged, the common misconceptions called out, and the
answer double-checked by Wolfram Alpha where possible. Your materials
and progress stay on your device. The AI provider is your choice.

Built initially for GATE Engineering Mathematics; the architecture is
domain-agnostic — any exam with a defined syllabus works.

> **New to Vidhya?** Read the [**30-second pitch (PITCH.md)**](./PITCH.md) for what it does for you as a student. \
> **Technical evaluator?** The [**full technical deck (FEATURES.md)**](./FEATURES.md) covers every architectural decision.

---

## What Vidhya does for you

**Study anything from your syllabus, instantly.** Ask a question in chat, or
upload a photo of a problem. You'll get a walkthrough — not just the
answer, but the method, the intuition, and the common mistakes to avoid.

**Lessons that actually stick.** Every concept is taught in 8 bite-sized
components (hook → definition → intuition → worked example → mini
exercise → common traps → formal statement → connections). Designed around
how human memory actually works, not around video lecture formats.

**Works on a slow internet.** The app pre-loads the 80% of questions most
students actually ask. You can keep studying when your wifi drops.

**Reach it from anywhere.** Web, Telegram, or WhatsApp — the same Vidhya
account, the same progress, across all three.

**Your data stays yours.** Materials you upload, questions you ask, progress
you make — all stay in your browser or on your local server. Nothing leaves
unless you explicitly sync it.

**Free to try, your AI your choice.** Use the free Gemini tier, or plug in
your own key from any of 8 providers (Claude, OpenAI, Groq, Ollama local,
and more). Your keys stay in your browser; we never see them.

---

## Why institutions deploy it

- **Free to install and run** — no per-seat licensing, $5/month VPS covers a class of 50
- **You own your users and data** — flat-file user directory on your server; nothing leaves
- **Three access channels** — students use web, Telegram, or WhatsApp depending on what they prefer
- **Customizable curriculum** — define any exam as a YAML file; works for GATE, JEE, CSIR-NET, custom in-house exams, anything with a syllabus
- **Role-based admin** — owner/admin/teacher/student hierarchy with the first sign-in auto-becoming owner

---

## How it works under the hood (the short version)

| Tier | Source                                    | Cost per request | Typical hit rate |
|------|-------------------------------------------|------------------|------------------|
| 0    | Bundled JSON, served from CDN              | $0               | ~80%             |
| 1    | Semantic RAG over bundle + your materials | $0 (client-side) | ~12% of misses   |
| 2    | LLM generation (Gemini 2.5 Flash-Lite)     | ~$0.0005         | ~6% of misses    |
| 3    | Wolfram-verified generation                | ~$0.002          | ~2% of misses    |

Result: **86% cost reduction** vs a naive LLM-per-request setup, with no
quality compromise — tier-0 hits carry the emerald "Wolfram-Verified"
badge when computationally checked.

---

## Core architecture

```
Browser                                  Edge server (stateless)
┌────────────────────────────┐          ┌──────────────────────────┐
│  React + Vite SPA          │          │  Express on Node 20      │
│  ├── IndexedDB (GBrain)    │          │  ├── /api/content/*      │
│  │   • student model        │◄───REST──►  ├── /api/gemini/*        │
│  │   • error history        │          │  ├── /api/aggregate/*    │
│  │   • uploaded materials   │          │  └── no database         │
│  ├── transformers.js WASM   │          └──────────┬───────────────┘
│  │   • embeddings, offline  │                     │
│  ├── content resolver       │                     ▼
│  │   • 4-tier cascade       │          ┌──────────────────────────┐
│  └── UI (Tailwind+Framer)   │          │ Gemini / Wolfram / Claude│
└────────────────────────────┘          └──────────────────────────┘

Build-time pipeline (GitHub Actions, nightly)
┌──────────────────────────────────────────────────────────────────┐
│  scrape-corpus  →  scrape-textbooks  →  build-explainers (LLM)    │
│                                 ↓                                 │
│                   verify-wolfram-batch (Wolfram API)              │
│                                 ↓                                 │
│                      build-bundle (SHA-256 dedup)                 │
│                                 ↓                                 │
│          commit content-bundle.json to main → deploy              │
└──────────────────────────────────────────────────────────────────┘
```

**What's local-first:**
- Student progress lives in the browser (IndexedDB)
- Embeddings computed client-side (22 MB WASM model, one-time download)
- Uploaded PDFs/DOCXs parsed entirely in-browser (privacy-preserving)

**What's on the edge server:**
- Stateless LLM proxy (Gemini, Anthropic, others)
- Content resolver with telemetry
- Opt-in anonymous cohort aggregation (flat-file, not Postgres)

---

## Quick start

See [**INSTALL.md**](./INSTALL.md) for the full guide. TL;DR:

```bash
git clone https://github.com/mathconcepts/project-vidhya.git
cd project-vidhya
npm ci
cd frontend && npm ci && npm run build && cd ..
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
npm run dev:server
```

Open `http://localhost:8080`. Works immediately with bundled content and no
API keys. Add `GEMINI_API_KEY` to `.env` to unlock Tier 2. Add
`WOLFRAM_APP_ID` to enable computational verification.

---

## Key features

- **Content engine** — scrape → tag → generate → verify → bundle → deliver, all automated
- **GBrain cognitive model** — 15-attribute Bayesian student model, 7-category error taxonomy, 82-concept DAG
- **Materials upload** — PDFs/DOCXs parsed + embedded entirely client-side, grounded into the tutor chat
- **Four-tier resolver** — every content request routed to cheapest matching source
- **Wolfram verification** — mathematical answers computationally checked at build time
- **Opt-in cohort telemetry** — anonymous misconception aggregation without session IDs or PII
- **Admin dashboards** — tier hit rates, cost per event, bundle coverage, student audits
- **Offline-capable** — runs in-browser with no server once the bundle is cached

---

## Dependencies overview

All managed via `npm ci`. See [INSTALL.md](./INSTALL.md#requirements-at-a-glance)
for the tiered breakdown.

**Host toolchain** (required): Node.js ≥ 20, npm ≥ 10, git ≥ 2.30
**Optional host tools**: PostgreSQL 14+, Docker 24+

**Runtime packages** (auto-installed):
- Backend: 11 runtime + 3 dev dependencies
- Frontend: 21 runtime + 9 dev dependencies

**External services** (all optional):
- **Any LLM provider** — Gemini / Anthropic / OpenAI / OpenRouter / Groq / DeepSeek / Mistral / Ollama (local). **Users configure in-browser at `/llm-config`**; keys never touch the server.
- Wolfram Alpha — tier-3 verification (unlocks emerald verified badges)
- Supabase / PostgreSQL — persistent auth (runtime works without either)

---

## Documentation

| Document                    | Scope                                       |
|----------------------------|---------------------------------------------|
| [PITCH.md](./PITCH.md)     | 30-second shareable one-pager                |
| [FEATURES.md](./FEATURES.md) | 33-slide deck (8 for students, 25 technical): every moat, metrics, cost model |
| [INSTALL.md](./INSTALL.md) | Cross-platform installation, tiered by feature needs |
| [docs/LLM-CONFIGURATION.md](./docs/LLM-CONFIGURATION.md) | BYO-key setup: 8 providers, cascading role defaults, privacy model |
| [docs/USER-JOURNEY.md](./docs/USER-JOURNEY.md) | Student + admin journey maps with pain points and fixes |
| [docs/TEACHER-JOURNEY.md](./docs/TEACHER-JOURNEY.md) | Teacher as end-user — what to teach + how to teach; human teacher ↔ AI teacher model |
| [docs/COMPOUNDING-MASTERY-FRAMEWORK.md](./docs/COMPOUNDING-MASTERY-FRAMEWORK.md) | After-each-attempt insight engine + Smart Notebook (auto-logged, concept-clustered, gap-analyzed, exportable) |
| [DEPENDENCIES.md](./DEPENDENCIES.md) | Canonical dep inventory tagged Required/Recommended/Optional |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute — scrapers, concepts, code, PRs |
| [SECURITY.md](./SECURITY.md) | Vulnerability disclosure policy + response timeline |
| [PLAN-content-engine.md](./PLAN-content-engine.md) | Four-tier cascade, cost analysis, Wolfram integration rationale |
| [PLAN-dbless-gbrain.md](./PLAN-dbless-gbrain.md) | Local-first architecture, client-side embeddings, opt-in aggregation |
| [PLAN-gbrain-mvp.md](./PLAN-gbrain-mvp.md) | Cognitive model: student attributes, error taxonomy, concept graph |
| [DESIGN.md](./DESIGN.md)   | Visual and UX design principles             |
| [CHANGELOG.md](./CHANGELOG.md) | Release history v2.0.0 onwards            |

---

## Content pipeline scripts

```bash
# Scrape curated sources (no API keys needed)
npx tsx scripts/scrape-corpus.ts --source gate
npx tsx scripts/scrape-textbooks.ts --source openstax
npx tsx scripts/scrape-textbooks.ts --source ocw

# Build the 82-concept explainer library (requires GEMINI_API_KEY)
npx tsx scripts/build-explainers.ts

# Computationally verify every problem (requires WOLFRAM_APP_ID)
npx tsx scripts/verify-wolfram-batch.ts

# Assemble the deliverable bundle
npx tsx scripts/build-bundle.ts
```

Output: `frontend/public/data/content-bundle.json` is served directly from
the CDN/host and consumed by the client resolver.

---

## Testing

```bash
# Backend
npm test

# Frontend typecheck
cd frontend && npx tsc --noEmit

# Production smoke test
curl http://localhost:8080/api/content/stats
curl -X POST http://localhost:8080/api/content/resolve \
  -H "Content-Type: application/json" \
  -d '{"intent":"practice","concept_id":"eigenvalues","difficulty":0.5}'
```

---

## License

MIT. See [LICENSE](./LICENSE).

Content bundled from third-party sources carries per-record attribution:
- OpenStax textbook excerpts → CC-BY 4.0
- MIT OpenCourseWare problems → CC-BY-NC-SA 4.0
- GATE previous year papers → public domain
- Math Stack Exchange excerpts → CC-BY-SA 4.0

See each record's `license` and `attribution` fields in
`frontend/public/data/content-bundle.json`.

---

## Contributing

Pull requests welcome. See [**CONTRIBUTING.md**](./CONTRIBUTING.md) for the
full guide. Highest-leverage areas:

- **New content sources** — CC-licensed scrapers in `scripts/` following the existing JSONL schema
- **Wolfram matcher improvements** — handle algebraically-equivalent restructured answers
- **New subject domains** — swap `concept-graph.ts` and seed problems

Security issues → [SECURITY.md](./SECURITY.md) (private disclosure).

---

*Vidhya (विद्या) is Sanskrit for knowledge, learning, and the means of attaining it.*
