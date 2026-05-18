# Project Vidhya

> # **The ingredients every champion needs — for your exam, your goals, your breakthrough.**
>
> *Calm. Strategy. Focus. Compounding. Vidhya builds all four in you, every time you practise.*

---

## The moment we built this for

It's 2 a.m. She's stuck on an eigenvalue problem. Her exam is in four weeks. **The coaching centre closed at nine.** The top YouTube explanation runs forty-five minutes and assumes she already understands the thing she's trying to learn.

She opens her phone, takes a photo of the problem, and gets her answer — not just the number, but the method, the intuition, the trap she would have fallen into, the specific concept she's weak on, and three calibrated problems that will fix it. **Ten minutes later she's moved on.**

The next problem she tries is a JEE 2023 conics question. She freezes. *Pole–polar duality?* It's not in her Tamil Nadu State Board textbook — she's never seen the technique. Vidhya already knows she's a **TN Class 12 student preparing for JEE Main**, so the planner has surfaced a bridge explainer that opens with what she does know from chapter 5 — eccentricity, focus, directrix — and then steps her, in two short pages, into the exam-level technique. **The gap she didn't know existed is the gap that just closed.**

The next morning the app doesn't guilt-ping her about a broken streak. It just remembers where she stopped, and picks up when she's ready. **On exam day she walks in like a champion who has trained right.**

That's Vidhya.

---

## The four ingredients

| | What it gives you | How we make it real |
|---|---|---|
| 📚 **Compounding** | Every rep adds to the next. Twelve short sessions add up like one long session; what you cracked in January is still with you in March. | A Bayesian student model remembers every mistake, breakthrough, and weak spot. Every shipped change is tracked as an experiment with a measured **mastery lift** + **PYQ accuracy delta against a frozen holdout bank** before it becomes canonical. |
| 🎯 **Strategy** | The right priority at the right distance from your exam. Six months out: base-building. Three days out: revision on weakest topics. | Exam-proximity-aware planner. Your registered dates reshape every priority weighting as the day approaches. The 5-layer **PersonalizedSelector** re-ranks atoms within each session for *your* concept history, *your* representation mode, *your* recent misconceptions. |
| 🧘 **Calm** | No streaks. No shame. No guilt pings. Your data stays yours — notes, progress, AI key all on your device. | Stateless server. No notification service, no streak counter. Seven CI invariants block any future PR from sprouting `personalized_*` / `tracked_*` / `behavior_*` schema columns or echoing scorer internals to the wire. **Surveillance-cliff discipline written into the test suite.** |
| 🌍 **Focus** | World-class teaching on any phone, anywhere, online or off. Same lesson, same depth, whether on fibre or 3G. | Four-tier content engine. ~80% of requests hit a pre-built bundle delivered once and cached. Atoms ship with optional GIF + TTS sidecars; A/B-gated narration cost-capped at 50 active experiments. |

Every ingredient defended in code, not in copy. Read the tests, run the smokes, inspect every layer.

---

## Why it exists

> ### 💡 **The stressed student is the profitable one. Vidhya refuses that trade.**

Every existing exam-prep product makes the same bargain: to get personalised prep, you give up your data, your time, your peace of mind, and usually your money. Streak fatigue, push notifications, lock-screen guilt — **none of it was ever going to teach you calculus.**

Vidhya makes a different trade. Sessions compound; your provider key stays yours; the price of the AI is whatever the provider charges you directly. A student logging in from a small town gets the same lesson as a student in the most expensive coaching centre anywhere. **Geography stops being the limit.**

📖 *Full positioning in [POSITIONING.md](./POSITIONING.md). Thirty-second version in [PITCH.md](./PITCH.md).*

---

## What it actually does

Ask a question in chat. Upload a PDF of your class notes. Snap a photo of a problem. Vidhya tries the cheapest path that works: a pre-built bundle of high-value concepts, then client-side semantic search over your uploads, then a live LLM call. Mathematical answers get verified against Wolfram Alpha where possible.

