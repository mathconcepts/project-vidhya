# Project Vidhya — Layout

> The *where*: file map, directory conventions, where each kind of file goes. Read [ARCHITECTURE.md](./ARCHITECTURE.md) first for what runs where; this doc tells you which file holds it.

---

## Top-level shape

```
project-vidhya/
├── src/                      ← Backend code (Node + tsx, ESM)
├── frontend/                 ← Frontend (Vite + React + TS)
├── modules/
│   └── project-vidhya-content/  ← The one sub-repo (community content)
├── demo/                     ← Multi-role demo seed + telemetry
├── data/                     ← Static course/topic content (markdown)
├── agents/                   ← Agent org-chart docs + manifests
├── context/                  ← Long-form positioning docs
├── docs/                     ← Topic-specific deep-dives
├── scripts/                  ← Build / deploy helpers
├── .data/                    ← Runtime state (gitignored, written at boot)
│
├── README.md                 ← Front door
├── OVERVIEW.md               ← What & who
├── DESIGN.md                 ← Why
├── ARCHITECTURE.md           ← How
├── LAYOUT.md                 ← Where (this file)
├── DESIGN-SYSTEM.md          ← Visual design language
├── INSTALL.md                ← Local install
├── DEPLOY.md                 ← Render + alternatives
├── DEPLOY-NETLIFY.md         ← Netlify+Render hybrid
├── AUTH.md                   ← Auth module surface
├── TEACHING.md               ← The teaching loop contract
├── LIBRARY.md                ← The content library contract
├── STUDIO.md                 ← The content studio contract
├── CONTENT.md                ← Content engine internals
├── EXAMS.md                  ← Exam adapters
├── FOUNDER.md                ← Solo-founder runbook (the business side)
├── PRODUCTION.md             ← Production-readiness checklist
├── DEMO.md                   ← Demo walkthrough
├── MODULARISATION.md         ← Module/tier/profile registry (companion to modules.yaml)
├── PENDING.md                ← What's done / partial / planned
├── FEATURES.md               ← Detailed shipping ledger
├── CHANGELOG.md              ← Per-commit highlights
├── CLAUDE.md                 ← Operating notes for Claude (the agent helping develop this)
├── SECURITY.md               ← Reporting + threat model
├── CONTRIBUTING.md           ← How to send PRs
│
├── modules.yaml              ← Authoritative module/tier/profile registry
├── render.yaml               ← Render Blueprint config
├── netlify.toml              ← Netlify frontend deploy config
├── content.pin               ← Content sub-repo pin (sha / local / pending)
├── package.json              ← Root npm package (backend deps + scripts)
└── frontend/package.json     ← Frontend npm package (Vite, React, etc.)
```

## `src/` — backend

