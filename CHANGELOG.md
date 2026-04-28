# Changelog

All notable changes to GATE Math are documented here.

## [Unreleased] — 2026-04-27 (the teaching loop made legible)

Three commits in sequence that build the legibility layer for content
generation and delivery, then wire it into the existing handlers, then
document the contract.

### `807e179` — TeachingTurn schema + persistence + read API + UI

The codebase had a teaching loop that sort-of-existed: chat-routes
called the GBrain task reasoner, content-router published events to
the signal bus, computeInsight ran after attempts. But the loop wasn't
**observable** — there was no single record showing "this student saw
X because Y, attempted Z, and mastery moved by N%". This commit creates
that record.

A TeachingTurn is a two-phase append-only event: `openTurn` when a
content request enters, `closeTurn` when the response or attempt
arrives. Reconcile merges the pair on read. Earliest-wins on
double-close keeps the log a true audit trail.

Files:
- `src/lib/append-log.ts` — JSONL append helper, companion to flat-file-store
- `src/teaching/turn-store.ts` — types, persistence, reconcile, summariseStudent
- `src/modules/teaching/index.ts` — public barrel
- `src/api/turns-routes.ts` — three read endpoints with layered auth
- `frontend/src/pages/gate/TurnsPage.tsx` — student-facing UI
- `src/__tests__/unit/data/teaching-turns.test.ts` — 8 unit tests

modules.yaml gets a 10th module (`teaching`, depends on core+content+learning).
Health probe added.

### `df0b2eb` — instrumentation of chat-routes + notebook-insight

Wires `openTurn`/`closeTurn` into the two main response surfaces so
real traffic produces real turn records.

- `chat-routes.ts handleChat` — three call paths covered: degraded
  early-exit (no GEMINI_API_KEY, opens + immediately closes with
  `degraded.reason='no-llm-available'`), main streaming path (open
  after GBrain reasoner runs so `student_intent` and
  `pedagogical_action` are populated, close after SSE completes),
  stream-error catch.
- `notebook-insight-routes.ts handleAttemptInsight` — open before
  model_after read, close after `computeInsight` returns. This is the
  highest-fidelity turn — real `mastery_delta` (before/after/delta_pct),
  real `attempt_outcome`, full `insight` payload.

The schema gained `student_intent` and `pedagogical_action` fields to
carry the GBrain reasoner's richer vocabulary.

Honest gap: notebook-insight depends on Postgres (`getOrCreateStudentModel`)
so the live mastery-delta path was only sandbox-verifiable in
type-check terms. The chat path's degraded-mode end-to-end was
verified live.

### (this commit) — scenario detection + master doc + e2e runtime test

Four scenarios detected and flagged on `pre_state` at turn-open time:

- **cold start** — `is_cold_start` when total mastery_vector attempts < 3
- **ZPD candidate** — `is_zpd_candidate` when GBrain reasoner picked the concept
- **repeated error pattern** — `repeated_error_pattern` + `consecutive_failures` when GBrain reports ≥3 consecutive failures
- **no-LLM degraded** — `degraded.reason='no-llm-available'` (already in `df0b2eb`, called out here for completeness)

Three scenarios deliberately deferred (each needs infrastructure beyond
the schema): plateau (cross-turn analytics), stale content (syllabus
version registry), verification failure (rendering-routes Wolfram hook).

New files:
- `TEACHING.md` — master doc. The contract: what a turn is, when open
  fires, when close fires, what fields it carries, the seven scenarios
  with detection status, the pattern for instrumenting new handlers,
  privacy + access control.
- `scripts/verify-teaching-loop.ts` — runtime end-to-end test, 10
  assertions covering the full open → close cycle, cross-student
  isolation, anon flows, admin firehose visibility. Runs against a live
  backend.
- `npm run verify:teaching` — npm script to run it.

Coherence pass on existing docs:
- OVERVIEW.md — module count 9 → 10, TEACHING.md added to doc map
- DESIGN.md — three references to "9 modules" updated to 10
- ARCHITECTURE.md — `## The 10 modules`, teaching row added to module
  table, new "Teaching loop" section after "Feature flags"
- LAYOUT.md — `src/teaching/` and `src/modules/teaching/` added,
  TEACHING.md added to top-level doc listing
- MODULARISATION.md — `## The 10 modules`, new §9 `teaching` section,
  orchestrator bumped to §10
- PENDING.md — three new entries in the post-banner shipped table

### Regression

All 8 gates green for each of the three commits:

```
Backend tsc            0 errors
Frontend tsc           0 errors
Vitest                 121 / 121 (was 113)
Smoke stdio            49 / 49
Smoke SDK compat       65 / 65
Graph validator        56 agents valid
Subrepo check          passed
Demo verify            14 / 14 multi-role
```

Plus the new `verify:teaching` runtime test passes 10/10 against a
live backend.

### Honest non-goals

- No instrumentation of `snap-solve-routes`, `bitsat-sample-routes`,
  or `rendering-routes` yet. Each is a clean ~30-line pattern-copy
  from `chat-routes`. Deferred to keep this PR's diff focused.
- No log rotation. JSONL grows unbounded. At ~100k records the linear
  scan slows; rotation by month is the obvious follow-up.
- No retention policy. Turn records persist forever in `.data/`. When
  data-rights deletion runs, it should also clear that user's turns.
  Open follow-up.
- The mastery_delta path can't be sandbox-verified end-to-end (Postgres
  dependency). Verified by type-check + unit test in this environment.
- "All possible scenarios" was honestly not promised — 13 brainstormed,
  4 detected, 3 explicitly deferred with reasons, 6 scaffolded but not
  exercised. The schema is structured to accept them all without further
  type changes.

## [Unreleased] — 2026-04-27 (master docs + coherence pass)

### 📚 Four master docs land + system-design language is now consistent

The repo had `DESIGN.md` (visual design only — typography, colour, spacing) and a sprawl of topic docs but no single entry point that explained Vidhya as a system. This commit creates that entry point.

**Four new master files:**

- **`OVERVIEW.md`** — what Vidhya is, who it's for, what's actually shipping vs. what's planned. The first doc anyone new to the repo should read.
- **`DESIGN.md`** — the *why* of the architecture. Five load-bearing decisions (flat-file persistence, BYOK LLMs, module barrels over sub-repos, env-var feature flags, Google-OIDC-only auth) with the costs each choice imposes documented honestly. What we deliberately reject and why. What's open for change vs. stable.
- **`ARCHITECTURE.md`** — the *how*. Modules + tiers + profiles. Runtime topology diagram. Request lifecycle walk-through. Persistence layout. Scaling characteristics with honest ceilings.
- **`LAYOUT.md`** — the *where*. Top-level shape. Backend `src/` directory map. Frontend `frontend/src/` map. Naming conventions. A "where do new things go?" lookup table.