The lesson you see isn't a one-size-fits-all atom. It's been **re-ranked for your mastery state, your representation preference, and the misconception you tripped on last week** — and if a generic prompt would have produced a different version, an admin can show the side-by-side proof. The planner budgets for the time you actually have — three minutes at a bus stop, sixty on a weekend. When your exam is three days out, the app stops telling you to rest; it switches to revision. Everything reaches you through web, Telegram, or WhatsApp — same account, same progress, three surfaces.

**If you came in through school — CBSE, ICSE, Tamil Nadu State Board, Karnataka PUE, Maharashtra HSC — the app knows that too.** Pick your board, grade, and subject at `/knowledge`; we map it to the entrance exams it leads into (JEE Main, BITSAT, UGEE, NEET) and surface **bridge content** that connects what you already know from your textbook to what the exam expects. The bridge isn't a separate course you have to take — it's three cards on your planner that GBrain ranked from where *you* are right now.

📖 *Forty-eight-release feature ledger: [FEATURES.md](./FEATURES.md). Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md). Syllabus bridge framework: [docs/SYLLABUS_BRIDGE.md](./docs/SYLLABUS_BRIDGE.md). Demo runbook: [docs/moat-demo.md](./docs/moat-demo.md).*

---

## What's underneath

A React SPA backed by a stateless Node server. **Your student model and uploaded notes live in IndexedDB.** A 22 MB WASM embedding model ships once; from then on embeddings are computed locally. The server is mostly a thin LLM proxy. **Nothing is in Postgres. Nothing requires it.** A five-dollar VPS handles a class of fifty.

Thirteen modules: core, auth, content, rendering, channels, learning, exams, lifecycle, teaching, content-library, content-studio, operator, orchestrator. Each declares its public surface in `src/modules/<name>/index.ts` and registers in `modules.yaml`. The orchestrator composes them per deployment profile.

📖 *Production-readiness in [PRODUCTION.md](./PRODUCTION.md).*

---

## Life with Vidhya — three vignettes

The features only matter if they change what happens when you sit down to study. Three concrete scenes:

#### 🎓 The TN Board student on her own at 11 p.m.

She's halfway through a JEE practice paper. Question 14: "Find the equation of the chord of contact from (3, 4) to the parabola y² = 8x." Her TN textbook taught her about chords and tangents — but never *chord of contact*. Twenty minutes ago she would have closed the book.

She opens Vidhya. The planner is already showing **TN → JEE bridge cards** ranked by what GBrain says she needs most — pole-polar duality is #2 because she's at 0% mastery on JEE coordinate geometry and the difficulty jump from her textbook is 4 out of 5. She taps **Read**. The card opens in place. First paragraph: "From your TN textbook chapter 5 you already know the tangent equation T = 0. JEE's chord of contact is *exactly that equation applied at an external point* — same formula, new framing." Three lines of working, one bridge example, done. She closes the card. Question 14 takes her five minutes.

She taps 👍 on the way out. **GBrain notes the helpful rating. The content stays.**

#### 🧑‍🏫 The teacher who finally knows where the class is stuck

Monday morning, Mr. Selvam pulls up `/teacher/syllabus-coverage`. His roster of 18 Class-12 students loads automatically. He picks TN-12-MATH → JEE Main, hits **Run gap report**.

Twelve seconds later he has the answer he's been guessing at all term: **15 of 18 are stuck at parabola/ellipse JEE depth.** Eleven are stuck at de Moivre's theorem applied to roots of unity. Six are still wobbly on Cramer's rule consistency cases. Each row tells him what to do — *"Run a class session — most students need this"* on the first one, *"Assign as homework — about a third of the class is stuck"* on the third. **The framework already knows where the editorial bridge note lives**, so he can grab the talking points for class without writing his lesson plan from scratch.

For the second-most-stuck topic, there's no generated content yet. He clicks **Generate material for this gap**. By his next free period the bridge explainer, two worked examples, and a graduated practice set are ready. Cost: about three cents. **He never opened the admin panel.**

