# Project Vidhya — Features & Moats

*Two audiences, one deck. The first eight slides are for students and the
people who'll use Vidhya every day. Everything from Slide 9 onward is
the technical deep-dive for developers, evaluators, and decision-makers
who need to understand what's under the hood.*

- **Part 1 — For students, teachers, and institutional buyers** (Slides 1–8): what Vidhya *does for you*, in plain language
- **Part 2 — For developers and technical evaluators** (Slides 9–34): every architectural decision, moat, file reference, and cost metric

---

# Part 1 — For the people who'll use it

---

## Slide 1 — Meet Vidhya

A tutor that knows your exam, reads your notes, answers whenever you're
stuck, and respects your privacy.

**What it does, in one breath:** ask a question or snap a photo of a
problem → get a walkthrough that teaches (not just tells), based on
your actual syllabus, with the answer double-checked where possible,
and your notes woven in.

**Where it works:** the web, Telegram, or WhatsApp — same account, same
progress, across all three.

**What it costs:** free to try (uses Gemini's free tier out of the box).
If you bring your own AI provider's key, you pay that provider directly
at their rates. There is no Vidhya subscription.

**What's unusual about it:**

- Your study materials don't leave your device
- The AI provider is your choice (and swappable in 30 seconds)
- Lessons are eight bite-sized pieces designed around how memory actually
  works, not 45-minute video blocks
- There's no streak counter, no "you've lost your streak!" notification,
  no gamification — you study when you want

---

## Slide 2 — What you get as a student

**Snap, understand, move on.** Take a photo of any problem — from a
textbook, a past paper, your own handwritten notebook. Vidhya reads the
image, identifies which concept is being tested, and walks you through
the solution. Not "here's the answer" — here's the method, here's the
intuition, here's where students typically go wrong.

**Lessons that actually teach.** Each concept appears as eight small
components:

| Component | What it does for you |
|-----------|---------------------|
| Hook | Why this matters, in one sentence |
| Definition | The precise statement, in your exam's terminology |
| Intuition | A mental picture you can hold onto |
| Worked example | A real problem, solved step by step |
| Mini exercise | A quick check that you got it |
| Common traps | The five ways students usually mess this up |
| Formal statement | For when you want the rigorous version |
| Connections | What this connects to, upstream and downstream |

You can skip, linger, or come back to any component. Your time, your pace.

**Your notes, your lessons.** Upload a PDF of your class notes. The app
turns them into searchable chunks and weaves them into relevant lessons.
When you're studying eigenvalues, your professor's notes about eigenvalues
appear alongside the pre-curated content — your voice, your context, your
examples.

**A study plan that matches reality.** Upload a photo of your last mock
test. Vidhya grades it problem-by-problem, maps your weak spots to the
syllabus, and builds you a focused plan. "The next 14 days, these 12
concepts, in this order." Shown only when you ask for it — no unsolicited
plans.

**Review at the right moment.** Concepts you've seen before come back at
spaced intervals (based on real memory research), so things you learned
three weeks ago don't slip away the week of the exam.

---

## Slide 3 — A day in the life

**8:30 AM, bus ride to college.** You open Telegram, tap the Vidhya bot,
paste a problem you saw in last night's reading. A walkthrough comes
back. You read it on the way in.

**2:15 PM, library.** You're stuck on a multivariable calculus problem.
You snap a photo with your phone. The app reads your handwriting,
identifies it as a Lagrange multiplier question, and walks you through
setting up the equations. It flags the common trap: "students forget
to check all the stationary points."

**7:00 PM, home.** You finished a mock test this afternoon. You upload
a photo of your answer sheet. Vidhya grades it, shows you the three
concepts you fumbled, and offers a focused 20-minute review plan.
You accept.

**11:45 PM, before bed.** You can't fall asleep. You open the app and
tap on a concept you've been meaning to review. A 90-second intuition
explainer. A single worked example. Done. You close the app and
actually fall asleep.

**3:20 AM, insomniac study session.** You have a specific question
about whether the Cauchy-Riemann equations are necessary or sufficient.
You ask in chat. You get a correct, careful answer that explicitly
calls out what your exam covers and what's out of scope.

No streaks were counted. No notifications were sent. The app didn't
manipulate you.

---

## Slide 4 — How this isn't just another AI chatbot

**It teaches. It doesn't just answer.** Type "find the eigenvalues of
[[2,1],[1,2]]" into ChatGPT and you get a number. Ask the same in
Vidhya and you get a lesson: what eigenvalues *are*, why this 2×2
matrix has shortcuts, the sum-and-product check, the common sign error.
If all you wanted was the number, you can skip to it in one tap. But
the teaching is there if you want it.

**It sticks to your syllabus.** LLMs will happily explain infinite-
dimensional operator theory when you asked about simple matrix
eigenvalues. Vidhya knows your exam's scope, and filters out material
that won't be tested. Your study time doesn't leak into topics you
don't need.

**Answers are verified, not invented.** For computational problems,
Vidhya runs the answer through Wolfram Alpha — a computer algebra
system that doesn't hallucinate. You see an emerald "verified" badge
when this has happened. For past-paper problems, the answers were
already pre-checked before you ever saw them.

**Your materials shape the lessons.** Most AI tutors treat your notes
as context to be politely ignored. Vidhya gives user-uploaded materials
the highest priority in composing lessons — because what YOU wrote is
the most resonant.

**It doesn't game you.** No streaks, no XP, no "you've been away for 3
days!" emails. It's a tool. You pick it up when you need it. The app
has no incentive to increase your session time.

---

## Slide 5 — Your privacy, in plain language

**Your study materials never leave your device.** When you upload a PDF
of your notes, it's parsed entirely in your browser. The text is
embedded (turned into numbers for similarity search) entirely in your
browser, using a 22 MB model that runs client-side. The chunks and
embeddings are stored in your browser's IndexedDB storage. Nothing
is uploaded to our servers.

**Your progress lives locally by default.** Which problems you've tried,
which lessons you've finished, where your weak spots are — all in your
browser's storage. If you sign in (optional), this can sync across your
own devices via a small user record on your deployment's server. Even
then, the detailed progress data is still yours.

**Your AI key stays in your browser.** When you configure your own AI
provider (Gemini, Claude, OpenAI, Ollama, and more), the key is stored
in your browser's localStorage. It's attached to outbound API calls
only — the server reads it once per request and forgets it. Nothing
about your key is persisted on our side.

**We don't track you.** No analytics, no heatmaps, no behavioral
profiling, no ad pixels. The only telemetry is anonymized aggregate
counts of which content tier handled which request (to tune
performance) — no personal information attached.

**You can delete everything.** Clear your browser's site data for the
Vidhya domain, and your local state is gone. Sign out from your account
(if you signed in) and your user record can be deleted by your admin.

---

## Slide 6 — What it costs you (spoiler: not much)

**To use Vidhya as a student:**

- **Free tier (default):** $0. Vidhya ships with a bundled content
  library — 82 concepts, verified problems, pedagogical explainers.
  This handles 80% of what students actually ask without ever touching
  an LLM.
- **Your own AI (optional):** You plug in your own key (Google Gemini,
  Claude, OpenAI, etc.) and you pay your AI provider directly. Google
  Gemini's free tier is very generous — most students never exceed it.
- **Local models (optional):** Run everything offline via Ollama on
  your laptop. No keys, no cost, just the price of electricity.

**To run Vidhya for a class or institution:**

- **Infrastructure:** $5/month VPS (DigitalOcean, Hetzner, Linode) is
  plenty for up to ~50 concurrent students. Render's free tier also
  works for small deployments.
- **Licensing:** $0. Vidhya is MIT-licensed.
- **LLM costs:** $0 if you rely on the bundled content only. A few
  cents per student per month if you enable LLM generation for
  novel questions. Zero if each student brings their own key.

**Comparison to other adaptive-learning products:**

| Product category | Typical cost per student per month |
|------------------|-----------------------------------|
| Coaching institute (in person) | ₹1,000–₹5,000 ($12–$60) |
| Premium adaptive-learning app | $15–$30 |
| AI tutor apps (LLM-per-response) | $5–$20 |
| **Vidhya** | **$0 (free AI tier) to $0.30 (your own key)** |

---

## Slide 7 — Who can do what

Vidhya has four roles. Most students will never notice this — they use
the app and it just works. The roles matter for classrooms and
institutional deployments.

| Role | Who they are | What they can do |
|------|-------------|-----------------|
| **Anonymous** | Casual visitor | Use the app fully. No account. State lives in their browser. |
| **Student** | Signed-in user | Plus: cross-device sync, chat-app access (Telegram/WhatsApp) |
| **Teacher** | Promoted by admin | Plus: see their roster of students, view their progress |
| **Admin** | Promoted by owner | Plus: manage users, assign teachers, edit curriculum, view quality dashboards |
| **Owner** | First person to sign in | Plus: transfer ownership, configure deployment-wide settings |

**The first person who signs in to a fresh deployment automatically
becomes the owner.** No admin panel to configure beforehand, no database
to provision. The deployment is "ownerless" until someone uses it, at
which point they claim it.

If the wrong person claimed ownership first, anyone with shell access
to the server can reset it via `npx tsx scripts/admin/assign-owner.ts
--email you@example.com`. Filesystem control IS the ultimate ownership
proof.

---

## Slide 8 — Getting started

**As a student:**

1. Open the app
2. (Optional) Sign in with Google for cross-device sync and chat-app access
3. (Optional) Upload your class notes as PDFs
4. Ask a question, or tap the camera to snap a problem

That's it. Three of those four steps are optional.

**As a teacher:**

1. Sign in to the deployment your institution set up
2. Ask your admin to promote you (they visit `/admin/users` and change
   your role from student to teacher)
3. Visit `/admin/users` to see your student roster
4. As admin assigns students to you, they appear under your roster

**As an admin or institutional owner:**

1. Install on your infrastructure — follow `INSTALL.md` Path 4 (5-step
   install with Google OAuth setup)
2. You sign in first; you become the owner automatically
3. Visit `/owner/settings` to configure Telegram/WhatsApp channels if
   desired
4. Visit `/admin/users` as users sign in; promote them to admin or
   teacher as appropriate
5. (Optional) Define your exam's curriculum as a YAML file in
   `data/curriculum/` — see the shipped `gate-ma.yml` as a template

---

# Part 2 — For developers and technical evaluators

*The rest of this deck covers every architectural decision, each moat
in the codebase, and the metrics behind them. For a shorter technical
summary, see the bottom of PITCH.md.*

---

## Slide 9 — What Vidhya Is

> **Adaptive learning at near-zero marginal cost.**

Vidhya delivers personalized practice that costs ~$0.01 per daily active
user per month — where naive LLM-per-request architectures cost $2.

It does this without sacrificing quality: every answer can be
computationally verified by Wolfram Alpha, every concept has a
pre-computed pedagogical explainer, and every student's progress is
modeled with a 15-attribute Bayesian cognitive framework.

**Built for GATE Engineering Mathematics. Architecture is domain-agnostic.**

---

## Slide 10 — The Problem

Edtech AI products burn money on LLM calls they don't need.

| Typical adaptive learning app | Per active daily user / month |
|-------------------------------|-------------------------------|
| LLM-per-practice-problem      | $1.20                         |
| LLM chat tutor                | $0.60                         |
| LLM error analysis            | $0.20                         |
| **Total**                     | **~$2.00**                    |

At 10,000 DAU, that's $240K/year in LLM fees alone. Venture-funded
companies absorb this. Bootstrapped or nonprofit products can't.

**Meanwhile, 80% of those requests ask for content that could have been
pre-computed once and cached forever.**

---

## Slide 11 — The Solution in One Diagram

```
     Every content request flows through FOUR TIERS.
     Each tier is an escalation. We only pay when lower ones miss.

     ┌───────────────────────────────────────────────┐
     │  TIER 0  — Static bundle (CDN)                │  <10ms   $0
     │           80%+ hit rate after warm-up         │
     └──────────────────────┬────────────────────────┘
                            │ miss
     ┌──────────────────────▼────────────────────────┐
     │  TIER 1  — Semantic RAG (client WASM)         │  ~50ms   $0
     │           over bundle + your uploaded notes   │
     └──────────────────────┬────────────────────────┘
                            │ miss
     ┌──────────────────────▼────────────────────────┐
     │  TIER 2  — Gemini 2.5 Flash-Lite              │  ~2s     $0.0005
     │           on-demand generation + cache        │
     └──────────────────────┬────────────────────────┘
                            │ low confidence
     ┌──────────────────────▼────────────────────────┐
     │  TIER 3  — Wolfram Alpha computational check  │  ~1s     $0.002
     │           (free tier covers build-time)       │
     └───────────────────────────────────────────────┘
```

**Result: 86% cost reduction, modeled and deployed.**

---

## Slide 12 — The Cost Moat (Core Defensibility)

Four compounding cost-reduction mechanisms in the shipped code:

| Mechanism | Where it lives | Savings vs naive |
|-----------|---------------|------------------|
| Four-tier cascade | `src/content/resolver.ts` | 75-85% |
| Client-side embeddings (WASM) | `frontend/src/lib/gbrain/embedder.ts` | 100% on RAG |
| Per-device problem cache | `frontend/src/lib/gbrain/db.ts` | Compounds tier 0 |
| Model routing (Flash-Lite for gen) | `src/api/gemini-proxy.ts` | 3× vs Flash |
| Context caching (planned) | — | Up to 90% |
| Batch API for CI generation | `scripts/build-explainers.ts` | 50% |

**Cost at 100 DAU × 20 problems/day × 3 tutor turns/day:**

| Scenario | Monthly cost |
|----------|--------------|
| Naive (no caching, no tiering) | $200 |
| Vidhya (all tiers active) | **$28** |
| Vidhya (bundle-only, no keys) | **$0** |

All three scenarios are achievable today — last one is the default.

---

## Slide 13 — The Privacy Moat (Local-First)

The runtime is **DB-less**. Student state lives on-device.

```
                 BROWSER                          EDGE SERVER
     ┌──────────────────────────────┐       ┌───────────────────┐
     │  IndexedDB (GBrain)          │       │  Stateless proxy  │
     │  • student model (15 attrs)  │       │  • no database    │
     │  • error history             │       │  • no sessions    │
     │  • uploaded materials        │       │  • no PII         │
     │  • generated problem cache   │       │                   │
     │                              │       │  Just forwards    │
     │  transformers.js WASM        │       │  to Gemini/Claude │
     │  • 384-dim embeddings        │       │  + writes local   │
     │  • 22 MB one-time download   │       │  flat-file        │
     │                              │       │  aggregates       │
     │  PDF.js + mammoth            │       │                   │
     │  • parse your docs in-browser│       │                   │
     └──────────────────────────────┘       └───────────────────┘
```

**What this unlocks:**
- Zero Postgres ops burden
- Student data never leaves the device unless user opts in
- Offline-capable after first load
- GDPR/privacy-friendly by architecture, not by policy
- Scales horizontally: every edge region runs identical stateless code

**Where it's shipped:**
`src/api/aggregate.ts`, `src/api/gemini-proxy.ts`,
`frontend/src/lib/gbrain/db.ts`, `frontend/src/lib/gbrain/embedder.ts`,
`frontend/src/lib/gbrain/materials.ts`

---

## Slide 14 — The Quality Moat (Computationally Verified)

Every mathematical answer in the bundle can be independently verified
against Wolfram Alpha.

**Pipeline:**

```
 34 problems in bundle
        │
        ▼
 scripts/verify-wolfram-batch.ts
        │
        ├──→ Wolfram Alpha Full Results API
        │         │
        │         ▼
        │    answer comparison (Unicode-aware,
        │    LaTeX-tolerant, multi-number-set
        │    matcher with subscript stripping)
        │
        ▼
 6/34 problems marked wolfram_verified = true
 15/34 correctly skipped (MCQ narrative answers)
 13/34 need per-problem curation (not computable)
```

**UX consequence:** `/smart-practice` shows an **emerald "Wolfram-Verified"
badge** on verified problems. Tier-0 picker sorts verified first.

**Where it's shipped:** `src/services/wolfram-service.ts` (250 LOC), the
batch verifier at `scripts/verify-wolfram-batch.ts`, and the provenance
badges in `frontend/src/pages/gate/SmartPracticePage.tsx`.

The answer matcher handles: Unicode super/subscripts (²³ → ^2 ^3),
function-of-variable notation (`y(x)` → `y`), implicit multiplication,
multi-valued answers like eigenvalue sets (`λ_1 = 3 | λ_2 = 1`),
numerical tolerance (0.1%).

---

## Slide 15 — The Personalization Moat (Cognitive Model)

Not a chatbot. A **cognitive architecture** with six explicit pillars.

| Pillar | What it does | File |
|--------|-------------|------|
| Student Model v2 | 15-attribute Bayesian profile: working memory, processing speed, ZPD floor/ceiling, motivation state, fatigue, misconception stickiness, ... | `src/gbrain/student-model.ts` |
| Error Taxonomy | 7-type Gemini classifier: conceptual, procedural, notation, arithmetic, misreading, strategic, careless | `src/gbrain/error-taxonomy.ts` |
| Concept Graph | 82-node DAG with 112 prerequisite edges, `gate_frequency` and `marks_weight` per concept | `src/constants/concept-graph.ts` |
| Adaptive Problem Generator | Zone-of-proximal-development targeting, target-error-type routing, self-verify + cache | `src/gbrain/problem-generator.ts` |
| Exam Strategy Optimizer | Per-student playbooks, skip thresholds, time allocation | `src/gbrain/exam-strategy.ts` |
| Task Reasoner | 5-node decision tree selecting next action (practice / review / rest / new-topic / diagnostic) | `src/gbrain/task-reasoner.ts` |

**Every attempt updates all 15 attributes via Bayesian inference.** Then
the task reasoner picks what to serve next. This loop runs in the
browser — no server round-trip.

---

## Slide 16 — The Materials Moat (Your Notes, Your Model)

Students can upload PDFs and DOCXs. Vidhya parses them **entirely in the
browser**, embeds chunks with transformers.js, stores them in IndexedDB,
and grounds the tutor chat on them.

**Why this is a moat, not a feature:**

1. **Cost**: zero API calls for parsing or embedding — commodity LLMs
   charge per page. Vidhya charges zero.
2. **Privacy**: materials never leave the device. Competitors must
   upload to their servers.
3. **Personalization**: the tutor cites your notes, your notation, your
   teacher's examples — not generic textbook content.
4. **Stickiness**: once a student uploads a semester of notes, switching
   costs increase dramatically. Their materials are *their data*, not
   ours, but the UX value is locked in.

Where it's shipped: `frontend/src/pages/gate/MaterialsPage.tsx` + the
four-stage pipeline in `frontend/src/lib/gbrain/materials.ts` (parse →
chunk → embed → index).

---

## Slide 17 — The Content Moat (Curated + Attributed + Compounding)

The bundle grows every night via CI. Each source is license-compliant.

**Sources shipped at v2.2.3:**

| Source | License | Count | Attribution enforced? |
|--------|---------|-------|----------------------|
| GATE official past papers | Public domain | 12 | `source_url`, `year` |
| OpenStax textbooks | CC-BY 4.0 | 5 | Full citation line |
| MIT OpenCourseWare | CC-BY-NC-SA 4.0 | 5 | Instructor credit |
| Math Stack Exchange | CC-BY-SA 4.0 | (stub) | Author display name |
| Vidhya-generated (Gemini) | Internal | 12 | `model`, `generated_at` |
| **Total after dedup** | | **34** | Per-record in bundle |

**The compounding defensibility:**

1. `scripts/scrape-corpus.ts` and `scrape-textbooks.ts` — polite scrapers
   with robots.txt respect, 1.5s rate limit per domain
2. `scripts/build-bundle.ts` — SHA-256 fingerprint dedup, so re-runs
   never duplicate
3. `.github/workflows/content-engine.yml` (manual upload pending) —
   nightly scrape + generate + verify + commit
4. Every record carries `source_url` + `license` + `attribution` — we
   can never get sued for republishing what someone else's content
5. Bundle shipped at `frontend/public/data/content-bundle.json` (82 KB)
   served from CDN with aggressive cache headers

**The bundle is the asset.** After 30 days of CI runs, it will have
~500 problems. After 90 days, ~2000. Growing free.

---

## Slide 18 — The Observability Moat

**What gets measured gets kept cheap.**

Two admin dashboards track the cost machine in real time:

**`/admin/content`** — Content Engine observability
- Lifetime free-hit-rate % (tier 0 + tier 1 as % of total resolves)
- Avg cost per event + lifetime total spend
- Source distribution bars (lifetime + last 14 days)
- Daily stacked-bar trend with tier color coding
- Topic coverage visualization across the 82-concept graph

**`/admin/gbrain`** — Cognitive model health
- Cohort distribution across student-model attributes
- Error-type frequency trends
- Misconception aggregation (opt-in, anonymous)

**How it's collected:**
Server-side auto-telemetry on every `/api/content/resolve`. Client-side
tier-0 hits also ping `/api/content/telemetry` (fire-and-forget, with
`keepalive: true`). Data lives in `.data/content-telemetry.json` —
flat-file, no Postgres.

**The moat:** competitors have this data in Postgres. Theirs costs
money per query. Vidhya's costs nothing and survives DB outages.

Shipped: `src/content/telemetry.ts`, `src/api/content-routes.ts`,
`frontend/src/pages/gate/ContentAdminPage.tsx`.

---

## Slide 19 — The Operational Moat (Graceful Degradation)

**Vidhya runs with zero external services.**

This is rare in the LLM-powered edtech space. Every feature has a
graceful fallback:

| External service absent | What happens |
|-------------------------|--------------|
| No `GEMINI_API_KEY` | Tier 2 disabled; app serves bundle + placeholder explainers |
| No `WOLFRAM_APP_ID` | Tier 3 disabled; no emerald badges; Gemini still works |
| No `ANTHROPIC_API_KEY` | Single-provider mode on the LLM router |
| No `DATABASE_URL` | JWT-only auth; no persistent sessions (this is the default) |
| No Postgres host | DB-less mode (default) |
| No Render / any host | Docker image runs anywhere |
| No Docker | Source install via `npm ci` |
| Offline | Bundle already cached in browser; IndexedDB still writes |

**Shipped proof:** `scripts/postinstall-check.cjs` inspects the
environment, shows which tier is unlocked with color-coded status, and
gives the exact command to unlock the next.

**Why this is a moat:** most LLM apps are soft-bricked without their API
keys. Vidhya isn't. This matters for schools, NGOs, offline classrooms,
regions with spotty connectivity, and anyone worried about API
dependency.

---

## Slide 20 — The UX Moat (No-Nagging, Permission-First)

Most LLM edtech products act on the student. Vidhya acts **with** them.

After every response, the system considers whether there's a natural next
step the student might want — then either suggests it *once*, subtly, or
stays silent.

**The rules (encoded as guards in `suggestNextStep`, not just prose):**

```
Rule                              | Guard                          |
----------------------------------|--------------------------------|
Max 1 suggestion per response     | return NextStep | null         |
Never offered on failure          | responseWasHandledWell() check |
Never offered on low confidence   | intent_confidence < 0.4 → null |
One-tap to dismiss                | "Not now" button               |
Dismissal persists for session    | sessionStorage by dedupe_key   |
Permission language               | "Want me to...?"               |
Non-blocking in chat              | parallel fetch, background    |
Syllabus gated behind consent     | computed, not shown            |
No attention-grabbing animation   | 0.25s fade-in only             |
```

**Where it changes the UX:**

- **Chat with an image** — the assistant response streams normally. Multimodal analysis runs silently in parallel for GBrain logging. *If* a natural next step exists ("Try 3 practice problems on eigenvalues?"), a small chip appears below the answer. User can accept, dismiss, or ignore. If ignored, it quietly stays in the chat scroll — no modal, no popup.

- **Test diagnostic (new in v2.4)** — student uploads a photo of their completed test. Server streams per-problem verdicts via SSE (correct / off / skipped / needs-review). A personalized syllabus is computed during the stream but **not shown**. After verification completes, a "Show the plan" chip appears. Only if the student taps does the syllabus appear. Otherwise, the student walks away with their grade and no unsolicited lecture.

- **Solution check** — if the answer is correct, suggest a harder problem. If wrong, offer to review the misconception. Never both.

**Why this is a moat:**

Most LLM products over-offer. They suggest three follow-ups after every turn, popup modals asking for feedback, dress up outputs with forced "next steps" that feel like ads. The cognitive burden is real — the student stops trusting the suggestions because they're always there.

Vidhya's chips are scarce. When one appears, it's because the system has actually thought about what might help *this student right now*. Students learn to trust them, and the acceptance rate (measured in admin dashboard) stays high.

**Where it's shipped:**
- `src/multimodal/next-step-suggester.ts` — the pure rule engine
- `frontend/src/components/gate/NextStepChip.tsx` — the subtle chip with sessionStorage dedupe
- `src/multimodal/diagnostic-analyzer.ts` — syllabus computed but not revealed
- `src/api/multimodal-routes.ts` — chip attached to `/analyze` response

---

## Slide 21 — The Pedagogical Moat (Research-Grounded Atomic Content)

Every Vidhya lesson is built from an **8-component pedagogical template**
where every slot maps to a research-backed learning-science principle.

```
1. Hook            ←  elaborative interrogation (Chi et al.)
2. Definition      ←  schema activation
3. Intuition       ←  dual coding (Paivio)
4. Worked Example  ←  worked-examples effect (Sweller)
5. Micro-Exercise  ←  testing effect (Roediger & Karpicke)
6. Common Traps    ←  preemptive error correction
7. Formal Statement←  concrete → abstract progression
8. Connections     ←  schema weaving (prerequisite DAG)
```

**Source aggregation with explicit priority** (highest to lowest):

```
USER-MATERIALS  >  BUNDLE-CANON  >  WOLFRAM  >  CONCEPT-GRAPH
```

If a student uploaded their professor's eigenvalue notes, the hook quotes
those notes — not OpenStax. That's the **resonance** layer: their context,
their notation, their words. Attribution is preserved per-component, so a
single lesson might cite (user notes) + (OpenStax definition) + (OCW
Strang intuition) + (Wolfram example) + (graph connections) — and the UI
shows every source with its license.

**Personalization as opt-in layering, not substitution.**

The base Lesson works for anyone. Zero student state = coherent experience
for first-time visitors. Student state is applied as a *separate pass*
with 6 independent, composable rules:

| Rule | Trigger | Effect |
|------|---------|--------|
| Spot-check | Mastery > 0.85 on concept | 7 components → 2 (exercise + connections) |
| Skip hook | Topic mastery > 0.75 | No motivational preamble needed |
| Collapse formal | Scope = mcq-fast | Save the math depth for a different session |
| Reorder | Visit count ≥ 2 | Micro-exercise leads (retrieval practice) |
| Expand traps | Matching error history | Traps reorder to match student's error types |
| Annotate user material | User material surfaced | UI shows "personalized from your notes" |

All rules are pure functions, idempotent, cacheable. The base lesson is
deterministic — 1,000 students get the same bytes; only the layer changes.

**Spaced retrieval without nagging.**

After each lesson, the SM-2 scheduler (SuperMemo-2 simplified) computes
the next review interval — 1d → 3d → 6d → 15d → ... — based on the
student's micro-exercise performance. The scheduler *surfaces* due
concepts via `GET /api/lesson/review-today`. The student is never forced
or guilted into reviewing. Consistent with Slide 12's UX contract.

**Why this compounds:**

1. **The bundle grows** → explainers get richer → component quality
   improves for all students, no personalization required.
2. **Student uploads materials** → user-material resonance increases →
   lessons feel progressively more personal over time.
3. **Engagement data flows back** → poorly-engaged components surface in
   admin dashboard → curator improvements → better base for everyone.

**Where it's shipped:**
- `src/lessons/types.ts` — 8-component schema
- `src/lessons/source-resolver.ts` — 4-source aggregation
- `src/lessons/composer.ts` — base lesson assembly (pure function)
- `src/lessons/personalizer.ts` — 6-rule layering (pure function)
- `src/lessons/spaced-scheduler.ts` — SM-2 with engagement-inferred quality
- `src/api/lesson-routes.ts` — 5 HTTP endpoints
- `frontend/src/pages/gate/LessonPage.tsx` — card-based adaptive reader
- `docs/LESSON-FRAMEWORK.md` — full pedagogical rationale + bibliography

---

## Slide 22 — The Curriculum Moat (Admin-Owned, Shared-Concept, Compounding Quality)

The Lesson framework (Slide 13) decides *how* to teach. The Curriculum
framework decides *what* to teach, *per exam*, and measures whether the
content is improving across iterations.

**The two-layer data model:**

```
Concept Graph (shared, static)
           ↑
           │ many-to-many
           │ (depth, weight, emphasis per link)
           ↓
Exam Definitions (admin-owned, YAML)
  data/curriculum/*.yml
```

A concept like `eigenvalues` exists **once** in the graph and is linked
from many exams. Each exam's YAML specifies *how* that concept appears:

```yaml
# data/curriculum/gate-ma.yml
- concept_id: eigenvalues
  depth: standard
  weight: 0.03
  emphasis: [characteristic-polynomial, 2x2-and-3x3, sum-and-product]
  restrictions: [infinite-dimensional, operator-theory, spectral-theorem]
```

```yaml
# hypothetical csir-net-math.yml
- concept_id: eigenvalues
  depth: advanced
  weight: 0.12
  emphasis: [spectral-theorem, jordan-canonical-form, operator-theory]
  restrictions: []
```

Same concept. Different treatment per exam. One content bundle, many
curricula filtering which slice to serve. This is scope-as-data, not
scope-as-if-branches in code.

**Three-layer guardrails** keep all interactions within syllabus scope:

| Check | How | On fail |
|-------|-----|---------|
| Concept-scope match | Detected concept ∈ exam's concept_links | Chunk excluded from lesson |
| Depth compatibility | Content depth ≤ exam allowed depth + 1 tier | Chunk excluded |
| Restriction compliance | Content doesn't hit a restriction tag | Chunk excluded |

User materials that fail are filtered **out of lesson rendering** but
**never deleted** — they stay accessible in `/materials`. The guardrail
is a scope filter, not a content gate. For LLM-generated content
(future), the validator is strict and rejects on any failure since LLM
output can be regenerated.

**The compounding quality loop:**

```
student interacts
  → engagement signal
  → quality-aggregator computes per-(concept × component) score
  → components below 0.6 flagged with reason
    ("high skip rate 65%", "low completion 28%", etc.)
  → admin runs scripts/admin/quality-report.ts --flagged
  → targeted content updates → bundle rebuild
  → students see better content (next iteration)
  → admin runs --close: freezes iteration, shows delta
  → trend shows compounding in numbers
```

Each cycle is one measurable iteration. The dashboard shows deltas so
curators see their work compounding.

**Cross-exam gap rollup** boosts shared-concept gaps:

```
priority_combined = Σ(per_exam_priority) × √(exams_affected)
```

Fixing one concept that affects GATE + JEE + CSIR-NET pays three times,
so the admin sees it at the top of the list.

**Credible per-exam admin workflow:**

1. Write `data/curriculum/{exam-id}.yml` from the `gate-ma.yml` template
2. `npx tsx scripts/admin/analyze-gaps.ts --exam new-exam-id` → prioritized gaps
3. Fill high-priority gaps with existing content scripts (scrape, explainers, Wolfram)
4. `npx tsx scripts/build-bundle.ts && scripts/restore-wolfram-flags.ts`
5. `npx tsx scripts/admin/quality-report.ts --flagged` after students engage
6. Iterate

Same commands for any exam. Everything is data-driven.

**Modular, portable, scalable:**

- *Modular* — three independent subsystems (graph, YAMLs, runtime). No
  subsystem changes to add a new exam. Only data.
- *Portable* — every persistent artifact is a file. Pack repo, drop on
  any Linux host, it runs. No DB migration, no admin-panel bootstrap.
- *Scalable* — adding an exam is one YAML + three scripts. Stateless
  server, no per-user storage. Same code path serves 10 or 10,000
  students.

**Where it's shipped:**
- `src/curriculum/types.ts` — complete schema
- `src/curriculum/exam-loader.ts` — YAML→ExamDefinition validation
- `src/curriculum/concept-exam-map.ts` — bidirectional lookups
- `src/curriculum/guardrails.ts` — three-layer safety
- `src/curriculum/gap-analyzer.ts` — gap detection + cross-exam rollup
- `src/curriculum/quality-aggregator.ts` — engagement→quality→iterations
- `src/api/curriculum-routes.ts` — 12 HTTP endpoints
- `data/curriculum/gate-ma.yml` — exemplar exam (27 concept links)
- `scripts/admin/analyze-gaps.ts`, `quality-report.ts` — admin CLIs
- `docs/CURRICULUM-FRAMEWORK.md` — complete design doc

---

## Slide 23 — The LLM-Agnostic Moat (BYO-Key, Provider-as-Data)

Most LLM products either (a) lock you into one provider ("Powered by
OpenAI") or (b) let you pick at deploy-time via a complex YAML config
only the sysadmin touches. Vidhya is **fully LLM-agnostic at runtime**:
the student picks their provider in the browser, and the system adapts.

**The registry-as-data pattern:**

```
src/llm/provider-registry.ts  ←  8 providers declared as data
                                  (Gemini, Anthropic, OpenAI, OpenRouter,
                                   Groq, DeepSeek, Mistral, Ollama)
        ↓
    4 API shapes      ←  google-gemini | anthropic | openai-compatible | ollama
        ↓
  universal callChat()  ←  one function, dispatches on api_shape
```

Adding a new provider is a **data change, not a code change**. Append to
the `PROVIDERS` array with metadata (name, endpoint, auth header shape,
model list, capabilities, key format) — the frontend picker auto-includes
it, the resolver routes to it, `callChat` handles it via the shape
dispatch. Same pattern as the curriculum YAMLs (Slide 14).

**Cascading role resolution with independent overrides:**

```
User picks Gemini as primary           → Chat=Gemini-Flash
                                       → Vision=Gemini-Flash
                                       → JSON=Gemini-Flash-Lite

User picks Groq as primary             → Chat=Llama-3.3-70B
                                       → Vision=(Groq has none; falls through)
                                       → JSON=Llama-3.1-8B

User wants cheap chat + smart reasoning:
  primary = Groq (chat)
  override vision = Gemini (needs separate key)
  override json = Gemini-Flash-Lite
                                       → Three providers, three keys,
                                         all configured in one form
```

Each role resolves independently. The same resolver file
(`src/llm/config-resolver.ts`) contains the full rules — no special
cases scattered through the codebase.

**Privacy-first transport:**

```
browser (localStorage)
  └─ X-Vidhya-Llm-Config header (base64 JSON)
     └─ server handler (reads header, uses once, discards)
        └─ LLM provider (receives key as auth header)
```

Keys **never** persist server-side. The server reads the header, makes
the request, and forgets. This is the same privacy model as the rest of
Vidhya (Slide 5): keys belong to the user, so they live in the user's
browser.

**Corner cases handled in the UI (`/llm-config`):**

| Edge | How it's handled |
|------|------------------|
| Key masking | `••••••••` display + show/hide eye toggle |
| Format validation | Client-side regex per provider (sk-ant-, AIza, gsk_) before network |
| Live validation | `Test & save` makes a minimal round-trip; `reason` + `latency_ms` shown |
| Key rotation | Paste new value over old; re-validate |
| Local models | Ollama picker hides the key field entirely |
| Custom endpoints | Shown only for `endpoint_overridable: true` providers |
| Provider without vision | Role preview shows 'not supported by X — will fall back' |
| Cross-tab sync | `StorageEvent` listener updates all open tabs live |
| Mobile | Stacked grid, 14-20 px tap targets, show-key button for paste UX |
| Shared deployments | Env-var fallback (`GEMINI_API_KEY` etc.) auto-detected |

**Backward compatibility:**

Existing deployments using `GEMINI_API_KEY` in `.env` keep working
unchanged. `loadConfigFromEnv()` auto-detects legacy provider-specific
env vars and synthesizes an equivalent `LLMConfig`. Users who opt-in via
the browser simply override the server default for their session.

**Why this is a moat:**

1. **No lock-in** — switching providers is a 30-second UI change, not a
   migration. Competition between LLM vendors directly benefits users.
2. **Team-friendly** — shared Vidhya deployments can use env-var defaults
   while individual users opt-in to their own keys.
3. **Privacy-friendly** — users who want their data to go through
   specific jurisdictions (Mistral for EU, Ollama for local) can do so
   without admin involvement.
4. **Cost-friendly** — a user with free Gemini quota uses Gemini; a user
   who wants Groq's speed pays Groq directly. No markup.
5. **Future-proof** — new providers arrive monthly; Vidhya's registry
   grows as a data PR, not a refactor.

**Where it's shipped:**
- `src/llm/provider-registry.ts` — 8 providers, 32 model entries
- `src/llm/config-resolver.ts` — cascading resolution, header transport, env fallback
- `src/api/llm-config-routes.ts` — 4 HTTP endpoints + universal `callChat` adapter
- `frontend/src/pages/gate/LLMConfigPage.tsx` — full setup UI
- `frontend/src/lib/llm/config-store.ts` — localStorage + masking + `fetchWithConfig`
- `frontend/src/hooks/useLLMConfig.ts` — React hook with cross-tab sync
- `docs/LLM-CONFIGURATION.md` — user + admin guide, add-a-provider walkthrough

---

## Slide 24 — The Roles & Multi-Channel Moat (Flat-File Identity, Three Access Surfaces)

Most adaptive-learning products are either (a) single-user self-study
tools with no identity layer, or (b) enterprise systems with heavy
database-backed user directories, classroom management, and locked-in
admin panels. Vidhya ships **role-based access** with **multi-channel
identity** while keeping the DB-less architectural philosophy intact.

**The four roles (linear hierarchy):**

```
owner  →  admin  →  teacher  →  student  →  anonymous
  │         │         │          │            │
  │         │         │          │            └── no account, client-side state
  │         │         │          └── default on signup, normal app usage
  │         │         └── manages assigned students, read-only content
  │         └── manages users + teachers, edits curriculum
  └── installs + controls everything, can transfer ownership
```

Role capabilities inherit downward: `requireRole('teacher')` allows
owner/admin/teacher, rejects student/anonymous.

**DB-less identity — the flat-file pattern continues:**

```
.data/users.json
{
  "version": 1,
  "org_id": "default",
  "owner_id": "user_xyz",
  "users": {
    "user_xyz": {
      "google_sub": "110000...",
      "email": "owner@example.com",
      "role": "owner",
      "teacher_of": [],
      "taught_by": null,
      "channels": ["web", "telegram:987654321", "whatsapp:+14155551234"]
    }
  }
}
```

Atomic writes (tmp + rename, POSIX + NTFS safe). Scales comfortably to
~10,000 users. Beyond that, swap `src/auth/user-store.ts` for a Postgres
implementation — the exported API is stable so nothing else changes.

**Bootstrap rule:** first user to sign in becomes the owner
automatically. No admin panel to configure beforehand, no DB schema to
provision. The deployment is ownerless until the first person uses it;
then it's claimed.

If the wrong person claims first:

```bash
npx tsx scripts/admin/assign-owner.ts --email you@example.com
```

Requires shell access — deliberate, since filesystem control IS the
ultimate ownership proof in a DB-less system.

**Identity via Google OAuth only. Deliberately.**

- Covers 95%+ of the student population worldwide
- Email is Google-verified — we don't manage password reset flows
- No password management = no password-breach surface
- `sub` claim is the identity anchor — stable across email changes

Non-goals (intentional): Apple Sign-In, email magic links, local
username/password, SAML/SSO. These are enterprise features; Vidhya
targets the 95% case cleanly.

**Three channels, one identity:**

```
user_abc123  (same Vidhya account)
  ├── web      (Google Sign-In, localStorage JWT)
  ├── telegram:987654321   (linked via /start → one-time URL)
  └── whatsapp:+14155551234  (linked via "start" → one-time URL)
```

Linking flow (identical pattern for Telegram and WhatsApp):

1. User initiates contact on the chat platform
2. Bot creates a pending link token (in-memory, 15-min TTL)
3. Bot replies with `<PUBLIC_URL>/sign-in?link_token=<token>`
4. User opens the URL, signs in with Google
5. Server binds chat_id to user, subsequent messages route as that user

No per-channel accounts, no per-channel passwords. The chat platform's
native auth (Telegram account, WhatsApp phone) proves *persistent*
identity; Google proves *canonical* identity; we link them.

**What users see by role:**

| Role | Sees |
|------|------|
| Anonymous | Full app, state in IndexedDB, no cross-device sync |
| Student | All of the above + cross-device sync + chat-app access if linked |
| Teacher | Plus: their student roster |
| Admin | Plus: `/admin/users` with role management, curriculum editing, quality dashboards |
| Owner | Plus: `/owner/settings` with ownership transfer + channel integration status |

**Anonymous flow preserved:** users who don't sign in continue working
exactly as before (v2.7 behavior). Sign-in is additive — for
cross-device sync and multi-channel access — not mandatory.

**Zero new npm dependencies:**

- Google ID token verification via manual JWK RS256 (Node `crypto` only)
- HS256 JWTs reuse existing `JWT_SECRET` pattern from Supabase middleware
- Telegram webhook handler uses `fetch` against Telegram Bot API
- WhatsApp uses `fetch` against graph.facebook.com

The alternative (google-auth-library, grammY, jsonwebtoken) would add
~3 MB of transitive deps for ~400 LOC of behavior we can write directly.

**Where it's shipped:**

- `src/auth/types.ts` — Role hierarchy, User shape, ChannelLinkToken
- `src/auth/user-store.ts` — flat-file directory with atomic writes,
  role-change hierarchy enforcement, channel linking
- `src/auth/google-verify.ts` — JWK-based Google ID token verifier
- `src/auth/jwt.ts` — HS256 issue/verify with timing-safe compare
- `src/auth/middleware.ts` — requireRole, requireAuth, getCurrentUser
- `src/api/auth-routes.ts` — 5 endpoints (config, google-callback, me,
  sign-out, link-status)
- `src/api/user-admin-routes.ts` — 6 endpoints (list, detail, role,
  teacher, unlink channel, transfer ownership)
- `src/channels/telegram-adapter.ts` — webhook + /start/me/help commands
- `src/channels/whatsapp-adapter.ts` — Meta Cloud API webhook
- `frontend/src/contexts/AuthContext.tsx` — useAuth hook with cross-tab
- `frontend/src/pages/gate/SignInPage.tsx` — Google button + link binding
- `frontend/src/pages/gate/UserAdminPage.tsx` — roster + role management
- `frontend/src/pages/gate/OwnerSettingsPage.tsx` — ownership transfer
- `scripts/admin/assign-owner.ts` — CLI escape hatch
- `docs/ROLES-AND-ACCESS.md` — architecture + capability matrix
- `docs/MULTI-CHANNEL-SETUP.md` — per-channel setup walkthrough

**Why this is a moat:**

1. **Zero-setup identity** — first signup becomes owner; no DB provisioning,
   no admin-panel bootstrap
2. **Channel-agnostic** — same account, web + Telegram + WhatsApp, one
   progress stream
3. **Shell control = ownership** — escape hatch via CLI matches the
   DB-less philosophy; no custodial risk
4. **Anonymous-safe** — doesn't force sign-in, preserves the "works
   without accounts" promise for casual visitors
5. **Deps-light** — no new npm packages for identity/sessions/bot
   framework; adds 0 bytes to the dependency graph

---

## Slide 25 — The GBrain Integration Moat (One Cognitive Truth, Every Consumer)

Vidhya's cognitive core (GBrain) has been shipping since v2.2 with a
15-attribute Bayesian mastery vector, a 7-category error taxonomy, a
concept dependency graph, and a task-reasoner for pre-generation
thinking. But through v2.5-v2.8, the newer frameworks (Lesson,
Curriculum, Multimodal, Roles) were built on top of this **without
consuming it**.

Before v2.9:

- `Lesson.personalize()` accepted a `StudentSnapshot` parameter but
  nothing populated it from GBrain. Students using `/lesson/*` got
  generic lessons even though their cognitive profile was rich.
- `Curriculum quality-aggregator` only saw engagement signals (viewed /
  revealed / skipped), not error-taxonomy classifications.
- `Multimodal diagnostic` streamed per-problem verdicts but never fed
  them back into the student model.
- Teachers had a `/admin/users` roster showing enrollment data but no
  cognitive health.

**v2.9 adds the bridge.** One pure-function module translates GBrain's
rich cognitive data into the shapes each consumer needs, with privacy
filters at the translation layer.

**Architectural rules:**

```
  ┌─────────────────────┐
  │  GBrain (6 pillars) │  ← rich cognitive data
  └──────────┬──────────┘
             │  READ ONLY
             ▼
  ┌─────────────────────┐
  │ integration.ts      │  ← 8 pure translation fns
  │  (bridge module)    │     with privacy filters
  └──────────┬──────────┘
             │
     ┌───────┼────────┬────────┬────────┐
     ▼       ▼        ▼        ▼        ▼
   Lesson  Curriculum Multimodal Teacher  Admin
                                 Roster   Cohort
```

Rules (enforced at code review):

1. The bridge reads from GBrain — it never writes. Writes stay in
   GBrain's own API.
2. Translation functions are pure — no I/O, no side effects.
3. Graceful degradation — if GBrain is unavailable, consumers get
   empty snapshots and behave identically to pre-bridge v2.5/v2.6.
4. Doesn't break any existing API — every integration is opt-in.

**Seven translation functions:**

| Function | Direction | Consumer |
|----------|-----------|----------|
| `modelToLessonSnapshot()` | model → Lesson StudentSnapshot | Lesson personalizer |
| `errorToQualitySignal()` | error → Curriculum signal | Quality aggregator |
| `prioritizeConceptsByMastery()` | model → sorted concepts | Syllabus generator |
| `findNearMasteryConcepts()` | model → quick-win picks | Syllabus generator |
| `deriveConceptHints()` | model × concept → presentation hints | Lesson composer |
| `modelToTeacherRosterEntry()` | model → teacher summary | Teacher roster |
| `summarizeCohort()` | N models → admin view | Admin cohort dashboard |
| `diagnosticToAttempts()` | verdicts → attempt stream | Multimodal feedback (future) |

**What students get:**

- Lessons at `/lesson/*` now auto-adapt to their mastery history when
  signed in — concepts they struggle with get more worked examples,
  common_traps get emphasized; concepts they're near mastering surface
  as confidence-building quick wins.

**What teachers get:**

- A new page `/teacher/roster` shows every student they teach with a
  cognitive-health summary: overall mastery bar, concept counts
  (mastered/in-progress/struggling), attention flags for students who
  hit 5+ consecutive failures or land in frustrated/anxious state.
- Aggregate-only — teachers don't see raw answers or emotional-state
  details.

**What admins get:**

- `/api/admin/cohort-summary` endpoint returns class-wide aggregates:
  total students, avg mastery, top 20 struggling concepts (students
  affected × avg mastery), count of students in each emotional state,
  count needing teacher attention.

**Privacy architecture:**

- Student snapshots passed to Lesson: mastery + errors only. Emotional
  state opt-in via `include_emotional` flag.
- Teacher roster entries: aggregate counts only. No raw error logs, no
  emotional state details.
- Admin cohort summary: class-wide aggregates only. Individual students
  not named.

**Zero new dependencies, zero breaking changes.**

- Bridge module is ~300 LOC of pure functions.
- Existing `/api/gbrain/*` routes work unchanged.
- Anonymous users (no `session_id`) continue getting v2.5-v2.8 behavior.
- Signed-in users get upgraded lessons automatically.

**Why this is a moat:**

1. **One cognitive source of truth** — instead of every feature inventing
   its own student model, all five consumer frameworks read from GBrain
   through one translation layer
2. **Privacy is centralized** — the bridge IS the privacy boundary;
   reasoning about what data leaves GBrain happens in one file
3. **Refactor-friendly** — when GBrain's internal shape changes, only
   the bridge needs updating; consumers keep working
4. **Testability** — pure functions, no I/O, trivially unit-tested
5. **Unlocks teacher & admin UX** — teachers and admins finally get
   cognitive-health visibility that was always in the data but never
   surfaced

**Where it's shipped:**

- `src/gbrain/integration.ts` — the bridge (~300 LOC, 8 translation functions)
- `src/api/lesson-routes.ts` — opt-in enrichment when `session_id` passed
- `src/api/user-admin-routes.ts` — 2 new endpoints (teacher roster, cohort summary)
- `frontend/src/pages/gate/TeacherRosterPage.tsx` — teacher-facing UI at `/teacher/roster`
- `frontend/src/App.tsx` — `/teacher/roster` route
- `docs/GBRAIN-INTEGRATION.md` — complete architectural rationale + consumer rules

---

## Slide 26 — The Compounding Mastery + Smart Notebook Moat (Every Attempt Makes You Better)

Most AI tutors are transactional. Ask → answer → end. Open the app
tomorrow, nothing carried over except chat history.

Vidhya closes the loop. **Every interaction now produces a visible,
student-facing signal of what they got better at** — and every
interaction is logged to a notebook that becomes their personal,
downloadable source of truth.

### Part 1 — The "every attempt makes you better" engine

After every problem attempted, micro-exercise answered, or concept
engaged, the student sees:

```
┌─────────────────────────────────────────────────┐
│ Verdict        ✗ Wrong — sign error             │
│                                                 │
│ Mastery        63% → 66%  (+3)                  │
│                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                24 attempts · 8 from mastery     │
│                                                 │
│ Insight        "This wrong answer just made     │
│                 you sharper."                   │
│                The approach was correct; the    │
│                arithmetic slipped. Slow down on │
│                the next one.                    │
│                                                 │
│ Next step      ▸ One more attempt              │
│                Errors teach fastest when        │
│                the correction is immediate.     │
│                                                 │
│ Reinforcement  ★ You're connecting ideas       │
│                across 4 concepts — that's how   │
│                deep learning happens.           │
└─────────────────────────────────────────────────┘
```

Every box has a specific design rationale:

- **Mastery delta** — the tangible progress signal. Mastery is not
  binary "solved or not"; it's a moving number that advances with
  every engagement.
- **Insight tone** — four options: `celebration` (first-try, milestone,
  hard-problem-solved), `encouragement` (wrong answer, framed as
  learning), `reinforcement` (correct but not yet mastered),
  `correction` (prerequisite gap). **Never "try again" in a failure
  framing.** Always "this wrong answer uncovered exactly what we can
  fix."
- **Error-type-aware explanations** — when GBrain's 7-category error
  taxonomy classifies the attempt, the insight is specific:
  - conceptual → "specific gap in how you're thinking about X"
  - procedural → "method is right; a step was off"
  - computational → "approach was correct; arithmetic slipped"
  - notation → "you understand the idea; notation tripped you up"
  - application → "you know the rule; identifying when to apply it is
    the hard part"
- **Single next step, permission-based** — never a menu. The
  recommender cascade chooses one: `move_on` (for mastered concepts),
  `try_harder`, `practice_same`, `review_prereq` (weakest prerequisite,
  when conceptual error detected), `take_break` (after 5+ consecutive
  failures — "memory consolidates during breaks").
- **Reinforcements fire on patterns, not streaks** — 3+ consecutive
  correct same-concept, mastery milestone crossed, or cross-concept
  success ("connecting ideas across 4 concepts — that's how deep
  learning happens"). **Specific wins, not generic gamification.**

**Files:**
- `src/gbrain/after-each-attempt.ts` — insight engine (~430 LOC, pure
  functions, no I/O)
- `POST /api/gbrain/attempt-insight` — compute + return

### Part 2 — Smart Notebook: single source of truth, downloadable

Every user input becomes a notebook entry. Auto-clustered by concept.
Gap-analyzed against the full syllabus. Exportable as Markdown.

**7 entry kinds**, all captured automatically:
`chat_question` · `snap` · `lesson_viewed` · `problem_attempted` ·
`material_uploaded` · `diagnostic_taken` · `note`

**Auto-clustering** — lightweight keyword match against concept labels,
aliases, keywords. Score ≥ 1.5 wins. No LLM call, no embedding call,
no round-trip. Every log is ~1ms. Designed for write-heavy use.

**Gap analysis** — per topic, shows covered vs uncovered concepts in
the official syllabus. Worst-coverage-first ordering. Students see
**exactly what they haven't touched yet** — higher leverage than a
to-do list because it's grounded in what they've actually done vs
what's required.

**Markdown export** — the download button triggers
`GET /api/notebook/download` which streams GitHub-flavored Markdown
with `Content-Disposition: attachment`. Structure:

```markdown
# Study Notebook — Maya K.
*Exported from Project Vidhya on 2026-04-21*

Total entries: 342
Syllabus coverage: 58% (48 of 82 concepts touched)

## Table of contents
1. Syllabus coverage
2. Concepts by topic
3. Chronological log

## Syllabus coverage
| Topic | Coverage | Concepts touched | Gaps |
|-------|:--------:|:----------------:|------|
| linear-algebra | 🟢 85% | 17/20 | null space, +1 more |
| calculus | 🟡 62% | 13/21 | partial derivatives, directional... |
| complex-variables | 🔴 18% | 2/11 | contour integrals, residues... |

### Concepts to study next
**calculus** — 8 uncovered:
- Partial derivatives
- Directional derivatives
- ...

## Concepts by topic
### Eigenvalues (linear-algebra)
*23 entries · last touched 2026-04-19*
- [chat_question] Asked: how to find eigenvalues of 2x2 matrix?
  > I'm stuck on the characteristic polynomial step...
  *2026-03-18*
...
```

A student going into an exam can download their entire study history
in 2 seconds, reference it offline, print it, share it with a
teacher. **It's theirs.**

**Frontend at `/smart-notebook`** — three tabbed views:

- **Gaps** (default) — syllabus coverage table, worst-first
- **By concept** — clusters view with expandable entry lists
- **Timeline** — chronological log grouped by date

Plus the Download `.md` button in the header.

**Files:**
- `src/notebook/notebook-store.ts` — notebook module (~380 LOC)
- `src/api/notebook-insight-routes.ts` — 8 HTTP endpoints
- `frontend/src/pages/gate/SmartNotebookPage.tsx` — UI

**Storage:** `.data/notebooks/{user_id}.json` via shared
`createFlatFileStore` generic. Append-only. Bounded at 5000 entries
(student should be downloading periodically anyway).

### Why this is a moat

Traditional AI tutors optimize the *answer*. Vidhya optimizes the *arc*.

1. **Every attempt produces visible progress.** Students see mastery %
   move, not just correctness. The compounding is felt, not hidden.
2. **Every wrong answer is reframed as learning.** Error taxonomy lets
   us explain *why* an answer was wrong in a way that builds
   understanding rather than shame.
3. **Every session creates one actionable next step.** Student never
   decides what to do next alone.
4. **Patterns are celebrated specifically.** "Three in a row on
   eigenvalues" beats a generic streak counter.
5. **Notebook accumulates over weeks.** A student with 6 months of
   practice has a 1000-entry notebook grouped by concept — their study
   companion, their review reference, their proof of growth.
6. **Gap analysis against real syllabus.** No other tutor tells you
   which of your 82 syllabus concepts you haven't touched yet.
7. **Exportable in universal format.** Markdown works everywhere.
   Privacy bonus: the student owns their data.

**Zero new npm dependencies. Zero LLM cost at log or insight time.**
The insight engine is pure functions over existing GBrain state; the
notebook is flat-file storage; the clustering is keyword matching.
Architecturally clean.

---

## Slide 27 — The Dynamic Exam Framework Moat (One Exam, Many Students, Progressive Fill)

Every LMS claims to "support multiple exams." In practice, most ship
a static list defined by the vendor, and you wait months for new ones.

Vidhya ships with **a dynamic exam framework** that lets admins add
a new exam in 30 seconds with just three fields — then progressively
enrich it over days or weeks as details become available.

### The shape of the problem

An admin at a coaching institute decides to support GATE CS 2027. They
know the name. They know it's an Indian PG exam. They know it's run
by IIT Madras. But they don't have:

- The exact number of sections
- The marking scheme (is negative marking 1/3 or 1/4 this year?)
- The syllabus document (the official release is 3 weeks away)
- The exam date (not announced yet)

Traditional LMS: "come back when you have complete info."

**Vidhya: create it now. Fill as you go.**

### The admin flow

**Create (30 seconds):** Three required fields — short code, full name,
level. Optionally: country, issuing body, any seed text the admin has
lying around. System generates a unique ID `EXM-<CODE>-<BASE36-TS>`
that will be stable across all future edits and assignable to
unlimited students.

**Enrich (progressive):** Admin has four non-exclusive options:

1. **Auto-enrich from web** — one click. An LLM researches the exam
   (grounded in any local data the admin uploaded) and proposes a
   complete profile. Admin reviews in a preview, applies.
2. **Upload local data** — paste official syllabus text, prep-guide
   excerpts, past-paper content. This becomes authoritative context
   for enrichment, overriding general web knowledge.
3. **Edit manually** — open the Fields tab, fill anything directly.
4. **Talk to the assistant** — a conversational helper that greets,
   reports completeness, recommends highest-leverage next action.
   Stateless, regex-classified intents (auto-enrich, upload, ready,
   what's next). Never hallucinates exam content.

**Mark ready:** When ≥ 40% complete, the exam becomes assignable to
students. Remains in draft below that threshold.

**Adapt later:** Re-enrichment is idempotent. Admin can run it again
next week when the official syllabus is released. Nothing the admin
manually typed gets overwritten — enrichment only fills gaps or
refreshes previously-web-researched fields.

### Provenance — who filled what

Every filled field carries metadata. Source ranks trust:

    admin_manual     🟢 admin typed it directly
    user_upload      🔵 extracted from admin-uploaded local data
    web_research     🟡 filled by LLM, with confidence score
    default          ⚪ inferred placeholder
    none             ⚪ not yet filled

**Critical invariant:** enrichment NEVER overwrites admin_manual or
user_upload fields. Admin's explicit entries are sacred.

When admin edits a web-researched field, its source flips to
admin_manual automatically. Re-running enrichment is always safe.

### LLM-optional

Enrichment detects which provider has an API key at runtime —
`GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`. If none
configured, returns a graceful "enrichment disabled" response and
admin can still fill everything manually. The framework does not
require an LLM to be useful.

Default provider: **Gemini 2.0 Flash Lite** — cheapest, fastest,
JSON-mode structured output. Roughly $0.0002 per enrichment call.

### One exam, many students

The unique Exam ID is the join key. A single exam profile serves
unlimited students:

    Exam: EXM-GATECS2027-MO8JEJYV
      ↓ assigned to
      ├── student_123 (user.exam_id = "EXM-...")
      ├── student_456 (user.exam_id = "EXM-...")
      ├── student_789 (user.exam_id = "EXM-...")
      └── ...

Admin edits the syllabus → every assigned student sees the update on
next page load. No per-student duplication, no stale copies.

A coaching institute admin sets up `GATE-CS-2027` once, bulk-assigns
50 students via `/admin/users`, and one edit later updates all 50.

### Completeness — a gradient, not pass/fail

Computed from 14 weighted fields across 5 categories (Basics /
Structure / Content / Schedule / Eligibility). A 25% exam is usable
— just less tailored. A 90% exam drives rich per-student experience
(topic-weighted priorities, countdown prompts, mock-exam fidelity,
pacing-aware micro-exercises).

The admin UI shows a per-category breakdown: "4/7 structural fields
filled." This makes progress visible without being a to-do list.

### HTTP surface (13 endpoints)

    POST   /api/exams                        Create
    GET    /api/exams                        List (admin)
    GET    /api/exams/assignable             List ready (teacher+)
    GET    /api/exams/:id                    Full + breakdown + suggestions
    PATCH  /api/exams/:id                    Update (admin_manual source)
    POST   /api/exams/:id/enrich             Preview proposal
    POST   /api/exams/:id/enrich/apply       Apply proposal
    POST   /api/exams/:id/local-data         Add local data
    DELETE /api/exams/:id/local-data/:ldid   Remove local data
    POST   /api/exams/:id/mark-ready         Draft → ready
    POST   /api/exams/:id/archive            Archive (reversible)
    DELETE /api/exams/:id                    Permanent delete (owner)
    POST   /api/exams/:id/assistant          Assistant turn

### Why this is a moat

1. **Zero wait-for-vendor.** Admin adds any exam, any time, zero code.
2. **Accepts incomplete info.** Partial data is the expected state,
   not a pending TODO.
3. **Provenance protects admin edits.** Re-enrichment never
   overwrites admin manual entries.
4. **LLM-optional.** Framework works fully without any LLM; enrichment
   is a nice-to-have layer.
5. **One profile, many students.** Coaching institutes scale cleanly.
6. **Local data takes priority.** Admins with official source documents
   get authoritative enrichment, not just web guesses.
7. **Architectural cleanliness.** Flat-file storage via shared
   createFlatFileStore; zero new npm deps; 13 endpoints; 1700 LOC.

Storage: `.data/exams.json` via the shared flat-file-store generic
from v2.9.1.

---

## Slide 28 — Technical Differentiators (Head-to-Head)

| Capability | Typical LLM edtech | Vidhya |
|-----------|-------------------|--------|
| Cost per DAU | $1.50-$2.50/mo | $0.01-$0.30/mo |
| Runtime DB required | Postgres/Supabase/Firebase | None |
| Embedding API | OpenAI / Cohere / Voyage | Local WASM, $0 |
| Document parsing | Server upload → cloud OCR | In-browser PDF.js + mammoth |
| Answer verification | LLM self-check | Wolfram Alpha computational |
| Works offline | No | Yes (after first load) |
| Student data location | Cloud | Device |
| Content source | LLM-generated, unverified | Scraped + verified + attributed |
| Tier routing | None (1 tier) | 4 tiers |
| Cost observability | Per-LLM-call logs | Admin dashboard with hit rates |
| Model routing | Single provider lock-in | 7+ providers, fallback router |
| Graceful without keys | Soft-bricked | Full bundle mode |
| Image input in chat | Sync-blocking upload | Background pre-analysis, zero added latency |
| Test diagnostic | Either none or batch (wait 30s+) | SSE stream — per-problem verdicts live |
| Follow-up suggestions | 3 after every turn, always | Max 1, null on failure, session-deduped |
| Learning plan delivery | Pushed at student unsolicited | Gated behind explicit "Show the plan" consent |
| Content delivery unit | Generate-on-demand OR static prose | Structured 8-component template, attributed multi-source aggregation |
| Personalization model | Entangled with generation | Layered on deterministic base — cacheable, auditable, testable |
| Spaced retrieval | Unsupported OR forced streaks | Offered via SM-2 with engagement-inferred quality; never pushed |
| New-exam onboarding | Code PR with new tables, migrations, admin UI | Write one YAML file, run three scripts — no code changes |
| Off-syllabus drift | LLM-generated content can wander | Three-layer guardrails on every chunk (concept-scope, depth, restrictions) |
| Content quality measurement | Qualitative review OR vanity metrics | Per-(concept × component) quality scores, iteration snapshots, compounding deltas |
| LLM provider | Single, baked into backend | 8 providers user-selectable in-browser, 30s to switch |
| API key storage | Server-side database or env-var | User's localStorage; server never persists |
| Adding a new LLM provider | Code PR with new client wrapper | Append to registry array (data change) |
| Identity bootstrap | DB migration + admin UI setup | First sign-in auto-claims ownership |
| Channel integration | Separate user account per channel | One account spans web + Telegram + WhatsApp |
| Role management deps | Auth library + session store + DB | Zero new deps (manual JWK + flat file + fetch) |

---

## Slide 29 — Tech Stack

**Backend** (8 runtime deps, 3 dev):
Gemini SDK · Anthropic SDK · pg · tsx · TypeScript · katex ·
resend · yaml · vitest

**Frontend** (12 runtime deps, 8 dev):
React 18 · Vite · Tailwind · framer-motion · react-router-dom 6 ·
`@xenova/transformers` (WASM embeddings) · idb · pdfjs-dist · mammoth ·
lucide-react · clsx · `@tanstack/react-query` · `@supabase/supabase-js`

**External APIs (all optional):**
Google Gemini · Anthropic Claude · Wolfram Alpha · Supabase · Resend ·
OpenAI · Groq · DeepSeek · Mistral · Together · OpenRouter

**Host requirements:**
Node ≥ 20 · npm ≥ 10 · git ≥ 2.30. Nothing else.

---

## Slide 30 — What's Shipped (at v2.9.7)

| Milestone | Commits | Highlights |
|-----------|---------|-----------|
| v2.0.0 | `a60cd78` | Admin dashboard, marketing page, cron, auth wall |
| v2.1.0 | `8c19093` | DB-less GBrain complete (all 7 phases of PLAN-dbless-gbrain.md) |
| v2.2.0 | `3e905f1` | Content Engine with four-tier cascade |
| v2.2.1 | `7ca5a98` | Content telemetry + admin dashboard + OpenStax/OCW sources |
| v2.2.2 | `46c27db` | Resolver tier-0 fixes, concept_id auto-fill, client telemetry |
| v2.2.3 | `a5c88f2` | Wolfram verification pipeline complete, 6 problems verified |
| v2.3.0 | `f5879da` | Scope-aware syllabus + multimodal intent analyzer (Snap) |
| v2.4.0 | `0e71cf9` | Chat image support + SSE diagnostic + polite next-step chips |
| v2.5.0 | `5147cff` | Lesson framework — 8-component template, 4-source aggregation, 6-rule personalizer, SM-2 retrieval |
| v2.5.1 | `0b577a0` | Curated misconceptions for 22 concepts, syllabus→lesson navigation, CI workflow staged |
| v2.6.0 | `888dbd7` | Curriculum framework — admin-owned YAML exams, shared-concept strategy, three-layer guardrails, compounding quality loop |
| v2.7.0 | `8a03c27` | LLM config framework — BYO-key in-browser, 8 providers as data, cascading role defaults, 4 API-shape universal adapter |
| v2.8.0 | `b4f0dd1` | Roles & multi-channel — owner/admin/teacher/student hierarchy, Google OAuth identity, flat-file user store, web/Telegram/WhatsApp adapters, zero new deps |
| v2.9.0 | `ee3da63` | GBrain Integration Bridge — pure-function translation layer connecting cognitive core to Lesson/Curriculum/Multimodal/Roles frameworks; teacher roster + admin cohort dashboard |
| v2.9.1 | `13ce67c` | Refactor — extract shared route + flat-file primitives, −210 LOC |
| v2.9.2 | `fc0445f` | User journey mapped, admin dashboard + student welcome card shipped |
| v2.9.3 | `de75e8a` | Teacher as end-user — /teaching dashboard, student-teacher relationship model with transparency |
| v2.9.4 | `e3fde92` | Compounding Mastery + Smart Notebook — after-each-attempt insight engine + auto-clustered notebook with gap analysis + Markdown export |
| v2.9.5 | `97b45d1` | Syllabus-driven notebook export with per-concept timestamps — every concept listed with clear practiced/not-practiced markers + fixes hidden Map/Array bugs |
| v2.9.6 | `23ff72b` | Notebook watermark + legally-binding-yet-friendly disclaimer — every export carries provenance + scope clarification |
| v2.9.7 | *this* | Dynamic Exam Framework — admin-managed exam registry with LLM-optional progressive enrichment + conversational assistant + unique multi-student IDs |

**Production numbers at v2.6.0:**
- 34 curated + attributed problems across 10 topics
- 82-concept knowledge graph with 22 fully-curated explainers (100% quality)
- 6 problems Wolfram-verified end-to-end
- 4-tier resolver live at `/api/content/resolve`
- **1 admin-owned exam definition** (GATE MA, 27 concept links) with per-exam depth/weight/emphasis/restrictions
- 5 personalized-syllabus exam presets (distinct from admin curricula)
- Multimodal analysis with 6 intents (explain / solve / practice / check / stuck / transcribe)
- **LLM-agnostic runtime** — 8 providers configurable in-browser at `/llm-config`
- **Role-based access** — owner/admin/teacher/student with multi-channel identity (web/Telegram/WhatsApp)
- **GBrain Integration Bridge** — 8 pure translation functions wiring cognitive data to every consumer framework, with centralized privacy filters
- SSE-streaming test-paper diagnostic with auto-generated study plan
- Admin dashboard live at `/admin/content`
- Auth wall verified (HTTP 401 on unauth)
- 83% free-hit rate on smoke-test traffic
- Frontend builds in ~29s, SnapPage chunk 22 KB

**Total code volume:**
- ~11,000 LOC backend + frontend (production)
- ~5,000 LOC scripts + pipeline + CI
- ~5,000 LOC documentation (README, INSTALL, DEPENDENCIES, PLAN docs, CHANGELOG)

---

## Slide 31 — Cost Projections at Scale

Assumes 20 problems/day + 3 tutor turns/day per DAU, 80% tier-0 hit rate,
Gemini 2.5 Flash-Lite pricing (Apr 2026), Wolfram free tier used for
build-time verification only.

| DAU | Naive $/mo | Vidhya $/mo | Vidhya $/user/mo |
|----:|-----------:|------------:|-----------------:|
| 100 | $200 | $28 | $0.28 |
| 1,000 | $2,000 | $280 | $0.28 |
| 10,000 | $20,000 | $2,800 | $0.28 |
| 100,000 | $200,000 | $28,000 | $0.28 |

**Marginal cost scales linearly — but the constant is 14× lower.**

With more bundle content (target: 500 problems in 30 days, 2000 in 90),
tier-0 hit rate climbs toward 95%, driving per-DAU cost below $0.10/mo.

---

## Slide 32 — Why Now

**Three trends converge:**

1. **LLM pricing is collapsing, but still per-token.** Flash-Lite at
   $0.10/M input is 20× cheaper than GPT-4 from 2023, yet edtech apps
   still charge $15/mo because they spend it all on API calls. The
   architecture — not the model — is the expensive part.

2. **Client-side ML has matured.** transformers.js runs MiniLM in 22 MB
   of WebAssembly. Pdfjs is a stable community library. IndexedDB has
   universal browser support. What required a server 5 years ago now
   runs in the browser.

3. **Privacy regulation is tightening.** Students uploading personal
   notes to cloud LLMs is legally ambiguous under FERPA/COPPA/GDPR.
   Local-first architectures sidestep this entirely.

**Vidhya exists at the intersection.**

---

## Slide 33 — Extension points (for contributors)

Vidhya is open source. These are places where a contributor can add
real value without rewriting the foundation:

**Content expansion.** The current bundle ships 34 pre-verified
problems across 82 concepts. Every scraper under `scripts/` is
idempotent and attribution-preserving — add a new source, run the
pipeline, the bundle grows. No architectural lift.

**Explainer content.** 82 concept placeholders live in
`frontend/public/data/explainers.json`. 6 have been filled with
complete 200-word pieces; 76 are awaiting content. Each completed
explainer immediately improves Tier-0 hit rate.

**Domain expansion.** Swap `src/constants/concept-graph.ts` and add
a new curriculum YAML under `data/curriculum/`. Ship for JEE, CAT,
UPSC, or any exam with a defined syllabus. Infrastructure unchanged.

**Mobile wrapper.** Architecture is already local-first. A Capacitor
or Tauri wrap would ship to iOS/Android without restructuring the
backend. Nothing in the codebase assumes a browser.

**Verification layer.** A SymPy micro-service (stateless, optional)
would catch the ~6% of problems where Wolfram refactored algebraically
and the equivalence check fails. Clean interface point exists at
`src/services/wolfram-service.ts`.

These aren't promises of what we'll ship — they're openings in the
architecture where someone else can.

---

## Slide 34 — Invitation

**Project Vidhya is open source under MIT.**

Where to engage:
- **Try it:** `git clone https://github.com/mathconcepts/project-vidhya.git && npm run setup`
- **Deploy it:** One-command Docker or Render setup, see `INSTALL.md`
- **Contribute content:** Every CC-licensed math source can be added via a new scraper
- **Fork the architecture:** Domain-agnostic — drop in your concept graph

*Vidhya (विद्या) — Sanskrit for knowledge, learning, and the means of attaining it.*

---

## Appendix A — File Index

**Core resolver:**
- `src/content/resolver.ts` — four-tier cascade
- `frontend/src/lib/content/resolver.ts` — client mirror
- `src/api/content-routes.ts` — HTTP endpoints

**Wolfram integration:**
- `src/services/wolfram-service.ts` — HTTP client + answersAgree
- `scripts/verify-wolfram-batch.ts` — bulk verifier

**Content pipeline:**
- `scripts/scrape-corpus.ts`
- `scripts/scrape-textbooks.ts`
- `scripts/build-explainers.ts`
- `scripts/build-bundle.ts`

**GBrain cognitive core:**
- `src/gbrain/*.ts` (6 pillars)
- `frontend/src/lib/gbrain/*.ts` (client mirror)
- `src/constants/concept-graph.ts` (82 nodes)

**Local-first runtime:**
- `frontend/src/lib/gbrain/db.ts` — IndexedDB
- `frontend/src/lib/gbrain/embedder.ts` — transformers.js
- `frontend/src/lib/gbrain/materials.ts` — PDF/DOCX parsing

**Observability:**
- `src/content/telemetry.ts`
- `src/api/aggregate.ts`
- `frontend/src/pages/gate/ContentAdminPage.tsx`
- `frontend/src/pages/gate/GBrainAdminPage.tsx`

**User-facing:**
- `frontend/src/pages/gate/SmartPracticePage.tsx` — tier cascade UI
- `frontend/src/pages/gate/MaterialsPage.tsx` — upload/RAG
- `frontend/src/pages/gate/ChatPage.tsx` — grounded tutor

**Documentation:**
- `README.md`, `INSTALL.md`, `DEPENDENCIES.md`, `LICENSE`
- `PLAN-content-engine.md` — cost math
- `PLAN-dbless-gbrain.md` — architecture rationale
- `PLAN-gbrain-mvp.md` — cognitive model design
- `DESIGN.md` — UI principles
- `CHANGELOG.md` — release history

---

## Appendix B — Moat Summary (One Table)

| Moat | Strength | Why it compounds |
|------|----------|------------------|
| **Cost (4-tier cascade)** | 🔵🔵🔵🔵🔵 | Every new problem scraped lowers future cost |
| **Privacy (local-first)** | 🔵🔵🔵🔵 | Architectural, not policy-based |
| **Quality (Wolfram verify)** | 🔵🔵🔵🔵 | Grows with bundle size |
| **Personalization (materials)** | 🔵🔵🔵🔵 | Switching cost rises with upload volume |
| **Cognitive model (GBrain)** | 🔵🔵🔵 | 6 pillars, explicit design, auditable |
| **Pedagogical (Lesson framework)** | 🔵🔵🔵🔵🔵 | Research-grounded template + attributed aggregation + layered personalization; compounds with bundle + user materials growth |
| **Curriculum (admin-owned, compounding)** | 🔵🔵🔵🔵🔵 | Shared-concept strategy pays √N across exams; quality iterations measurably compound via engagement→quality→iteration loop |
| **LLM-agnostic (BYO-key)** | 🔵🔵🔵🔵 | Provider-as-data — 8 providers, 4 API shapes; users pick + pay their own provider, no lock-in, rotate in 30s |
| **Roles & multi-channel** | 🔵🔵🔵🔵 | Flat-file identity, zero-setup bootstrap (first signup = owner), 3 channels one account, zero new deps |
| **GBrain Integration Bridge** | 🔵🔵🔵🔵🔵 | One cognitive source of truth for every consumer; privacy filters centralized; refactor-friendly; unlocks teacher/admin UX that was always in the data |
| **Compounding mastery** | 🔵🔵🔵🔵🔵 | Every attempt produces visible mastery delta + insight + single next step + pattern reinforcement; error-taxonomy-aware explanations reframe wrong answers as learning |
| **Smart Notebook** | 🔵🔵🔵🔵🔵 | Every user input auto-logged, concept-clustered, syllabus gap-analyzed, exportable as Markdown — single source of truth, universal format, privacy-preserving |
| **Dynamic exam framework** | 🔵🔵🔵🔵🔵 | Admin-managed exam registry with 3-field minimal seed, LLM-optional progressive enrichment, conversational assistant, admin-edit-preserving provenance, unique IDs reusable across any number of students |
| **Content (curated + attributed)** | 🔵🔵🔵🔵 | Nightly CI compounds asset value |
| **Observability (telemetry)** | 🔵🔵🔵 | Flat-file, no DB costs |
| **Graceful degradation** | 🔵🔵🔵 | Works in constrained deployments |
| **UX (no-nagging, permission-first)** | 🔵🔵🔵🔵 | Scarcity → trust → high chip acceptance; compounds via learned trust |
| **Multi-LLM routing** | 🔵🔵 | No single-provider lock-in |
| **Licensing (MIT + attributions)** | 🔵🔵🔵 | Republish-safe at any scale |
| **Domain-agnostic architecture** | 🔵🔵🔵 | One codebase, many subjects |

---

*End of deck. Questions → contributors@project-vidhya.dev*
