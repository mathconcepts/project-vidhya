# Project Vidhya

> # **The ingredients every champion needs — for your exam, your goals, your breakthrough.**
>
> *Calm. Strategy. Focus. Compounding. Vidhya builds all four in you, every time you practise.*

---

## The moment we built this for

It's 2 a.m. She's stuck on an eigenvalue problem. Her exam is in four weeks. **The coaching centre closed at nine.** The top YouTube explanation runs forty-five minutes and assumes she already understands the thing she's trying to learn.

She opens her phone, takes a photo of the problem, and gets her answer — not just the number, but the method, the intuition, the trap she would have fallen into, the specific concept she's weak on, and three calibrated problems that will fix it. **Ten minutes later she's moved on.**

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

📖 *Forty-eight-release feature ledger: [FEATURES.md](./FEATURES.md). Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md). Demo runbook: [docs/moat-demo.md](./docs/moat-demo.md).*

---

## What's underneath

A React SPA backed by a stateless Node server. **Your student model and uploaded notes live in IndexedDB.** A 22 MB WASM embedding model ships once; from then on embeddings are computed locally. The server is mostly a thin LLM proxy. **Nothing is in Postgres. Nothing requires it.** A five-dollar VPS handles a class of fifty.

Thirteen modules: core, auth, content, rendering, channels, learning, exams, lifecycle, teaching, content-library, content-studio, operator, orchestrator. Each declares its public surface in `src/modules/<name>/index.ts` and registers in `modules.yaml`. The orchestrator composes them per deployment profile.

📖 *Production-readiness in [PRODUCTION.md](./PRODUCTION.md).*

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
| 🧪 A tester wanting it live now | [DEMO.md](./DEMO.md) — one command, six demo users seeded |
| 🚀 Spinning up a public URL | The Deploy button above → [DEPLOY.md](./DEPLOY.md) |
| 📚 Evaluating exams | [EXAMS.md](./EXAMS.md) — three bundled, adapter pattern for new ones |
| 📖 Designing content | [CONTENT.md](./CONTENT.md) + [LIBRARY.md](./LIBRARY.md) + [STUDIO.md](./STUDIO.md) |
| 🎬 Pitching the moat | [docs/moat-demo.md](./docs/moat-demo.md) — guided 3-minute persona-scenarios path |
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

**Frameworks** — [docs/COMPOUNDING-MASTERY-FRAMEWORK.md](./docs/COMPOUNDING-MASTERY-FRAMEWORK.md), [docs/CURRICULUM-FRAMEWORK.md](./docs/CURRICULUM-FRAMEWORK.md), [docs/EXAM-FRAMEWORK.md](./docs/EXAM-FRAMEWORK.md), [docs/LESSON-FRAMEWORK.md](./docs/LESSON-FRAMEWORK.md), [docs/RENDERING-FRAMEWORK.md](./docs/RENDERING-FRAMEWORK.md)

**Demo** — [docs/moat-demo.md](./docs/moat-demo.md) (guided 3-minute persona-scenarios path)

**Project meta** — [CONTRIBUTING.md](./CONTRIBUTING.md), [EXTENDING.md](./EXTENDING.md), [CHANGELOG.md](./CHANGELOG.md), [FEATURES.md](./FEATURES.md), [PENDING.md](./PENDING.md)

**Hierarchical reference** — [docs/00-index.md](./docs/00-index.md)

</details>

---

## License

MIT. See [LICENSE](./LICENSE). Bundled third-party content keeps its own per-record attribution: OpenStax under CC-BY 4.0, MIT OCW under CC-BY-NC-SA 4.0, GATE papers in the public domain, Math Stack Exchange under CC-BY-SA 4.0. Every record in `content-bundle.json` carries its own `license` and `attribution` fields.

---

*Vidhya (विद्या) is Sanskrit for knowledge, learning, and the means of attaining it.*