```
src/
├── auth/                     ← Auth module (User type, JWT, Google OIDC,
│                                user-store, middleware)
│   ├── types.ts              ← Role union, ROLE_RANK, hasGuardianOf
│   ├── jwt.ts                ← issueToken, verifyToken
│   ├── middleware.ts         ← requireAuth, requireRole
│   ├── google-verify.ts      ← OIDC token verification
│   └── user-store.ts         ← createFlatFileStore for users
│
├── modules/
│   ├── auth/                 ← Auth module barrel + flag implementation
│   │   ├── index.ts          ← Public re-exports — import from here
│   │   └── feature-flags.ts  ← env-var driven flags, read once at boot
│   ├── teaching/             ← Teaching module barrel
│   │   └── index.ts          ← Public re-exports for openTurn / closeTurn / etc.
│   ├── content-library/      ← Content library barrel
│   │   ├── index.ts          ← Public re-exports for getEntry / addEntry / etc.
│   │   └── feature-flags.ts  ← user_authoring flag
│   └── content-studio/       ← Content studio barrel
│       └── index.ts          ← Public re-exports for generateDraft / approve / etc.
│
├── api/                      ← HTTP route handlers (one file per resource)
│   ├── auth-routes.ts        ← /api/auth/* (5 routes)
│   ├── user-admin-routes.ts  ← /api/admin/users/* (5 routes)
│   ├── orchestrator-routes.ts ← /api/orchestrator/* (9 routes)
│   ├── student-routes.ts     ← /api/student/*
│   ├── content-lifecycle-routes.ts ← /api/content/* + /api/uploads/*
│   └── …
│
├── lib/                      ← core module — shared library code
│   ├── flat-file-store.ts    ← createFlatFileStore (atomic JSON persistence)
│   ├── send-json.ts          ← sendJSON, sendError response helpers
│   └── …
│
├── orchestrator/             ← Module registry + composer + health
│   ├── registry.ts           ← Reads modules.yaml at boot
│   ├── composer.ts           ← Profile → active modules resolution
│   └── health.ts             ← Per-module probes
│
├── content/                  ← Content module
│   ├── router.ts             ← classifyIntent + routeContent
│   ├── community.ts          ← content.pin resolver, _resolveContentDir
│   ├── uploads.ts            ← User upload metadata + lookup
│   └── …
│
├── content-pipeline/         ← Content authoring + verification
├── curriculum/               ← Curriculum schemas + generators
├── syllabus/                 ← Syllabus → topics breakdown
├── exam-builder/             ← Exam adapters (BITSAT, JEE Main, UGEE, NEET)
├── samples/                  ← Sample exam definitions (JSON)
│
├── session-planner/          ← Daily plan + study commander
├── spaced-repetition/        ← SR engine
├── mastery/                  ← Mastery score tracking
│
├── exam-engine/              ← Exam adapters runtime
├── proctored/                ← Proctored exam mode
│
├── rendering/                ← Lesson rendering pipeline
├── explainer/                ← Step-by-step explainer
├── snap-solve/               ← Snap-a-photo OCR + solve
│
├── channels/                 ← Channel module — Telegram + WhatsApp
├── channels-runtime/         ← Channel webhook routing
│
├── lifecycle/                ← Customer lifecycle agents
├── data-rights/              ← GDPR-style export/delete (request/cancel/confirm/finalise)
├── jobs/                     ← In-process job scheduler

├── teaching/                 ← Teaching module
│   └── turn-store.ts         ← TeachingTurn schema + persistence (.data/teaching-turns.jsonl)
│
├── content-library/          ← Content library module
│   ├── types.ts              ← LibraryEntry schema
│   └── store.ts              ← Two-source loader (seed + JSONL additions) + in-memory index
│
├── content-studio/           ← Content studio module
│   ├── types.ts              ← ContentDraft schema + StudioEvent log shape
│   ├── store.ts              ← Generation orchestrator + draft lifecycle
│   └── sources/              ← Four source adapters
│       ├── uploads.ts        ← Pulls from admin's existing uploads
│       ├── wolfram.ts        ← Wolfram Alpha for verified math
│       ├── url-extract.ts    ← Single-URL fetch + main-content extraction
│       └── llm.ts            ← Gemini-backed last-resort generation
│
├── operator/                 ← Solo-founder business surface
│   ├── types.ts              ← PaymentEvent / AnalyticsEvent / FounderDashboard
│   ├── payments.ts           ← Local-JSONL payments adapter (Stripe-compatible)
│   ├── analytics.ts          ← Local-JSONL analytics adapter
│   └── dashboard.ts          ← Founder dashboard aggregator
│
├── events/                   ← Event bus (signal-bus.ts)
├── utils/                    ← Generic utilities
├── constants/                ← Global constants
├── services/                 ← Cross-cutting services
│
├── __tests__/                ← Vitest test suites
│   └── unit/                 ← 113 unit tests, no HTTP boot
│
└── gate-server.ts            ← Entrypoint — assembles routes, listens on :8080
```

### Backend conventions

- **`@ts-nocheck` at the top of every backend `.ts` file.** The TS config is intentionally lenient; types are documentation, not enforcement. The module barrel `src/modules/auth/index.ts` is the strict-typed interface.
- **One route file per resource family.** `auth-routes.ts` holds `/api/auth/*`, `student-routes.ts` holds `/api/student/*`, etc. Mixed-resource files are an anti-pattern.
- **Lazy cross-module imports use `await import(...)`.** ESM under tsx — `require()` doesn't exist, `eval('require')` works in some boot contexts but not all. When in doubt, top-level dynamic import.
- **Module barrels are at `src/modules/<n>/index.ts`.** Currently only `auth` has one; new modules with explicit public surfaces add their own.

## `frontend/` — UI