**One renamed:**

- **`DESIGN.md` → `DESIGN-SYSTEM.md`** — the existing visual design doc kept its content; only the filename changed so it doesn't collide with the new system-design master. References across the repo (CLAUDE.md, README.md, FEATURES.md, CHANGELOG.md historical) updated to point at the new name.

**One brand-new domain doc:**

- **`AUTH.md`** — the auth module's full surface. 6 roles with rank table, 4 feature flags, 10 HTTP routes (5 auth + 5 admin), JWT mechanics, channel linking, the module boundary at `src/modules/auth/index.ts`, the auth health probe, and an honest "what this module does NOT provide" section.

**Coherence pass on existing docs (focused, not exhaustive):**

- `MODULARISATION.md` — module count corrected from 8 → 9 (auth carved out of core in `ebdf23c`). New `auth` section (`§2`). Section numbers re-shuffled. New "Feature flags — within-module toggles" section explaining the env-var pattern, with pointer to AUTH.md for the auth-specific inventory.
- `INSTALL.md` — new "Enable / disable features" subsection covering the 4 auth flags with example env-var lines, how to inspect flag state via `/api/orchestrator/features` and `/admin/features`, and why flag flipping is intentionally restart-required (with pointer to DESIGN.md §4).
- `PENDING.md` — three more shipped items added to the post-banner table: auth-as-first-class-module (§8.x), institution role scaffolding (§9.1 partial), feature matrix UI. §9.1 entry updated to reflect partial-scaffolding state. §11.7 parent role entry updated from "future" to "partial" (backend + flag shipped, only the guardian view UI remains).
- `README.md` — Architecture and features link block restructured to feature the four masters prominently. Stale "DESIGN.md for the architecture" pointer redirected to ARCHITECTURE.md. The 46-agent count (which was wrong — the actual count is 56) corrected throughout.
- `CLAUDE.md` — visual UI checks now point at DESIGN-SYSTEM.md (the file that actually describes UI principles), not the new system-design DESIGN.md master.
- `FEATURES.md` — DESIGN reference split: visual lives in DESIGN-SYSTEM.md, system-level in DESIGN.md.

### What this commit deliberately does NOT do

This is the heaviest doc commit in repo history but it's still focused. To be transparent about scope:

- **Coherence pass on `docs/` was NOT performed.** That subdirectory has ~40 framework docs (`docs/EXAM-FRAMEWORK.md`, `docs/RENDERING-FRAMEWORK.md`, `docs/COMPOUNDING-MASTERY-FRAMEWORK.md`, etc.) plus the numbered `00-25` series. Each is a deep-dive that hasn't drifted in any way the new masters changed. Spot-check, don't assume coherence.
- **Coherence pass on `agents/` was NOT performed.** The 56-agent org-chart documentation references the modules but doesn't reference the auth-vs-core split. ORG-CHART.md and the `_shared/` files are stable.
- **Coherence pass on `context/` was NOT performed.** Long-form positioning docs (COMPANY.md, CONTACTS.md, GLOSSARY.md, SKILLS.md, SQUAD.md, VOICE.md) are aspirational/positioning documents that don't reference architecture details.
- **Coherence pass on `modules/project-vidhya-content/`'s docs was NOT performed.** The sub-repo has its own README and CONTRIBUTING. That's the sub-repo's responsibility.

If a doc in any of those directories says something inconsistent with the new masters, file an issue — I didn't read every file.

### Files

```
NEW    OVERVIEW.md                ~2.5 KB master — what & who
NEW    DESIGN.md                  ~5.5 KB master — why
NEW    ARCHITECTURE.md            ~6 KB master — how
NEW    LAYOUT.md                  ~5 KB master — where
NEW    AUTH.md                    ~4 KB auth module surface
RENAMED DESIGN.md → DESIGN-SYSTEM.md  (no content change)
MOD    MODULARISATION.md          9-module model + feature-flags section
MOD    INSTALL.md                 +Enable/disable features subsection (~30 lines)
MOD    PENDING.md                 3 shipped items added; §9.1 + §11.7 updated
MOD    README.md                  4 stale pointers + agent count fix
MOD    CLAUDE.md                  2 visual-check pointers → DESIGN-SYSTEM.md
MOD    FEATURES.md                1 doc reference split
MOD    CHANGELOG.md               this entry
```

Pure documentation work. Zero behavioural changes to the running app.

## [Unreleased] — 2026-04-27 (auth as first-class module + operator feature matrix)

Two commits landed in sequence; this entry covers both.

### `ebdf23c` — auth module barrel + feature flags

Auth becomes its own module in the orchestrator. Files stay in `src/auth/`; the boundary is a barrel re-export at `src/modules/auth/index.ts` that future extraction (if ever warranted) can pivot on as a `git subtree split` rather than a rewrite.

**Why not a sub-repo:** the user originally asked about extracting auth to a sub-repo, listmonk-style. After audit I argued against it (recorded in the conversation): auth has no external contributor surface, the API isn't stable yet (institutional-b2b changes pending), tight coupling with every protected route makes the boundary expensive across repos, blast radius of bugs is much higher than for content. The user agreed.

**Four feature flags ship:**

| Flag | Env var | Default |
|---|---|---|
| `auth.google_oidc` | `VIDHYA_AUTH_GOOGLE_OIDC` | on |
| `auth.demo_seed` | `VIDHYA_AUTH_DEMO_SEED` | on |
| `auth.parent_role` | `VIDHYA_AUTH_PARENT_ROLE` | on |
| `auth.institution_role` | `VIDHYA_AUTH_INSTITUTION_ROLE` | off |

Flags are read once at boot via `process.env`, exposed as a sync getter (`isAuthFeatureEnabled`), and aggregated at `GET /api/orchestrator/features` (admin-only). Flipping a flag requires a server restart — by design, not a runtime API. Default state matches existing behaviour exactly.

**Other notable changes:**

- `modules.yaml` carved `src/auth` out of `core`'s source list. New `auth` module with `foundation: true` (auto-included in every composition).
- New auth health probe — separate from core. Reports degraded if `auth.google_oidc=on` but `GOOGLE_OAUTH_CLIENT_ID` is not set, surfacing a misconfiguration that would otherwise be invisible until login fails.
- `Role` union extended with `'institution'` (rank 5, scaffolding for PENDING §9). The user-store rejects assignment unless `auth.institution_role` is on.
- **Bug fix:** `handleSetRole`'s hardcoded role allowlist was `['owner','admin','teacher','student']` — it never accepted `parent` despite the type system claiming otherwise (the parent role had been in the union for two prior commits without ever being reachable). Replaced with a derived list of all 6 valid roles; flag-gated roles are accepted at the route layer and rejected by the user-store with a clear reason if their flag is off.