#### 👨‍💼 The admin who used to burn tokens on the wrong content

Last month, the admin generated the full TN → JEE pack — 77 units, $0.017. Two weeks in, the framework's feedback inbox tells a story: nine students rated `conics.parabola-ellipse-hyperbola — bridge explainer` "unclear", three rated it "wrong". The content is **auto-flagged for regeneration**.

Today the admin opens the wizard, jumps to step 5, sees the amber banner: *3 content pieces flagged for regeneration*. One click on **Regenerate flagged**. A targeted batch runs — only the bad units, not the whole pack. Better content arrives in two minutes. Cost: under a cent. **Token spend follows real student signal, not a hunch.**

---

## Built since the four ingredients

The ingredients are the promise. These are the systems that defend it.

| | What it does | Where it lives |
|---|---|---|
| 🧪 **Content R&D Loop** | Every batch of generated content is a `GenerationRun` with a budget, a cost meter, and an auto-wrapping experiment. The nightly **learnings ledger** computes lift via Welch's t-test (mastery delta) and a two-proportion z-test (PYQ accuracy delta against the holdout). **Auto-promotes winners** to canonical, **auto-demotes losers** so they stop being served. Sundays it can open a digest PR. | `src/experiments/`, `src/generation/`, `src/jobs/learnings-ledger.ts`, `/admin/content-rd` |
| 🎓 **Curriculum R&D** | Atoms are now grouped into **curriculum_units** — single-concept bundles of 5–15 atoms with declared learning objectives and explicit PYQ alignment. A Tier-4 **PedagogyVerifier** scores units against a 5-criterion rubric (concept fidelity, sequence, objective coverage, interactive correctness, distractor quality). **PYQ holdout** (~30/exam, stratified) is locked at seed time and never moves. | `src/curriculum/`, `src/generation/curriculum-unit-orchestrator.ts`, `src/content/verifiers/pedagogy-verifier.ts`, `/admin/holdout` |
| 🧬 **Personalization** | A 5-layer weighted selector (syllabus / exam / cohort / user-mastery / user-error / realtime) re-ranks atoms per session via a single `lesson-wire.ts` integration point. **Phase B** threads the student's representation mode, motivation state, recent misconceptions, prior curriculum, and shaky prerequisites *into the LLM prompt* — so the atom is generated FOR them, not just SELECTED for them. Anonymous and control-bucket sessions short-circuit unchanged. | `src/personalization/` |
| 🎭 **Demo-as-Moat** | A scripted **persona** drives a deterministic trial through any concept (`npm run demo:scenario priya-cbse-12-anxious limits-jee`), pauses on interactive atoms for human input, and dumps a regression-quality `trial.json`. The `/admin/scenarios` page renders each atom **side-by-side with what a generic prompt would have produced** — the personalization moat made visible, on screen. | `data/personas/`, `src/scenarios/`, `/admin/scenarios` |
| 🛡 **Surveillance-cliff invariants** | **7 CI tests** block any future PR from: adding `personalized_*` / `tracked_*` / `behavior_*` / `student_context_*` schema columns; writing to the DB from `realtime-nudge.ts`; importing personalization from `src/api/*` (one allowlisted helper) or from any frontend file; pasting real UUIDs into persona YAML; echoing scorer internals to the wire. Calm is enforced by tests, not by promise. | `src/personalization/__tests__/surveillance-invariants.test.ts` |
| 🎬 **Interactives + multi-modal sidecars** | Three dependency-free interactive atom kinds (Manipulable / Simulation / GuidedWalkthrough) ride next to atom bodies. GIF scenes render via `gifenc` (sync, pure-JS); TTS narration via OpenAI tts-1, A/B-gated and cost-capped. `prefers-reduced-motion` honoured. | `frontend/src/components/lesson/interactives/`, `src/content/concept-orchestrator/{gif,tts}-generator.ts` |
| 📦 **Snapshot mechanism** | Every state worth deploying is a triple: git tag + Docker image + markdown manifest. `npm run snapshot -- "exam-pack-bitsat"` writes a manifest with SHA, branch, version, migration count, exam packs, and a notes section for hypothesis + feedback. Reproducible experiments at scale. | `scripts/snapshot.sh`, `docs/snapshots/` |
| ⚡ **Batch generation** | Content generation runs through provider Batch APIs (Gemini Batch first; OpenAI/Anthropic adapter-ready) — **~50% cheaper, no rate-limit pain.** Five-state machine (`queued → prepared → submitted → downloading → processing → complete`) with mid-flight resume: every transition writes to DB before the next side-effect, so a crash mid-anything is recoverable from the persisted state alone. Per-job idempotency via deterministic `custom_id`. Cost cap rejects over-budget batches BEFORE provider call. Boot poller + 5-min cron driving the same code path. | `src/generation/batch/`, `src/jobs/scheduler.ts:batchPoller` |
| 📐 **Content blueprints** | The spec layer between intent and generation. Each blueprint is a human-editable plan that explicitly names stages, atom kinds, and constraints — plus the `rationale_id` for every choice — so the lift ledger can correlate spec shape with measured outcomes. Locked v1 contract; deterministic template engine produces sane defaults; operator overrides via JSON edit + ETag concurrency. The "explicit decisions before generation" surface that makes the personalization moat legible to operators. | `src/blueprints/`, `/admin/blueprints` |
| 🧭 **Admin journey UX** | A guided-assist layer over the admin pages. `/admin/journey` shows an 8-milestone progress timeline derived from existing DB state — admin always sees where they are + the next high-leverage move, never gated. `/admin/decisions` is a chronological feed of admin actions (rulesets, blueprints, runs); `/admin/cohort` surfaces only the (max 10) students who need attention with one-click `student-audit` drill-in; lift ledger rows render an inline action sentence ("won — write a ruleset" / "trending toward loss — investigate") with one-click CTAs. **Suggestions are advice, never auto-applied** — humans stay in the loop on compounding decisions. | `src/api/admin-journey-routes.ts`, `src/api/admin-decisions-routes.ts`, `src/api/admin-cohort-routes.ts`, `src/experiments/ledger-suggestions.ts` |
| 🌉 **Syllabus Bridge** | A framework that maps a school curriculum (Tamil Nadu Class 12 Maths today; CBSE/ICSE/KAR-PUE/MAH-HSC structurally ready) to an entrance exam (JEE Main today) and generates **intuitive bridge content** that ramps from textbook level to exam level. 23 mapping entries × 4 gap classes (aligned / depth-gap / breadth-gap / foundation) → 77 content units, **~58k tokens, ~$0.017** for the full TN → JEE pack at Gemini Flash pricing. Admin walks a **5-step wizard** (`/admin/syllabus-bridge`): pick mapping → review gap → personalise → generate → review & feedback. Each bridge entry carries an **editorial `bridge_note`** that flows straight into the LLM prompt, so generated content explicitly says "from your TN chapter 5 you already know X; JEE adds Y" instead of producing generic exam practice. Extending to a new board = two files. | `src/syllabus-bridge/`, `src/api/syllabus-bridge-routes.ts`, `frontend/src/pages/app/SyllabusBridgePage.tsx`, [docs/SYLLABUS_BRIDGE.md](./docs/SYLLABUS_BRIDGE.md) |
| 🧠 **GBrain × Bridge** | The student-model engine connects to the bridge framework so the same pack adapts per student and per cohort. **Implicit** (always on): `personalizePromptForStudent` injects motivation, working memory, weak topics, prerequisite gaps into every generation prompt — same template, calibrated body. `recommendBridgeContent` ranks entries on the student's planner — `need_score = 0.50·(1−mastery) + 0.30·(jump/5) + 0.15·gap_class_weight + 0.05·motivation`. **Explicit**: `rankEntriesForStudent` powers the admin **Preview Rank** button and **Smart Priority** batches (top-10 gaps only — saves cost for solo prep). `cohortGapReport` powers the teacher's class view at `/teacher/syllabus-coverage` with per-entry recommended action ("Run a class session" / "Assign as homework" / "Light-touch follow-up"). | `src/syllabus-bridge/gbrain-integration.ts`, `frontend/src/components/app/BridgeRecommendationsCard.tsx`, `frontend/src/pages/app/TeacherSyllabusCoveragePage.tsx` |
| 👍 **Feedback-driven regeneration** | Students and teachers rate generated content with **6 ratings** (helpful / not-helpful / wrong / unclear / too-easy / too-hard). The framework auto-flips `flagged_for_regen` when thresholds cross — **3+ wrong → factual error**; **4+ not-helpful with <25% helpful → wrong angle**; **3+ unclear with <33% helpful → re-write**. The admin sees an amber banner with one-click **Regenerate flagged** — runs a targeted batch on just the flagged unit_ids, no others. Token spend follows real signal. | `src/syllabus-bridge/feedback-store.ts`, 9 tests in `feedback-store.test.ts` |

