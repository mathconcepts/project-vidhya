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

Most students don't need another app. They need relief from a specific
set of pains that every prep cycle produces. Here's the before/after
Vidhya is built for.

### "I don't know if I'm actually ready for my exam."

**Bliss:** Every time you open Vidhya, you see exactly where you stand —
12 concepts mastered, 15 in progress, 3 struggling. Not a vague progress
bar. Not a percentage bar that means nothing. Real, per-concept, honest.
When someone asks "how's prep going?" you have an answer.

### "The syllabus feels overwhelming — I don't know where to start."

**Bliss:** When your exam is set, Vidhya filters everything through its
topic weightings. Open the app and see "Priority actions: three concepts
ranked by exam weight and your current mastery." Not 100 things to do.
Three. Today.

### "My exam is three days away. Every app tells me to 'take a break' and it feels tone-deaf."

**Bliss:** Vidhya reads the urgency. Six months out and five wrong in a
row → it suggests a break. Three days out and five wrong in a row → it
switches to a quick lesson review instead. The advice shifts as your
situation shifts. No app telling you to step away 48 hours before your
exam.

### "I watch 45-minute video lectures and still don't get it."

**Bliss:** Every concept is eight small components — hook, definition,
intuition, worked example, mini exercise, common traps, formal statement,
connections. You can skip what you already know and linger on what you
don't. Built on how human memory actually works, not how YouTube
monetizes attention.

### "It's 2am. I'm stuck on a problem. I have nowhere to turn."

**Bliss:** Snap a photo. Vidhya reads your handwriting, identifies which
concept is being tested, walks you through the solution, flags where
students usually go wrong. Same quality at 2am on a Tuesday as 2pm on a
Saturday. Telegram, WhatsApp, or the web app — your pick.

### "I paid for a subscription but I don't know what I'm actually getting."

**Bliss:** If your plan bundles multiple exams, the first thing you see
after sign-in is a "🎁 Giveaway · included in your plan" banner:
*"You're preparing for GATE CS, and your plan also covers JEE Advanced
(42% covered), IES Electronics (18% covered), BARC CSE (8% covered)."*
Every bonus exam, explicit, with live coverage from your current prep.
The bundle is celebrated, not buried in a settings page.

### "I keep forgetting things I studied weeks ago."

**Bliss:** Concepts come back at spaced intervals based on actual memory
research. The week of your exam, stuff you learned three months ago is
still there — not because you crammed, but because the system surfaced
it at the right moments along the way.

### "AI chatbots hallucinate. I don't trust the numbers."

**Bliss:** Where possible, every answer is verified by Wolfram Alpha.
Past papers are pre-checked. The AI doesn't get to invent numbers. When
it's uncertain, it says so. When it's wrong, you can see exactly why.

### "Study apps use streaks, badges, and guilt-trip notifications to manipulate me."

**Bliss:** No streaks. No badges. No "you've lost your streak!"
notifications. No gamification. You study when you want to. The app
doesn't manipulate you — and the design decisions that would have
juiced engagement metrics weren't made.

### "I worry every app wants my data. I don't want my weak areas in some corporate database."

**Bliss:** Materials you upload stay in your browser. Progress you make
lives on your device. Your AI key (if you use one) never touches our
servers. Your weak areas are yours. This isn't a marketing claim — it's
how the app is architected. There's no server-side database of student
progress to leak.

### "I don't have access to top-tier teaching where I live."

**Bliss:** The lesson content doesn't change based on where you are.
Every concept is written with the same structure, depth, and trap-flagging
you'd find in well-regarded prep material — a student in a small town
gets the same lesson quality as a student in Kota or Bangalore. The
variable isn't access to the teaching; it's your willingness to engage
with it.

### "My foundations are shaky, which is making advanced topics impossible."

**Bliss:** When you get a wrong answer and it looks like a prerequisite
issue, Vidhya doesn't just show the solution. It walks the concept graph,
finds the specific upstream concept you're weakest on, and suggests
reviewing that first. The misconception gets repaired where it actually
lives, not where it's visible. Advanced topics unlock naturally once the
foundation stops slipping.

### "Coaching lectures move at the average pace. I'm either bored or lost."

**Bliss:** You move at your own pace, per concept. Crush linear algebra
in a day. Spend two weeks on measure theory. The app tracks mastery
per concept, not per class, so nothing is gated by a classroom schedule.
Fast learners don't wait. Slow learners don't feel pushed.

### "I'm embarrassed to ask 'basic' questions in front of classmates."

**Bliss:** Ask the same question ten different ways. No one sees. No one
judges. You can type "wait, what's a derivative again?" after you've
done 200 derivative problems, and the app just answers. The only thing
that matters is that you understand — not what your classmates would
think about what you don't.

### "My teacher explains, but I don't see why any of it actually matters."

**Bliss:** Every lesson opens with a hook — one sentence on why this
concept exists and what real problem it solves. Not "it's in the
syllabus." A genuine motivation — the question this concept was
invented to answer. You see the point before the proof, which makes
the proof stick.

### "Rigorous material is too abstract; intuitive explanations are too hand-wavy."

**Bliss:** Each lesson carries both layers. The intuition is a mental
picture anyone can hold onto — not dumbed-down, just visualized. The
formal statement is rigorous, in your exam's exact terminology — not
obscured in academic prose. You linger on whichever you need today.
Neither layer compromises on correctness.

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
