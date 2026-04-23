# Project Vidhya

> # **World-class prep. Without the world-class stress.**
>
> *Every five minutes of practice compounds into real competence — and none of it comes at the cost of your peace of mind.*

---

## The moment we built this for

It's 2 a.m. She's stuck on an eigenvalue problem. Her exam is in four weeks. **The coaching centre closed at nine.** The top-ranked YouTube explanation runs forty-five minutes and assumes she already understands the thing she's trying to learn. **Her notes are at home. She doesn't know what to ask because she doesn't know what she doesn't know.**

She opens her phone, takes a photo of the problem, and gets her answer — not just the number, but the method, the intuition, the trap she would have fallen into, the specific concept she's weak on, and three calibrated problems that will fix it. **Ten minutes later she's moved on.**

The next morning the app doesn't guilt-ping her about a broken streak. It just remembers where she stopped, and picks up when she's ready.

That's Vidhya.

---

## Why this is different — and why you can trust it

We built Vidhya because we've been the student at 2 a.m. We know what bad exam-prep apps do, because we paid for them. Every design choice here is a direct answer to something that wasted our time or money when we were preparing.

**Open-source and inspectable.** Every claim on this page maps to code you can read. Nothing is hidden behind a paywall, an enterprise-tier, or a "contact sales". The four-tier content engine, the student model, the Wolfram verification — it's all in this repository. Read the code, run the tests, see for yourself.

**Pedagogy from the people who teach well.** The 82-concept library draws from OpenStax, MIT OpenCourseWare, and GATE previous-year papers — the sources top teachers already trust. Every maths answer is computationally checked against Wolfram Alpha before it reaches you. This is not generated slop. This is verified teaching.

**No investors asking us to squeeze students.** There is no pricing tier. There is no ad model. Your AI costs are whatever Gemini or Claude charges you directly, at their rates, to your card. We do not sit in the middle.

---

## What breaks today — and what we fix

Five everyday frustrations of exam prep in India. For each one — the direct answer, exactly what you get, and how we built it so it holds up.

<br />

> [!CAUTION]
> ### 💸 **You study today, lose half of it by next week.**
> *Most apps don't remember what you struggled with. Every session starts from scratch, so your effort keeps leaking out. The hard work is real; the retention isn't.*

> [!TIP]
> ### 📚 **Every minute of effort finally compounds into real competence.**
> *Your weak spots, your mistakes, your breakthroughs — the app remembers all of them, forever. Twelve short sessions add up like one long one, instead of evaporating. A concept you cracked in January is still with you in March.*
>
> **What you get:** A personal student model that tracks you across 15 cognitive attributes and 7 error categories. Your mistakes become tomorrow's revision queue. Your breakthroughs become the foundation for the next concept.
>
> *How we built it:* A spaced-repetition engine layered on a Bayesian knowledge model — the same pedagogy principles that power elite tutoring, implemented in your browser. Full design in [PLAN-gbrain-mvp.md](./PLAN-gbrain-mvp.md).

<br />

> [!CAUTION]
> ### 😰 **The app is built to make you anxious, not to teach you.**
> *Streaks, red notifications, guilt pings at 11 pm — the design is meant to keep you hooked, not help you crack the exam. Miss a single day and it makes you feel like you've failed.*

> [!TIP]
> ### 🧘 **Study on your own terms. Your peace of mind is the point, not the price.**
> *Miss a day? The app quietly waits. Come back whenever you're ready. No streaks. No shame. No guilt pings at 11 pm. The app earns your attention by being useful, not by holding it hostage.*
>
> **What you get:** Zero growth-hack notifications. No streaks to maintain. No "you've broken your 47-day record" heartbreak. Just sessions when you want them, paused when you don't.
>
> *How we built it:* We refused to instrument engagement metrics in the product. The codebase has no push notification service, no streak counter, no re-engagement campaign logic. It is not there because we chose not to build it.

<br />

> [!CAUTION]
> ### 🗺️ **Your pincode decides the quality of your teaching.**
> *Top coaching centres sit in five or six cities. Students outside those cities make do with random YouTube lectures, outdated PDFs, and luck. That's not a level playing field.*

> [!TIP]
> ### 🌍 **The same quality of teaching. Anywhere in India. On any phone.**
> *A student in Kota, Durgapur, or a small town in Odisha gets the same lesson, the same worked example, the same depth as a student in South Delhi — on a three-year-old Android, on spotty wifi, in any language their browser supports.*
>
> **What you get:** An app that pre-loads 80% of the content offline on first visit. Works without internet after the first sync. Runs on entry-level hardware. No premium tier for better teaching — there is one tier, and it is the good one.
>
> *How we built it:* A four-tier cascade. 80% of student questions are served from a pre-built JSON bundle, delivered once and cached forever. The remaining 20% route to semantic search, then LLM, then Wolfram. Full architecture in [PLAN-content-engine.md](./PLAN-content-engine.md).

<br />

