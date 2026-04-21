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

## From exam-prep pain to exam-prep bliss

Every exam-prep cycle produces a specific set of pains. Below is the pain you recognise, and the concrete **bliss** that names your takeaway — what you actually walk away with. Each bliss is a real feature shipped in the codebase; deeper versions are in [FEATURES.md](./FEATURES.md) Slide 2.

- **Pain:** *"I don't know if I'm actually ready for my exam."*    **Bliss** *(your takeaway):* You see "12 mastered · 15 in progress · 3 struggling" — per concept, always visible. When your parents ask how preparation is going, you have a real answer instead of a guess.
- **Pain:** *"The syllabus feels overwhelming — I don't know where to start today."*    **Bliss** *(your takeaway):* Three priority concepts for today, ranked by your exam's topic weight × your current mastery. An hour of focused work. Not a hundred-item to-do list.
- **Pain:** *"My exam is three days away and every app tells me to 'take a break.'"*    **Bliss** *(your takeaway):* Advice that reads your urgency. Six months out and five wrong in a row: break suggested. Three days out and five wrong in a row: switched to a quick review instead. No tone-deaf suggestions when you're already stressed.
- **Pain:** *"I watch 45-minute lectures and still don't get the concept."*    **Bliss** *(your takeaway):* Every concept in eight small pieces. You skip what you already know, linger on what you don't. Two focused minutes beat forty unfocused ones.
- **Pain:** *"It's 2 a.m. I'm stuck on a problem. I have nowhere to turn."*    **Bliss** *(your takeaway):* Snap a photo. Full walkthrough in seconds, with the common traps flagged. Works on web, Telegram, and WhatsApp — same quality on a slow mobile connection or a laptop on campus wifi.
- **Pain:** *"I paid for a plan but don't know what I'm actually getting."*    **Bliss** *(your takeaway):* Sign in once and see every exam your plan covers, with a live "you're already X% of the way there" chip per bonus exam. Coverage updates as you study. Nothing buried in a settings PDF.
- **Pain:** *"I keep forgetting things I studied weeks ago."*    **Bliss** *(your takeaway):* Concepts resurface at intervals backed by memory research, not streak tricks. Exam week, your day-one learning is still intact because the system brought it back at the right moments.
- **Pain:** *"AI chatbots sometimes confidently give wrong answers."*    **Bliss** *(your takeaway):* Answers run through Wolfram Alpha where possible. Past papers are pre-checked. When the system isn't sure, it says so instead of inventing a clean-looking wrong answer.
- **Pain:** *"Apps use streaks and guilt-trip notifications to manipulate me."*    **Bliss** *(your takeaway):* Zero streaks. Zero badges. Zero "you lost your streak" notifications. You study when you want. The app doesn't try to trick you into opening it.
- **Pain:** *"I don't want my weak areas in some corporate database."*    **Bliss** *(your takeaway):* No server-side database of your progress exists. Your materials stay in your browser; your progress lives on your device. Architecturally, not as a policy statement that can be rewritten later.
- **Pain:** *"I don't have access to top-tier teaching where I live."*    **Bliss** *(your takeaway):* Lesson content doesn't change based on your location. Same structure, depth, and explicit trap-flagging for every student. Your pin code stops deciding the quality of your preparation.
- **Pain:** *"My foundations are shaky, so advanced topics feel impossible."*    **Bliss** *(your takeaway):* When a wrong answer has a foundational-gap signature, the system routes you upstream first. Fix the foundation, and the advanced topic unlocks naturally.
- **Pain:** *"Coaching lectures move at the average pace — I'm either bored or lost."*    **Bliss** *(your takeaway):* Mastery tracked per concept, not per class schedule. Move quickly through topics that click. Spend extra time on topics that don't. No batch pace to keep up with.
- **Pain:** *"I'm embarrassed to ask 'basic' questions in class."*    **Bliss** *(your takeaway):* Ask anything, in any way, any number of times. No classmate sees. No teacher makes a face. The question you were holding in gets an actual answer.
- **Pain:** *"My teacher explains but I don't see why any of it actually matters."*    **Bliss** *(your takeaway):* Every lesson opens with a one-sentence hook — the real problem this concept was invented to solve. Motivation before mechanics, so the mechanics actually stick.
- **Pain:** *"Rigorous material is too abstract; intuitive explanations are too hand-wavy."*    **Bliss** *(your takeaway):* Every lesson carries both layers. A visualised mental picture that isn't dumbed-down, and the formal statement in your exam's exact terminology that isn't hidden in academic prose. Linger on whichever you need today.

