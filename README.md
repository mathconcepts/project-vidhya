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
| 📚 **Compounding** | Every rep adds to the next. Twelve short sessions add up like one long session; what you cracked in January is still with you in March. | A Bayesian student model remembers every mistake, breakthrough, and weak spot. Effort compounds. |
| 🎯 **Strategy** | The right priority at the right distance from your exam. Six months out: base-building. Three days out: revision on weakest topics. | Exam-proximity-aware planner. Your registered dates reshape every priority weighting as the day approaches. |
| 🧘 **Calm** | No streaks. No shame. No guilt pings. Your data stays yours — notes, progress, AI key all on your device. | Stateless server. No notification service, no streak counter. Nowhere to keep you even if we wanted to. |
| 🌍 **Focus** | World-class teaching on any phone, anywhere, online or off. Same lesson, same depth, whether on fibre or 3G. | Four-tier content engine. ~80% of requests hit a pre-built bundle delivered once and cached. |

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

The planner budgets for the time you actually have — three minutes at a bus stop, sixty on a weekend. When your exam is three days out, the app stops telling you to rest; it switches to revision. Everything reaches you through web, Telegram, or WhatsApp — same account, same progress, three surfaces.

📖 *Forty-eight-release feature ledger: [FEATURES.md](./FEATURES.md). Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md).*

---

## What's underneath

A React SPA backed by a stateless Node server. **Your student model and uploaded notes live in IndexedDB.** A 22 MB WASM embedding model ships once; from then on embeddings are computed locally. The server is mostly a thin LLM proxy. **Nothing is in Postgres. Nothing requires it.** A five-dollar VPS handles a class of fifty.

Thirteen modules: core, auth, content, rendering, channels, learning, exams, lifecycle, teaching, content-library, content-studio, operator, orchestrator. Each declares its public surface in `src/modules/<n>/index.ts` and registers in `modules.yaml`. The orchestrator composes them per deployment profile.

📖 *Module map in [MODULARISATION.md](./MODULARISATION.md). Production-readiness in [PRODUCTION.md](./PRODUCTION.md).*

---

## Try it live

**[→ Open live demo](https://gate-math-api.onrender.com/demo-login)** — logs you in as a demo student instantly. No account needed.

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

| | Local | Render | Netlify + Render |
|---|---|---|---|
| Public URL | no | ✓ | ✓ |
| Branch previews | no | no | ✓ |
| Setup time | 5 min | 5 min | 10 min |
| Cost | $0 | $0 (free tier) | $0 (both free tiers) |

📖 *[DEMO.md](./DEMO.md) for the local walkthrough. [DEPLOY.md](./DEPLOY.md) for Render. [PRODUCTION.md](./PRODUCTION.md) before any real-user deployment.*

---

## Where to go next

| You are | Read |
|---|---|
| 🎓 A student | [PITCH.md](./PITCH.md) → [INSTALL.md](./INSTALL.md) |
| 🧪 A tester wanting it live now | [DEMO.md](./DEMO.md) — one command, six demo users seeded |
| 🚀 Spinning up a public URL | The Deploy button above → [DEPLOY.md](./DEPLOY.md) |
| 📚 Evaluating exams | [EXAMS.md](./EXAMS.md) — three bundled, adapter pattern for new ones |
| 📖 Designing content | [CONTENT.md](./CONTENT.md) + [LIBRARY.md](./LIBRARY.md) |
| 🧩 Thinking about modules / B2B | [MODULARISATION.md](./MODULARISATION.md) — 13 modules, 20 tiers, 6 profiles |
| 🔬 Technical evaluator | [OVERVIEW.md](./OVERVIEW.md) → [ARCHITECTURE.md](./ARCHITECTURE.md) → [docs/](./docs/) |
| 🛡 Production deployer | [PRODUCTION.md](./PRODUCTION.md) — honest readiness checklist |
| 🚀 Solo founder | [FOUNDER.md](./FOUNDER.md) — running the business: stack, day-1 checklist, revenue, ops |
| 📋 Wanting to know what's NOT done | [PENDING.md](./PENDING.md) — the full ledger |

---

## Doc tree

<details>
<summary>All master docs at the repo root</summary>

**Pitch** — [PITCH.md](./PITCH.md), [POSITIONING.md](./POSITIONING.md)

**Architecture** — [OVERVIEW.md](./OVERVIEW.md), [DESIGN.md](./DESIGN.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [LAYOUT.md](./LAYOUT.md), [MODULARISATION.md](./MODULARISATION.md)

**Modules** — [AUTH.md](./AUTH.md), [TEACHING.md](./TEACHING.md), [LIBRARY.md](./LIBRARY.md), [STUDIO.md](./STUDIO.md), [CONTENT.md](./CONTENT.md), [EXAMS.md](./EXAMS.md)

**Setup + ops** — [INSTALL.md](./INSTALL.md), [DEPLOY.md](./DEPLOY.md), [DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md), [DEPENDENCIES.md](./DEPENDENCIES.md), [PRODUCTION.md](./PRODUCTION.md), [FOUNDER.md](./FOUNDER.md), [SECURITY.md](./SECURITY.md)

**Frameworks** — [docs/COMPOUNDING-MASTERY-FRAMEWORK.md](./docs/COMPOUNDING-MASTERY-FRAMEWORK.md), [docs/EXAM-FRAMEWORK.md](./docs/EXAM-FRAMEWORK.md), [docs/RENDERING-FRAMEWORK.md](./docs/RENDERING-FRAMEWORK.md)

**Plans** — [PLAN-content-engine.md](./PLAN-content-engine.md), [PLAN-dbless-gbrain.md](./PLAN-dbless-gbrain.md), [PLAN-gbrain-mvp.md](./PLAN-gbrain-mvp.md)

**Project meta** — [CONTRIBUTING.md](./CONTRIBUTING.md), [EXTENDING.md](./EXTENDING.md), [CHANGELOG.md](./CHANGELOG.md), [FEATURES.md](./FEATURES.md), [PENDING.md](./PENDING.md)

**Hierarchical reference** — [docs/00-index.md](./docs/00-index.md)

</details>

---

## License

MIT. See [LICENSE](./LICENSE). Bundled third-party content keeps its own per-record attribution: OpenStax under CC-BY 4.0, MIT OCW under CC-BY-NC-SA 4.0, GATE papers in the public domain, Math Stack Exchange under CC-BY-SA 4.0. Every record in `content-bundle.json` carries its own `license` and `attribution` fields.

---

*Vidhya (विद्या) is Sanskrit for knowledge, learning, and the means of attaining it.*