> [!CAUTION]
> ### 🎯 **Your struggles are being sold to advertisers.**
> *Your weak areas, your wrong answers, your study timings — most apps store all of it on their servers, then monetise it. You became the product the day you signed up.*

> [!TIP]
> ### 🔒 **Your data lives on your phone. Your AI key stays yours. We see nothing.**
> *Nothing leaves your device unless you choose to send it. Your uploaded PDFs, your study history, your mistakes — all in your browser, not on our servers. You bring your own Gemini or Claude or OpenAI key; we never see it, and we never charge for it.*
>
> **What you get:** Student progress stored in IndexedDB on your device. PDFs parsed client-side. Embeddings computed on a 22 MB WASM model in your browser. Server sees only the bare minimum — proxied LLM calls with your own key, opt-in anonymous telemetry if you choose to contribute.
>
> *How we built it:* The server is stateless by design. It has no user database, no behavioural analytics table, nowhere to keep you even if we wanted to. Inspect the code at [PLAN-dbless-gbrain.md](./PLAN-dbless-gbrain.md).

<br />

> [!CAUTION]
> ### ⚠️ **The advice has nothing to do with your situation.**
> *Three days before your exam, you get five questions wrong and the app tells you to "take a break and come back tomorrow". That advice was written for demos, not for a student whose exam is 72 hours away.*

> [!TIP]
> ### ⏰ **Advice that understands where you are. Six months out, or three days out.**
> *Six months out, the app suggests rest when you are tired. Three days out, it switches straight to revision — because when the exam is near, rest is not the answer. Review is. Same app, different mode, driven by your actual exam dates.*
>
> **What you get:** Sessions planned for the exact time you have — three minutes at a bus stop, sixty minutes on a weekend. Advice that changes as your exam approaches. Templates you save once (*"morning commute, 8 minutes"*) and fire with one tap.
>
> *How we built it:* An exam-proximity-aware planner. Your registered exams and their dates drive every recommendation. Priority weightings shift as the exam date approaches. Smoke-tested across 15 backend routes and 33 MCP tools. See [FEATURES.md](./FEATURES.md) for the 48-release ledger.

<br />

---

## Why it exists

> ### 💡 **The stressed student is the profitable one.** Vidhya refuses that trade.

**Every existing exam-prep product makes the same bargain: to get personalised prep, you give up your data, your time, your peace of mind, and usually your money.** Streak fatigue, push notifications, lock-screen guilt — **none of it was ever going to teach you calculus. It was just going to cost you sleep.**

Vidhya makes a different trade. Twelve five-minute sessions compound into the mastery a sixty-minute session builds; nothing evaporates between them. The app tunes its advice to how close your exam is. **Your notes, your progress, and your provider key all stay on your device.** The price of the AI is whatever the provider charges you directly — there is no intermediary pricing layer, because there is no intermediary.

A student logging in from a small town gets the same lesson, the same worked example, the same depth as a student in the most expensive coaching centre in the country. **Geography stops being the limit.**

📖 *The full positioning is in [POSITIONING.md](./POSITIONING.md). The thirty-second shareable version is in [PITCH.md](./PITCH.md).*

---

## What it actually does

> ### 💡 **Ask anything. Upload anything. The cheapest path that works gets taken first.**

Ask a question in chat. Upload a PDF of your class notes. Snap a photo of a problem. For each request, Vidhya tries the cheapest path that works: **first a pre-built bundle** of the 82 highest-value concepts in the syllabus, **then a client-side semantic search** over your uploaded materials, **then a live LLM call** — only when the first two miss. Mathematical answers get computationally verified against Wolfram Alpha where possible, and the UI says so with an emerald _Wolfram-verified_ badge.

You register your exams once. The planner gives you sessions budgeted for the time you actually have in front of you — three minutes at a bus stop, sixty minutes on a weekend. You see your trailing weekly activity on the home screen. You save the patterns that work (*"morning commute, eight minutes"*) and fire them with one tap. When your exam is three days out the app stops telling you to rest; it switches to lesson review, because telling a stressed student to *"step away for ten minutes"* two days before her exam reads as tone-deaf.

Everything reaches you through whichever channel you prefer — **the web app, a Telegram bot, or WhatsApp**. Same account, same progress, three surfaces.

📖 *The complete ledger of shipped features across forty-eight tagged releases lives in [FEATURES.md](./FEATURES.md).*

---

## What's underneath

> ### 💡 **Stateless server. Local-first client. No database required.**

A React SPA backed by a stateless Node server on Express. **Your student model, your uploaded notes, and your semantic embeddings all live in IndexedDB.** A twenty-two-megabyte WASM embedding model ships to the browser once; from then on embeddings are computed locally. The server is mostly a thin LLM proxy with an opt-in anonymous telemetry aggregator. **Nothing is in Postgres. Nothing requires it.** A five-dollar VPS handles a class of fifty.