---




## What you actually get (as a student)

We built Vidhya around six promises to the student. Each one is a
concrete outcome, not a feature.

### 1. You'll know exactly where you stand — on every concept in your syllabus

Vidhya tracks your mastery per concept, not just overall. Open the app
and you see: 12 concepts mastered, 15 in progress, 3 struggling. You
know what to review before your next session. No dashboards to learn,
no jargon — just "here's what needs work."

### 2. The app knows which exam you're taking — and adapts every lesson

When you pick your target exam (GATE CS, JEE Advanced, UPSC CSE,
whatever), every lesson, every recommendation, every "try this next"
is filtered through that exam's syllabus and topic weightings. The
concepts your exam weighs heavily get more practice; the ones that
aren't on your exam don't clutter your study time.

### 3. As your exam approaches, the app stops telling you to rest

Five wrong answers in a row when your exam is 6 months away? The app
suggests a break. Same five wrong answers when your exam is 3 days
away? The app switches to a lesson review instead — because telling
a stressed student to "step away for 10 minutes" two days before
their exam reads as tone-deaf. The urgency of your situation shapes
every piece of advice the app gives.

### 4. One subscription can unlock multiple exams

If your coaching institute bundles GATE CS with JEE Advanced, IES
Electronics, and BARC, you'll see a clear **🎁 Giveaway** banner on
sign-in listing every bonus exam your plan covers — and how much of
each you've *already* covered through your primary prep. "You're
already 42% of the way through JEE Advanced through your current
prep." The bundle is celebrated, not hidden.

### 5. You can study on a slow phone, on spotty wifi

The app pre-loads the 80% of questions students most commonly ask.
When your wifi drops or the server is down, you can keep studying.
Telegram and WhatsApp bots work from a 3-year-old Android just as
well as a new laptop.

### 6. Your data stays yours — and your AI provider is your choice

Your class notes, your mock test scores, your study history — all
stay on your device. If you want to use AI-powered features, you
bring your own Gemini / Claude / OpenAI / Ollama key. Your key stays
in your browser. We never see it, and we never charge you for the AI.

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
| [FEATURES.md](./FEATURES.md) | 37-slide deck (9 for students, 28 technical): every moat, metrics, cost model |
| [INSTALL.md](./INSTALL.md) | Cross-platform installation, tiered by feature needs |
| [docs/LLM-CONFIGURATION.md](./docs/LLM-CONFIGURATION.md) | BYO-key setup: 8 providers, cascading role defaults, privacy model |
| [docs/USER-JOURNEY.md](./docs/USER-JOURNEY.md) | Student + admin journey maps with pain points and fixes |
| [docs/TEACHER-JOURNEY.md](./docs/TEACHER-JOURNEY.md) | Teacher as end-user — what to teach + how to teach; human teacher ↔ AI teacher model |
| [docs/COMPOUNDING-MASTERY-FRAMEWORK.md](./docs/COMPOUNDING-MASTERY-FRAMEWORK.md) | After-each-attempt insight engine + Smart Notebook (auto-logged, concept-clustered, gap-analyzed, exportable) |
| [docs/EXAM-FRAMEWORK.md](./docs/EXAM-FRAMEWORK.md) | Dynamic exam registry — admin-managed with LLM-optional enrichment, conversational assistant, unique multi-student IDs, progressive fill |
| [docs/GBRAIN-INTEGRATION-AUDIT.md](./docs/GBRAIN-INTEGRATION-AUDIT.md) | Systematic per-feature audit proving GBrain is applied across all student-facing surfaces; unified /api/me/gbrain-summary endpoint; cross-exam coverage engine |
| [docs/RENDERING-FRAMEWORK.md](./docs/RENDERING-FRAMEWORK.md) | Multi-channel interactive rendering — enriches canonical lessons with step-reveal / flip-card / quick-check / drag-match blocks; first-class renderers for web (Framer Motion), Telegram (progressive-reveal keyboards), WhatsApp, voice |
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
