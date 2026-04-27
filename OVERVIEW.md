# Project Vidhya — Overview

> The product, the audience, and what's actually shipping. If you're new to the repo, read this first; the other three masters ([DESIGN](./DESIGN.md) / [ARCHITECTURE](./ARCHITECTURE.md) / [LAYOUT](./LAYOUT.md)) build on top of this one.

---

## What Project Vidhya is

Project Vidhya is a self-hosted, AI-powered exam-prep platform for Indian competitive exams (JEE, BITSAT, UGEE, NEET, GATE, CAT). It packages four things into one deployable unit:

1. **A multi-role learning system** — students study, teachers manage rosters, admins curate content, owners run the deployment.
2. **An AI tutor pipeline** — chat, snap-a-photo solve, step-by-step explainers, all with bring-your-own-key (BYOK) for OpenAI / Gemini / Anthropic.
3. **A content engine** — three exams shipped as samples, with an authoring + verification pipeline (Wolfram + LLM cross-check) for adding more.
4. **A flat-file persistence layer** — no database required for the demo path; `.data/*.json` files survive restarts on any host with a writable disk.

The thing people remember after using Vidhya is that it tells them **what to study next**, not just *that* they should study. That's the Study Commander loop: priority-ranked daily tasks based on marks weight × weakness × improvement speed × recency × exam proximity. It's the differentiator vs every other India exam-prep app.

## Who it's for

| Audience | What they do | Where they enter |
|---|---|---|
| **Self-studying students (16–28)** | Take diagnostics, get a daily study plan, use the AI tutor, snap problems they're stuck on | `/` → role-aware home |
| **Teachers / coaching staff** | Roster students, assign material, monitor progress | `/teacher/roster` |
| **Coaching-centre admins** | Manage users, content packs, channel webhooks | `/admin/dashboard` |
| **Platform owners (the operator)** | Configure LLM providers, run integrity audits, manage feature flags | `/owner/settings` + `/admin/features` |
| **Parents** | Read-only view of one or more linked students' progress | `/parent` (scoped per-student via `guardian_of[]`) |
| **Institutions** *(scaffolding only — flag-gated)* | Multi-tenant deployment for B2B | PENDING §9 |

Three of those entry points run from a single backend deployment; the role of the authenticated user determines what they see. There's no separate "admin app."

## What's actually shipping today

Honest accounting, not aspirational. From [`PENDING.md`](./PENDING.md) and [`FEATURES.md`](./FEATURES.md):

**Shipped and used:**
- Multi-role demo (6 personas: owner / admin / teacher / 3 students)
- 4 sample exams: BITSAT, JEE Main, UGEE (math), NEET (bio)
- AI tutor (chat) with BYOK for 3 providers + Wolfram fallback when set
- Snap-a-photo solver
- Daily study plan / Study Commander
- Spaced repetition engine
- 3 content delivery modes: web app, Telegram channel, WhatsApp channel
- 56 agents organised into a 4-tier org chart
- 9 modules (`core`, `auth`, `content`, `rendering`, `channels`, `learning`, `exams`, `lifecycle`, `orchestrator`)
- 6 deployment profiles (`minimal`, `full`, `channel-only`, `institutional-b2b`, `demo`, `content-author`)
- Feature flags for the auth module (Google OIDC, demo seed, parent role, institution role)

**Partial / scaffolding:**
- `parent` role: implemented, ships behind the `auth.parent_role` flag (default on)
- `institution` role: type-system scaffolding only, gated by `auth.institution_role` flag (default off, see PENDING §9)
- Customer-lifecycle agents (4 specialists): code present, end-to-end flow not wired

**Planned, not started:**
- See [`PENDING.md`](./PENDING.md) §1–§13. ~47 items remain.

## What it isn't

- **Not a SaaS.** There is no hosted Vidhya offering. You run it on your own infra.
- **Not a database-backed app.** The flat-file design is intentional. If you want Postgres, you can swap `src/lib/flat-file-store.ts` — the rest of the system has a stable API, but the default path stays JSON-on-disk.
- **Not a payment system.** No Stripe, no subscriptions, no paywall. Bring your own LLM keys; pay each provider directly.
- **Not a Lambda-friendly app.** The backend is a long-running Node process. Netlify Functions / Vercel serverless can't host it. See [`DEPLOY.md`](./DEPLOY.md) for hosts that can.

## How to read the rest of the docs

The four master files are deliberately focused. Each answers a different question:

- **[OVERVIEW.md](./OVERVIEW.md)** *(this file)* — *what* and *who*
- **[DESIGN.md](./DESIGN.md)** — *why* (the system design choices and what they cost)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — *how* (modules, data flow, runtime topology)
- **[LAYOUT.md](./LAYOUT.md)** — *where* (file map, naming conventions, what lives in each directory)

Topic-specific docs that go deeper than the masters:

- **[INSTALL.md](./INSTALL.md)** — local install, three paths (full clone, demo, content-author)
- **[DEPLOY.md](./DEPLOY.md)** — Render free tier, alternatives if Render isn't an option
- **[DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md)** — Netlify+Render hybrid (frontend on CDN, backend on Render)
- **[DEMO.md](./DEMO.md)** — multi-role demo walkthrough
- **[AUTH.md](./AUTH.md)** — auth module surface (5 endpoints, 5 admin endpoints, JWT, Google OIDC, feature flags)
- **[CONTENT.md](./CONTENT.md)** — 7-layer content architecture, the 3 modes of `content.pin`
- **[EXAMS.md](./EXAMS.md)** — exam inventory and the adapter pattern
- **[MODULARISATION.md](./MODULARISATION.md)** — the 8-module / 20-tier / 6-profile registry
- **[PENDING.md](./PENDING.md)** — what's done, what's partial, what's planned

For the design system specifically (typography, colour, spacing, motion), see [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md). That's the visual design language; this OVERVIEW and the other three masters are the system design.

## A note on honesty in the docs

The docs in this repo aim to be more honest than is conventional in OSS projects:

- Things that work get documented as working.
- Things that are scaffolding get documented as scaffolding.
- Things that don't exist yet are listed in [`PENDING.md`](./PENDING.md), not in feature lists.
- Things that broke and got fixed are recorded in [`CHANGELOG.md`](./CHANGELOG.md), including the misleading docs that got corrected.

If you find a doc that contradicts the running code, that's a bug — file an issue or send a PR. The convention is the docs follow the code, not the other way around.
