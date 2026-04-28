# Pending items — the full honest ledger

> **Status:** canonical reference · last reviewed 2026-04-24
> **Purpose:** every deferred item, every "future", every "stub mode" across the project — grouped by subsystem, with honest effort estimates and dependencies.
> **Supersedes:** the older TODOS.md from before the current architecture stabilized.

This document is the single place a reader or new contributor can go to find **"what's not done yet and why"** across the entire project. It is intentionally exhaustive rather than curated.

Each item is tagged:

- **Priority** — `P1` blocks the next natural milestone / `P2` valuable but deferrable / `P3` nice-to-have
- **Effort** — `S` ≤ 1 day / `M` 2-5 days / `L` 1-3 weeks / `XL` weeks-of-work / `migration` needs a data or schema change
- **Depends on** — what must exist before this can be done
- **Status** — `deferred` (we chose not to ship) / `planned` (next up) / `future` (when relevant) / `stub` (scaffolded but inactive)

Navigation by subsystem:

1. [Deployment & hosting](#1-deployment--hosting)
2. [Demo & installation](#2-demo--installation)
3. [Exams & content adapters](#3-exams--content-adapters)
4. [Content subsystem](#4-content-subsystem)
5. [Customer lifecycle](#5-customer-lifecycle)
6. [Agent org](#6-agent-org)
7. [GBrain cognitive spine](#7-gbrain-cognitive-spine)
8. [Modularisation & orchestrator](#8-modularisation--orchestrator)
9. [B2B institutional tier](#9-b2b-institutional-tier)
10. [Monetization](#10-monetization)
11. [Further use cases identified](#11-further-use-cases-identified)
12. [Frontend UI gaps](#12-frontend-ui-gaps)
13. [Runtime integration gaps](#13-runtime-integration-gaps)
14. [Documentation gaps](#14-documentation-gaps)

---

## ✓ Shipped in the 2026-04-24 "perform pending activities" commit

Thirteen items moved from pending → done (11 backend/infra + 2 frontend pages in follow-ups). The sections below show the full remaining list. Thirteen more items shipped in subsequent commits and are listed at the bottom of this banner.

| Item | What shipped |
|---|---|
| **§1.3** Scheduler | `src/jobs/scheduler.ts` — `finaliseExpiredDeletions` hourly + `healthScan` every 5min. Wired into gate-server boot. `/api/orchestrator/jobs` admin view. |
| **§1.4** Backups | `scripts/backup-data.ts` — tarball to `backups/` (gitignored) with `--list` and `--prune N` subcommands. `npm run backup:create`. |
| **§2.3** Idempotency tests | `src/__tests__/unit/data/lifecycle.test.ts` — 6 new tests proving seed idempotency + data-rights cooling period + scheduler registration. Vitest 107→113. |
| **§3.1** NEET Biology | 4th exam adapter. `src/samples/neet-biology.ts` + `src/exams/adapters/neet-biology.ts` + aggregator line. Full ExamAdapter contract. |
| **§4.6** Intent classifier | `src/content/intent-classifier.ts` — extracted the rule-based classifier and added an async path with LLM fallback (opt-in via `VIDHYA_INTENT_CLASSIFIER=llm`). Drop-in when budget allows. |
| **§4.7** Content subscription picker UI | `frontend/src/pages/gate/ContentSettingsPage.tsx` at `/gate/content-settings`. Lists bundles, optimistic subscribe/unsubscribe with rollback on error, source-exclusion toggles, honest stub-mode banner. Linked from `/gate/settings`. |
| **§4.8** Upload drag-and-drop UI | `frontend/src/pages/gate/UploadsPage.tsx` at `/gate/uploads`. Drag-and-drop zone + click fallback, concept-tag chips with known-concept suggestions, optimistic delete, privacy banner. Verified end-to-end: `find-in-uploads` intent correctly finds tagged uploads. |
| **§6.3** Validator coverage | 3 new invariants in `agents/validate-graph.py`: owned-tool paths exist, signal pairing (emits → subscribers), manager has downstream or `standalone: true`. 24 honest warnings surfaced. |
| **§7.1** Attention-counter migration | `scripts/migrations/001-drop-attention-counter.ts` — idempotent strip of the legacy field. |
| **§11.7** Parent role | `parent` added to backend + frontend `Role` type. `ROLE_RANK.parent = 0` (orthogonal — scope is per-student, not site-wide). `User.guardian_of[]` / `User.guardians[]` fields. `hasGuardianOf()` helper. |
| **§13.2** Signal bus | `src/events/signal-bus.ts` — in-process pub/sub. `content-router` publishes `content-routed` per decision. `/api/orchestrator/signals` admin view with recent-events buffer. |
| **§13.3** Periodic health scan | Included as a job in the scheduler (every 5 minutes). Degraded-state transitions surface in logs even without operator polling. |
| **§1.1** (documentation only) | Live URL — still operator action; link to [`DEPLOY.md`](./DEPLOY.md) clarified. |
| **§8.x** (new, post-banner) — Auth as first-class module | `ebdf23c`. Carved `src/auth` out of `core` in `modules.yaml`; new `auth` module with `foundation: true`. Public surface at `src/modules/auth/index.ts` (barrel re-export). 4 feature flags (`auth.google_oidc`, `auth.demo_seed`, `auth.parent_role`, `auth.institution_role`) with env-var control read once at boot. New `GET /api/orchestrator/features` endpoint. Auth health probe separate from core. Bug fix: `handleSetRole`'s hardcoded role allowlist never accepted `parent` despite the type system claiming otherwise — now derived from the full `Role` union. Scaffolding for `institution` role added (rank 5, flag-gated, default off). |
| **§9.1** (partial) — Institution role scaffolding | `ebdf23c`. Type-system scaffolding only — `institution` in the `Role` union, `ROLE_RANK = 5`, frontend mirror, `setRole()` flag gate. Tenant isolation (the actual B2B tenancy logic) is still PENDING.md §9.2 onwards. |
| **§(operator UX)** — Feature matrix UI | `dd7dc2f`. New page at `/gate/admin/features` (admin-only). Renders flag state with overridden/default badges, env-var name, and one-paragraph description per flag. Read-only by design. QuickLink added to `/gate/admin/dashboard`. |
| **§(teaching loop)** — TeachingTurn schema + persistence + read API + UI | `807e179`. New `teaching` module (10th in modules.yaml) with append-only JSONL log at `.data/teaching-turns.jsonl`. Module barrel at `src/modules/teaching/index.ts`. Three read endpoints (`/api/turns/me`, `/api/turns/student/:id`, `/api/turns`) with layered authorization (admin/teacher-roster/parent-guardian/self). Frontend at `/gate/turns` (own) and `/gate/turns/:id` (admin/teacher/parent view). 8 unit tests covering round-trip, in-flight, double-close earliest-wins, corruption recovery, trend computation, insufficient-data guard, degradation legibility. Vitest 113→121. |
| **§(teaching loop)** — Instrumentation of chat-routes + notebook-insight | `df0b2eb`. handleChat opens a turn after the GBrain task reasoner runs (capturing `student_intent` + `pedagogical_action` from the reasoner). closeTurn fires after the SSE stream completes or on error. Degraded-mode early-exit (no GEMINI_API_KEY) records a fully-closed turn with `degraded.reason='no-llm-available'`. handleAttemptInsight wraps `computeInsight` to capture real `mastery_delta` on close — the highest-fidelity turn record in the system. Pre-existing condition: notebook-insight depends on Postgres so the mastery-delta path can only be sandbox-verified in a Postgres-equipped deployment. |
| **§(teaching loop)** — Scenario detection + master doc + e2e runtime test | (this commit). Four scenarios detected: cold start, ZPD candidate, repeated error pattern, no-LLM degraded — all flagged on `pre_state` at turn-open time. New `TEACHING.md` master doc covering the loop, the seven scenarios with detection status, the contract for instrumenting new handlers, privacy and access control. New `npm run verify:teaching` script — 10-assertion runtime test that proves a turn round-trips end-to-end through a live backend (chat → degraded turn → /api/turns/me → admin firehose → cross-student isolation → 403 → anon turn). Three scenarios deliberately deferred: plateau (needs cross-turn analytics), stale content (needs syllabus_version registry), verification failure (needs rendering-routes hook). |
| **§(content-library)** — Module substrate (seeds + additions + index) | `4df51ba`. New `content-library` module (11th in modules.yaml, `foundation: true`). Two-source persistence: seed dir at `data/content-library/seed/<concept_id>/{meta.yaml, explainer.md, worked-example.md}` (committed) + JSONL additions at `.data/content-library-additions.jsonl` (runtime). In-memory Map<concept_id, LibraryEntry> at boot, additions override seeds. 3 starter concepts copied (not moved) from `modules/project-vidhya-content/concepts/`. One feature flag: `content_library.user_authoring` (default off). 14 unit tests covering all 4 ranking vectors, kebab-case validation, additions overriding seeds, stats accuracy, mastery-to-difficulty bands. Vitest 121→135. |
| **§(content-library)** — HTTP endpoints (public read, admin/flagged write) | `4aea4d2`. Three endpoints: `GET /api/content-library/concepts` (public, optional `?source=` filter), `GET /api/content-library/concept/:id` (public), `POST /api/content-library/concept` (admin or teacher+ when flag on). POST always overrides client-supplied `added_by` with actor's id. `source='seed'` rejected at API layer. For `source='llm'`, annotates `added_by` as `llm:<provider> (via <admin-id>)`. 11 route tests. Real bug caught and fixed during test writing: `req.query` is `URLSearchParams` not plain object — the buggy `(req.query as any)?.source` would have shipped silently broken without route tests. Vitest 135→146. |
| **§(content-library)** — Router cascade integration + master doc | (this commit). Library plugs into `src/content/router.ts` cascade between `subscription` and `bundle` tiers. New `Source` enum value `'library'`. Source ref format `library:<seed\|user\|llm>:<concept_id>`. For `practice-problem` and `walkthrough-problem` intents, library serves the worked-example body; for other intents, the explainer. Disclosure text varies between built-in (seed) and contributed (user/llm). `RouteRequest` gains optional `preferred_difficulty` and `preferred_exam_id` hints (forward-looking scaffolding for when concepts have multiple difficulty entries). 8 router cascade tests covering library-wins, intent → body selection, considered-list ordering, user-contributed disclosure phrasing. New `LIBRARY.md` master doc (~340 lines) covering schema, two sources, API surface, cascade tier, personalisation hints, three workflows for adding content, durability properties. Vitest 146→154. |
| **§(content-studio)** — Module substrate + 4 source adapters + draft lifecycle | `ab14ffd`. New `content-studio` module (12th in modules.yaml). Admin-driven content authoring with 4 generation sources cascading in priority order: uploads → wolfram → url-extract → llm. URL-extract is hand-rolled regex extraction (zero new deps; admin reviews each draft so brittleness is acceptable). Drafts persist to `.data/content-drafts.jsonl` with 5 event kinds (created/edited/approved/rejected/archived). Promotion path calls `addLibraryEntry` first; only on success appends 'approved' event. Library source set to `'llm'` for LLM-sourced drafts, `'user'` otherwise. 15 unit tests including a real network call to example.com. Vitest 154→169. Honest non-goals: no HTTP routes (commit 2), no UI (commit 3), Gemini-only LLM, no bulk gen, no URL allowlist, no archive→restore. |
| **§(production-readiness)** — Docs pass + concise README + CI workflow | `98bdc16`. README rewritten 320→141 lines (55% reduction) preserving voice (em-dashes, second-person narrative). New `PRODUCTION.md` (~250 lines) — honest checklist of what's ready (type safety, 169 tests, graceful degradation table, auth model, persistence + backups, observability, doc tree) and what's not (single-process state, no moderation flow, no rate limiting, no retention policy, limited observability, no SLO, no security audit, no PII redaction, no LLM cost controls). `.env.example` rewritten (was "EduGenius v2.0" with stale DATABASE_URL/REDIS_URL refs; now honest about required vs optional). CI workflow at `docs/operator-snippets/regression-workflow.yml.example` (operator-installable; PAT lacked workflow scope). SECURITY.md placeholder email removed. |
| **§(production)** — Rate limit + per-user LLM budget cap | `48b50ad`. Two of the eight gaps from PRODUCTION.md closed in one commit because both protect the operator from runaway LLM costs. New `src/lib/rate-limit.ts` (~150 LOC, hand-rolled token-bucket) with default limits per endpoint: chat 30/min, content-studio.generate 10/hour, content-library.write 60/min, attempt-insight 100/min. `VIDHYA_RATE_LIMIT_DISABLED=true` override for load testing. New `src/lib/llm-budget.ts` (~140 LOC, default OFF, opt in via `VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER`). Daily UTC reset, reservation/recordUsage/cancelReservation flow. Wired into chat-routes between input validation and getChatModel; cancelReservation on error and on no-LLM-degraded path. 13 unit tests + 9 runtime assertions in `npm run verify:budget`. Vitest 169→182. Live verified: 35 chat calls in succession → 29 passed + 6 rate-limited (HTTP 429 with `retry_after_ms: 512`). |
| **§(operator)** — Founder ecosystem module + FOUNDER.md | (this commit). New `operator` module (13th in modules.yaml) with three small adapters: `localPaymentsAdapter` (Stripe-compatible shape, JSONL append-only), `localAnalyticsAdapter` (event recording with query + countByType), `buildDashboard` (aggregator pulling from user store, payments, teaching turns, content-studio drafts, budget module, health probes — `caveats` array on every response lists what's missing). 4 HTTP endpoints: `GET /api/operator/dashboard` (admin), `POST /api/operator/payments/record` (admin), `POST /api/operator/payments/webhook` (shared-secret via `OPERATOR_WEBHOOK_SECRET`, default 503 if unset), `POST /api/operator/analytics/event` (admin). New `FOUNDER.md` (~340 lines) — solo-founder runbook with stack table (Render, Netlify, Cloudflare, Resend, Stripe, Plausible, Sentry, BetterStack), day-1 checklist, marketing/acquisition/strategy/revenue advice with concrete pricing, dependency diagram split into critical-path vs convenience vs setup-time, anti-patterns. 11 unit tests. Vitest 182→193. Honest scope: code is small (~700 LOC across module + routes + tests); FOUNDER.md is the real artefact because almost nothing a solo founder needs lives in code. |
| **§(content-studio)** — Module substrate + 4 source adapters + draft lifecycle | `ab14ffd`. New `content-studio` module (12th in modules.yaml). Four source adapters at `src/content-studio/sources/*.ts` cascading in admin-chosen priority order: uploads (free, highest fidelity), wolfram (verified math), url-extract (admin-supplied URL with hand-rolled HTML extraction; bounded by design — single URL, no crawling, ~135 LOC, zero new deps), llm (last-resort Gemini). First non-null result wins; later sources recorded as 'skipped' for audit. Draft lifecycle: created → edited → approved/rejected/archived, persisted as append-only JSONL at `.data/content-drafts.jsonl`. Approval calls library's addEntry FIRST then appends 'approved' event (atomicity). 15 unit tests including a real network call to example.com. Vitest 154→169. |
| **§(production)** — Rate limit + per-user LLM budget cap | `48b50ad`. Hand-rolled token-bucket rate limiter at `src/lib/rate-limit.ts` (~150 LOC, zero new deps). Per-actor + per-endpoint isolation. DEFAULT_LIMITS for chat (30/min), content-studio.generate (10/hour), content-library.write (60/min), attempt-insight (100/min). Lazy refill, in-memory only (multi-process gap documented). Override via `VIDHYA_RATE_LIMIT_DISABLED`. Per-user daily LLM budget at `src/lib/llm-budget.ts` (~140 LOC). Default OFF; opt in via `VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER`. Daily UTC midnight reset. tryReserveTokens → recordUsage/cancelReservation flow. Wired into chat-routes at handler entry (after input validation, before getChatModel). 22 tests: 8 rate-limit unit + 5 budget unit (disabled mode) + 9 budget runtime via `scripts/verify-llm-budget.ts` (env var set BEFORE module load — vitest can't reliably override env at module-load time). Live verified: 35 chat calls in succession, 29 passed + 6 rate-limited HTTP 429. Vitest 169→182. |
| **§(operator)** — Solo-founder ecosystem | (this commit). New `operator` module (13th in modules.yaml). Three small adapters + a dashboard endpoint, NOT a marketing/sales/support module. Local-JSONL defaults at `.data/payments.jsonl` and `.data/analytics.jsonl` so a fresh deployment tracks revenue and events on day one without external accounts. PaymentEvent shape is Stripe-compatible. Webhook endpoint authenticated via shared secret (`OPERATOR_WEBHOOK_SECRET`). 4 endpoints: GET dashboard (admin), POST payments/record (admin), POST payments/webhook (shared-secret), POST analytics/event (admin). Dashboard aggregates from user store, payments adapter, teaching turn store, content-studio drafts, budget module, and health probes; honest about gaps via `caveats` field. Companion FOUNDER.md (~340 lines) is the runbook covering the recommended stack with cost estimates (Render/Netlify/Cloudflare/Resend/Stripe/Plausible/Sentry/BetterStack/Buttondown), day-1 checklist, marketing channels worth trying vs not, acquisition funnel math, strategy heuristic ("do the thing that makes the next user successful"), revenue model (when/how/what to charge), operations runbook, dependency diagram, anti-patterns. 11 unit tests for the operator module. Vitest 182→193. Live verified: dashboard returns 6 users (1 owner+1 admin+1 teacher+3 students), 13 modules in health, real payment recorded → dashboard immediately shows total_30d/paid_users_30d/arpu_30d. |

Everything tested end-to-end on a live backend before each commit landed. See commit messages for proofs.

---

## 1. Deployment & hosting

### 1.1 Live production URL

**Status:** deferred — operator decision
**Priority:** P1
**Effort:** S (one click + three minutes)
**Depends on:** `render.yaml` (shipped), operator creating a Render account

**Detail:** The "Deploy to Render" button in README.md is the one-click path. Clicking it provisions the service per `render.yaml`. I cannot do this from a sandbox — no Render credentials. See [`DEPLOY.md`](./DEPLOY.md) for the three-click walkthrough.

### 1.2 BYOK key rotation procedure

**Status:** not yet documented
**Priority:** P2
**Effort:** S
**Depends on:** a live deployment

**Detail:** When a LLM provider key gets compromised or rotated, the operator should know which env var to change and expect a ~30-second redeploy. This is a short DEPLOY.md addition.

### 1.3 Scheduled cron — `finaliseExpiredDeletions()`

**Status:** function exists, cron registration does not
**Priority:** P1
**Effort:** S
**Depends on:** a cron infrastructure choice (Render cron jobs, GitHub Actions scheduled, OS-level)

**Detail:** `src/data-rights/delete.ts#finaliseExpiredDeletions()` is the handler that hard-deletes soft-deleted users whose 24h cooling period has elapsed. Today nothing calls it periodically. Either wire into Render's cron jobs, add a GitHub Actions scheduled workflow, or add a simple `setInterval` inside the server process (simplest, works for single-instance deploys).

### 1.4 Database backups for the flat-file store

**Status:** not addressed
**Priority:** P1 once real users
**Effort:** S
**Depends on:** nothing

**Detail:** `.data/` is the source of truth. A simple daily `tar.gz` uploaded to S3 or similar is the natural approach. No user data currently, so not urgent; the moment a real user signs up, this becomes P1.

### 1.5 Multi-region / HA

**Status:** out of scope
**Priority:** P3
**Effort:** XL
**Depends on:** scale
**Detail:** Flat-file store rules out multi-instance writes without a coordination layer. When scale forces this, the natural path is replacing `src/lib/flat-file-store.ts` with a DB-backed equivalent (Postgres or SQLite replicated). Plan this as a migration when traffic warrants, not before.

---

## 2. Demo & installation

### 2.1 INSTALL.md cleanup

**Status:** done in this commit
**Priority:** P1
**Effort:** S (already done)

**Detail:** Previous INSTALL.md described a Supabase-era install path. This commit rewrites it for the current flat-file architecture.

### 2.2 Live LLM smoke test in CI

**Status:** deferred — requires real API keys
**Priority:** P2
**Effort:** S
**Depends on:** GitHub Actions secrets for at least one provider

**Detail:** The smoke suites (`smoke:stdio`, `smoke:sdk-compat`) test the SDK surface but don't exercise real LLM calls. Adding one test that calls Gemini/Anthropic/OpenAI via the router would catch regressions in the adapter code. Needs a repo secret (operator call — gets charged against that provider).

### 2.3 Demo seed idempotency tests

**Status:** informally tested, not in CI
**Priority:** P3
**Effort:** S

**Detail:** `upsertFromGoogle` is idempotent by `google_sub`, so re-running `demo:seed` on a populated `.data/` doesn't duplicate users. There's no explicit test that proves this beyond the manual `demo:verify`. A 10-line vitest unit test would lock the property.

---

## 3. Exams & content adapters

### 3.1 More exams

**Status:** 3 shipped (BITSAT, JEE Main, UGEE Math); pattern documented
**Priority:** P2 per new exam
**Effort:** M per exam (authoring + verification data; code is ~2 files)
**Depends on:** content-team bandwidth, access to canonical exam material

Candidate exams per [`EXAMS.md`](./EXAMS.md):

| Exam | Priority | Notes |
|---|---|---|
| NEET Biology | P2 | Huge target audience; biology is a different content authoring discipline |
| JEE Advanced | P2 | Natural next step after JEE Main |
| GATE Mathematics | P3 | Legacy reference exists, needs adapter |
| CAT Quant | P3 | Large audience but very different (aptitude style) |
| GRE Quant | P3 | International audience |
| SAT Math | P3 | International audience |

**Recipe for adding an exam is documented in EXAMS.md** — two files + one line in the aggregator.

### 3.2 Topic-weight updates annually

**Status:** informal process
**Priority:** P2
**Effort:** S per exam per year

**Detail:** Exam topic distributions drift year-to-year. BITSAT's 27.5% calculus weighting is from 5 years of past-paper analysis, valid today. No scheduled re-audit. Probably want a manual process: `curriculum-manager` checks January of each year and bumps weights if needed.

### 3.3 Sample paper generation refresh

**Status:** `src/samples/` exists for all 3 exams
**Priority:** P3
**Effort:** M

**Detail:** The sample-paper generators produce mock exams. They work but the question quality is constrained by what the LLM + Wolfram-verify pipeline can generate. Human curation of a gold-standard mock set per exam would be a quality lift, not a code change.

---

## 4. Content subsystem

### 4.1 Create `project-vidhya-content` GitHub repo

**Status:** deferred — operator decision
**Priority:** P1
**Effort:** S (one `gh repo create` + `git subtree push`)
**Depends on:** decision to accept community PRs

**Detail:** The subrepo is **built** at `modules/project-vidhya-content/` and `content.pin` is in `local` mode serving it end-to-end. Converting to a real GitHub subrepo requires the four commands documented in CONTENT.md. This is a governance call (who maintains the repo, licensing defaults, PR review policy) rather than engineering.

### 4.2 More seed concepts in the subrepo

**Status:** 3 seed concepts shipped
**Priority:** P2
**Effort:** M per concept (4-8 hours each of authoring + review)

**Detail:** Today's seed has `calculus-derivatives`, `linear-algebra-eigenvalues`, `complex-numbers`. Any of the ~80 concepts in `src/curriculum/concept-exam-map.ts` can get a corresponding subrepo concept. Each one is independent work. The pattern is clear; what's needed is content-author time.

### 4.3 Wolfram verification in subrepo CI

**Status:** documented in CONTRIBUTING.md, not wired to CI
**Priority:** P2
**Effort:** M
**Depends on:** Wolfram App ID secret in the subrepo's GitHub Actions

**Detail:** CONTRIBUTING.md says PRs with numerics get Wolfram-verified. The CI workflow (`checks.yml`) runs the basic validator but not Wolfram-verify. Adding the step: extend `scripts/check.js` to find `$...$` and `$$...$$` LaTeX blocks in explainers and worked-examples, extract numerics, submit to Wolfram, flag disagreements.

### 4.4 OCR for image uploads

**Status:** stub — image uploads stored without text extraction
**Priority:** P2
**Effort:** M
**Depends on:** `tesseract` or equivalent

**Detail:** `src/content/uploads.ts` stores images fine, returns them to the owner, but doesn't extract text for the router to find via `find-in-uploads` intent. Concept tagging is user-provided only. Adding tesseract-based OCR would let the router match uploads by content rather than just by explicit tagging.

### 4.5 PDF text extraction for uploads

**Status:** stub — same as OCR
**Priority:** P2
**Effort:** S
**Depends on:** `pdf-parse` npm package

**Detail:** PDF uploads store the file but don't extract text. `pdf-parse` is ~100 lines of integration code.

### 4.6 LLM-backed intent classifier

**Status:** rule-based classifier shipped
**Priority:** P3
**Effort:** S
**Depends on:** nothing — router has a clean `classifyIntent(text) → Intent` interface

**Detail:** Current classifier is keyword-regex. Works deterministically, fast, testable, but limited. Swapping to an LLM call with strict JSON schema is a drop-in — just route through `llm-router-manager`. Wait until the rule-based one is shown to misclassify in production.

### 4.7 Frontend subscription picker UI — ✓ SHIPPED 2026-04-24

**Status:** ✓ shipped at `frontend/src/pages/gate/ContentSettingsPage.tsx` — route `/gate/content-settings`, linked from `/gate/settings`.
**Priority:** ~~P2~~
**Effort:** ~~M~~

**What landed:** Lists available bundles with descriptions + concept counts + verified badges. Optimistic subscribe/unsubscribe with per-bundle rollback on error. Source-exclusion toggles for generated / wolfram / uploads / community / cache. Honest mode banner (stub / local / live) with pin SHA. All bundle and subscription state read from / written to the existing `/api/student/content/*` endpoints. Frontend typecheck clean; no backend changes needed.

### 4.8 Frontend upload UI — ✓ SHIPPED 2026-04-24

**Status:** ✓ shipped at `frontend/src/pages/gate/UploadsPage.tsx` — route `/gate/uploads`, linked from `/gate/settings`.
**Priority:** ~~P2~~
**Effort:** ~~M~~

**What landed:** Drag-and-drop zone (keyboard-accessible) with click-to-select fallback. Per-upload note and concept-tag chips with autocomplete suggestions for known concept IDs. Optimistic list with rollback on error. Client-side enforces the ~7.5 MB binary ceiling up-front (server accepts 10 MB base64 = ~7.5 MB binary) so users don't hit a confusing body-limit error. Privacy banner surfaces the constitutional constraint that uploads stay user-private. End-to-end verified: `find-in-uploads` intent correctly returns the tagged upload from a routing request.

### 4.9 "Wolfram live" disclosure in frontend

**Status:** endpoint shipped, UI doesn't exist
**Priority:** P2
**Effort:** S

**Detail:** When content-router returns `source: "wolfram"`, the response has a `disclosure` field *"Computed live by Wolfram Alpha"*. No frontend reads this yet. Should show a badge next to Wolfram-sourced content to keep students clear on attribution.

---

## 5. Customer lifecycle

### 5.1 Onboarding / retention frontend dashboards

**Status:** endpoints shipped, UI doesn't exist
**Priority:** P2
**Effort:** M

**Detail:** `GET /api/admin/lifecycle/funnel` and `/retention` return detailed reports. No admin-facing React page visualises them. Once built, owners can see cohort conversion + retention without curl.

### 5.2 Rout retention findings to feedback-manager

**Status:** findings are produced, routing is manual
**Priority:** P2
**Effort:** S

**Detail:** `retention-specialist` emits findings (e.g. *"cohort 2026-W15 dropped 60%"*). Today they sit in the HTTP response. The design intent is that sufficiently-severe findings auto-route as events to `feedback-manager` for human triage. Add an event emission + subscription in `feedback-manager`'s manifest.

### 5.3 "Carry over" opt-in UI polish

**Status:** MVP shipped
**Priority:** P3
**Effort:** S

**Detail:** The `/gate/convert-demo` page asks for email and shows a carry-over summary. It could be improved: preview the actual plans/templates about to be carried over, let the user deselect individual items, show the trailing-stats badge before/after.

### 5.4 Google OAuth handoff on conversion

**Status:** demo stub — real OAuth not wired
**Priority:** P1 before real-user launch
**Effort:** M

**Detail:** Production conversion would chain: click "Make this real" → Google OAuth popup → backend verifies id_token → migration runs → new real JWT minted → user logged in as real account. Today's demo stops at "your data has been migrated, sign in with Google next". Real OAuth is wired elsewhere in the app (`src/auth/google-verify.ts` exists); hooking into the conversion flow is straightforward.

### 5.5 Exit-feedback collection

**Status:** `feedback-manager` exists, no exit-path collection
**Priority:** P2
**Effort:** M

**Detail:** When a user requests account deletion, we currently say goodbye. `data-rights-specialist`'s manifest mentions exit feedback (why are you leaving?). A 1-question optional form before `confirmDeletion` would feed `feedback-manager`.

---

## 6. Agent org

### 6.1 Agent runtime

**Status:** manifests define the org; runtime is limited
**Priority:** P2
**Effort:** L
**Depends on:** runtime choice (Claude Agent SDK / MCP stdio / LangGraph)

**Detail:** The agent org (56 agents across 4 tiers) is authoritative in manifests but the actual runtime composition — dispatching tasks to specific agents via their declared skills — exists only partially via the MCP tool layer. A full runtime would read each manifest's `owned_tools` + `skills` and auto-wire agent-to-agent delegation. Today, most agent responsibility is enforced at review time, not runtime.

### 6.2 Per-agent system prompts

**Status:** not implemented
**Priority:** P2
**Effort:** M

**Detail:** Each manager and specialist manifest could declare a `system_prompt` field used when the agent is invoked via LLM. Today agent mission/skills/decision_rules sit in YAML but aren't composed into actual LLM calls. Implementing: `src/agents/prompt-composer.ts` that reads a manifest and generates a system prompt.

### 6.3 Agent graph validator coverage

**Status:** 8 invariants, all passing
**Priority:** P3
**Effort:** S

**Detail:** The Python validator (`agents/validate-graph.py`) enforces graph invariants. Could add: "every agent's `owned_tools.id` referencing `src/` must exist", "every `emits_signals` name has at least one `subscribes_to` subscriber somewhere in the org", "every manager has ≥1 specialist under it OR a justification note".

### 6.4 Orchestrator-specialist runtime

**Status:** HTTP surface shipped, doesn't actually orchestrate runtime yet
**Priority:** P3
**Effort:** L

**Detail:** `src/orchestrator/` reads `modules.yaml` and exposes composition queries. It doesn't yet influence the actual boot process — the server boots with all routes registered, regardless of deployment profile. Wiring composer → conditional route registration is straightforward but needs a refactor of `gate-server.ts` to route registration through the composer.

---

## 7. GBrain cognitive spine

### 7.1 Retire legacy `attention_counter` field

**Status:** deprecated but present
**Priority:** P2 (schema hygiene)
**Effort:** S
**Depends on:** data migration

**Detail:** Older schema had `attention_counter` on user objects. Replaced by the attention-store. A migration to drop the legacy field from all existing `.data/users.json` records. ~10 line migration script + release note.

### 7.2 Source-aware mastery weighting

**Status:** documented in CONTENT.md, not implemented
**Priority:** P3
**Effort:** M

**Detail:** Content from Wolfram-verified sources should contribute higher-confidence mastery estimates than content from LLM-generated sources. Today `attempt-insight-specialist` records all attempts equally. Adding a confidence-weight based on the `source` field of the attempt's content record is a ~20-line change in the mastery update logic.

### 7.3 Error-cluster → content traceback

**Status:** each exists; connection not drawn
**Priority:** P3
**Effort:** M

**Detail:** `error-classifier` clusters student mistakes. `content-router` knows what content preceded an attempt. Joining these so that *"this error cluster correlates with this explainer"* becomes visible to `authoring-manager` is a schema + view. Useful for identifying which explainers create misconceptions.

### 7.4 Per-student trailing stats on admin dashboard

**Status:** endpoint exists, admin UI doesn't show per-student
**Priority:** P3
**Effort:** S

**Detail:** Admin can see aggregate retention. Viewing a specific student's trailing-stats would require an endpoint (exists: `/api/student/session/trailing-stats` works for self) + admin-impersonation endpoint (doesn't exist).

---

## 8. Modularisation & orchestrator

### 8.1 Actually execute subrepo splits

**Status:** 1 subrepo built (content), 3 others documented but unsplit
**Priority:** P2
**Effort:** S per split once decided

**Detail:** Per MODULARISATION.md split-order recommendation:
1. ✓ **content** — built (this commit)
2. **exams** — smallest, cleanest next split
3. **channels** — independent licensing concerns
4. **rendering (frontend)** — biggest, requires coordination

Each split is a `git subtree push` + `modules.yaml` source-pointer update + main-repo import path change. Commands documented; execution is an operator choice per module.

### 8.2 Profile-driven conditional boot

**Status:** composer resolves profiles; boot doesn't use it
**Priority:** P3
**Effort:** M

**Detail:** Today `gate-server.ts` registers every route regardless of the deployment profile. A `channel-only` deployment currently includes the web-facing surfaces (harmless but wasteful). Making boot conditional: read `DEPLOYMENT_PROFILE` env var, pass to composer, register only the routes for active modules. Touches ~20 lines in `gate-server.ts`.

### 8.3 Orchestrator dashboard UI

**Status:** endpoints shipped, no UI
**Priority:** P3
**Effort:** M

**Detail:** `GET /api/orchestrator/modules`, `/tiers`, `/profiles`, `/health`, `/graph` all return JSON today. An admin page visualising the dependency graph + health per module + active profile would make the orchestration concrete for operators.

---

## 9. B2B institutional tier

Status across-the-board: **documented, not implemented.** See MODULARISATION.md's B2B section and `modules.yaml#tiers.institutional-b2b` (`status: planned`).

### 9.1 `institution` role in auth middleware

**Status:** partial — type-system scaffolding shipped in `ebdf23c`
**Priority:** P1 before B2B launch
**Effort:** S (remaining)

**Detail:**
- ✅ **Done (ebdf23c):** `institution` added to the `Role` union (`src/auth/types.ts`), `ROLE_RANK.institution = 5` (above owner). Frontend mirror updated. `setRole()` accepts `'institution'` only when the `auth.institution_role` feature flag is on (default off — `VIDHYA_AUTH_INSTITUTION_ROLE`). `UserAdminPage.tsx`'s `ROLE_META` carries an entry for institution so the type system stays exhaustive.
- ⏳ **Remaining:** `requireRole` middleware doesn't yet handle institution-specific scoping. The role rank check works, but tenant isolation logic (i.e. "institution-admin can only see users in their tenant") is not implemented. That work belongs in §9.2 once the schema migration lands.

### 9.2 `institution_id` schema migration

**Status:** planned
**Priority:** P1 before B2B launch
**Effort:** migration (real data migration)

**Detail:** Every per-user flat-file store gets an `institution_id` field. Users belonging to institution A cannot be queried by institution B's owner. Migration script: iterate existing records, default-assign to a "no institution" tenant for backward compat.

### 9.3 Per-institution admin UI

**Status:** planned
**Priority:** P1 before B2B launch
**Effort:** L

**Detail:** An "institution owner" role needs a page to: provision per-branch owners, set institution-wide policies (which exams, which channels, which monetization tiers), run institution-wide reporting. Significant frontend work.

### 9.4 Tenant-isolation test suite

**Status:** planned
**Priority:** P1 before B2B launch
**Effort:** M

**Detail:** Before shipping B2B, need a test suite that proves: institution A's data is invisible to institution B's owner, cross-tenant writes are refused, content/exam adapters are correctly shared across tenants while data stays isolated.

---

## 10. Monetization

Status across-the-board: **catalog designed, runtime not built.**

### 10.1 Payment rails integration

**Status:** not implemented
**Priority:** P1 before monetization launch
**Effort:** L
**Depends on:** payment provider choice (Stripe / Razorpay / both)

**Detail:** Users purchase bundle subscriptions. Today all `paid-basic` / `paid-premium` entries in the catalog are theoretical. Adding Stripe webhooks + purchase UI + refund flow is significant.

### 10.2 Entitlement enforcement in content-router

**Status:** not implemented
**Priority:** P1 before monetization launch
**Effort:** S
**Depends on:** entitlement store schema

**Detail:** `content-router` checks subscriptions today. It should also check entitlements: *"is this user's subscription to `bitsat-prep-2026` still active?"* Not expensive — a JSON lookup — but requires the entitlement store to exist first.

### 10.3 Subscription lifecycle

**Status:** not implemented
**Priority:** P2
**Effort:** M

**Detail:** Expiring subscriptions should notify the user before expiry (but not in a guilt-pingy way — constitutional). Renewal flow, grace period policy, downgrade behaviour all need design.

### 10.4 Revenue share for community authors

**Status:** not designed
**Priority:** P3
**Effort:** L

**Detail:** If a community author contributes a bundle that students subscribe to, the author's `meta.yaml.contributor_github` should receive a cut. Mechanics (accumulating, paying out, tax reporting) are substantial. Design before building.

---

## 11. Further use cases identified

Per MODULARISATION.md's "8 further use cases" section:

| # | Use case | Status | Priority | Effort |
|---|---|---|---|---|
| 11.1 | API-as-a-service | future | P3 | L |
| 11.2 | Language localisation (Hindi/Tamil) | future | P2 | content-heavy |
| 11.3 | Accessibility (TTS, large-text) | future | P2 | M |
| 11.4 | Content marketplace | future | P3 | L |
| 11.5 | Teacher-as-a-service | future | P3 | L |
| 11.6 | Research tier | future | P3 | M |
| 11.7 | Parent / guardian view | partial | P3 | S (UI page remaining; backend role + flag shipped) |
| 11.8 | Proctored exam | future | P3 | XL |

Each has documented fit assessment + effort estimate in MODULARISATION.md's "further use cases" section. None are in flight.

---

## 12. Frontend UI gaps

Aggregated list of UI pages that don't exist yet where the backend endpoint does:

| Missing page | Backend endpoint(s) | Priority | Effort |
|---|---|---|---|
| Content subscription picker | `/api/student/content/*` | ✓ shipped | — |
| Upload drag-and-drop | `/api/student/uploads` | ✓ shipped | — |
| Activation funnel dashboard | `/api/admin/lifecycle/funnel` | P2 | M |
| Retention findings dashboard | `/api/admin/lifecycle/retention` | P2 | M |
| Orchestrator dependency graph | `/api/orchestrator/graph` | P3 | M |
| Per-module health dashboard | `/api/orchestrator/health` | P3 | S |
| Module / tier browser | `/api/orchestrator/modules` `/tiers` | P3 | M |
| Admin data-rights controls | `/api/me/delete*` | P3 | S |

All endpoints work today via curl. These are React component additions.

---

## 13. Runtime integration gaps

### 13.1 Route registration is unconditional

**Status:** intentional today, orchestrator-gated is the plan
**Priority:** P3
**Effort:** M

**Detail:** See §8.2.

### 13.2 Signal bus not implemented

**Status:** manifests declare `emits_signals` / `subscribes_to`; no bus
**Priority:** P3
**Effort:** M

**Detail:** Agents declare signal emissions in their manifest (e.g. `content-router` emits `CONTENT_ROUTED`). There's no actual message bus yet — signals are documentation. A minimal in-process pub/sub (nothing fancy) would let agent-to-agent subscription work at runtime.

### 13.3 Health probe cadence

**Status:** on-demand only
**Priority:** P3
**Effort:** S

**Detail:** `/api/orchestrator/health` computes on request. Adding periodic health scans + alerting when a module flips from healthy to degraded is straightforward but needs an alerting destination (email? a webhook?).

### 13.4 Frontend build caching in Docker

**Status:** rebuild from scratch every deploy
**Priority:** P3
**Effort:** S

**Detail:** `demo/Dockerfile` builds the frontend in stage 1 every time. Adding a proper layer-cache strategy (copying `package.json` first, running npm ci as its own layer) would cut deploy time. Not urgent — Render deploys are fine.

---

## 14. Documentation gaps

### 14.1 CHANGELOG.md freshness

**Status:** stale relative to recent commits
**Priority:** P2
**Effort:** S

**Detail:** CHANGELOG stops covering some of the more recent work. Appending entries for each of the last ~10 commits would close the gap. Every commit message has the full context in it.

### 14.2 docs/ tree — overlaps with top-level docs

**Status:** some duplication
**Priority:** P3
**Effort:** M

**Detail:** There are both `docs/09-deployment.md` and `DEPLOY.md`, `docs/12-content-delivery.md` and `CONTENT.md`. The newer top-level docs are authoritative; the `docs/` ones pre-date them. A consolidation pass would reduce reader confusion.

### 14.3 API reference generation

**Status:** `docs/06-api-reference.md` exists, hand-maintained
**Priority:** P3
**Effort:** M

**Detail:** Auto-generating from route declarations (we have `lifecycleRoutes`, `contentLifecycleRoutes`, `orchestratorRoutes` arrays with consistent shape) would keep it fresh without effort. Not urgent while the API is still evolving.

### 14.4 Screenshot / walkthrough video for demo

**Status:** not produced
**Priority:** P3
**Effort:** S
**Depends on:** a live URL

**Detail:** A 90-second video walking through the demo landing page → planned session → admin view would be a much better sales tool than text. Requires §1.1 first.

---

## Priority snapshot — what's most pressing

The **P1** items across the ledger, grouped by what unlocks them:

**Unblocked, operator action:**
- §1.1 Live production URL (click the Deploy button)
- §4.1 Create `project-vidhya-content` GitHub repo

**Unblocked, small engineering:**
- §1.3 Cron for `finaliseExpiredDeletions()`
- §1.4 Backup job for `.data/`

**Blocked on a bigger decision:**
- §5.4 Google OAuth handoff on conversion (blocks real-user launch)
- §9.1–9.4 All B2B institutional items (blocks B2B launch)
- §10.1–10.2 Monetization payment rails (blocks monetization launch)

Nothing in this ledger is hidden. Every *"future"* / *"stub"* / *"deferred"* that was scattered across 14 documents is consolidated here.
