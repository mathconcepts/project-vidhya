# Project Vidhya

> **World-class prep. Without the world-class stress.**
>
> *Every five minutes of practice compounds into real competence — and none of it comes at the cost of your peace of mind.*

---

## The moment we built this for

It's 2 a.m. She's stuck on an eigenvalue problem. Her exam is in four weeks. The coaching centre closed at nine. The top-ranked YouTube explanation runs forty-five minutes and assumes she already understands the thing she's trying to learn. Her notes are at home. She doesn't know what to ask because she doesn't know what she doesn't know.

She opens her phone, takes a photo of the problem, and gets her answer — not just the number, but the method, the intuition, the trap she would have fallen into, the specific concept she's weak on, and three calibrated problems that will fix it. Ten minutes later she's moved on.

The next morning the app doesn't guilt-ping her about a broken streak. It just remembers where she stopped, and picks up when she's ready.

That's Vidhya.

---

## Why it exists

Every existing exam-prep product makes the same trade-off: to get personalised prep, you give up your data, your time, your peace of mind, and usually your money. The stressed student is the profitable one. Streak fatigue, push notifications, lock-screen guilt — none of it was ever going to teach you calculus. It was just going to cost you sleep.

Vidhya makes a different trade. Twelve five-minute sessions compound into the mastery a sixty-minute session builds; nothing evaporates between them. The app tunes its advice to how close your exam is, so a student two days out gets *"do a quick review"*, not *"take a break"*. Your notes, your progress, and your provider key all stay on your device. The price of the AI is whatever the provider charges you directly — there is no intermediary pricing layer, because there is no intermediary.

A student logging in from a small town gets the same lesson, the same worked example, the same depth as a student in the most expensive coaching centre in the country. Geography stops being the limit.

The full positioning is in [POSITIONING.md](./POSITIONING.md). The thirty-second shareable version is in [PITCH.md](./PITCH.md).

---

## What it actually does

Ask a question in chat. Upload a PDF of your class notes. Snap a photo of a problem. For each request, Vidhya tries the cheapest path that works: first a pre-built bundle of the 82 highest-value concepts in the syllabus, then a client-side semantic search over your uploaded materials, then a live LLM call — only when the first two miss. Mathematical answers get computationally verified against Wolfram Alpha where possible, and the UI says so with an emerald *Wolfram-verified* badge.

You register your exams once. The planner gives you sessions budgeted for the time you actually have in front of you — three minutes at a bus stop, sixty minutes on a weekend. You see your trailing weekly activity on the home screen. You save the patterns that work (*"morning commute, eight minutes"*) and fire them with one tap. When your exam is three days out the app stops telling you to rest; it switches to lesson review, because telling a stressed student to *"step away for ten minutes"* two days before her exam reads as tone-deaf.

Everything reaches you through whichever channel you prefer — the web app, a Telegram bot, or WhatsApp. Same account, same progress, three surfaces.

The complete ledger of shipped features across forty-eight tagged releases lives in [FEATURES.md](./FEATURES.md).

---

## What's underneath

A React SPA backed by a stateless Node server on Express. Your student model, your uploaded notes, and your semantic embeddings all live in IndexedDB. A twenty-two-megabyte WASM embedding model ships to the browser once, and from then on embeddings are computed locally. The server is mostly a thin LLM proxy with an opt-in anonymous telemetry aggregator. Nothing is in Postgres. Nothing requires it. A five-dollar VPS handles a class of fifty.

The content layer is a four-tier cascade assembled overnight by GitHub Actions: scrape curated CC-licensed sources (OpenStax, MIT OCW, GATE previous-year papers, Stack Exchange), generate 82 concept explainers with a cheap LLM, verify every piece of math against Wolfram, assemble into `content-bundle.json`, and ship. Roughly eighty percent of student questions hit tier 0 at zero marginal cost. The remaining twenty percent fan out to semantic search, then to a live LLM call — and six percent of those get Wolfram-verified on the fly. The whole cascade is defended and cost-modelled in [PLAN-content-engine.md](./PLAN-content-engine.md).

Every other architectural choice is walked through in [DESIGN.md](./DESIGN.md). The hierarchical docs index is at [docs/00-index.md](./docs/00-index.md).

---

## Getting started

**As a student**, read [PITCH.md](./PITCH.md) for what Vidhya does for you, then follow [INSTALL.md](./INSTALL.md) to run it locally.

**As a technical evaluator**, start at [FEATURES.md](./FEATURES.md) for the shipping ledger, then [DESIGN.md](./DESIGN.md) for the architectural principles, then dive into [docs/](./docs/).

**As an institution deploying for a cohort**, install via [INSTALL.md](./INSTALL.md). No per-seat licence and no external database required. Role-based admin hierarchy — owner, admin, teacher, student — with the first sign-in auto-becoming owner. Add students through the admin dashboard or via CSV import. Define new exams as YAML files. Students reach their sessions through web, Telegram, or WhatsApp.

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