```
frontend/
├── src/
│   ├── pages/
│   │   ├── gate/             ← Authenticated app pages (most of the UI)
│   │   │   ├── GateHome.tsx
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── UserAdminPage.tsx
│   │   │   ├── FeaturesPage.tsx       ← /admin/features (feature matrix)
│   │   │   ├── ContentSettingsPage.tsx
│   │   │   ├── UploadsPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── …
│   │   └── public/           ← Pre-auth pages (landing, SEO topics)
│   │       └── …
│   ├── components/           ← Reusable UI primitives
│   ├── contexts/             ← React contexts (AuthContext, …)
│   ├── lib/
│   │   ├── auth/
│   │   │   └── client.ts     ← Frontend Role mirror, authFetch, hasRole
│   │   └── animations.ts     ← Framer Motion variants (fadeInUp, etc.)
│   ├── App.tsx               ← Routes
│   └── main.tsx              ← Entry
├── public/                   ← Static assets, demo HTML for local-only flow
├── package.json
└── vite.config.ts
```

### Frontend conventions

- **Pages live under `frontend/src/pages/`** — `gate/` for authenticated app, `public/` for pre-auth.
- **Lazy imports for routes.** `App.tsx` uses `lazy(() => import(…))` to keep the initial bundle small.
- **Tailwind utility classes only.** No custom CSS modules unless absolutely required. The pre-defined utility set is what's available.
- **Lucide React for icons.** No custom SVG icons unless they don't exist in lucide.
- **Framer Motion for animations.** Variants imported from `lib/animations.ts` so they're consistent.
- **Auth-gated routes use `useAuth().hasRole(min)`** for client-side role checks. The server enforces; the client just hides what wouldn't work.

## `modules/project-vidhya-content/` — the one sub-repo

```
modules/project-vidhya-content/
├── concepts/                 ← Per-concept content (markdown + JSON)
│   ├── linear-algebra/
│   ├── thermodynamics/
│   └── …
├── bundles/                  ← Curated content bundles (concept groupings)
│   ├── jee-main-mathematics.json
│   └── …
├── scripts/
│   └── check.js              ← Subrepo integrity check
├── package.json              ← NO `type: module` (CommonJS for the check script)
├── README.md
├── LICENSE                   ← MIT (community content)
├── LICENCE-MANIFEST.md
└── VERSION
```

The main repo's [`content.pin`](./content.pin) file points at this subrepo. Three modes:

- `sha: pending` — subrepo not yet linked; `_resolveContentDir` returns null
- `sha: local` — use `modules/project-vidhya-content/` directly (the repo on disk)
- `sha: <40-char>` — clone that specific revision into `.data/community-content/` at boot

Default for development is `sha: local`. See [CONTENT.md](./CONTENT.md) for full semantics.

## `data/` vs `.data/`

Confusingly named, totally different:

| Directory | Lifecycle | Source-controlled? | What it holds |
|---|---|---|---|
| `data/` | Built into the repo | Yes | Static course content (markdown lecture notes, formula sheets, teaching tips for the 10 GATE EM topics + 4 CAT topics) plus the content-library seed at `data/content-library/seed/<concept_id>/`. Updated by content authors. |
| `.data/` | Runtime, gitignored | No | Live persistence — users.json, plans.json, vector store, chat history, teaching-turns.jsonl, content-library-additions.jsonl, content-drafts.jsonl, payments.jsonl, analytics.jsonl, etc. Created at boot. |

If you delete `.data/`, the next `npm run demo:seed` recreates it. If you delete `data/`, you lose the static lecture content (but `git checkout` brings it back).

## `agents/` — agent org-chart

```
agents/
├── ORG-CHART.md              ← The 56-agent organisational map
├── CUSTOMER-LIFECYCLE.md     ← Customer-lifecycle agent specifics
├── README.md
├── _shared/
│   ├── constitution.md       ← Constitution every agent inherits
│   ├── communication-protocols.md
│   ├── gbrain-integration.md ← How agents interact with GBrain
│   └── manifest-schema.md    ← YAML schema for agent manifest files
├── ceo/
│   └── manifest.md
├── managers/
│   └── …
└── specialists/
    └── …
```

The org-chart isn't required to run Vidhya. It's a conceptual modelling layer for ownership and a future automation hook. See [`agents/ORG-CHART.md`](./agents/ORG-CHART.md) for the full graph.

## `docs/` — topic-specific deep-dives

