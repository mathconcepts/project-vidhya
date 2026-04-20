# Project Vidhya

**Cost-minimal, local-first adaptive learning engine with a four-tier content cascade.**

Vidhya is a learning platform built on the premise that *the right content at
the right moment costs nothing when delivered well*. It combines a DB-less
runtime architecture, client-side embeddings, pre-verified content bundles,
and computational verification via Wolfram Alpha to deliver personalized
practice at a marginal cost approaching zero.

Built initially for GATE Engineering Mathematics but the architecture is
domain-agnostic — swap the concept graph and seed problems for any subject.

---

## Why Vidhya

Most adaptive learning products spend ~$2 per active daily user on LLM
calls. Vidhya spends ~$0.01 by routing every content request through a
four-tier cascade:

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
- Gemini API — tier-2 generation (recommended)
- Wolfram Alpha — tier-3 verification (unlocks emerald verified badges)
- Supabase / PostgreSQL — persistent auth (runtime works without either)
- Anthropic Claude, OpenAI, Groq, DeepSeek, Mistral, Together, OpenRouter — LLM fallbacks

---

## Documentation

| Document                    | Scope                                       |
|----------------------------|---------------------------------------------|
| [INSTALL.md](./INSTALL.md) | Cross-platform installation, tiered by feature needs |
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

Pull requests welcome. The content pipeline is the highest-leverage area:
- New scrapers for CC-licensed sources
- Improvements to the Wolfram answer matcher (see `src/services/wolfram-service.ts`)
- New subject domains: swap `concept-graph.ts` and re-run the pipeline

---

*Vidhya (विद्या) is Sanskrit for knowledge, learning, and the means of attaining it.*