📖 *Full development context lives in [CLAUDE.md](./CLAUDE.md). Detailed personalisation + R&D pipelines documented inline.*

---

## Try it live

**[→ Open live demo](https://vidhya-demo.onrender.com/demo-login)** — logs you in as a demo student instantly. No account needed.

---

## Quick start

Three deployment paths. Pick one.

```bash
# Local — runs on your laptop, no keys required
git clone https://github.com/mathconcepts/project-vidhya
cd project-vidhya
npm run demo:setup
npm run demo:start
# open http://localhost:3000/demo.html
```

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mathconcepts/project-vidhya) — one-click public URL, free tier.

For Netlify (frontend) + Render (backend) hybrid: see [DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md).

For the full local stack with Postgres + pgvector + auto-migrations (production parity):

```bash
docker compose up --build        # http://localhost:8080
```

| | Local | Render | Netlify + Render | Docker (full stack) |
|---|---|---|---|---|
| Public URL | no | ✓ | ✓ | no |
| Branch previews | no | no | ✓ | no |
| Real Postgres | no | ✓ (Supabase) | ✓ | ✓ (local) |
| Setup time | 5 min | 5 min | 10 min | 5 min |
| Cost | $0 | $0 (free tier) | $0 (both free tiers) | $0 |

📖 *[DEMO.md](./DEMO.md) for the local walkthrough. [DEPLOY.md](./DEPLOY.md) for Render. [PRODUCTION.md](./PRODUCTION.md) before any real-user deployment. [docs/moat-demo.md](./docs/moat-demo.md) for the 3-minute persona-scenarios demo.*