```
docs/
├── 00-index.md               ← Hierarchical doc map
├── 00-overview.md
├── 01-quick-start.md
├── 02-agent-architecture.md
├── 03-llm-abstraction.md
├── 04-event-system.md
├── 05-data-layer.md
├── 06-api-reference.md
├── 07-workflows.md
├── 08-testing-guide.md
├── 09-deployment.md
├── 10-configuration.md
├── 11-multi-agent-setup.md
├── 12-content-delivery.md
├── 13-deployment-modes.md
├── 14-exam-configuration.md
├── 15-frontend-preview.md
├── 16-website-portal-architecture.md
├── 17-master-design-documentation.md
├── 18-agent-connection-map.md
├── 19-deployment-options.md
├── 20-content-system.md
├── 21-course-summary-outline.md
├── 22-help-manual.md
├── 23-two-layer-content-architecture.md
├── 24-course-playbook.md
├── 25-course-material-generator.md
├── …                         ← UPPERCASE.md framework docs
└── infra/
    └── jee-peak-prep.md
```

These are the deep-dives. The four masters at the top of the repo are the entrypoints; `docs/` is where you go for a specific topic.

## `scripts/` — build + deploy helpers

```
scripts/
├── netlify-prebuild.sh       ← Substitutes BACKEND_URL into netlify.toml at build time
├── update-readme-url.sh      ← Fills live demo URL into README + DEPLOY.md
├── backup-data.ts            ← .data/ backup helper
└── migrations/
    └── 001-drop-attention-counter.ts  ← One-off data migration scripts
```

Add new scripts here when you find yourself running the same multi-step incantation more than twice. Naming convention: kebab-case `.sh` for shell, kebab-case `.ts` for TypeScript.

## Naming conventions

| Kind | Convention | Examples |
|---|---|---|
| Backend file | `kebab-case.ts` | `user-store.ts`, `auth-routes.ts` |
| Frontend file | `PascalCase.tsx` for components, `kebab-case.ts` for non-components | `UserAdminPage.tsx`, `client.ts` |
| Doc file at root | `UPPER-CASE.md` | `DEPLOY.md`, `AUTH.md` |
| Doc file under `docs/` | Either `NN-kebab-case.md` (numbered series) or `UPPER-CASE.md` (framework docs) | `06-api-reference.md`, `LESSON-FRAMEWORK.md` |
| Sub-repo | `project-vidhya-<purpose>` | `project-vidhya-content` |
| Module barrel | `src/modules/<n>/index.ts` | `src/modules/auth/index.ts` |
| Skill (under `.claude/skills/`) | `kebab-case/SKILL.md` | `.claude/skills/autoplan/SKILL.md` |

## Where new things go

A quick reference for "I'm adding X — where does it live?"

| Adding… | Goes in… |
|---|---|
| A new HTTP route | `src/api/<resource>-routes.ts` |
| A new React page | `frontend/src/pages/gate/` (auth-gated) or `public/` |
| A new module | New dir under `src/`, declare in `modules.yaml`, add to barrel under `src/modules/<n>/` if public surface |
| A new feature flag | The owning module's `feature-flags.ts` + `modules.yaml` declaration + (optional) UI surfacing in `FeaturesPage.tsx` |
| A new exam adapter | `src/exam-builder/<exam>.ts` + sample at `src/samples/<exam>.json` |
| A new course | `data/courses/<course>/` (markdown) + `modules/project-vidhya-content/concepts/` (subrepo content) |
| A new agent | `agents/<tier>/<agent-id>/manifest.md` + entry in `agents/ORG-CHART.md` |
| A new doc | Top-level `UPPER-CASE.md` for primary refs, `docs/<topic>.md` for deep-dives |
| A migration script | `scripts/migrations/NNN-<purpose>.ts` |
| A regression test | `src/__tests__/unit/<area>/<topic>.test.ts` |

## What you should not put anywhere

- **Generated files** — `.data/`, `frontend/dist/`, `backups/`, `demo-tokens.json` should never be committed. The `.gitignore` covers these.
- **Secrets** — no `.env` file, no real LLM API keys, no Google OAuth client secrets in any committed file. The auth module's `feature-flags.ts` lists env var *names*, not values.
- **Files that don't have a clear home in this map** — if something feels homeless, that's a signal that either a new directory is needed or the thing belongs in an existing module you haven't noticed.

## Where this doc came from

This file is a master. Specifics about each module live in:
- [ARCHITECTURE.md](./ARCHITECTURE.md) — runtime topology
- [MODULARISATION.md](./MODULARISATION.md) — the module/tier/profile registry's human-readable companion
- [`modules.yaml`](./modules.yaml) — authoritative source of truth for what modules exist

If a new directory or convention lands and this doc doesn't reflect it, this doc has a bug.