### `dd7dc2f` — operator-facing feature matrix at `/gate/admin/features`

Renders the runtime state of every module's feature flags so an operator can confirm what a deployment actually has enabled without reading boot logs. Backs onto the new `/api/orchestrator/features` endpoint.

- Admin-gated (same `hasRole('admin')` check as `UserAdminPage`)
- Overridden flags get an amber-bordered card + "overridden" pill
- Each card shows current state, default, env var name, and one-paragraph description
- Read-only by design — flipping is a redeploy with the new env var
- Linked from `/gate/admin/dashboard` via a Settings-icon QuickLink

### Regression — 8 gates green for both commits

```
Backend tsc            0 errors
Frontend tsc           0 errors
Vitest                 113 / 113
Smoke stdio            49 / 49
Smoke SDK compat       65 / 65
Graph validator        56 agents valid
Subrepo check          passed
Demo verify            14 / 14 multi-role
```

## [Unreleased] — 2026-04-26 (DEPLOY.md hosting landscape correction)

### 📝 DEPLOY.md updated to reflect the actual 2026 hosting landscape

The repo's earlier docs presented Fly.io as "works too via the same Dockerfile" without context. As of October 7, 2024 Fly.io ended its free tier for new accounts, so a new Vidhya operator following the previous wording would have been surprised by the trial-credit experience and the requirement to upgrade. Several other "free Heroku replacements" the docs had implicitly recommended over the years also changed terms in 2024–2025 (Railway dropped the 500-hour free plan, Koyeb removed free compute, Heroku already gone). DEPLOY.md was due for a correction pass.

What landed:

- **Header blockquote rewritten** — Fly.io's free-tier sunset called out explicitly with date, and a pointer to the new "If Render's free tier doesn't work for you" section.
- **NEW section: "If Render's free tier doesn't work for you"** — three subsections:
  - "First, check whether your Render quota actually reset" — explains the 750 instance-hours/month cap, when rollovers happen, what cleanup actually frees hours vs. just tidies the project list.
  - "Always-free alternatives" — comparison table covering Render free tier, Oracle Cloud Always Free, and Google Cloud Run with sources verified April 2026 (Render pricing, Oracle Always Free docs, Cloud Run pricing). Honest recommendation: Oracle Cloud is the best fit for "always-on, $0/month" Vidhya hosting if you can do the ~30min initial setup.
  - "Hosts that are no longer free for new accounts" — Fly.io (Oct 2024), Railway (2023), Koyeb (2024), Heroku (Nov 2022). Each with the date the change happened.
  - "Paid options under $10/month" — Render Starter, Fly.io PAYG, Railway Hobby, DigitalOcean App Platform — with notes on what fits Vidhya without modification.
- **Fly.io section corrected** — heading now reads "Fly.io (paid, no longer free)", body explains the trial mechanics and approximate monthly cost, and links to the always-free alternatives section.
- **Netlify rejection rephrased** — "Netlify — NOT supported" was misleading given the hybrid path is now first-class. Rewritten as "Netlify alone — backend cannot run there" with an explicit pointer to `DEPLOY-NETLIFY.md` for the supported hybrid.
- **NEW troubleshooting entry: "Render says you've exceeded the free tier"** — concrete steps to check usage, what cleanup actually helps, when to look at alternatives.
- **Closing comparison table updated** — "Why Render, not Netlify, one more time" → "Why Render, not Netlify alone" with the table compared against Netlify-alone (not Netlify-as-frontend-of-hybrid which is fine).