---

## Where to go next

| You are | Read |
|---|---|
| 🎓 A student | [PITCH.md](./PITCH.md) → [INSTALL.md](./INSTALL.md) |
| 🏫 A school student preparing for JEE / NEET / BITSAT | [docs/SYLLABUS_BRIDGE.md](./docs/SYLLABUS_BRIDGE.md) — pick your board at `/knowledge`, see bridge content on your planner |
| 🧪 A tester wanting it live now | [DEMO.md](./DEMO.md) — one command, six demo users seeded |
| 🚀 Spinning up a public URL | The Deploy button above → [DEPLOY.md](./DEPLOY.md) |
| 📚 Evaluating exams | [EXAMS.md](./EXAMS.md) — three bundled, adapter pattern for new ones |
| 📖 Designing content | [CONTENT.md](./CONTENT.md) + [LIBRARY.md](./LIBRARY.md) + [STUDIO.md](./STUDIO.md) |
| 🌉 Generating a school → exam bridge course | [docs/SYLLABUS_BRIDGE.md](./docs/SYLLABUS_BRIDGE.md) — 5-step wizard at `/admin/syllabus-bridge`, two-file extension story for new boards |
| 🧑‍🏫 A teacher who wants to know where the class is stuck | `/teacher/syllabus-coverage` — gap report against your roster, one-click "Generate material for this gap" |
| 🎬 Pitching the moat | [docs/moat-demo.md](./docs/moat-demo.md) — guided 3-minute persona-scenarios path |
| 🛠 Setting up from scratch | [docs/admin-getting-started.md](./docs/admin-getting-started.md) — day-0 to cloud deploy, local-first |
| 🧑‍🏫 Running real students | [docs/admin-guide-jee-tn.md](./docs/admin-guide-jee-tn.md) — end-to-end admin runbook with concrete TN-board / IIT-JEE / anxious-cohort scenario |
| 🔬 Technical evaluator | [OVERVIEW.md](./OVERVIEW.md) → [ARCHITECTURE.md](./ARCHITECTURE.md) → [CLAUDE.md](./CLAUDE.md) |
| 🧱 Extending the platform | [EXTENDING.md](./EXTENDING.md) — four extension contracts, &lt;20 min to first extension |
| 🛡 Production deployer | [PRODUCTION.md](./PRODUCTION.md) — honest readiness checklist |
| 🚀 Solo founder | [FOUNDER.md](./FOUNDER.md) — running the business: stack, day-1 checklist, revenue, ops |
| 📋 Wanting to know what's NOT done | [PENDING.md](./PENDING.md) — the full ledger |