The content layer is a **four-tier cascade** assembled overnight by GitHub Actions: scrape curated CC-licensed sources (OpenStax, MIT OCW, GATE previous-year papers, Stack Exchange), generate 82 concept explainers with a cheap LLM, verify every piece of math against Wolfram, assemble into `content-bundle.json`, and ship. **Roughly eighty percent of student questions hit tier 0 at zero marginal cost.** The remaining twenty percent fan out to semantic search, then to a live LLM call — and six percent of those get Wolfram-verified on the fly.

📖 *The cascade is defended and cost-modelled in [PLAN-content-engine.md](./PLAN-content-engine.md). Every other architectural choice is in [DESIGN.md](./DESIGN.md). The hierarchical docs index is at [docs/00-index.md](./docs/00-index.md).*

---

## Getting started

> [!NOTE]
> **Choose your path below.** Each takes you to the right starting file.

🎓 **As a student** → [PITCH.md](./PITCH.md) for what Vidhya does for you, then [INSTALL.md](./INSTALL.md) to run it locally.

🔬 **As a technical evaluator** → [FEATURES.md](./FEATURES.md) for the shipping ledger, [DESIGN.md](./DESIGN.md) for the architecture, then [docs/](./docs/).

🏫 **As an institution deploying for a cohort** → [INSTALL.md](./INSTALL.md). No per-seat licence. No external database. Role-based admin hierarchy (owner / admin / teacher / student) with the first sign-in auto-becoming owner. Add students via dashboard or CSV import. Define new exams as YAML. Students reach sessions through web, Telegram, or WhatsApp.

---

## Where the rest lives

**Pitch and positioning**
&nbsp;&nbsp;[PITCH.md](./PITCH.md) — thirty-second student-facing pitch
&nbsp;&nbsp;[POSITIONING.md](./POSITIONING.md) — full brand and promise document

**Architecture and features**
&nbsp;&nbsp;[DESIGN.md](./DESIGN.md) — visual and UX principles
&nbsp;&nbsp;[FEATURES.md](./FEATURES.md) — forty-eight-release feature ledger
&nbsp;&nbsp;[PLAN-content-engine.md](./PLAN-content-engine.md) — four-tier content cascade
&nbsp;&nbsp;[PLAN-dbless-gbrain.md](./PLAN-dbless-gbrain.md) — local-first architecture rationale
&nbsp;&nbsp;[PLAN-gbrain-mvp.md](./PLAN-gbrain-mvp.md) — the cognitive student model
&nbsp;&nbsp;[docs/00-index.md](./docs/00-index.md) — hierarchical deep-reference index

**Frameworks the product is built on**
&nbsp;&nbsp;[docs/COMPOUNDING-MASTERY-FRAMEWORK.md](./docs/COMPOUNDING-MASTERY-FRAMEWORK.md) — the insight engine and smart notebook
&nbsp;&nbsp;[docs/EXAM-FRAMEWORK.md](./docs/EXAM-FRAMEWORK.md) — exam registry, enrichment, progressive fill
&nbsp;&nbsp;[docs/RENDERING-FRAMEWORK.md](./docs/RENDERING-FRAMEWORK.md) — multi-channel interactive rendering
&nbsp;&nbsp;[docs/GBRAIN-INTEGRATION-AUDIT.md](./docs/GBRAIN-INTEGRATION-AUDIT.md) — per-feature audit of the student model

**Setup and operation**
&nbsp;&nbsp;[INSTALL.md](./INSTALL.md) — cross-platform installation, tiered by feature needs
&nbsp;&nbsp;[DEPENDENCIES.md](./DEPENDENCIES.md) — toolchain + runtime packages, tagged by necessity
&nbsp;&nbsp;[docs/LLM-CONFIGURATION.md](./docs/LLM-CONFIGURATION.md) — BYO-key setup for 8 providers
&nbsp;&nbsp;[docs/08-testing-guide.md](./docs/08-testing-guide.md) — test commands and smoke checks

**Journeys**
&nbsp;&nbsp;[docs/USER-JOURNEY.md](./docs/USER-JOURNEY.md) — student and admin journey maps
&nbsp;&nbsp;[docs/TEACHER-JOURNEY.md](./docs/TEACHER-JOURNEY.md) — teachers as end users

**Project meta**
&nbsp;&nbsp;[CONTRIBUTING.md](./CONTRIBUTING.md) — PRs, new scrapers, new subject domains
&nbsp;&nbsp;[SECURITY.md](./SECURITY.md) — private vulnerability disclosure
&nbsp;&nbsp;[CHANGELOG.md](./CHANGELOG.md) — release history from v2.0.0

---

## License

MIT. See [LICENSE](./LICENSE).

Bundled third-party content keeps its own per-record attribution: OpenStax textbook excerpts under CC-BY 4.0, MIT OpenCourseWare problems under CC-BY-NC-SA 4.0, GATE previous-year papers in the public domain, Math Stack Exchange excerpts under CC-BY-SA 4.0. Every record in `content-bundle.json` carries its own `license` and `attribution` fields.

---

*Vidhya (विद्या) is Sanskrit for knowledge, learning, and the means of attaining it.*