Sources verified for every dated claim:
- [Render pricing](https://render.com/pricing) — April 2026
- [Oracle Cloud Always Free docs](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) — April 2026
- [Google Cloud Run pricing](https://cloud.google.com/run/pricing) — April 2026
- Fly.io, Railway, Koyeb sunset dates from each platform's pricing/docs/blog posts

Zero behavioural changes to the running app. Pure documentation correctness pass.

## [Unreleased] — 2026-04-26 (deploy infra correction + URL helper)

### 🛠️ BACKEND_URL substitution: corrected mechanism

Fixes a real bug in the previous Netlify deploy story.

The previous commit (`a9c8f7f`) claimed *"Netlify substitutes BACKEND_URL at build time in [[redirects]] to fields"*. **That was wrong.** Netlify's docs are explicit: *"Using environment variables directly as values in your netlify.toml isn't supported."* An operator following the previous documentation would have set `BACKEND_URL` in the dashboard, redeployed, and watched the proxy continue pointing at the literal default URL with no obvious explanation.

This commit corrects the mechanism to match Netlify's actual recommended pattern:

- **`netlify.toml`** — the redirect targets now use a `__BACKEND_URL__` placeholder string. The `[build]` command runs `bash ../scripts/netlify-prebuild.sh` before `npm ci && npm run build`.

- **NEW: `scripts/netlify-prebuild.sh`** — substitutes the placeholder using sed, exactly as Netlify documents. Validates that `BACKEND_URL` is set and HTTPS (with `ALLOW_HTTP_BACKEND=1` escape hatch for local testing). **Fails the build loudly** if `BACKEND_URL` is missing — better to fail at build than silently deploy a broken proxy. Strips trailing slashes. Idempotent: if the placeholder is already gone, logs a warning and exits 0 instead of erroring. Tested across 5 paths (missing var, http rejection, http override, valid https, idempotent re-run).

- **`DEPLOY-NETLIFY.md`** — corrected the wrong claim with explicit attribution to Netlify's docs and a "this section corrects it" note. Added two troubleshooting entries for the new build-failure modes.

### 🔗 Live demo URL — placeholder + helper script

Honest framing: this commit cannot produce a live URL — that requires Render credentials and a browser, neither of which exist in the build sandbox. The README and DEPLOY.md now have **clearly-labelled placeholder slots** that admit they're placeholders and explain what an operator needs to do.

- **NEW: `scripts/update-readme-url.sh`** — one-command tool that fills in the live URL across both README.md and DEPLOY.md once an operator has clicked the Deploy button and gotten a real URL. Validates HTTPS, idempotent (safely re-run with a different URL).

- **README.md** — Render section gets a `> **Live demo URL:** _none yet — operator action required._` blockquote with instructions on how to fill it in.

- **DEPLOY.md** — same placeholder near the top, plus a new `## Three-click checklist (operator-facing)` section that walks an operator from "sign in to Render" to "URL filled in across docs" in 5 steps. The detailed three-click deploy section that already existed continues below.

The Render Deploy button itself is unchanged — a maintainer (or any forker) clicks it, gets a real URL, runs the helper script, commits. The repo now makes that path frictionless.

## [Unreleased] — 2026-04-24 (deployment docs + Netlify path)

### 📚 Three deployment paths surfaced clearly

Closes the documentation ask: a reader landing on the repo can now see, in three seconds, the three ways to run Vidhya — local, Render, or Netlify+Render hybrid — with side-by-side trade-offs.

- **README.md** — new `## Quick start` section above `## Getting started`. Three deployment paths in three code blocks: local (`npm run demo:setup`), Render (Deploy button), Netlify+Render hybrid. Comparison table with cost, cold-start latency, vendor count, setup time. The existing persona-based "Getting started" navigation kept intact for readers who want context.

- **NEW: `DEPLOY-NETLIFY.md`** — focused walkthrough for the hybrid path. Step-by-step from "deploy backend on Render first" through to "set BACKEND_URL in Netlify dashboard". Honest about trade-offs (Netlify CDN + branch previews vs. two services to monitor) and one critical gotcha: channel webhooks (Telegram / WhatsApp) must point directly at the Render URL, not the Netlify proxy, because synchronous bot timeouts.

- **NEW: `netlify.toml`** — production config so a `git push` to a Netlify-connected repo just works. SPA fallback + `/api/*` proxy to `BACKEND_URL` (env var, not hardcoded — same config works for staging and production). Includes security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) and aggressive `/assets/*` cache control.

- **DEPLOY.md** — replaced the "cannot-target Netlify" claim with a pointer to the hybrid doc. The original framing was technically true (Netlify alone can't host the backend) but rejected too much: the Netlify+Render combination is fully supported and now clearly documented.

- **INSTALL.md** — preamble rewritten with a deployment-path comparison table at the top. Reader picks Local / Render / Netlify+Render before reading the rest. The detailed Minimal/Recommended/Full local install profiles continue below — readers who want the demo URL don't need to read them.

## [Unreleased] — 2026-04-24 (uploads UI)

### 📤 Upload drag-and-drop page

- `frontend/src/pages/gate/UploadsPage.tsx` at route `/gate/uploads` (PENDING §4.8) — students upload class notes, problem photos, PDFs, or text files which the content router can later find via the `find-in-uploads` intent.
- **Drag-and-drop zone** + click-to-select fallback, keyboard-accessible (Enter / Space triggers file picker).
- **Per-upload metadata**: optional note + concept-tag chips. Tag input accepts free strings with autocomplete chips for known concept IDs (`calculus-derivatives`, `linear-algebra-eigenvalues`, etc.) — saves students guessing exact strings.
- **Optimistic delete** with rollback + per-item inline error message on failure.
- **Client-side size validation**: refuses files > 7.5 MB up-front with a clear explanation of the base64-encoding overhead rather than letting the server return a confusing error. Backend accepts 10 MB JSON body; base64 adds ~33% for binary files.
- **Privacy banner** makes the constitutional constraint visible: uploads are user-private, never enter cohort telemetry, never passed to LLM/Wolfram without per-request consent, deleted on account close.
- Backend untouched — uses the four existing `/api/student/uploads*` endpoints from commit `faf6aaa`.
- **End-to-end verified**: upload a file tagged `calculus-derivatives` → send content request `"what did I upload about derivatives"` → router returns `source: uploads` with the correct file. The `find-in-uploads` intent is now reachable from the UI for the first time.

## [Unreleased] — 2026-04-24 (frontend)

### 🎨 First frontend page backed by existing content endpoints

- `frontend/src/pages/gate/ContentSettingsPage.tsx` at route `/gate/content-settings` (PENDING §4.7) — students manage their community-bundle subscriptions and which source classes to exclude from routing. Lazy-loaded; linked from `/gate/settings`.
- Backend untouched — page reads from `GET /api/student/content/bundles` + `GET /api/student/content/subscriptions` in parallel on load; writes via the three `POST` mutations.
- **Optimistic UX with rollback**: tap Subscribe → UI updates immediately → network confirms or rolls back with inline error. Never leaves the user staring at a spinner.
- **Honest mode banner** — the page surfaces whether the content subrepo is in `stub`, `local`, or `live` mode with the pinned SHA visible in live mode.
- **Constitutional integrity preserved** — when a user excludes `generated`, the router's existing behaviour of refusing LLM content even with `allow_generation=true` is honored end-to-end (verified).
- **Side effect fix**: `UserAdminPage.tsx`'s `ROLE_META` record was incomplete after the parent-role addition in §11.7. Added the `parent` entry with a Heart icon; frontend typecheck now clean.

## [Unreleased] — 2026-04-24 (later)

### 🎯 "Perform pending activities" — 11 items moved from PENDING → shipped

Everything tested end-to-end on a live backend.

- **§1.3** Scheduler — `src/jobs/scheduler.ts` runs `finaliseExpiredDeletions()` hourly and `healthScan` every 5 min. Wired into gate-server boot with graceful shutdown. `GET /api/orchestrator/jobs` exposes job status. Toggle with `VIDHYA_DISABLE_SCHEDULER=1`.
- **§1.4** Backups — `scripts/backup-data.ts` creates `.tar.gz` snapshots of `.data/` into gitignored `backups/`. `npm run backup:create | :list | :prune`. 8.3 KB for a seeded demo.
- **§2.3** Idempotency tests — `src/__tests__/unit/data/lifecycle.test.ts` — 6 tests proving upsertFromGoogle idempotency, data-rights cooling-period enforcement, scheduler job registration. Vitest 107 → 113.
- **§3.1** NEET Biology — the 4th exam adapter. 2-file recipe (sample + adapter). Full ExamAdapter contract. Registered as `EXM-NEET-BIO-SAMPLE`.
- **§4.6** Intent classifier — extracted to `src/content/intent-classifier.ts` with rule-based default + async LLM-backed path (opt-in via `VIDHYA_INTENT_CLASSIFIER=llm`). Drop-in when budget allows.
- **§6.3** Validator coverage — 3 new invariants in `agents/validate-graph.py`: (a) owned-tool paths exist on disk, (b) every emitted signal has ≥1 subscriber, (c) every manager has downstream or `standalone: true`. 24 honest warnings surfaced + 0 errors.
- **§7.1** Attention-counter migration — `scripts/migrations/001-drop-attention-counter.ts` strips the legacy field idempotently.
- **§11.7** Parent role — `Role` now includes `'parent'` with `ROLE_RANK.parent = 0` (orthogonal — scope is per-student, not site-wide). `User.guardian_of[]` / `User.guardians[]`. `hasGuardianOf()` helper enforces per-student access. Mirrored on frontend.
- **§13.2** Signal bus — `src/events/signal-bus.ts` in-process pub/sub. Content-router publishes `content-routed` per decision. `GET /api/orchestrator/signals` admin view with 200-event recent buffer.
- **§13.3** Health scan — included as a scheduler job; degraded transitions surface in server logs.
- **§1.1** Live URL — remains operator-actionable (click DEPLOY button); PENDING.md entry clarified.

PENDING.md updated with a "✓ Shipped" banner at the top.

## [Unreleased] — 2026-04-24

### 📋 Documentation refresh + pending-items ledger

- **`PENDING.md`** — new comprehensive ledger of every deferred / future / stub item across 14 subsystems, with priority and effort. Supersedes the older `TODOS.md`.
- **`INSTALL.md`** — rewritten for the current flat-file architecture. Previous version described a Supabase-era install path. Now covers Minimal / Recommended / Full paths, demo install, env-var quick reference, data-directory layout, seven-gate regression check list.
- **`TODOS.md`** — retired; points at `PENDING.md`.
- **`README.md`** — updated navigation block with a "what's NOT done yet" entry pointing to PENDING.md.

### 🧱 Subrepo (earlier this day)

- **`modules/project-vidhya-content/`** — full working subrepo with 3 real seed concepts (derivatives, eigenvalues, complex numbers), 2 bundle manifests, CI config, CONTRIBUTING guide, LICENCE-MANIFEST.
- **`content.pin` — new `local` mode** reading directly from `modules/project-vidhya-content/` in this repo (pre-GitHub-subrepo). End-to-end verified: subscribe to bundle → get real community content.
- Bug fix: `src/content/community.ts` used dynamic `require('fs')` inside ESM; surfaced when content went beyond stub-mode.

### 🎯 Orchestrator & modularisation

- `MODULARISATION.md` + `modules.yaml` + `src/orchestrator/` — 8 modules, 20 tiers, 6 deployment profiles. Master composer resolves profile → tier → module load order, warns on planned tiers, errors on future ones. Health-check aggregation across all modules. 6 admin HTTP endpoints.
- 1 new agent specialist: `orchestrator-specialist` under `task-manager`. Agent org now at **56 agents**.

### 📖 Content subsystem

- `CONTENT.md` — 7-layer content architecture (sources → acquisition → authoring → verification → representation → routing → delivery).
- 3 new content specialists: `content-router`, `upload-specialist`, `community-content-specialist`.
- `src/content/router.ts` — intent classification (6 intents) + source priority cascade (subscription → bundle → cache → uploads → community → generated → wolfram → decline).
- Every returned content carries source disclosure. Constitutional constraints honored (opt-in for generation / Wolfram, subscription `exclude_sources` wins over per-request `allow_*` flags).
- User uploads — private per-user storage, hard-delete chains through `data-rights-specialist`.

### 🚀 Deployment

- `DEPLOY.md` + "Deploy to Render" button in README + cleaned up `render.yaml` + two-stage `demo/Dockerfile`.
- Production-mirror-simulated deploy verified: all 3 exam adapters load, frontend builds, demo seed runs.

### 🔁 Customer lifecycle

- `agents/CUSTOMER-LIFECYCLE.md` — 6-stage journey (awareness → consideration → trial → activation → retention → win-back/offboard) mapped to the agent org.
- 4 new lifecycle specialists: `conversion-specialist`, `data-rights-specialist`, `onboarding-specialist`, `retention-specialist`.
- `POST /api/demo/convert` — demo→paid conversion with 97-min trailing stats carried over verified end-to-end.
- `POST /api/me/delete*` + `GET /api/me/export` — 24h cooling + cancel + confirm + portable export.
- `GET /api/admin/lifecycle/{funnel,retention}` — cohort-level analytics, k-anon enforced.
- Frontend CTA `/gate/convert-demo` + `DemoBanner` component.

### 📚 Exams inventory

- `EXAMS.md` — authoritative inventory of the 3 shipped math exams (BITSAT, JEE Main, UGEE) with scoring, topic weights, adapter-pattern for new exams.
- Bug fixed: demo seed used non-canonical `EXM-BITSAT-SAMPLE`; fixed to `EXM-BITSAT-MATH-SAMPLE` across 7 replacements.

## [2.2.0] — 2026-04-20

### 🧩 Content Engine — Cost-Minimal Four-Tier Delivery

Introduces a complete content pipeline: **scrape → tag → generate → verify → bundle → deliver**,
with a four-tier resolver that routes every request to the cheapest matching tier.

Cost modeling (see `PLAN-content-engine.md`): naive path costs ~$200/mo at 100 DAU;
this framework brings it to ~$28/mo — **86% reduction** — by ensuring 80%+ of content
delivery never hits an LLM.

### Added

**Wolfram Alpha integration** (`src/services/wolfram-service.ts`)
- Direct HTTP client to the Full Results API (no MCP server complexity on Render)
- `wolframSolve(query)` — returns answer + step-by-step pods + interpretation
- `verifyProblemWithWolfram(text, answer)` — authoritative answer verification
- `answersAgree(a, b)` — normalizes LaTeX/whitespace/numerical tolerance
- Graceful `{ available: false }` when `WOLFRAM_APP_ID` is absent

**Four-tier resolver** (`src/content/resolver.ts`)
- Tier 0: exact bundle match (free, <10ms, ~80% hit rate target)
- Tier 1: semantic RAG over bundle (free, ~50ms, ~70% of tier-0 misses)
- Tier 2: generate via Gemini 2.5 Flash-Lite (~$0.0005, ~2s)
- Tier 3: Wolfram verification for high-stakes (~$0.002, slow)
- Returns typed `ResolvedContent` with `source`, `confidence`, `latency_ms`,
  `cost_estimate_usd`, `wolfram_verified` — full provenance
- In-memory bundle caching with legacy-bundle fallback

**HTTP endpoints** (`src/api/content-routes.ts`)
- `POST /api/content/resolve` — pipeline entry; returns problem or explainer
- `POST /api/content/verify` — Wolfram answer check
- `GET /api/content/stats` — bundle inventory (public)
- `GET /api/content/explainer/:conceptId` — direct explainer lookup

**Content pipeline scripts**
- `scripts/scrape-corpus.ts` — polite, rate-limited scraper (GATE curated seed + NPTEL skeleton; respects robots.txt; 1 req/s per domain)
- `scripts/build-explainers.ts` — pre-generates 82-concept explainer library via
  Gemini Flash-Lite (~$0.08 total) with resume + batch + placeholder fallback
- `scripts/build-bundle.ts` — merges scraped + generated + explainers into
  `content-bundle.json` with SHA-256 fingerprint dedup

**Client-side resolver** (`frontend/src/lib/content/resolver.ts`)
- Bundle fetch once + session cache (force-cache)
- Client-side tier 0, 0.5 (device cache), 1 (material RAG via transformers.js)
- Falls through to server for tier 2+
- Auto-caches server-generated problems in IndexedDB for next time

**Smart Practice page** (`frontend/src/pages/gate/SmartPracticePage.tsx`, route `/smart-practice`)
- Shows each problem's provenance (Bundled / Cached / Your Notes / Generated / Wolfram-Verified)
- Live session cost meter
- Per-request latency + cost display
- Require-Wolfram toggle for high-stakes practice
- Records attempts via existing `recordAttempt()` (updates GBrain locally)

**Content pipeline CI** (`.github/workflows/content-engine.yml`)
- Nightly at 03:30 UTC (09:00 IST)
- Workflow dispatch for manual stage runs
- Commits refreshed bundle directly to main with stats in message

**Architecture plan** (`PLAN-content-engine.md`, 250+ lines)
- 10-part architecture: scrape, generate, deliver, costs, Wolfram strategy
- Cost projections with real Gemini/Wolfram pricing
- Rationale for HTTP API over MCP on stateless edge

### Verified end-to-end
- Bundle assembled: 24 deduped problems across 10 topics + 82 explainers (75 KB)
- Resolver test: Tier-0 exact match in 2ms at $0 cost
- Legacy pyq-bank problems auto-dedup via fingerprint
- Frontend builds clean (46s, SmartPracticePage compiles)
- Graceful degradation when Gemini / Wolfram keys absent (placeholder mode)

### Cost impact (100 DAU × 20 problems/day × 3 tutor turns)
- Before: ~$200/mo
- After: ~$28/mo (with 80% tier-0 hit rate from ~3k problem bundle)
- Wolfram: free tier 2k/mo covers build-time verification

---

## [2.1.0] — 2026-04-19

### 🗄️ DB-less GBrain (complete — all 7 phases)

Transforms the runtime from server-DB to **local-first with stateless edge proxy**.
All student state lives in IndexedDB on-device. Static knowledge ships as JSON bundles.
Server becomes a pure LLM/vision/embedding relay plus opt-in aggregation.

Promotes `v2.1.0-beta` to stable by adding **Phase 7 — opt-in anonymous cohort
aggregation** so the MOAT cohort analytics work again without re-introducing
any Postgres dependency.

### Added (Phase 7 — new in this release)

**Server: opt-in aggregation** (`src/api/aggregate.ts`)
- `POST /api/aggregate` — batched anonymized events (max 100/request)
- `POST /api/aggregate/event` — single event API (simpler client path)
- `GET /api/aggregate/cohort` — detailed cohort report (admin/teacher only)
- `GET /api/aggregate/stats` — public summary
- Strict input sanitization: regex-bounded concept/topic/error_type, motivation whitelist,
  200-char cap on descriptions, no session_id or free text
- File-backed storage (`.data/aggregate.json`), atomic writes via temp+rename
- Day rollover, 50k/day rate limit, v1→v2 schema migration
- Topic accuracy tracking (attempts × correct) per concept

**Client: opt-in queue** (`frontend/src/lib/gbrain/aggregate.ts`)
- `localStorage` persisted queue (key: `gbrain_aggregate_queue`)
- Auto-flush every 5 min OR 20 events, whichever first
- Requeue on network failure, flush on page unload
- Exported: `isOptedIn()`, `setOptIn(v)`, `trackAggregate(event)`, `flush()`

**UX: Settings page toggle**
- "Help improve GBrain" panel with clear privacy copy
- Single-click toggle persists to localStorage
- Starts/stops periodic flush automatically

**Hooks into `recordAttempt()`**
- After error classification completes, auto-fires `trackAggregate()` with
  sanitized fields (concept_id, error_type, topic, motivation_state,
  misconception_id, misconception_description)
- No-op when user hasn't opted in

### Phases 1-6 (shipped in v2.1.0-beta, included here for completeness)

- **Phase 1**: Pure-function GBrain core (`src/gbrain/gbrain-core.ts`, `frontend/src/lib/gbrain/core.ts`)
- **Phase 2**: IndexedDB store with 8 object stores, cosine similarity search, export/import
- **Phase 3**: Static knowledge bundles (concept-graph.json, pyq-bank.json + build script)
- **Phase 4**: Stateless Gemini proxy (5 endpoints, no DB, graceful fallback)
- **Phase 5**: Client-side embeddings via transformers.js (all-MiniLM-L6-v2, 384-dim, lazy-loaded)
- **Phase 6**: Student materials UX at `/materials` (drag-drop upload, parse, chunk, embed, retrieve)

### Verified end-to-end
- Batch ingest accepts valid events, rejects malicious payloads (regex filter)
- Sanitization confirmed: `<script>` payloads → HTTP 400 rejected
- Admin auth wall confirmed: unauthenticated → HTTP 401
- Topic accuracy aggregation working (e.g., calculus: 1 correct / 2 attempts)
- Frontend build clean in 36s, all new modules compile

### Architecture status
- DB-less mode is fully functional alongside DB mode
- Materials-first users get entirely local storage
- Cohort intelligence survives without Postgres (file-backed aggregates)
- Server retains backward compat — no migrations, no breaking changes

---

## [2.1.0-beta] — 2026-04-19

### 🗄️ DB-less GBrain (beta — Phases 1-6 of PLAN-dbless-gbrain.md)

### Added

**Pure-function GBrain core**
- `src/gbrain/gbrain-core.ts` — pure Bayesian updates, mastery aggregation, ZPD selection,
  exam strategy computation, task reasoner — all side-effect-free. Runs on server or client.
- `frontend/src/lib/gbrain/core.ts` — async mirror for browser (loads concept graph lazily).

**Client-side IndexedDB store** (`frontend/src/lib/gbrain/db.ts`)
- 8 object stores: student, errors, attempts, confidence, materials, chunks, embeddings, generated
- Full CRUD + indexes (by-session, by-concept, by-date, by-material, by-source)
- Cosine similarity search over embeddings
- Export/import JSON for backup/restore

**Client-side embeddings** (`frontend/src/lib/gbrain/embedder.ts`)
- `@xenova/transformers` wrapper for `all-MiniLM-L6-v2` (384-dim)
- Lazy-loaded (~22 MB one-time, browser-cached)
- First embed ~500 ms cold, ~50 ms warm

**Materials parsing pipeline** (`frontend/src/lib/gbrain/materials.ts`)
- PDF parser via pdfjs-dist
- DOCX parser via mammoth
- Markdown/TXT direct
- Image OCR via Gemini Vision proxy (`/api/gemini/vision-ocr`)
- Chunking (~500 words with sentence overlap)
- Full ingestion: parse → chunk → embed → persist

**Static knowledge bundles** (`frontend/public/data/`)
- `concept-graph.json` — 82 concepts + prerequisites (generated from `ALL_CONCEPTS`)
- `pyq-bank.json` — 12 seed PYQs (extensible from DB via `scripts/export-bundles.ts`)
- Build script: `npx tsx scripts/export-bundles.ts` (CI-ready)

**Stateless Gemini proxy** (`src/api/gemini-proxy.ts`)
- `POST /api/gemini/classify-error` — error classification, no DB
- `POST /api/gemini/generate-problem` — generate + self-verify
- `POST /api/gemini/embed` — server-side embedding (fallback)
- `POST /api/gemini/vision-ocr` — OCR handwritten images
- `POST /api/gemini/chat` — SSE stream with grounding
- Graceful fallback when `GEMINI_API_KEY` is absent
- Zero database. Zero persistence. Portable to any edge runtime.

**Client GBrain controller** (`frontend/src/lib/gbrain/client.ts`)
- `recordAttempt()` — full pipeline: Bayesian update + classify + log, all client-side
- `getExamStrategy()` — instant from local model
- `getErrorReport()` — client-side aggregation over IndexedDB
- `generateProblemClient()` — with local cache
- `streamGroundedChat()` — retrieves top-K material chunks, streams Gemini with grounding

**Materials UX** (`frontend/src/pages/gate/MaterialsPage.tsx`, route `/materials`)
- Drag-drop upload (PDF, DOCX, MD, TXT, images)
- Live progress bar (parse → chunk → embed)
- Materials library with chunk counts
- Privacy banner, grounding indicator
- Delete with confirmation (cleans up chunks + embeddings)

**Concept loader** (`frontend/src/lib/gbrain/concept-loader.ts`)
- Lazy-loads concept graph JSON
- `getAllConcepts()`, `getConcept(id)`, `getConceptsForTopicClient(topic)`
- Client-side `traceWeakestPrerequisiteClient()` for prereq repair

### Changed
- `src/gate-server.ts` — registers new `geminiProxyRoutes` alongside existing gbrain routes
- `frontend/src/App.tsx` — `/materials` route added
- `frontend/src/pages/gate/ProgressPage.tsx` — "Your Materials" link at top of GBrain section
- `frontend/package.json` — added `mammoth`, `@xenova/transformers`

### Architecture
- Existing DB-mode endpoints remain fully functional (backward compat)
- IndexedDB mode runs in parallel as opt-in
- No migration required; new users auto-get IndexedDB on browsers, logged-in users keep DB

### Deferred to Phase 7
- Opt-in anonymous cohort aggregation
- Fully removing Postgres from production server
- Re-embedding PYQ bundle at 384-dim (currently 3072-dim from Gemini)

---

## [2.0.0] - 2026-04-19

### 🧠 GBrain Cognitive Architecture — Major Release

Transforms Project Vidhya from a practice app into a cognitive learning platform. GBrain is a 6-pillar architecture that models how a student thinks, not just what they answer.

### Added — Backend Cognitive Architecture (~2,878 LOC)
- **Pillar 1: Student Model v2** — 15-attribute live profile (mastery vector, speed profile, cognitive style, abstraction comfort, working memory, motivation state, confidence calibration, frustration threshold, exam strategy). Bayesian updates on every attempt.
- **Pillar 2: Error Taxonomy** — 7-type classifier (conceptual/procedural/notation/misread/time-pressure/arithmetic/overconfidence-skip) with Gemini-powered misconception explanations and corrective problem generation.
- **Pillar 3: Concept Graph** — 82 GATE concepts organized as a prerequisite DAG with 112 edges. `traceWeakestPrerequisite()` auto-routes foundation repair.
- **Pillar 4: Adaptive Problem Generator** — Infinite calibrated practice targeting specific (concept × error-type × difficulty) gaps. Self-verified, cached.
- **Pillar 5: Exam Strategy Optimizer** — Personalized playbooks: attempt order, time budgets, confidence-calibrated skip threshold, score maximization planner.
- **Pillar 6: Task Reasoner (Layer 2)** — 5-node decision tree (intent → action → difficulty → format → verification) runs before every chat completion.
- **Migration 011** — 7 new tables, auto-applies on server startup.

### Added — MOAT Operations (~970 LOC)
- `/api/gbrain/audit/:sessionId` — 360° student audit with markdown export
- `/api/gbrain/cohort` — population insights (admin/teacher gated)
- `/api/gbrain/content-gap/{scan,fill}` — inventory scan + auto-fill
- `/api/gbrain/health` — 6-check system health
- `/api/gbrain/daily-intelligence` — nightly refresh (CRON_SECRET gated)
- `/api/gbrain/mock-exam/:sessionId` — full-length timed calibrated exam
- `/api/gbrain/weekly-digest/:sessionId` — tone-calibrated progress report
- `/api/gbrain/misconceptions` — mined misconceptions (admin/teacher gated)
- `/api/gbrain/seed-rag` — pre-seed RAG cache (CRON_SECRET gated)
- `/api/gbrain/verify-sweep` — re-verify problems to catch model drift

### Added — Frontend Pages
- `/practice/:id` — integrated `ErrorDiagnosis` on wrong answers
- `/exam-strategy` — personalized playbook + score maximization
- `/error-patterns` — weekly error digest with trends
- `/audit` — 360° audit with mastery heatmap, action plan, markdown export
- `/digest` — student-facing weekly report
- `/mock-exam` — full-length timed exam UI with live timer
- `/admin/gbrain` — unified admin dashboard (Cohort/Health/Content tabs)
- `/gbrain` — marketing landing page showcasing the architecture

### Added — Infrastructure
- `.github/workflows/gbrain-cron.yml` — 4 scheduled cron jobs (daily-intelligence, seed-rag, verify-sweep, content-gap-fill) with `workflow_dispatch` for manual runs
- `src/api/auth-middleware.ts` — `requireRole('admin', 'teacher')` wraps admin endpoints
- `.claude/bootstrap-skills.sh` — teammate onboarding script for vendored gstack
- 10 MOAT skills in `.claude/skills/` (student-audit, cohort-analysis, content-gap, gbrain-health, daily-intelligence, mock-exam, weekly-digest, misconception-miner, seed-rag, verify-sweep)

### Changed
- `/api/chat` SSE runs Task Reasoner before Gemini; streams `reasoner` event first with `{intent, action, concept, motivation}`
- `ProgressPage` expanded GBrain Intelligence section with 5 MOAT links
- `CLAUDE.md` updated with full MOAT skill catalog and routing rules

### Fixed
- 36 broken skill symlinks in `.claude/skills/` that pointed to a hardcoded macOS path. Vendored gstack; replaced with relative symlinks so teammates on any OS can use skills.

### Security
- Admin endpoints gated via `requireRole('admin', 'teacher')`
- Cron endpoints require `Bearer $CRON_SECRET`

---

## [0.3.0.0] - 2026-04-10

### Changed
- **Navigation restructure:** 5-tab bottom nav → 3 tabs (Home, Notes, Progress) + floating Tutor FAB. The AI tutor is now always one tap away from any page via a sky-blue floating button.
- **Header:** Slimmed from 56px to 48px, removed "GATE Math" text label (kept "G" logo badge). Content padding reduced from `p-4` to `px-4 pt-2 pb-4`.
- **GateHome:** Added quick-help tutor chips below One Thing card ("Explain {topic}" / "Solve a problem step by step"). Fixed dead-end states — "All done" and "Free study day" now link to the tutor. TopicGrid simplified from 2-column cards to horizontal rows.
- **NotebookPage:** Renamed "Smart Notebook" → "Notes". Removed topic completion summary grid and status legend. Simplified collapsed entries to (status dot + query + timestamp).
- **ProgressPage:** Merged weak + all topics into single sorted list (weakest first). Weak topics get amber accent. Shows top 3 by default with "Show all topics" toggle. Removed MasteryRing from topic cards.
- **PracticePage:** Removed verification metadata (tier, duration, confidence). Compact result banner (icon + verdict). "Next Problem" is full-width primary CTA; "All Problems" becomes small text link.
- **ChatPage:** Simplified empty state from 4-card grid to 3 compact chips with colored dots. Shrunk icon from 64px to 48px. Added URL param support (`?prompt=...`) for pre-filling input from home page tutor chips.
- **OnboardPage:** Replaced 10 individual confidence sliders with 3-bucket tappable sort (Weak / Okay / Strong). Faster (10 taps vs 10 drags), more mobile-friendly.
- **DESIGN.md** *(renamed to `DESIGN-SYSTEM.md` in a later commit)*: Updated nav spec, added FAB spec, rewrote App Declutter Rules, added 4 decisions to log.

## [0.2.2.1] - 2026-04-09

### Fixed
- Double-tap race condition on rating buttons (ref guard prevents duplicate POSTs)
- Silent error swallowing on rate/skip — now shows transient "Couldn't save" toast
- `profileChecked` not reset on retry — prevents stale profile flash after error recovery
- Defensive guard on `currentTask` access to prevent crash if task index is invalid

## [0.2.2.0] - 2026-04-09

### Added
- **One Thing Mode:** Home page stripped to a single priority card per session. Tired students at 11pm see one clear instruction instead of a 12-element dashboard
  - Three user states: no profile (onboard CTA), no diagnostic (diagnostic CTA), fully onboarded (One Thing card)
  - Progressive disclosure: complete or skip task #1 to reveal task #2, then #3
  - "Start practicing" navigates directly to a problem via `content_preview.pyq_id` from the daily plan API
  - Celebration state with confetti and MasteryRing when all tasks are done
  - "Free study day!" fallback with topic grid when no tasks are scheduled
- **Tired Student Mode:** AI tutor prompt modifier detects late-night study (after 9pm IST + exam within 30 days) and keeps responses short and actionable
- Streak badge moved to global header (visible on all pages)

### Changed
- Home page WHY line uses encouraging tone ("Biggest room to grow") instead of shaming ("weakest topic")
- All interactive elements now meet 44px minimum touch targets
- Added `prefers-reduced-motion` support, `aria-live` regions, and focus-visible rings throughout home page

## [0.2.1.0] - 2026-04-08

### Fixed
- Blog "See Problems" CTA now takes you to the topic page instead of a broken route. Previously, clicking the CTA on any blog post led nowhere
- Frontend and backend content types are now in sync (was 7 vs 4, only `comparison` overlapped)

### Changed
- All 10 GATE topic definitions live in one place (`src/constants/topics.ts`). Previously scattered across 7 files, which meant adding a topic required 7 edits
- Blog content types centralized into `src/constants/content-types.ts`. Labels, accent colors, and type lists all come from one source now

## [0.2.0.0] - 2026-04-05

### Added
- **Content Intelligence Engine:** Self-improving content loop that gets smarter over time
  - Trend collection from Reddit, Stack Exchange, YouTube, and NewsAPI. Matches external signals to your 10 GATE topics automatically
  - 5-signal priority scoring (user struggle, trend signal, conversion rate, view velocity, coverage gap) decides what content to create next
  - Feedback scoring grades every blog post on engagement, conversion, and relevance. Low performers get auto-archived after 90 days
  - Smart flywheel integration: content-flywheel now picks topics based on priority scores and weaves trend context into Gemini prompts
- **Dark Neubrutalism blog redesign:** Gen Z/Gen Alpha aesthetic with personality
  - Hard 2px borders with content-type accent colors, colored offset shadows (3px 3px) that shift on hover
  - Space Grotesk font (geometric, modern), uppercase bold labels, sharp 4px corners
  - Single-column card feed, topic filter pills, sort tabs (Recent/Trending/Most Read), content type tabs
  - CSS-only stagger entrance animations (80ms per card) + scroll-reveal (progressive enhancement)
  - Full `prefers-reduced-motion` accessibility support
  - Sticky floating CTA bar on blog posts bridges readers to the app
  - Zero JS, single font load, ~4KB CSS total
- **App declutter:** Compact hero bar, removed welcome banner, daily challenge threshold raised to 3+ reviews, subtle inline onboarding nudge

### Fixed
- Blog route gracefully falls back when `content_score` column missing (migration not yet applied)

## [0.1.0.0] - 2026-04-03

### Added
- **Growth Engine:** Full marketing and acquisition stack
  - Blog content pipeline: 4 content types (solved problems, topic explainers, exam strategy, comparison posts) auto-generated from verified problems via Gemini
  - Server-side rendered blog pages, exam landing pages, dynamic sitemap, and RSS feed for SEO
  - Acquisition funnel tracking with backend API (replaces localStorage-only tracking)
  - Retention engine: welcome email sequence, streak reminders, weekly digest via Resend (optional)
  - Push notification subscription and preferences API
  - Social posting: Telegram Bot API + optional Twitter API v2 with IST-aware posting windows
  - Blog admin API: draft/publish/archive workflow with view counting
  - Light theme for public SEO pages, dark theme for app
- **Content Pipeline:** Chat grounding, content previews, prompt modifiers
- **Study Commander:** Priority engine, onboarding diagnostic, personalized daily plans
- **Camera Scan:** OCR problem input with smart notebook and exam readiness scoring
- **AI Tutor:** Streaming chat via SSE with Gemini 2.5-flash
- **3-Tier Verification:** RAG cache, Gemini dual-solve, Wolfram Alpha
- **Auth:** Supabase Auth (Google OAuth + email/password), anonymous-first with upgrade
- **Social Autopilot:** Content flywheel generates posts for admin approval
- **Telegram Bot:** Daily problem posting with inline keyboards
- **Frontend:** 10-route React SPA with Duolingo-style UX, bottom nav, progress tracking

### Fixed
- SQL injection in notification preferences endpoint (parameterized queries)
- XSS in SSR blog templates (escape all LLM-generated content, sanitize URLs)
- SPA catch-all exclusion for SSR routes (/blog, /exams, /sitemap.xml, /rss.xml)
- Retention engine reads env vars at call time (testability fix)