---

## Doc tree

<details>
<summary>All master docs at the repo root</summary>

**Pitch** — [PITCH.md](./PITCH.md), [POSITIONING.md](./POSITIONING.md)

**Architecture** — [OVERVIEW.md](./OVERVIEW.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [CLAUDE.md](./CLAUDE.md)

**Modules** — [AUTH.md](./AUTH.md), [TEACHING.md](./TEACHING.md), [LIBRARY.md](./LIBRARY.md), [STUDIO.md](./STUDIO.md), [CONTENT.md](./CONTENT.md), [EXAMS.md](./EXAMS.md)

**Setup + ops** — [INSTALL.md](./INSTALL.md), [DEPLOY.md](./DEPLOY.md), [DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md), [DEPENDENCIES.md](./DEPENDENCIES.md), [PRODUCTION.md](./PRODUCTION.md), [FOUNDER.md](./FOUNDER.md), [SECURITY.md](./SECURITY.md)

**Frameworks** — [docs/COMPOUNDING-MASTERY-FRAMEWORK.md](./docs/COMPOUNDING-MASTERY-FRAMEWORK.md), [docs/CURRICULUM-FRAMEWORK.md](./docs/CURRICULUM-FRAMEWORK.md), [docs/EXAM-FRAMEWORK.md](./docs/EXAM-FRAMEWORK.md), [docs/LESSON-FRAMEWORK.md](./docs/LESSON-FRAMEWORK.md), [docs/RENDERING-FRAMEWORK.md](./docs/RENDERING-FRAMEWORK.md), [docs/SYLLABUS_BRIDGE.md](./docs/SYLLABUS_BRIDGE.md)

**Demo** — [docs/moat-demo.md](./docs/moat-demo.md) (guided 3-minute persona-scenarios path)

**Admin runbooks** — [docs/admin-getting-started.md](./docs/admin-getting-started.md) (day-0 to live deploy) → [docs/admin-guide-jee-tn.md](./docs/admin-guide-jee-tn.md) (end-to-end ops for a TN-board, anxious JEE cohort)

**Project meta** — [CONTRIBUTING.md](./CONTRIBUTING.md), [EXTENDING.md](./EXTENDING.md), [CHANGELOG.md](./CHANGELOG.md), [FEATURES.md](./FEATURES.md), [PENDING.md](./PENDING.md)

**Hierarchical reference** — [docs/00-index.md](./docs/00-index.md)

</details>

---

## License

MIT. See [LICENSE](./LICENSE). Bundled third-party content keeps its own per-record attribution: OpenStax under CC-BY 4.0, MIT OCW under CC-BY-NC-SA 4.0, GATE papers in the public domain, Math Stack Exchange under CC-BY-SA 4.0. Every record in `content-bundle.json` carries its own `license` and `attribution` fields.

---

*Vidhya (विद्या) is Sanskrit for knowledge, learning, and the means of attaining it.*
