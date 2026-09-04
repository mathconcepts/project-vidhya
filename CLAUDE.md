# CLAUDE.md

## Project: Vidhya

Vidhya is a focused, mobile-first exam-prep platform. Exam-agnostic by design — GATE, BITSAT, NEET, civil services, or any competitive exam configured via the exam adapter system.

### Key Entry Points
- **Server:** `src/server.ts` (NOT `src/index.ts`) — standalone Vidhya API on port 8080
- **Frontend:** `frontend/src/App.tsx` — React SPA (pages in `frontend/src/pages/app/`)
- **Deploy:** Render (auto-deploys from `main` branch) — see `render.yaml`
- **DB:** Supabase (PostgreSQL + pgvector) — migrations in `supabase/migrations/`
- **Live:** https://vidhya-demo.onrender.com

### Running Locally
```bash
npm install && cd frontend && npm install && cd ..
export JWT_SECRET=$(openssl rand -hex 16)   # required for auth to work
npx tsx src/server.ts        # backend on :8080
cd frontend && npm run dev        # frontend on :3000 (separate terminal)
```

> **Tip:** `npm run demo:start` handles `JWT_SECRET` automatically and also seeds demo users. Use it for first-run or demo mode.

### Architecture
- **3-tier verification:** RAG cache → Gemini 2.5-flash dual-solve → Wolfram Alpha
- **Auth:** Supabase Auth (Google OAuth + email/password), anonymous-first with optional upgrade
- **Roles:** student (default), teacher, admin
- **AI Tutor:** Streaming chat via SSE at POST /api/chat (Gemini 2.5-flash)
- **Social Autopilot:** Content flywheel generates social posts; admin approves at /admin
- **Content Intelligence:** Trend collection → priority scoring → smart flywheel → feedback scoring (self-improving loop)

### Important Files
- `src/constants/content-types.ts` — Single source of truth for blog content types (labels, accents)
- `src/db/auto-migrate.ts` — Applies pending SQL migrations on server startup
- `src/api/gate-routes.ts` — Core API (topics, problems, verify, SR)
- `src/api/chat-routes.ts` — AI tutor chat (SSE streaming)
- `src/api/auth-middleware.ts` — JWT verification + role-based access
- `src/verification/tiered-orchestrator.ts` — 3-tier verification engine + `registerVerifier()` for Tier 4+ extensions
- `src/verification/verifiers/types.ts` — `AnswerVerifier` interface (math correctness)
- `src/content/content-types.ts` — Content module domain types (RouteRequest, ResolvedContent, SessionMode, DeclinedReason)
- `src/content/cadence.ts` — `CadenceStrategy` interface (knowledge vs exam-prep post-filter)
- `src/content/pedagogy.ts` — `PedagogyReviewer` interface (async post-delivery quality gate)
- `src/content/verifiers/types.ts` — `ContentVerifier` interface (content quality, distinct from AnswerVerifier)
- `src/jobs/content-flywheel.ts` — Auto-generate problems + social content
- `src/jobs/trend-collector.ts` — External trend collection (Reddit, Stack Exchange, YouTube, NewsAPI)
- `src/jobs/content-prioritizer.ts` — 5-signal weighted priority scoring
- `src/jobs/feedback-scorer.ts` — Blog post scoring + auto-archive
- `frontend/src/components/app/AppLayout.tsx` — Persona-aware layout wrapper; detects Knowledge / Exam / Teacher shell on mount, serves shell-specific nav
- `frontend/src/pages/app/KnowledgeHomePage.tsx` — Knowledge Shell home at `/knowledge-home`; concept map, track progress, K→E bridge card
- `src/api/knowledge-routes.ts` — Knowledge track API; includes `/tracks/:id/progress`, `/tracks/:id/next-concept`, `/tracks/:id/concept-tree`
- `src/api/media-routes.ts` — Multi-modal sidecar serving (`GET /api/lesson/media/:atom_id/:kind`) with disk fallback for DB-less demos
- `src/content/concept-orchestrator/gif-generator.ts` — Sync GIF render via `gifenc`; `renderScene(SceneDescription)` for `parametric` and `function-trace` scenes
- `src/content/concept-orchestrator/tts-generator.ts` — OpenAI tts-1 narration; `shouldNarrate(atom_type)` + `extractNarrationScript(content)` + `generateNarration(...)`
- `src/content/concept-orchestrator/media-artifacts.ts` — DB layer for `media_artifacts` rows + filesystem write at `MEDIA_STORAGE_DIR`
- `src/content/concept-orchestrator/ab-tester.ts` — A/B harness; `getNarrationBucket(atom_id, student_id)` for Phase F TTS variants
- `src/jobs/narration-experiment-scanner.ts` — Nightly job that opens narration A/B experiments, cost-capped at `MAX_ACTIVE_NARRATION`
- `frontend/src/components/lesson/AtomCardRenderer.tsx` — exports `MediaSidecar` for `<audio>` + `<img>` rendering below atom body
- `demo/seed-media.ts` — Pre-renders GIFs from atom `gif-scene` blocks + copies MP3s from `demo/seed-audio/` at boot
- `demo/generate-demo-audio.ts` — One-time CLI that generates demo MP3s with `OPENAI_API_KEY`

### Database
12 migrations (001–012) in `supabase/migrations/`. **Auto-applied on server startup** via `src/db/auto-migrate.ts`. Tracked in `_migrations` table. All migrations must be idempotent (`IF NOT EXISTS`). Key tables: pyq_questions, sr_sessions, chat_messages, user_profiles, social_content, verification_log, rag_cache, blog_posts, trend_signals, content_priorities.

### Design system
The UI is **Vidhya Clarity** — an Apple-HIG light theme. The full system lives at `design/clarity/`. Always read `DESIGN-SYSTEM.md` before making any visual or UI decisions.

Non-negotiables when writing frontend code:
- Two accents, both semantic. Green (`--green` / `--green-ink`) = mastery, correctness, primary action. Indigo (`--indigo` / `--indigo-ink`) = AI, tutor, study plan, and nothing else.
- Never hard-code a colour. Use the custom properties in `frontend/src/styles/tokens/`.
- 17px is the body floor for anything a student reads. 15px supporting, 13px only for timestamps and metadata.
- One focal card per screen. Everything else is plain text or hairline-separated rows on the canvas.
- 44px minimum touch targets, except chips inside an already-tappable row.
- The receipt border is a promise, not a style. Only `<ReceiptBorder receipt={...}>` may render it, and only with a real receipt object.
- One motion curve (`--ease-standard`) and four durations. Press is `scale(0.96)`. No confetti, no shimmer, no pulse. Honour `prefers-reduced-motion`.
- No gradients, no glass, no emoji, no invented logo.

Retired and must not reappear: Fraunces, DM Sans, the `surface-*` navy palette, `.glass*`, `.btn-primary` gradient buttons, `.hero-gradient`, `.confidence-card`, `.streak-badge`, Confetti, MasteryParticle.

In QA mode, flag any code that doesn't match DESIGN-SYSTEM.md.

### Extending the Content Module
Read EXTENDING.md before adding new verifiers, cadence strategies, intent classifiers, or pedagogy reviewers. The four extension contracts (AnswerVerifier, ContentVerifier, CadenceStrategy, PedagogyReviewer) each have a contract test function — every implementation must pass it. Time to first extension target: <20 min.

Run `npm run test:content` for fast iteration on the content + verification module (~3s feedback). The full suite (`npm test`) takes ~45s.

### Multi-modal pipeline (§4.15, v4.11.0–v4.13.0)

Atoms ship with optional sidecars (animated GIFs, TTS narration). Pipeline:

1. **Authoring:** `visual_analogy` atoms embed a fenced ` ```gif-scene\n{type, expression, x_range, ...}\n``` ` JSON block in their body. Templates in `modules/project-vidhya-content/templates/{calculus,complex-numbers,linear-algebra}.yaml` instruct the LLM to emit these blocks for plot-friendly topics.
2. **Render:** `src/content/concept-orchestrator/gif-generator.ts` (sync, pure JS via `gifenc`) and `tts-generator.ts` (OpenAI tts-1, gated on `TTS_PROVIDER=openai`).
3. **Storage:** `src/content/concept-orchestrator/media-artifacts.ts` writes to `MEDIA_STORAGE_DIR` (default `.data/media/`). Migration `018_media_artifacts.sql` keys on `(atom_id, version_n, kind)`. Demo deploys without DB use the disk fallback in `applyMediaUrls` + `media-routes.ts`.
4. **Serve:** `src/api/media-routes.ts` → `GET /api/lesson/media/:atom_id/:kind` with path-traversal defense, allowlist (`gif`, `audio_narration`), 1-hour `Cache-Control`.
5. **Render in UI:** `frontend/src/components/lesson/AtomCardRenderer.tsx` exports `MediaSidecar` — renders `<audio controls preload="none">` + `<img loading="lazy">` below atom body. Honors `prefers-reduced-motion` (caption only — static-frame swap deferred per CEO premise).
6. **A/B gate (Phase F):** `narration-experiment-scanner` job + `getNarrationBucket` helper extend the v4.9.0 A/B harness (migration `019_atom_ab_variant_kind.sql` adds `variant_kind` column). Activate with `VIDHYA_AB_TESTING=on`; cap with `VIDHYA_MAX_NARRATION_AB` (default 50). When narration loses, `media_artifacts.status` flips to `'failed'` and `applyMediaUrls` skips the URL.
7. **Demo path:** `npm run demo:generate-audio` (one-time, requires `OPENAI_API_KEY`) → commits MP3s into `demo/seed-audio/` → `npm run demo:seed-media` (in Dockerfile CMD) copies them into `MEDIA_DIR` at boot. The demo deploy serves audio without runtime API keys.

---

### Content R&D Loop (§5.0, PR #28)

Closes the loop from "generate content" → "measure if it worked" → "decide what to keep". Operator-facing, admin-gated, reads/writes through a thin REST surface.

**Schema (migrations 000 + 020):**

- `000_local_auth_stub.sql` — Supabase-safe stub (`auth` schema + `users` table + `role()`/`uid()`/`jwt()` functions). All `IF NOT EXISTS` / `pg_proc` guards make this a silent no-op on real Supabase. Required for plain Postgres deploys (e.g. local `docker compose`) where migrations 005+ reference `auth.users` FKs.
- `020_experiments.sql` — four new tables:
  - `experiments` — id, exam_pack_id, hypothesis, cached `lift_v1`/`lift_n`/`lift_p`, status (`active|won|lost|inconclusive|aborted`)
  - `experiment_assignments` — `(experiment_id, target_kind, target_id, variant)`, target_kind ∈ {`atom`, `flag`, `gen_run`, `session`}
  - `mastery_snapshots` — append-only (session × concept × time × mastery), the lift baseline
  - `generation_runs` — every batch of generation with full config + cost + status

  Plus `generation_run_id TEXT` columns on `generated_problems`, `atom_versions`, `media_artifacts` so artifacts trace back to the run that produced them.

**Code:**

- `src/experiments/` — registry CRUD, append-only mastery snapshotter, `lift.ts` (Welch's t-test + Abramowitz–Stegun normal CDF, `n ≥ 30` + `p < 0.05` thresholds for promotion). Exports a single barrel.
- `src/generation/` — run-orchestrator (queued→running→complete lifecycle), cost-meter (per-call USD accumulator, throws `RunBudgetExceeded` at cap), dry-run estimator (predicts cost + duration before launch).
- `src/gbrain/operations/experiment-lift.ts` — CLI: `npx tsx src/gbrain/operations/experiment-lift.ts <experiment-id> [--window 7] [--no-persist]` or `--list --exam gate-ma`.
- `src/jobs/scheduler.ts` — registers `masterySnapshotter` (daily, `snapshotAllActiveSessions` from `src/experiments/snapshotter.ts`).
- `src/jobs/content-flywheel.ts` — every flywheel tick now wraps in a `GenerationRun` (provenance only, no behavior change). Cron-driven runs use `auto_experiment: false`; operator-launched ones get an auto-wrapping experiment.

**Admin REST API (`requireRole('admin')` — accepts JWT or `CRON_SECRET`):**

```
GET    /api/admin/experiments                    list + filters (?exam, ?status, ?limit)
GET    /api/admin/experiments/:id                single + assignments
POST   /api/admin/experiments                    create
PATCH  /api/admin/experiments/:id                update status
POST   /api/admin/experiments/:id/recompute-lift trigger lift (sync)
POST   /api/admin/experiments/:id/assignments    batch assign targets
GET    /api/admin/runs                           list + filters
GET    /api/admin/runs/:id                       single
POST   /api/admin/runs                           create + auto-experiment
POST   /api/admin/runs/dry-run                   cost estimate, no DB write
PATCH  /api/admin/runs/:id                       abort
```

**Admin UI at `/admin/content-rd`:**

- `frontend/src/api/admin/content-rd.ts` — typed client over `authFetch` (no embedded secrets)
- `frontend/src/components/admin/RunLauncher.tsx` — config form, debounced (400ms) live cost estimate, warning surface
- `frontend/src/components/admin/ActiveRunsPanel.tsx` — last 10 runs with abort
- `frontend/src/components/admin/EffectivenessLedger.tsx` — sortable lift table with status badges + recompute
- `frontend/src/pages/app/ContentRDPage.tsx` — page shell + admin gate; linked from `AdminDashboardPage` QuickLink grid

**Auth model:**

- `src/api/auth-middleware.ts:getAuth` resolves role in order: CRON_SECRET → DB `user_profiles` row → JWT `role` claim → `'student'`. The JWT-claim fallback is what makes demo/dev users (Arjun the admin, Kavita the teacher, Priya the student) seeded by `demo/seed.ts` work without a Supabase user_profiles row.
- Local-dev quick start: `/api/auth/config` returns `local_dev: true` when `GOOGLE_OAUTH_CLIENT_ID` is unset → `SignInPage` renders a "Local dev quick start" panel with three role buttons → `/demo-login?role=admin` auto-seeds `demo/demo-tokens.json` on first hit and redirects admin users to `/admin/content-rd` (other roles to `/`).

**Lift computation contract (locked as `lift_v1`):**

`lift = mean(post_window_mastery) − mean(pre_window_mastery)` for the treatment cohort, minus the same delta for matched control cohort (sessions in same exam pack, active during window, not assigned to the experiment). Significance via Welch's t-test with normal-CDF p-value approximation. **Never silently change the formula** — future versions land as `lift_v2` in a new column. Verified in motion: synthetic 12 treatment + 15 control sessions yielded measured lift `+0.1776`, p `≈ 0.000`.

**Sprint C — Closed Loop:** ✓ shipped.

Migration `022_canonical_flag.sql` adds `canonical BOOLEAN`/`canonical_at`/`canonical_reason` to `generated_problems`, `media_artifacts`, `atom_versions` plus `ledger_runs` (audit trail) and `run_suggestions` (operator inbox).

`src/jobs/learnings-ledger.ts` runs nightly via the scheduler:

1. Recompute `lift_v1` for every active experiment.
2. **Promote winners** (`lift > 0.05 ∧ p < 0.05 ∧ n ≥ 30`): set `canonical=true` on assigned atom_versions, media_artifacts, generated_problems; update `experiments.status='won'`.
3. **Demote losers** (`lift < -0.02 ∧ p < 0.05 ∧ n ≥ 30`): flip `media_artifacts.status='failed'` (so `applyMediaUrls` skips them); update `experiments.status='lost'`.
4. **Suggest follow-ups** via `src/generation/suggester.ts` (pure-function rules: CONFIRM_WIN at small n, RIDE_WIN at higher volume, RECOVER_LOSS with inverted flags). Persists into `run_suggestions`.
5. Write `docs/learnings/<YYYY-Www>.md` digest.
6. Sundays only (and gated by `VIDHYA_LEDGER_PR=on`), open a PR via `gh` CLI committing the digest.

**Admin REST API (`requireRole('admin')`):**

```
GET    /api/admin/ledger/runs           recent ledger runs
POST   /api/admin/ledger/run-now        synchronous trigger (no_pr/force_pr/no_digest opts)
GET    /api/admin/suggestions           operator inbox
POST   /api/admin/suggestions/:id       action: 'launch' | 'dismiss'
                                        (launch creates a real GenerationRun + auto-experiment)
```

**Admin UI:** `frontend/src/components/admin/SuggestedRunsPanel.tsx` renders above the RunLauncher on `/admin/content-rd`. Hidden when no pending suggestions. Each card shows hypothesis, reason, source experiment, expected lift/n, with Launch + Dismiss buttons.

**Flags:** `VIDHYA_LEDGER_PR=on` enables the weekly PR digest (default off — local boots and dev environments don't spam the repo). The job still runs and writes the markdown locally regardless.

---

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

### First-time setup (run once per machine)
Install gstack globally first, then wire it into the project:
```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
cd - && bash .claude/bootstrap-skills.sh
```
`bootstrap-skills.sh` detects the global `~/.claude/skills/gstack` install and symlinks it into `.claude/skills/gstack/` — no per-project clone needed. (If no global install is found, it falls back to cloning gstack locally and installing bun itself.) After this, every `/skill-name` below is available as a Claude Code slash command.

### Available gstack skills
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /setup-gbrain, /retro, /investigate, /document-release, /document-generate, /codex, /cso, /autoplan, /plan-devex-review, /devex-review, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn

All skill directories in `.claude/skills/<name>/SKILL.md` are relative symlinks into `.claude/skills/gstack/` — itself either a symlink to the global install or a vendored clone (see setup above). If a skill isn't resolving, re-run `bash .claude/bootstrap-skills.sh`.

## GBrain MOAT Skills

Custom skills that compound GBrain's cognitive architecture into defensible advantage. Each wraps a MOAT operation (in `src/gbrain/operations/`) exposed via both CLI (`npx tsx`) and REST API (`/api/gbrain/*`).

### Student-facing intelligence
- `/student-audit` — Deep 360° analysis of one student (mastery heatmap, error patterns, prerequisite alerts, cognitive profile, motivation trajectory, 3-session action plan)
- `/weekly-digest` — Student-facing weekly email with streak, errors fixed, growth proof, one concrete action
- `/mock-exam` — Full-length timed mock exam calibrated to the student's mastery

### Population-level intelligence
- `/cohort-analysis` — Top misconceptions, bottleneck concepts, error distribution across all students
- `/misconception-miner` — Mine top misconceptions with impact scores, feeds into corrective content

### Content pipeline
- `/content-gap` — Find (concept × difficulty × error-type) combos with no cached problems, auto-fill via generator
- `/seed-rag` — Pre-seed RAG cache with PYQ + generated problem embeddings for zero-cost Tier 1 hits
- `/verify-sweep` — Re-verify all generated problems to catch model drift; demote failures

### Platform health
- `/gbrain-health` — Full subsystem health report (student_model rows, verification rates, Gemini latency, concept graph integrity)
- `/daily-intelligence` — Nightly cron: refresh prerequisite alerts, recompute exam strategies, flag frustrated students, prune old data

All MOAT skills have SKILL.md at `.claude/skills/<name>/` and backing TypeScript at `src/gbrain/operations/`. Each is invocable via CLI, REST API (`/api/gbrain/*`), or as a Claude Code slash command.

## Deploy Configuration

For `/land-and-deploy` to skip the dry-run on subsequent runs.

- **Platform:** Render (auto-deploys backend from `main` branch via `render.yaml`)
- **Production URL:** https://vidhya-demo.onrender.com
- **Frontend platform:** Render (bundled in the Docker image — frontend built at deploy time, served as static files by the backend)
- **Deploy workflow:** none — Render watches the `main` branch directly. There is no GitHub Actions deploy step.
- **Post-deploy verification:** `.github/workflows/prod-smoke.yml` — runs automatically on every push to `main` (and daily at 09:00 UTC). Waits for the new commit to actually go live (`scripts/wait-for-deploy.ts`, matched against `github.sha`, so it can't pass against the previous build), then checks the SPA shell, `/api/demo/rails`, `/api/teaching/roster`, `/api/progress/*`, `/api/practice/item/*`, stance-adapted content delivery, and a real headless-browser render. This is the actual post-deploy canary — prefer triggering/watching this run over ad-hoc curl checks.
- **Health check:** `curl -sI https://vidhya-demo.onrender.com` — the API root returns HTTP 403 by design (auth-gated). Treat any non-5xx response as "deploy is live"; treat 502/503 as "Render is still spinning the service up."
- **Typical deploy duration:** ~2-5 minutes after push to `main`.
- **Staging:** none configured.
- **Merge method:** squash (confirmed from the last 15 merged PRs on `main` — every merge is a single `(#NNN)` squash commit).
- **Persistent state caveat:** Render free tier uses ephemeral disk; `.data/` resets on restart/sleep. Paid plans get `/app/.data` mount per `render.yaml` comments.

## Local development

```bash
# Backend (port 8080)
npm install
npx tsx src/server.ts

# Frontend (port 3000) — separate terminal
cd frontend && npm install && npm run dev

# Tests
npm test                          # backend (vitest)
cd frontend && npm test           # frontend (vitest + RTL, post-v4.0)
```

`render.yaml` builds the same way: `npm install && npm run build && cd frontend && npm install && npm run build`. If your local `npm test` passes, the Render build will too.

### Local stack with Docker (production parity)

```bash
docker compose up --build        # full stack: pgvector + auto-migrations + app
# → http://localhost:8080
```

`docker-compose.yml` is the single-source local environment that mirrors production: real Postgres+pgvector, all migrations applied (including `000_local_auth_stub.sql` which provides Supabase's `auth.*` schema for plain Postgres), and the same `Dockerfile` Render builds. If host port 5432 is taken by your own Postgres, drop a `docker-compose.override.yml` in the repo root remapping `db.ports` to `"5433:5432"` (gitignored).

## Snapshot mechanism

Every state worth deploying gets a **snapshot** — a triple of (git tag, Docker image tag, markdown manifest). Snapshots are the unit of "deployable as-is on a given date" and the audit trail that connects code state to deploy outcomes.

```bash
npm run snapshot                              # auto-named: snapshot-YYYYMMDD-HHMM
npm run snapshot -- "exam-pack-bitsat"        # named:      snapshot-YYYYMMDD-HHMM-exam-pack-bitsat
npm run snapshot -- --push "..."              # also push git tag to origin
npm run snapshot -- --no-docker "..."         # git tag + manifest only (skip image build)
npm run snapshot:list                         # list all snapshots
```

Each snapshot writes `docs/snapshots/<tag>.md` with: git SHA, branch, package version, migration count, exam packs, recent commits, env-var requirements, and a "Notes" section for hypothesis/feedback. The index at `docs/snapshots/INDEX.md` is the running log. Both are committed.

Why this exists: scaling content generation across exams + tiers means many parallel experiments. Without a snapshot pinning each experiment to a frozen artifact, learnings can't be reproduced or rolled back. The manifest is the contract between the team and the deploy.

---

### Curriculum R&D (§5.1, PR #31 — Phase 1 schema + JEE pack + custom-pack scaffold)

Reframes "Content R&D" (which generated atoms) into "Curriculum R&D" (which generates **curriculum_units** — single-concept bundles of 5–15 atoms in pedagogical sequence, with declared learning objectives and explicit PYQ alignment).

**Schema (migrations 023, 024, 025):**

- `023_curriculum_units.sql` — new `curriculum_units` table. Each row keys on `(exam_pack_id, concept_id)` (one concept per unit, eng-review D1), declares `learning_objectives JSONB`, links `prepared_for_pyq_ids TEXT[]` (bidirectional with `pyq_questions.taught_by_unit_id`), enumerates `atom_ids TEXT[]` in pedagogical order, holds a `pedagogy_score NUMERIC` from the Tier 4 verifier (PR #32), and supports the `canonical` promotion lifecycle from Sprint C.
- `024_pyq_holdout.sql` — adds `is_holdout BOOLEAN DEFAULT FALSE` and `taught_by_unit_id TEXT` to `pyq_questions`. Locked invariant (eng-review D3): a PYQ never moves between practice and holdout after `scripts/seed-pyq-holdout.ts` runs. The seed script samples ~30 PYQs/exam stratified by `(year, topic)` with deterministic SHA-256 seeding so the holdout is reproducible across machines.
- `025_exam_packs.sql` — operator-defined exam packs alongside YAML packs (eng-review D5). Source enum: `'yaml' | 'operator'`. Capability flag `interactives_enabled BOOLEAN` defaults to `false` for operator packs (text+GIF only) and `true` for canonical packs (gate-ma, jee-main).

**JEE Main pack:** `data/curriculum/jee-main.yml` — stub syllabus across PCM (~80 placeholder concept_ids; operators flesh out via the curriculum unit generator in PR #32 rather than seeding all at once).

**Admin REST API (`requireRole('admin')`):**

```
GET    /api/admin/exam-packs            list operator + canonical packs (DB-only for now)
GET    /api/admin/exam-packs/:id        single pack
POST   /api/admin/exam-packs            create operator pack (validates config shape; reserves canonical slugs)
PATCH  /api/admin/exam-packs/:id        update name / status / interactives_enabled
```

**Phase 1 risk floor:** the `exam_packs` table is populated but `src/curriculum/exam-loader.ts` did NOT initially merge those rows into the unified exam view. PR #32 wires the consumer side via `loadAllExamsWithDb()` / `getExamWithDb()` (async, 60s cache). The original sync `getExam()` is unchanged — legacy callers stay YAML-only.

**Phase 2 — PR #32 (shipped):** Curriculum unit generator + Tier 4 PedagogyVerifier + dual-metric lift.

- `src/curriculum/exam-loader.ts` — extended with `loadAllExamsWithDb()` async helper that merges YAML + `exam_packs` DB rows. YAML wins on id collision (defensive). 60s TTL cache. Sync API untouched.
- `src/content/verifiers/pedagogy-verifier.ts` — Tier 4 ContentVerifier; LLM-judge with 5-criterion rubric (concept_fidelity 0.30, pedagogical_sequence 0.20, learning_objective_coverage 0.20, interactive_correctness 0.15, distractor_quality 0.15). Shadow mode by default; `VIDHYA_PEDAGOGY_GATE=on` enables gating. Threshold tuneable via `VIDHYA_PEDAGOGY_THRESHOLD` (default 0.65).
- `src/experiments/lift.ts` — adds `computePyqAccuracyDelta(experiment_id)` alongside `computeLift()`. Uses the holdout PYQ bank (`is_holdout=TRUE`) as the cohort filter. Persists to `experiments.metadata.pyq_accuracy_delta_v1` (additive — no schema change). Two-proportion z-test, two-sided.
- `src/generation/curriculum-unit-orchestrator.ts` — wraps existing atom generation in a unit-level transaction. Lifecycle: queued → generating → ready | failed | aborted. Idempotent on `unit.id` re-call. Cost-metered per unit (inherits the run's cap; aborts the unit, not the run, when hit). Bidirectional PYQ links: `curriculum_units.prepared_for_pyq_ids` ↔ `pyq_questions.taught_by_unit_id`.
- `src/api/admin-runs-routes.ts` — `POST /api/admin/runs` now accepts `config.target.curriculum_unit_specs[]`; when present, the run dispatches into the unit orchestrator instead of the atom-only flywheel. When absent, behavior unchanged.

**Phase 3 — PR #34 (shipped):** Admin UI for unit launches + holdout dashboard.

- `frontend/src/components/admin/RunLauncher.tsx` — adds **Atoms / Curriculum unit** mode toggle. Unit mode reveals a panel with 4 fields: concept_id, unit name, learning objectives (newline-delimited `id|statement`), and prepared-for PYQ ids (newline-delimited). When the operator launches in unit mode, `config.target.curriculum_unit_specs[]` is populated and the backend's PR #32 unit orchestrator takes over.
- `frontend/src/pages/app/HoldoutPage.tsx` at `/admin/holdout` — read-only dashboard showing total holdout PYQs, stratification by `(year, topic)`, 28-day accuracy timeline, and per-PYQ listing (with attempts + accuracy + `taught_by_unit_id`). Linked from `AdminDashboardPage` quick links.
- `frontend/src/components/admin/EffectivenessLedger.tsx` — adds the **PYQ Δ** column that surfaces `experiments.metadata.pyq_accuracy_delta_v1` (the lagging north-star metric written by PR #32's `computePyqAccuracyDelta`). Sortable. Color-coded against the same promotion thresholds (`>+5%` win, `<-2%` loss).
- `src/api/admin-holdout-routes.ts` — two new admin REST endpoints: `GET /api/admin/holdout/summary?exam=…` and `GET /api/admin/holdout/pyqs?exam=…`. Tolerates absence of `sr_attempts` table (falls back to zero-attempt rows so the dashboard renders on a fresh DB).

**Phase 4 — interactives PR (shipped):** Three dependency-free interactive atom kinds for canonical packs.

- `frontend/src/components/lesson/interactives/types.ts` — schema for `manipulable` / `simulation` / `guided_walkthrough` specs + a safe formula evaluator (recursive-descent parser; no `Function()` / `eval()`). Versioned (`v: 1`); future schema changes ship as `v: 2` rather than mutating in place.
- `frontend/src/components/lesson/interactives/Manipulable.tsx` — slider-driven derived value. Live-evaluates output formulas as the operator drags the input.
- `frontend/src/components/lesson/interactives/Simulation.tsx` — parameterized animation. Plays an `(x(t), y(t))` trace over a small SVG; honors `prefers-reduced-motion` (renders the static endpoint instead of animating).
- `frontend/src/components/lesson/interactives/GuidedWalkthrough.tsx` — multi-step solver with three reveal phases per step (prompt → hint → answer).
- `frontend/src/components/lesson/interactives/InteractiveSidecar.tsx` — the dispatcher. Looks for a fenced ` ```interactive-spec\n{...}\n``` ` JSON block in the atom body (mirrors the `gif-scene` pattern from §4.15) and renders the matching widget. Renders nothing when no block is found. Wired into `AtomCardRenderer` next to `MediaSidecar`.
- **Capability gate:** `src/generation/curriculum-unit-orchestrator.ts` resolves `exam_pack.interactives_enabled` (DB → YAML → default false) before generation. When disabled, interactive atom kinds are dropped from the unit's spec with a warning log. Canonical packs (gate-ma, jee-main) opt in via YAML; operator-defined packs default to off.

28 new tests (21 schema + formula evaluator hardening including no-`eval()` proof, 7 component dispatch). Authoring lives in the separate `project-vidhya-content` repo per CLAUDE.md; the renderer side is now ready.

**All locked-plan PRs shipped.** Curriculum R&D Phases 1–4 complete.

---

### Personalization (§5.2, PRs #36–#40)

5-layer weighted selector + Phase B prompt steering, all surveillance-disciplined.

- `src/personalization/selector.ts` — `applyPersonalizedRanking()` re-ranks atoms within an already-selected set. Layer weights frozen (sum to 1.0): syllabus 0.10, exam 0.05, cohort 0.30, user_mastery 0.30, user_error 0.15, realtime 0.10. Dedup hard-floor with progressive backoff (7d → 3d → 1d → 0d).
- `src/personalization/lesson-wire.ts` — single integration point into both `/api/lesson/compose` and `/api/lesson/:concept_id`. Anonymous + control-bucket sessions short-circuit unchanged. Activated by creating an `experiments` row with id `personalized_selector_v1_gate_ma` (deliberately out-of-band, NOT a migration).
- `src/personalization/student-context.ts` — Phase B payload threaded into the LLM prompt: `representation_mode`, `motivation_state`, `current_concept_mastery`, `recent_misconceptions`, `shaky_prerequisites`, `prior_curriculum`. Built on demand from `student_model` + `error_log` + `exam_profile_store` + `knowledge/tracks`. Never persisted.
- `src/personalization/__tests__/surveillance-invariants.test.ts` — 7 CI invariants. Schema can't sprout `personalized_*` / `tracked_*` / `behavior_*` / `student_context_*` columns; `realtime-nudge.ts` can't write to the DB; `src/api/*` can't import `personalization/` (except the allowlisted `lesson-wire`); frontend can't import `personalization/` or access scorer fields; persona YAML can't contain real PII; admin scenario routes can't echo scorer internals; `/admin/scenarios` must be admin-gated.

CompoundingCard data flow audited end-to-end (#40): `PlannedSessionPage` and `KnowledgeHomePage` now pass `useSession()` through to `<CompoundingCard sessionId={…} />` so the streak row renders. `/api/student/compounding` payload allowlisted to block peer/percentile/rank/comparison fields.

---

### Demo-as-Moat — Persona Scenarios (PRs #41–#43)

A 3-minute on-screen demo that proves "personalization is real, not theatre". The loop:

```
data/personas/<id>.yaml
  → npm run demo:scenario <persona> <concept>
  → .data/scenarios/<run-id>/{trial.json, digest.md, pending.json?}
  → /admin/scenarios in the UI
  → click "Show neutral version" → side-by-side panel
```

**Key files:**

- `data/personas/*.yaml` — versioned (`schema_version: 1`). Two locked personas: `priya-cbse-12-anxious` (geometric, anxious) and `arjun-iit-driven` (algebraic, driven).
- `src/scenarios/persona-loader.ts` — strict YAML validation; rejects unknown schema versions, bad slugs, out-of-range mastery, non-scripted policies.
- `src/scenarios/policy-runner.ts` — deterministic mulberry32 PRNG seeded by `SHA-256(persona.id + ':' + concept_id + ':' + atom_idx)`. No `Math.random` anywhere; output is reproducible.
- `src/scenarios/persona-seeder.ts` — writes a `student_model` row + `exam_profile_store` entry under the namespaced UUID prefix `0aded0a0-` so persona rows never collide with real users. Seeder refuses to overwrite a non-persona row.
- `src/scenarios/trial-runner.ts` + `src/scenarios/trial-storage.ts` — pure-function loop over a JSON-serialisable `TrialState`. Pauses on the first interactive / unanswerable atom, records a `resume_token`, 24h timeout.
- `scripts/run-scenario.ts` + `scripts/run-scenario-resume.ts` — `npm run demo:scenario` and `npm run demo:scenario:resume`.
- `src/api/admin-scenarios-routes.ts` — `GET /api/admin/scenarios`, `GET /api/admin/scenarios/:id`, `POST /api/admin/scenarios/:id/neutral-render`. Per-admin 10/hour rate limit on neutral-render; disk cache short-circuits before consuming a token.
- `frontend/src/pages/app/ScenariosPage.tsx` at `/admin/scenarios` — list + detail UI. Each event row exposes a "Show neutral version" button that fetches the on-demand render and shows the side-by-side panel.

**Storage layout:**

```
.data/scenarios/<run-id>/
  trial.json     — source of truth (TrialState)
  pending.json   — present iff status === 'paused'
  digest.md      — markdown view, regenerated from trial.json
  _neutral_cache/<concept>__<atom_id>.txt   — disk cache for neutral renders
```

`VIDHYA_SCENARIO_ROOT` and `VIDHYA_SCENARIO_NEUTRAL_CACHE` env vars override defaults (used by tests + CI).

**Demo runbook:** see `docs/moat-demo.md` for the guided 3-minute path.

---

### Batch Generation (PRs #47–#50)

Moves content generation off sync LLM calls onto provider Batch APIs (~50% cheaper, no rate-limit pain). Five-state machine with mid-flight resume:

```
queued → prepared → submitted → downloading → processing → complete
             ↑           ↑                                       │
             └─ rebuild from batch_jobs if JSONL gone ─┐         │
                                       any state ─────┴─── failed | aborted
```

**Key files:**

- `src/generation/batch/types.ts` — `BatchAdapter` interface + state machine. Locked `BatchState` enum + `IN_FLIGHT_STATES` / `TERMINAL_STATES`.
- `src/generation/batch/jsonl-builder.ts` — deterministic `customIdFor(run_id, spec)` (SHA-256 over canonical-stringified spec). Same input → byte-identical JSONL → provider de-dupes by `display_name=run_id`.
- `src/generation/batch/gemini-adapter.ts` — pure HTTP layer over Gemini Batch. 5xx retries with exponential backoff; 4xx surfaces immediately.
- `src/generation/batch/orchestrator.ts` — five idempotent state handlers. Every transition writes to DB BEFORE the next side-effect; crash mid-step is recoverable from persisted state alone.
- `src/generation/batch/pg-persistence.ts` — Postgres impl of `BatchPersistence` with `pg_try_advisory_lock` keyed by `FNV-1a(run_id)` so two pollers can't race.
- `src/generation/batch/poller.ts` — `pollAllInFlightBatches()` shared by boot resume (`resumeAllInFlightBatches`) + 5-min cron poller.

**Schema (migration 026):** `generation_runs` gains `batch_provider` / `batch_id` / `batch_state` / `submitted_at` / `jsonl_path` / `last_polled_at` / `budget_locked_usd`. New `batch_jobs` table (per-atom durable ledger) keyed by `(run_id, custom_id)` with `processed_at` as the per-row idempotency keystone.

**Resume guarantees** (every failure mode covered by tests):
- JSONL on disk lost → rebuilt deterministically from `batch_jobs.atom_spec` rows
- `submitted` polling crashes → boot poller resumes; provider de-dupes on re-submit
- `processing` half-done → `processed_at IS NULL` filter, only re-processes what's left
- Per-job hook failure → marks that job's error, continues with the rest
- Operator Abort → calls `cancelBatch` on provider before flipping state
- 24h provider timeout → `failed:provider_timeout` with operator Resubmit
- Cost cap exceeded → rejected BEFORE any provider call

**Rate-limit telemetry (PR #50):** `src/llm/rate-limit-tracker.ts` records outcome + latency on every `callChat`. Hourly checkpoint to `.data/rate-limits.json`. Weekly learnings-ledger digest gains a "Rate limits hit this week" section with 🔥 hot-bucket callout for >5% 429s. Tracks PROVIDER outcomes, not student behaviour.

---

### Content Blueprints (PR #51)

The "spec layer" between `RunLauncher` and the `curriculum-unit-orchestrator`. Each blueprint is a human-editable plan that explicitly names stages, atom kinds, and constraints — plus the `rationale_id` for every choice — so the lift ledger can correlate spec shape with measured outcomes.

**Locked v1 contract (mutating in place forbidden — future shape changes ship as `decisions_v2 JSONB`):**

```ts
{
  version: 1,
  metadata: { concept_id, exam_pack_id, target_difficulty },
  stages: [
    { id: 'intuition', atom_kind: 'visual_analogy', rationale_id: 'concept_is_geometric' },
    { id: 'practice', atom_kind: 'mcq', count: 3, difficulty_mix: { easy: 50, medium: 30, hard: 20 }, rationale_id: 'default_practice_mix' },
  ],
  constraints: [{ id: 'no_jargon_first_definition', source: 'template' }],
}
```

- `StageKind ∈ {intuition, discovery, formalism, worked_example, practice, pyq_anchor}`
- `AtomKind` reuses the existing 8 kinds
- `rationale_id` is a closed-enum string (the join key for the eventual lift-ledger groupby)
- `practice` stages must declare `count` + `difficulty_mix` summing to 100
- `constraints` carry `source ∈ {template, arbitrator, operator, ruleset}`

**Schema (migration 027):** `content_blueprints` table with `superseded_by` chains for non-destructive history. `generation_runs.blueprint_id` FK column (nullable; legacy runs untouched).

**Code:**

- `src/blueprints/types.ts` — locked v1 types + closed enums
- `src/blueprints/validator.ts` — runtime validation; refuses invalid shape AND any field name matching `/user_id|session_id|behavior|tracked|surveillance/i` at any depth (defense-in-depth)
- `src/blueprints/template-engine.ts` — deterministic blueprint producer. Picks atom kinds by topic family (geometric → `visual_analogy`, algebraic → `worked_example`, computational → `manipulable` for discovery). No LLM, no DB, no clocks.
- `src/blueprints/persistence.ts` — pg-backed CRUD with optimistic concurrency via `updated_at` ETag + cycle-safe `supersedeBlueprint`
- `src/blueprints/to-unit-spec.ts` — pure translator from blueprint to the orchestrator's existing `CurriculumUnitSpec` shape
- `src/api/admin-blueprints-routes.ts` — admin REST: `GET/POST /api/admin/blueprints`, `GET/PATCH /api/admin/blueprints/:id` (requires `If-Match`), `POST /api/admin/blueprints/:id/approve`. 409 Conflict on ETag mismatch.
- `frontend/src/pages/app/BlueprintsPage.tsx` at `/admin/blueprints[/:id]` — sidebar + per-stage rationale + JSON edit-in-place with conflict recovery

**Surveillance invariant 8:** migration grepped + validator runtime check both refuse behavioural / per-student field names.

**What's deferred** (per locked CEO recommendation — ship blueprint, observe, then iterate):
- LLM arbitrator (PR-2): override template baseline when context warrants
- Operator-uploaded rulesets (PR-3): plain-text constraints scoped by `(exam_pack_id, concept_pattern)`
- Lift-ledger blueprint section (PR-4): weekly digest groups lift by `(template_version, stage shape)`

---

### Admin Journey UX (PRs #58–#61)

A guided assist layer over the existing admin pages so operators land on a clear "next move" instead of a wall of tools. Four pieces, each surfacing existing data without new schema:

**PR #58 — Journey dashboard at `/admin/journey`**

8-milestone progress timeline (Vercel-style vertical stages, never gates navigation). Every milestone is derivable from one indexed query:

| # | Milestone | Done when |
|---|---|---|
| 1 | exam_pack | always (jee-main + gate-ma ship) |
| 2 | rulesets | ≥3 enabled rulesets |
| 3 | blueprint | ≥1 non-superseded |
| 4 | approve_blueprint | ≥1 approved |
| 5 | persona_scenario | ≥1 `.data/scenarios/<id>/trial.json` |
| 6 | generation_run | ≥1 generation run |
| 7 | first_student | ≥1 user_profiles role='student' |
| 8 | first_signal | ≥1 mastery_snapshots |

`GET /api/admin/journey/progress` runs a single `Promise.all` of indexed queries; 30s in-process cache; `?refresh=1` bypasses. First-time admin redirected to `/admin/journey` once via `localStorage.vidhya.admin.first_landing`.

**PR #59 — Decision log + JourneyNudge**

`/admin/decisions` is a chronological feed of admin actions across blueprint + ruleset + run surfaces. Sourced from existing `created_at`/`created_by` columns. Filterable by kind, grouped by day. Backend uses `Promise.allSettled` over 4 queries; merged + sorted DESC.

`<JourneyNudge currentHref="..." />` is a self-fetching banner mounted at the top of `BlueprintsPage`, `RulesetsPage`, `ContentRDPage`, and `DecisionsPage`. Surfaces the current `next` milestone with a one-click CTA. Hides on the page it would point to + on session-dismiss (`sessionStorage.vidhya.admin.nudge.dismissed`).

**PR #60 — Cohort attention surface at `/admin/cohort`**

The deliberately-narrow alternative to "show me every student". Returns at most **10 cards** of students who need attention; everyone else rolls up into a single counter line. Hard caps + thresholds locked:

```ts
ATTENTION_CAP = 10
REGEN_WEEK_THRESHOLD = 3
MASTERY_DECLINE_THRESHOLD = -0.05
```

Cards triggered by ≥1 of: `≥3 personalised regens in 7d`, `mastery delta < -0.05 over 14d`, `motivation_state ∈ {'frustrated','flagging'}`. Each card surfaces the `student-audit` CLI command for one-click drill-in. Surveillance invariant 10 enforces: `ATTENTION_CAP` is a small literal + no `email`/`student_name`/`display_name`/`full_name` fields ever leak.

**PR #61 — Lift-ledger suggested actions**

`src/experiments/ledger-suggestions.ts` — pure-function `suggestForExperiment()` returns one of 7 suggestion kinds (`bake_in_winner`, `investigate_loser`, `wait_for_signal`, `expand_run_count`, `fund_resume`, `celebrate`, `no_action`) deterministically from `(status, lift_v1, lift_n, lift_p, variant_kind, ended_at)`. Same input → same output forever; backend tests lock the rules.

Frontend mirror at `frontend/src/lib/ledger-suggestions.ts` (manual-sync). `EffectivenessLedger.tsx` renders a tone-coded inline second row beneath each experiment row with the suggestion + a one-click CTA link to `/admin/rulesets`, `/admin/decisions`, or `/admin/content-rd`. **Suggestions are advice, never auto-applied** — the human stays in the loop on compounding decisions.

**Surveillance invariants added:** 9 (`admin-journey-routes.ts` returns counts only) and 10 (`admin-cohort-routes.ts` caps + forbids PII). Combined with invariants 1–8 the count stands at 10 CI-enforced rules.

---

### 100x Blueprint Foundation (v4.14.0, PR #65)

Architectural foundation for the 100x Blueprint (`886f0351-ProjectVidhya100xBlueprint.md`, full doc at `docs/100x-blueprint.md`). Locks interface contracts for every layer in §5 and ships real Phase 1 implementations (Elo + FSRS + `nextBestAction`) plus a Phase 2 descriptive-grading scaffold with the CAS guardrail wired. Approvals from §9 baked into code: Extraction vs Acquisition split (premise gate), right-modality manim (Challenge C1).

**Phase 0 — seams** (`src/core/interfaces.ts`):

Single barrel for the seven layer contracts. `[seam]` markers have one impl today; `[plugin]` are multi-impl from day one.

| Layer | Interface | Marker | Status |
|---|---|---|---|
| L1 Platform | `LLMGateway` | [seam] | Honored by existing `src/llm/index.ts` |
| L1.5 Eval & Guardrails | `VerificationGate` | [seam] | Wraps existing `src/verification/` cascade |
| L2 Curriculum | `CurriculumRepo` | [plugin] | Per-course graph |
| L3 Student Model | `StudentModel` | [plugin] | Elo+FSRS now, AKT later |
| L4 Assessment | `Scorer`, `ItemSelector` | [plugin] | MCQ vs descriptive vs proto-CAT |
| L5 Teaching Policy | `TeachingPolicy` | [plugin] | A/B-able strategies |
| L6 Readiness Engine | `ReadinessEngine` | [plugin] | `nextBestAction()` |

**Phase 1 — real working implementations** (pure functions, no DB / network):

- `src/gbrain/elo.ts` — joint student-ability / item-difficulty online ratings (§3.1). `K_STUDENT=32` (students move fast), `K_ITEM=8` (items move slow by design). `itemDifficultyTrustworthy()` returns false until `n≥100` per blueprint guardrail. Caller persists.
- `src/gbrain/fsrs.ts` — FSRS-6 memory model with locked default weights (§3.4). Replaces SM-2 over time; the existing `retention-scheduler.ts` stays online during the dual-write window. Per-user weight re-fit deferred to Phase 4 behind a flag.
- `src/readiness/next-best-action.ts` — `DefaultReadinessEngine` encoding the four-arm core loop (Retain → Practice → Teach → Diagnose). **Extraction-first tie-breaking:** an overdue card with recall < `RETAIN_RECALL_THRESHOLD` (0.7) gets `expectedGain = 1.0 + (1 - recall)`, guaranteeing it outranks fresh practice (baseline 1.0). `expectedScore()` throws `not yet implemented` (Phase 2 wires it; never returns silent zeros).

**Phase 2 — descriptive grading scaffold** (§3.5):

- `src/scoring/rubric-grader.ts` — `RubricGrader` implements `Scorer`. Six non-negotiables enforced: rubric JSON, RAG grounding, **CAS final-answer check is the source of truth on the number** (LLM never decides correctness), reason-then-score, calibration store, low-confidence → teacher queue. `LLMJudge` + `CASChecker` are abstract contracts; concrete adapters wrapping `LLMClient` and the existing `AnswerVerifier` cascade land in a follow-up wiring PR (kept separate so pure-logic tests stay DB-free).
- `src/scoring/teacher-queue.ts` — `TeacherQueueRepo` contract + pure aggregators (`summarizeQueue` returns ICC proxy, mean adjustment marks, oldest-pending hours for the cockpit). `extractFinalAnswer` uses brace-balanced parsing — `\boxed{f(x) = \frac{1}{2}}` is captured whole, not truncated.

**Migration 029** (`supabase/migrations/029_blueprint_100x.sql`):

Four idempotent tables, auto-applied on boot by `src/db/auto-migrate.ts`:
- `student_skill_elo` keyed `(student_id, skill_id)`
- `item_difficulty_elo` keyed `(object_id, skill_id)`
- `fsrs_cards` keyed `(student_id, object_id)` with `due_at` index
- `grading_reviews` (pending/confirmed/corrected/dismissed) feeds the calibration set

**Tests:** 55 new pure-function tests across `elo.test.ts` (14), `fsrs.test.ts` (16), `next-best-action.test.ts` (6), `rubric-grader.test.ts` (13), `teacher-queue.test.ts` (6). Full suite 1372/1372 passing.

**Deferred (called out in `docs/100x-blueprint.md`, not silently dropped):**

- `LLMJudge` + `CASChecker` adapters wiring → `LLMClient` and `AnswerVerifier` cascade
- `expectedScore()` real impl + mock-to-marks report (Phase 2 polish)
- Telemetry events on every attempt (§5.8) — interfaces don't fire today
- Idempotency dedup on `StudentModel.update` (Elo is not commutative on duplicate attempts; concrete impl needs a `(studentId, objectId, ts)` dedup table)
- Response-length cap on `RubricGrader.grade` to bound prompt tokens
- Phase 4 swaps: DKT/AKT behind `StudentModel`, IRT/true-CAT behind `ItemSelector`

**Phase 2 wiring (v4.15.0):** the foundation seams are now reachable from the public API:

- `src/scoring/adapters/llm-judge.ts` — `RuntimeLLMJudge` wraps `getLlmForRole` from `src/llm/runtime.ts`. Strict JSON parsing rejects malformed responses (caller routes to teacher queue rather than guess). System prompt enforces "LLM never judges the final answer — the CAS does." `MAX_RESPONSE_CHARS=20_000`, `MAX_SOLUTION_CHARS=8_000` keep prompt tokens bounded.
- `src/scoring/adapters/cas-checker.ts` — `TieredCASChecker` wraps `TieredVerificationOrchestrator` (the existing 3-tier RAG → SymPy → Wolfram cascade). Returns true only when `status === 'verified' && confidence >= CAS_TRUST_THRESHOLD (0.7)` — cascade failures default to false (safer than guessing).
- `src/scoring/teacher-queue-pg.ts` — `PgTeacherQueueRepo` implements `TeacherQueueRepo` against migration 029's `grading_reviews`. Single lazy pool, JSONB columns for proposed/final grade, optimistic-state `WHERE status='pending'` on resolve (idempotent).
- `src/scoring/attempt-dedup.ts` — `attemptKey()` + `InMemoryDedupRepo` + migration 030 `attempt_dedup` table for Postgres impls. Closes the §3.1 idempotency hole on `StudentModel.update`.
- `src/scoring/rubric-grader.ts` — added `MAX_RESPONSE_LENGTH=50_000` cap; oversized responses throw rather than truncate (silent truncation loses the student's work).
- `src/api/scoring-routes.ts` — three endpoints wired into `src/server.ts`:
  - `POST /api/scoring/grade` — open; runs the full RubricGrader pipeline; returns `{grade, queued_for_review, review_id}`. Validates `student_response` (length cap), `item.rubric` (non-empty), `item.maxMarks` (positive).
  - `GET /api/admin/grading/queue?status=pending&limit=50` — admin; returns rows + `summarizeQueue` health (pending count, oldest hours, ICC proxy, mean adjustment).
  - `POST /api/admin/grading/queue/:id/resolve` — admin; `{status, final_grade?, reviewer_notes?}`. Reviewer id pulled from JWT auth context.

**19 new tests** (`llm-judge.test.ts` 12 — prompt + strict parser; `attempt-dedup.test.ts` 6 — key determinism + LRU cap; `rubric-grader.test.ts` +1 — length cap). Full suite **1391/1391 passing.**

**Migration 030** (`supabase/migrations/030_attempt_dedup.sql`): `attempt_dedup(student_id, object_id, ts_ms)` PRIMARY KEY for idempotent attempt persistence; `recorded_at` index for cheap pruning of dedup keys older than ~30 days.

**Wave 3 (v4.16.0):** the writer side is now live and the headline metrics work.

- `src/gbrain/student-model-pg.ts` — `PgStudentModel implements StudentModel`. Single transaction does dedup-check → Elo joint update → FSRS card review → error-tag persist. Idempotent on `(studentId, objectId, ts)` via migration 030's PRIMARY KEY. Publishes `attempt.recorded` on the in-process bus post-commit.
- `src/events/attempts-bus.ts` — type-safe channel for attempt events (§5.8). Synchronous delivery, exception-isolated subscribers, `onAttemptRecorded(fn)` returns a cleanup function.
- `src/readiness/expected-score.ts` — `computeExpectedScore()` aggregates `sigmoid((rating-1500)/200) × examRelevance × maxMarks` across scoped nodes. `DefaultReadinessEngine.expectedScore()` wraps it; the v4.14.0 throw is gone.
- `src/readiness/mock-to-marks.ts` — `summarizeMock(attempts)` returns the Extraction report: `earned / knewIt / leftOnTable / lossByErrorType / topDrillRecommendation`. A `method` tag means "didn't know it"; careless tags (`sign`/`unit`/`misread`/`transcription`/`careless`) on attempts with partial credit mean "knew it but slipped."
- `/api/scoring/grade` calls `getStudentModel().update()` fire-and-forget when `student_id` + `skill_id` are supplied. Failures log but don't break the grade response.
- Migration 031 — `attempt_error_tags(student_id, object_id, ts_ms, error_tag) PK`. CHECK constraint locks the `ErrorTag` union.

**22 new tests** (mock-to-marks 8 + expected-score 8 + attempts-bus 4 + next-best-action +2). Full suite **1413/1413 passing.**

**Wave 4 (v4.17.0):** cold-start dignity + real item selection.

- `src/scoring/proto-cat-selector.ts` — `ProtoCATSelector implements ItemSelector`. Translates the desirable-difficulty success band to a catalog query window via inverse Elo (`eloFromSuccess`), scores by tent-shape information function (peaked at p=0.5), penalizes items past `OVEREXPOSURE_THRESHOLD=5` exposures, samples uniformly among the top-k (default 3). Retain mode (band ≥ 0.85) flips to success-probability scoring so overdue reviews feel validating, not punishing.
- `src/scoring/learning-object-catalog.ts` — `LearningObjectCatalog` interface + `InMemoryCatalog`. Production wraps `generated_problems`; tests use the in-memory impl.
- `src/readiness/diagnostic-warmup.ts` — 4–8 item bracketing diagnostic that replaces "everyone starts at Elo 1500." Bracket walks down from 800–2100 in ~5 items. Pure functions; caller persists.
- `src/api/readiness-routes.ts` — stateless warm-up endpoints; state round-trips through the client.
  - `POST /api/readiness/warmup/next` — get next probe.
  - `POST /api/readiness/warmup/apply` — pure reducer.
- `pickDueReview()` now passes `allowedNodes` into the selector (closes a latent bug where retain mode always returned null).

**36 new tests** (proto-cat 12 + warmup 14 + wave4-integration 4 + score/info 6). Full suite **1449/1449 passing.**

**Waves 5 + 6 (v4.18.0):** syllabus-progression awareness + motivation-aware modality. Closes the CEO-audit trilogy.

- `src/readiness/syllabus-context.ts` — pure helpers: `weeksToExam`, `pctSyllabusCovered`, `inferPhase` ({`early` | `mid` | `crunch` | `final-week`}), `armWeightsForPhase`, `eligibleNodes` (prereq-DAG filter).
- `src/readiness/syllabus-aware-engine.ts` — `SyllabusAwareReadinessEngine implements ReadinessEngine`. Filters `allowedNodes` by prereq mastery, scales `expectedGain` by phase weights, attaches a phase label to the rationale ("Crunch time — …"). Defensive: empty eligible-set falls back to the original set rather than deadlock in diagnose.
- `src/teaching/motivation-source.ts` — `MotivationSource` interface + `InMemoryMotivationSource`. Bridges legacy `student_models.motivation_state` into the 100x layer without coupling.
- `src/teaching/motivation-aware-policy.ts` — `MotivationAwareTeachingPolicy implements TeachingPolicy`. Locked modality preference table per motivation state. Anxious students get **practice last** (paranoid: wrong-answer spikes anxiety).

**35 new tests** (syllabus-context 19 + syllabus-aware-engine 6 + motivation-aware-policy 10). Full suite **1484/1484 passing.**

**CEO audit scoreboard:**

| Dimension | Status |
|---|---|
| Any competence level | ✅ Wave 4 — ProtoCATSelector + warm-up |
| Any syllabus position | ✅ Wave 5 — `SyllabusAwareReadinessEngine` |
| Any engagement level | ✅ Wave 6 — `MotivationAwareTeachingPolicy` |

**Wave 7 (v4.19.0):** wire the engine — the Wave 4–6 stack reachable by real users, repo under CI.

- `GET /api/readiness/next-action` + `GET /api/readiness/expected-score` — `SyllabusAwareReadinessEngine` composed with the Pg student model, `ProtoCATSelector` over the new `PgLearningObjectCatalog` (`src/scoring/learning-object-catalog-pg.ts`, wired at boot), `MotivationAwareTeachingPolicy`, and `ConceptGraphCurriculumRepo` (`src/curriculum/curriculum-repo.ts`). DB-less deploys degrade honestly: `{ action: null, reason: "building your baseline" }` — never fabricated.
- `src/scoring/deterministic-scorer.ts` — executing GATE marking (MCQ −1/3|−2/3, MSQ conservative, NAT epsilon) + full marking-matrix tests. Awaits a `question_type`/answer-column migration on `generated_problems` before a live route consumes it.
- `frontend/src/components/app/NextBestActionCard.tsx` — dominant action card on `PlannedSessionPage`, conservative expected-marks band, honest empty state.
- `.github/workflows/ci.yml` — typecheck + vitest + frontend tsc on every push/PR. The 10 pre-existing type errors on main (knowledge-routes, cas-checker, llm-judge, motivation-aware-policy) were fixed in this release; typecheck is clean — keep it that way.

Full suite **1541/1541 across 135 files.**

**Wave 8 (v4.20.0):** the Wave 7 deferred list, closed.

- Migration `032_generated_problems_marking.sql` — nullable `question_type`/`marks`/`answer_index`/`answer_indices`/`answer_range` on `generated_problems`; auto-migrate applies it at boot. `PgLearningObjectCatalog` threads valid marking through `payload` (validation gate `markingPayloadFromRow()` — half-marked rows count as unmarked), gained `getById()` (now on the catalog seam, optional), and `SELECT *`s so pre-032 deploys keep an intact catalog.
- `attachMarking()` in `src/api/readiness-routes.ts` is real: practice actions with a marked object get `{ marking: { marks_correct, marks_wrong } }` from deterministic-scorer's `describeMarking()`; everything else passes through unchanged. Marking is never fabricated.
- `PgMotivationSource` (`src/teaching/motivation-source-pg.ts`) reads legacy `student_model.motivation_state` by `session_id`; readiness routes now rank modalities on real motivation signal. DB-less → null → policy default ranking.

Full suite **1556/1556 across 137 files.**

**Wave 9 (v4.21.0):** `POST /api/practice/attempt` — deterministic grading live end-to-end.

- Structured `GateResponse` in, server-side `GateDeterministicScorer.grade()`, result into `StudentModel.update()` as `Attempt.partialMarks` (Elo + FSRS + dedup + attempts-bus; idempotent on (student, object, ts) — retries must resend the same `ts`). Non-skipped recorded attempts recalibrate `empirical_difficulty`.
- Migration `033_generated_problems_options.sql`: canonical ordered `options` JSONB — 032's answer indices are indices into THIS list; mcq/msq rows without it are refused (422), never guessed. Precise refusal reasons name the missing column.
- DB-less: grades honestly, responds `recorded: false`.

Full suite **1567/1567 across 138 files.**

**Wave 10 (v4.22.0):** the loop closes — authored marking + practice UI.

- `src/gbrain/marking-derivation.ts` — the generator authors 032/033 marking at creation: mcq canonical options shuffled ONCE (≥2 usable distractors or refuse), nat strict-numeric-only with authored tolerance max(0.01, 0.5%·|v|), marks 2 iff difficulty ≥ 0.66, 'open' never marked. Unmarkable material → honest unmarked row.
- `GET /api/practice/item/:id` — render-safe item view (question/kind/marks/options/marking + gradable/not_gradable_reason). Answer key NEVER leaves the server here; a test asserts the serialized response leaks nothing.
- `frontend /attempt/:objectId` (PracticeAttemptPage) — MCQ/MSQ/NAT inputs, marking chip, skip, server-graded result, idempotent retry (fixed per-load ts). NextBestActionCard routes practice/retain actions with an objectId here.

Full suite **1582/1582 across 139 files.**

**Wave 11 (v4.23.0):** MSQ generation + SmartPracticePage self-check honesty.

- `deriveMarking()` msq branch: ≥2 distinct correct answers + ≥1 disjoint distractor or refuse; shuffle-once canonical order, `answer_indices` into it. Generator `format: 'msq'`: prompt emits a `correct_answers` array, `correct_answer` column stores its JSON, self-verify compares normalized SETS, unusable msq material is dropped (not even cached display-only).
- SmartPracticePage: server-gradable resolves hand off to `/attempt/:id`; the remaining legacy path is labeled "Self-check … not exam grading, no marks recorded."

Full suite **1586/1586 across 139 files.**

**Wave 12 (v4.24.0):** FSRS shadow mode — A7 spec SIGNED OFF, §4 step 1 live.

- `src/gbrain/fsrs-shadow.ts` implements the A7 mappings (quality→rating both scales; stability←interval floor 0.5; difficulty←clamp(11−2.8·ease)); both live SM-2 sites (`POST /api/lesson/advance-sm2`, `retention-scheduler.recordEncounter`) log what FSRS-6 would have scheduled to `fsrs_shadow_log` (migration 034) while SM-2 behavior stays byte-identical. Fire-and-forget; DB-less no-op.
- `GET /api/admin/fsrs-shadow` (admin) reads the exit criterion: median |delta| ≤ 1 day over ≥ 200 events → unblocks Wave 13 (the swap, with `VIDHYA_SCHEDULER=sm2` rollback for one release).
- Acceptance property tested: migrated cards due within ±1 day of their SM-2 due date (stability←interval + intervalForRetention(s, 0.9) ≡ s).

Full suite **1595/1595 across 140 files.**

**Still deferred (the bigger roadmap, in order):**

- Wave 13: FSRS/SM-2 swap — gated on the shadow exit criterion at `GET /api/admin/fsrs-shadow`, not on code.
- E1 runtime LLM budget ladder (<₹10/student/month, routing ladder, semantic help-cache).
- Cockpit drill-downs.
- Phase 4 — DKT/AKT for `StudentModel`, IRT + true CAT for `ItemSelector`.

---

### Multi-Provider LLM Support (v4.25.0)

Content-generation no longer hard-requires `GEMINI_API_KEY` specifically — it requires **at least one** configured provider (Gemini, Anthropic, OpenAI, or OpenRouter), matching what the code already did in practice (`orchestrator.ts`'s non-math atom generation calls Claude primary, Gemini only backs math-atom consensus + the single-provider fallback).

**Root cause found while relaxing the gate:** three independent places declared the "requested" model id for Claude/Gemini and had drifted from each other — `config/providers.yaml` (`claude-sonnet-4-20250514` / `gemini-2.0-flash`), `orchestrator.ts`'s `MODEL_ID_MAP` (had to match providers.yaml exactly since `resolveProviderForModel()` does a literal string match), `RunLauncher.tsx`'s model dropdown (`claude-sonnet-4-6`, off by one from every other copy), and `cost-meter.ts`'s `PRICES` table (`claude-sonnet-4-6` too). Any operator picking "Claude" in the RunLauncher would have hit `ModelRetiredError`. All four now agree on `claude-sonnet-4-5` / `gemini-2.5-flash` / `gemini-2.5-pro` — the ids `src/llm/provider-registry.ts` (the BYOK chat registry) already used, so there's one id per model across the app instead of near-miss copies. This is exactly the "parallel truths that drift" bug class `registry.ts`'s own header comment warns about — nothing currently prevents a future re-drift; a shared constants module is the real fix, not attempted here.

**OpenRouter added as a real content-generation provider**, not just a BYOK chat option: `config/providers.yaml` gained an `openrouter` block (`OPENROUTER_API_KEY`, openai-compatible shape, `google/gemini-2.5-flash` / `anthropic/claude-sonnet-4-5` / `openai/gpt-4o`), `src/llm/index.ts`'s `LLMClient` and `src/llm/adapters/index.ts`'s factory both route `openrouter` through the existing `OpenAIAdapter` (OpenRouter speaks OpenAI's chat-completions shape — no new adapter class needed), and `ProviderId` in `src/llm/types.ts` gained the id. `preflightProviders()` / `npm run content:setup` / the Setup Wizard's provider list all pick it up automatically since none of them hardcode a provider allowlist — `config/providers.yaml` is the only place a new provider needs to be declared.

**Setup Wizard (`/admin/setup`) and `npm run content:setup`:** the readiness banner is `hard_requirement_met = providers.some(p => p.enabled && p.key_present)` instead of checking Gemini specifically; the banner names which provider(s) actually satisfied it. `ProviderStatus.required` is always `false` now (no single provider is individually mandatory) — kept as a field rather than removed in case a future deployment wants to reintroduce a mandatory provider. `content-generation-job.ts`'s in-process preflight (the one `npm run content:generate` actually runs) got the same treatment: refuses only when `preflightProviders()` returns zero results (nothing configured) or every configured provider fails its live check.

### RunLauncher dropdown now drives real generation + admin-launched runs actually dispatch (v4.26.0)

Two compounding gaps closed together, because fixing the first was pointless without the second:

**1. `orchestrator.ts`'s model plumbing was hardcoded to `'claude' | 'gemini'`.** `callLlm()`, `generateOne()`, `generateConcept()`/`OrchestratorOptions` now accept an arbitrary `model_id` (any id in `config/providers.yaml`) via the new `OrchestratorOptions.model_id` — defaults to Claude when absent, unchanged from before. Math atoms (`formal_definition`, `worked_example`) still run dual-model consensus; the second opinion (`pickConsensusSecondary()`) is chosen automatically to be on a **different provider** than the primary (Gemini unless the primary itself resolves to Gemini, in which case Claude) — `consensusProvidersAreDistinct()`/`ConsensusRoutingError` still refuse the pair up front if they'd resolve to the same provider, same guarantee as before, now parameterized instead of hardcoded to the old fixed pair. `GenerationSource`'s `'llm-claude'`/`'llm-gemini'` labels are kept as **positional** ("primary leg"/"secondary leg") rather than renamed — see the type's doc comment — to avoid a wider blast-radius rename for what's a two-call-site cosmetic label.

**2. Bigger discovery: admin-launched GenerationRuns never actually ran.** `POST /api/admin/runs` (RunLauncher's "Launch" button) and the ledger's "run now" suggestion-launch both only ever inserted a `generation_runs` row with `status='queued'` — nothing in the codebase consumed it. The UI said "Launched (queued). Watch its progress in Active runs below," but no process ever advanced the row past `queued`; `curriculum-unit-orchestrator.ts`'s own docblock even claimed "the admin POST /runs route... calls `generateUnit(spec, runContext)`," which was aspirational, not true. Separately, unit-mode generation (`generateAtomForKind`) looked up `conceptOrchestrator.generateAtom ?? .generate ?? .runOrchestrator` — none of which the barrel exports (the real entry point is `generateConcept`) — so it unconditionally fell through to a placeholder `_Stub atom_` insert, in every deployment, forever.

Fixed with `src/generation/run-dispatcher.ts` (`dispatchRun(runId)`):
- Atom mode (`target.concept_ids[]` / `target.topic_id`, the common RunLauncher path): loops `generateConcept()` per concept — threading `config.pipeline.llm_models[0]` as `model_id` — until `quota.count` atoms or `quota.max_cost_usd` is spent, updating `cost_usd`/`artifacts_count`/`status` on the row as it goes. Deliberately does NOT pass the run's `max_cost_usd` into `generateConcept`'s `cost_cap_usd` param — that's `concept-cost.ts`'s **per-concept monthly** cap, shared across every run touching that concept that month, not a per-run budget; run-level spend is bounded in the dispatcher's own loop instead.
- Unit mode (`target.curriculum_unit_specs[]`): calls the already-existing `generateUnitsForRun()`, now that `generateAtomForKind` actually reaches `generateConcept` (kind→AtomType via `KIND_TO_ATOM_TYPE`, with `'practice'` mapped to `'micro_exercise'` — the one curriculum-unit-specific label with no 1:1 AtomType name).
- Triggered fire-and-forget right after `createRun()` in both `admin-runs-routes.ts` and `admin-ledger-routes.ts` (the HTTP response returns immediately; dispatch runs in the background). Swept up on server boot and every 5 min by the scheduler's new `generationRunResume` job (`resumeQueuedRuns()`) for crash resilience — mirrors `batch/poller.ts`'s `resumeAllInFlightBatches` pattern for the *other*, unrelated `generation_runs` consumer (the Gemini-batch-API pipeline, keyed off `batch_state` instead of `status`).
- `atom_versions.appendVersion()` gained an optional `generation_run_id` param (the column already existed — `insertStubAtomVersion` was stamping it, `appendVersion` wasn't) so atom-mode-generated atoms are traceable back to their run, same as unit-mode ones already were.

**Still out of scope:** the cron-driven flywheel (`content-flywheel.ts`'s `runFlywheel()`) has its own separate PYQ-problem generator (`generateProblem`/`verifyAndPublish`, not `generateConcept`) and its own hardcoded `gemini-2.5-flash` — untouched, since it's a different generation pipeline entirely, not part of the RunLauncher/dropdown path. `config.pipeline.multi_llm_consensus` (a boolean the suggester randomly toggles as an experiment idea) still isn't read anywhere — consensus is still purely atom-type-driven (`requiresConsensus()`), not operator-toggleable.

---

### Durable stores + honest gates (v4.33.0)

Two classes of quiet falsehood, closed together.

**The gates were measuring wrong.** `scripts/check-syllabus-floor.ts` had four
independent defects and still produced plausible-looking numbers: it read the
top level of the explainer bundle instead of `by_concept`, treated a
single-object payload as unindexable, required an `atom_type` field real
explainers do not carry, and compared teaching-tip ids against a set whose keys
carry a `NN-` prefix. Net effect: 282 reported findings on `main`, of which 170
were content that existed and the gate could not see. Now 112, and every
counter it produces has a test that fails when that counter is broken. Practice
gaps (97) did not move — those are real.

Two more gates joined CI (10 total): `ci:template-coverage` and
`ci:variant-agreement`. The golden content set grew from 3 concepts to all 97
(196 atoms), with existing gaps grandfathered in
`scripts/golden-answer-key-baseline.json` so only NEW gaps fail.

Schema columns are now **deny-by-default** against
`scripts/schema-column-baseline.json` — adding one requires a reviewed entry,
which is where someone asks whether a per-student attribute should exist at
all. A JSONB `record` column is a hole in a column-name gate, so the blobs are
additionally guarded by per-type field allowlists in the durability tests.

**Records outside Postgres did not survive the host sleeping.** Migrations
041/042/043 back the flat-file stores:

- `041_auth_user_records` — user accounts
- `042_durable_content_stores` — feedback + generated bridge content
- `043_durable_records` — one `durable_records` table with a `collection`
  discriminator for the remaining ~17 stores holding irreplaceable data

`src/storage/durable-flat-file.ts` is the wiring reduced to four lines, and it
enforces the three rules once rather than per store: mirroring is
fire-and-forget, hydration NEVER writes over a populated local store, and a
failed read returns `null` rather than `[]` so an unreachable database cannot
read as "there is nothing here". `hydrateAllDurable()` runs at boot.

Wired: retention schedules, mastery trajectories, notebooks (row-per-entry —
an engaged student's history grows without bound), session plans, exam
profiles, practice logs, plan templates, attention coverage, sample checks,
live courses, marketing articles and campaigns, exams, exam groups, bridge
content feedback, and the three teacher stores. Left on disk deliberately and
documented in TODOS.md: recomputable aggregates and single-run scratch state.

**Generation actually generates.** `src/syllabus-bridge/batch-runner.ts` built
`new LLMClient({})` — zero adapters, so every call threw and fell through to a
mock that was then served as real content. Fixed; `isServable()` refuses
anything whose `source` is `'mock'` with a 409. Spend is capped BEFORE the
call, not discovered after (a thrown cap could not survive the nested catches).
`src/syllabus-bridge/pricing.ts` is now the only price table — the plan screen
and the cap had drifted 10x apart, each internally consistent.

**Other surfaces:** stance pinned per session (`src/sessions/stance-pin.ts`),
a cadence every topic resolves to (`src/content/stance-cadence.ts`), a variant
generator + LLM judge with a labelled eval set (`src/generation/`), and the
Tier 4 shadow readout at `GET /api/admin/pedagogy-shadow` which reports what
flipping `VIDHYA_PEDAGOGY_GATE=on` would refuse today.

**Known-unrun:** `npm run variants:eval` (the judge against its labelled set)
and live bridge generation have never executed against a real model in this
environment — `openrouter.ai` is blocked by proxy policy and no provider key is
set. Both reach only offline operator scripts, not any student-facing path.
Tracked in TODOS.md.

---

### Linear Algebra real-time loop + Math Academy layer (v4.34.0)

Closes the adaptive loop for all 26 Linear Algebra concepts end-to-end: warmup
placement → live frontier view → gradable practice with implicit-credit
propagation → checkpoint quizzes → mock exams, all server-graded and
DB-backed. Plan doc: `docs/designs/linear-algebra-realtime-and-math-academy-plan.md`.

**Warmup onboarding.** `src/readiness/warmup-onboarding.ts` — a 5-spine-concept
bracketing diagnostic at `/warmup` (`WARMUP_SPINE_CONCEPTS`, `COMPETENCE_THRESHOLD`),
`computePlacement()` + `inferPlacedAncestors()` to derive a placement result,
and `applyWarmupPriors()` to persist priors — only for CONVERGED concepts, never
guessed. Anonymous visitors get an honest sign-in path: a 401 on the persist
call surfaces a real sign-in step with the student's answers preserved, rather
than silently discarding the warmup or fabricating a success.

**Frontier spine.** `frontend/src/components/knowledge/FrontierSpine.tsx` — the
knowledge-frontier view: 4 clusters, mastered rollups, placed-vs-demonstrated
dots, a "You are here" focal card. Runs on the real GATE-MA prerequisite DAG
via `src/constants/concept-graph.ts`'s concept tree (97 concepts, regenerated
at build time — no drift between client and server graphs).

**Checkpoint quiz + XP.** `src/api/quiz-routes.ts` — `GET
/api/practice/xp/summary`, `POST /api/practice/quiz/start`, `POST
/api/practice/quiz/:id/submit`. `src/scoring/xp.ts` defines the constants:
`QUIZ_XP_THRESHOLD_MINUTES=100`, `QUIZ_LENGTH=6`, `QUIZ_POOL_MULTIPLE=2`,
`QUIZ_NO_REPEAT_WINDOW_DAYS=14`, `QUIZ_SECONDS_PER_ITEM=80`; `xpForAttempt()`
mirrors the signed marks ratio actually earned (can be negative under GATE
negative marking). The XP meter is **per-cycle, not lifetime** — it re-arms at
0/100 after each submitted quiz (`xpSinceBaseline()` reads the student's most
recent `quiz_sessions.submitted_at` as the baseline; an in-progress quiz never
moves it). `src/readiness/quiz-pool.ts` assembles the pool from due FSRS
reviews + frontier concepts minus the no-repeat window, and refuses (422) below
either the 2× depth gate or the XP threshold — both enforced server-side, not
just as a frontend display rule. Quizzes grade through the same
`GateDeterministicScorer` and `StudentModel.update()` attempt path as ordinary
practice (Elo + FSRS + FIRe + dedup all apply identically). `frontend/src/components/app/TimerPrimitive.tsx`
now runs **two registers** — exam mode and quiz mode — so expiry auto-submits
whatever was actually answered instead of hitting a stale-closure bug that
submitted everything as skipped.

**FIRe layer.** `src/gbrain/fire.ts` — FIRe-lite ("Fractional Implicit
Repetition", Skycak) implicit-credit propagation over 47 hand-justified
`encompasses:` edges in `data/curriculum/gate-ma.yml` (depth-capped at
`FIRE_MAX_DEPTH=2`). A correct attempt on an advanced concept blends a
discounted credit toward its encompassed concepts' FSRS stability (`CREDIT_DISCOUNT`);
an incorrect one applies a bounded penalty upward (never dropping stability
below `max(0.5, stability × 0.5)`). Pure module, no DB/clock ownership — gated
behind `process.env.VIDHYA_FIRE === 'on'` and applied only from
`src/gbrain/student-model-pg.ts`'s `update()` transaction. `src/readiness/compression-bonus.ts`
adds compression-aware task selection capped below the retain floor, and
`src/readiness/due-cards.ts` provides the real due-card scan (`makeDueReviewSource`)
that quiz-pool and readiness routes both read from.

**Content floor.** 123 newly verified Linear Algebra practice items (126
gradable items total, up from 3 product-wide), 15 hand-authored explainers,
138 new stance-variant files (156 stance pairs total). `enforce_topics:
[linear-algebra]` on `scripts/check-syllabus-floor.ts` makes the floor a
blocking CI gate for this exam pack — every item's answer key was recomputed
by hand via a second method and spot-checked against Wolfram before the gate
went live.

**Mock exams.** Migration `047_mock_exams.sql` gives `mock_exams` a real
migration (it was previously created by runtime SQL inside
`generateMockExam()`, bypassing the schema-column deny-by-default gate).
Grading moved fully server-side and exams are bound to the authenticated
owner via `owner_user_id` — previously any student could read another
session's keyed exam (IDOR). The `questions` column (which holds the full
answer key) is server-only; `GET /api/gbrain/mock-exam/:sessionId` always
strips it before serving, mirroring `GET /api/practice/item/:id`'s leak
discipline. `status` gates idempotent submission — only the first submit call
transitions `in_progress → submitted` and grades; later calls replay the
persisted `analysis`.

**Chat guardrails.** `src/lib/chat-spend.ts` — a durable daily spend cap
(`getDailySpendCapUsd()`, default read from `VIDHYA_CHAT_DAILY_SPEND_CAP_USD`,
default $5) backed by a flat-file store (`VIDHYA_CHAT_SPEND_FILE`, mirrors the
v4.33.0 durable-store pattern) plus a per-session rate limit in
`src/api/chat-routes.ts` (`VIDHYA_CHAT_RATE_LIMIT` / `VIDHYA_CHAT_RATE_LIMIT_WINDOW_SEC`).
Ships ahead of any live provider key being set.

**Shared connection pool.** `src/storage/pool.ts` is now THE shared Postgres
pool (`getSharedPool()`, `SHARED_POOL_MAX=10`) — ~65 modules that each built
their own lazy `pg.Pool` (with drifted `max` values: 3, 5, 5, 10 across
different copies) now build on this one seam. `npm run ci:connection-budget`
(`scripts/check-connection-budget.ts`) fails CI on a new per-call `new
Pool(...)` appearing inside an exported function on the request path. A short
documented exception list (advisory-lock holders, the throwaway health-probe
pool, one-shot CLI scripts) lives in the file header. `docs/ops/render-database-url.md`
is the operator-facing rule: any module on the shared pool that takes an
advisory lock, session variable, or `LISTEN/NOTIFY` requires `DATABASE_URL` to
point at a direct connection or session-mode pooler, never transaction-mode
pooling (Supabase's pooler defaults to transaction mode, which silently
breaks advisory-lock semantics).

**Migrations 044–047** (auto-applied on boot):
- `044_pyq_concept_id.sql` — adds nullable `concept_id` to `pyq_questions`
  (previously only a coarse `topic` column existed, so concept-scoped PYQ
  queries returned nothing for all 26 LA concepts).
- `045_fsrs_skill_and_fire.sql` — adds nullable `skill_id` to `fsrs_cards` so
  FIRe's credit/penalty propagation and the due-card scan can find every
  existing card for a concept without a separate lookup function.
- `046_xp_quiz.sql` — `xp_events` (append-only XP ledger, `UNIQUE (student_id,
  object_id, ts_ms)` idempotency mirroring `attempt_dedup`) and
  `quiz_sessions`.
- `047_mock_exams.sql` — real, reviewed migration for `mock_exams` (see
  above), plus `owner_user_id` for ownership binding.

**Key new files:** `src/readiness/warmup-onboarding.ts`,
`frontend/src/components/knowledge/FrontierSpine.tsx`, `src/api/quiz-routes.ts`,
`src/scoring/xp.ts`, `src/readiness/quiz-pool.ts`, `src/gbrain/fire.ts`,
`src/readiness/compression-bonus.ts`, `src/readiness/due-cards.ts`,
`src/lib/chat-spend.ts`, `src/storage/pool.ts`, `src/api/mock-exam-routes.ts`,
`frontend/src/components/app/TimerPrimitive.tsx`, `docs/ops/render-database-url.md`.

**New env vars:** `VIDHYA_FIRE` (`on` to activate FIRe credit propagation, off
by default), `VIDHYA_CHAT_DAILY_SPEND_CAP_USD` (default 5), `VIDHYA_CHAT_RATE_LIMIT`
+ `VIDHYA_CHAT_RATE_LIMIT_WINDOW_SEC`, `VIDHYA_CHAT_SPEND_FILE` (spend-store
path override).

**Tests:** Backend 2,499 → 3,285 (+786). Frontend 393 → 486 (+93). CI gates
10 → 12 (`ci:template-coverage`, `ci:variant-agreement`).

---

### Complete Walkthrough gate (`ci:la-walkthrough`)

The "any and every concept" guarantee, made mechanical. For every concept with
a given `topic` in `src/constants/concept-graph.ts` (derived, never hardcoded),
`scripts/check-la-walkthrough.ts` checks four demo legs:

- **explanation** — reuses `isRealExplainer` from `check-syllabus-floor.ts`
- **interactive** — a valid ` ```interactive-spec ``` ` block under
  `modules/project-vidhya-content/concepts/<id>/atoms/`, parsed with the
  renderer's own `parseInteractiveSpec`
- **practice** — >=5 items gradable through `FileLearningObjectCatalog` + the
  real `gateItemFromPayload` the server uses. "Gradable" means what the runtime
  means, not what the JSON claims. `also_tests` cross-concept references are
  reported as secondary coverage, never counted toward the floor
- **test** — >=1 PYQ mapped to the concept in
  `frontend/public/data/pyq-bank.json`, reading `concept_ids[]` first,
  `concept_id` as fallback

`--topic=<id>` selects the topic; it defaults to `linear-algebra`, which is
what `npm run ci:la-walkthrough` gates in CI. The flag exists because the gate
is the instrument as well as the gate — filling a new topic to the Linear
Algebra standard needs the same four numbers reported the same way, and a
second hand-written checker would drift from this one the moment either
changed. Blocking by default; `--report-only` prints the same table and
exits 0.

**`exam_tested: false`** (a property on `ConceptNode`) marks the 15 concepts
real papers assume rather than directly test — the chain rule appears inside a
hundred questions and is the subject of none. The test leg passes those
concepts WITHOUT a question, but prints `— (not examined)` rather than `✓`, and
the summary reports the counts separately (`test 13/19 (+6 not examined)`), so
a flagged pass is never folded into the same number as a real one. A concept
with a genuine gap still fails.

**Status as of v4.36.0:** all 10 topics measured, **101 concepts, 0 failing
legs**.

---

### Every topic walkable + three silent failures (v4.36.0)

**Content.** 245 new practice items across eight banks (**260 → 505** items,
16 banks), the last explainer and interactive gaps closed, and every one of the
241 past-exam questions in the shipped bank now carries a concept mapping (was
170). `ode-classification` joins the concept graph in its own right —
classifying order, degree and linearity is a distinct skill from solving.

**Three defects that reported success while failing:**

1. **Migrations `003`, `005`, `006` failed on every boot.** Postgres has no
   `CREATE POLICY IF NOT EXISTS`, and nine policy statements had no guard.
   `auto-migrate` runs each file in a transaction, so one `42710` rolled the
   whole file back — the `_migrations` row was never written, so the next boot
   retried and failed identically. Permanently. Fixed with the repo's own
   `DO $$ … EXCEPTION WHEN duplicate_object THEN NULL; END $$;` idiom, NOT
   `DROP POLICY IF EXISTS` (which would silently replace a policy that had
   drifted on the live database). `src/db/__tests__/migration-policy-idempotency.test.ts`
   fails on any future unguarded `CREATE POLICY`.

2. **`scripts/export-bundles.ts` was deleting most of the PYQ bank.** It
   rebuilt the bank from a topic-file scan whenever it could not reach a
   database; that scan produces 164 of the 241 committed questions. Both
   Dockerfiles run it in the builder stage with no `DATABASE_URL` build ARG, so
   **every shipped image carried the truncated bank**. Now: no database → no
   write (the committed bank IS the DB-less bundle, not a cache of one);
   unreachable → no write; present → a write that would drop any committed
   question id is refused by name via `idsLostAgainstCommitted()`. Identity is
   compared, not counts — a rebuild swapping thirty questions for thirty others
   keeps the total identical while losing all thirty. `--allow-bank-shrink` is
   the deliberate escape.

3. **Seven `gif-scene` blocks never rendered.** Three scene types close them in
   `src/content/concept-orchestrator/gif-generator.ts`: `parametric-curve`
   (`x_expr`/`y_expr`), `level-set` (implicit plots, optional `expression2`),
   and `discrete-bars` (literal `values`, never touches `compileExpression` —
   for distributions and recurrences). Two unplottable blocks were deleted
   rather than faked, keeping their prose. Renders went **66 / 28 skipped / 6
   failed → 70 / 30 / 0**, and `known_broken_scenes` in
   `scripts/gif-scene-baseline.json` is empty for the first time.

**`ci:playbook-convention` is live.** It existed, ran nowhere, and failed on
twelve scripts for anyone running it by hand — the worst of both, since a red
result teaches people the check is broken rather than that the code is. Six
were never bulk operations and are in `src/playbooks/non-bulk-allowlist.json`;
the other six are recorded in `src/playbooks/owed-playbook-baseline.json`
**with the reason each is still open**, because a playbook's estimator quotes
real money to an operator and inventing those numbers would be worse than the
debt. Kept separate from the non-bulk allowlist deliberately: that file asserts
"this is not a bulk operation", and filing `content:generate` there would
assert something false.

**Tests:** backend 3,400 → **3,640** (302 files). **CI gates 14 → 15.**

### Content readiness core plan (PR #129, merged 2026-08-27)

Closes the core plan (P0–P3) of
`docs/designs/2026-08-27-content-readiness-market-research-integration.md`
— see that doc's **IMPLEMENTATION RECORD** appendix for the full commit-SHA
breakdown per phase. Full detail below assumes that doc's vocabulary
(W1/W2/W3 workstreams, E/D amendments).

**Assessment contract + `MarkingStrategy` seam (W1.1/D11/E6/E7/D7).**
`src/exams/marking-constants.ts` is now the ONE marking truth — the five
prior parallel statements (`deterministic-scorer.ts` defaults,
`exam-profile.ts:GATE_EM_MARKING_TABLE`, `exam-catalog.ts:marking_table`,
`samples/gate-mathematics.ts:marking_scheme`, the `exam-profile-schema.md`
prose table) are deleted or re-export from it. `assessment_contracts`
(migration 050) is the versioned, DB-backed override — `(exam, paper,
year)` key, per-question-type `marking_strategy` id + params JSONB,
`official_source_url`, `verified_at`; `src/exams/assessment-contract-loader.ts`
resolves it with a 60s-TTL cache beside `exam-loader.ts`'s pattern. DB-less
or missing-row deploys fall back to the compiled constant and grade
honestly stamped `gate-2026+compiled` — a distinguishable version, never a
silent substitution. `src/scoring/marking-strategy.ts` is the registered
seam (`MarkingStrategy` interface) + `src/scoring/marking-strategy-contract.ts`
(the EXTENDING.md-style contract test every strategy must pass), entered in
`seam-registry.json`; `GateDeterministicScorer` is the `gate_2026` strategy.
`mock_exams`/`quiz_sessions` pin `contract_version` + a params snapshot at
session creation (migration 052) — grading, including idempotent retries,
reads the pinned snapshot, never resolve-at-submit.

**`attempt_facts` ledger (E1, migration 051).** The durable per-attempt row
the repo never had: `attempt_dedup` is prunable, `xp_events` skips skipped
attempts and stores no correctness/kind, mock analysis was one aggregate
blob. `src/gbrain/attempt-facts.ts` — `writeAttemptFactIn()` inside
`PgStudentModel.update()`'s open transaction via a SAVEPOINT (a telemetry
failure can never take the graded attempt down with it); `recordAttemptFacts()`
fire-and-forget on the shared pool for grading paths that never reach
`StudentModel.update()` (every mock-exam question, skipped quiz items).
Columns: student/object/ts, `question_kind`, `marks_earned`/`marks_max`,
`skipped`, `contract_version`, `latency_bucket` (4 labels, never raw ms),
`skill_id`. DB-less returns 0, never throws.

**Anti-gaming promote guards (W1.6).** Pure functions over `attempt_facts`
cohort/experiment aggregates only (never per-student): promotion routes to
operator review when immediate lift pairs with flat delayed retention, MCQ
accuracy rises while NAT falls, or time-on-task drops while errors rise.

**`ErrorTag` 13-tag union + failure-tagged distractors (W3.4/E4/E2/D9).**
`src/core/interfaces.ts`'s `ErrorTag` grows from 6 to 13
(`method_selection`, `representation`, `mode_msq`, `mode_nat_entry`,
`time_pressure`, `risk_decision`, `prerequisite` added) — lockstep across
migration `053_attempt_error_tags_extend.sql` (guarded CHECK swap, the
v4.36 CREATE-POLICY idiom), the `ERROR_TAGS` mirror + tripwire test in
`scripts/check-intent-catalogue.ts`, and `src/readiness/mock-to-marks.ts`'s
`KNEW_IT_TAGS` (mode_msq/mode_nat_entry/time_pressure/risk_decision = knew
it — exam-craft, not a knowledge gap; method_selection/prerequisite/
representation = didn't) with a union-completeness test. `rendering/lesson-
enrichment.ts`'s unrelated error-type union is declared OUT of this
lockstep, cross-referenced at both sites. Distractor tags: `src/gbrain/
marking-derivation.ts`'s `deriveMarking()` maps each mcq distractor to its
failure hypothesis, stored in `generated_problems.distractor_failure_tags`
(migration 054, nullable JSONB) — **server-only**, never selected into
`GET /api/practice/item/:id`'s render-safe view (leak test extended), tags
keyed against canonical POST-shuffle indices.

**Mock counterfactual + attempt/skip drill (W3.2, the most student-visible
item in the plan).** `src/readiness/attempt-counterfactual.ts` — a NEW pure
function computing leftOnTable per skipped/attempted question from the
per-question mock decomposition (`mock_exams.analysis` now carries `{id,
kind, marks, earned, skipped}` per question) + the contract's break-even p;
legacy rows without the decomposition degrade to headline-only (tested).
`frontend/src/components/app/AttemptCounterfactual.tsx` renders the locked
four-beat copy contract (earned → knewIt → recoverable-through-decisions →
one CTA), `COUNTERFACTUAL_ITEM_CAP = 3` with the rest collapsed, no receipt
border, student register only ("−⅔ of a mark", never raw EV). `src/api/
attempt-skip-drill-routes.ts` + `frontend/src/pages/app/AttemptSkipDrillPage.tsx`
at `/attempt-skip-drill` — 5-item drill, equal-weight 44px Attempt/Skip
buttons, green confirms a correct skip; <5 eligible marked items → honest
422 (quiz-pool pattern).

**Branching `guided_walkthrough` (W2.5/D1/D2/D3).** No new `InteractiveKind`
— `guided_walkthrough` grows an optional additive `branches` field (`v: 1`,
D3's pinned literal: `nodes[]` with `question`/`options[]{label,next}`,
`leaves[]` with `method`/`reason`/`best`), rendered by
`frontend/src/components/lesson/interactives/GuidedWalkthrough.tsx` as a
sequential wizard (one question card, full-width 44px choices, breadcrumb)
— never a tree diagram. Graded at the leaf only; a wrong branch is walkable
to its dead end before the reveal (E5: self-check only, feeds NOTHING into
`StudentModel` — client-visible specs cannot grade without reopening the
mock T22 client-trusted-grading hole). D2's first deliverable: the two
already-shipped hardcoded wizards — `frontend/src/pages/app/TheoremWizardPage.tsx`
and `DistributionSelectorPage.tsx` — migrated onto this data format. First
lesson-embedded tree: Green's/Stokes'/Gauss's theorem selection.

**Template families + anchors (W2.1/W2.2/E11/E12).**
`data/curriculum/gate-em/template-families.yml` — 14 families as data,
validated by new B6/B7 checks in `check-intent-catalogue.ts`
(`loadTemplateFamilies()`), codegen'd by `generate-intent-tables.ts` into
one merged sequence table with explicit precedence (family sequence
overrides the intent default where both exist — no second codegen truth).
Anchor ids: `hash(concept_id, stage_id, ordinal, template_version)` (the
`customIdFor` precedent) stamped on stage instances in the blueprint→unit
translation — additive metadata, `BlueprintDecisionsV1` untouched; the
attachment point every future anchored delta (W2.3, gated on stance-variant
n≥30) will use.

**Media QA (W3.6/E9).** `gifenc` cannot decode, so QA hooks pre-encoding
RGBA frames inside `renderScene` + draw-time bounding-box overlap checks
(deterministic) plus cheap raster heuristics — integrates with the existing
`check-gif-scenes` + `gif-scene-baseline.json`, not a parallel checker. The
70 committed scenes re-render clean; `qa_grandfathered` baseline is empty.

**Evidence labels (W1.2/E10/D10).** `evidence_level` (`official /
directly_reviewed / pattern_supported / design_hypothesis`) is now a
REQUIRED structured field on exam-relevance claims, checked at generation
time in the W1.3 gate path (runtime copy CI never sees); the phrase grep
for "high-yield"/"frequently asked" stays best-effort defense over
committed content only. `evidence_level` is the structured provenance
field, `verification_method` stays free-text detail beneath it — stated at
both definitions so they never read as rivals (D10). D/P/S codes imported
for all 116 topics into `data/curriculum/gate-em/historical-evidence.yml`.

**Gate ledger + review queue (W1.3/E8/D4).** `content_gate_ledger`
(migration 055) — five named, CLOSED-set gates per generated item: `scope`,
`mathematics` (**operator-decided, never auto-passed** — `src/generation/
gate-ledger.ts`'s `recordGates()` throws rather than write a decided
verdict on it), `assessment_contract`, `misconception_coverage`,
`provenance`. Scoped to items carrying `generation_run_id` provenance ONLY
(E8) — the 505 committed items stay covered by the existing floor gates +
hand-verification, and the DB-less demo stays lit. Fail-closed at two
seams: serving (`filterByGateLedger` in `learning-object-catalog-pg.ts`)
and promotion (`applyPromotion` in `learnings-ledger-repo.ts`) — no ledger
row, an unreachable table, or a failed query all read as "not passed."
`/admin/review-queue` (`src/api/admin-review-queue-routes.ts` +
`frontend/src/components/admin/ReviewQueuePanel.tsx`) is the D4 approval
tool built BEFORE any pilot ran, on the `BulkApprovePanel` pattern
(run → list → checkbox → bulk approve, `j`/`k`/space/enter keyboard nav);
its throughput meter (items decided, elapsed, min/item, clock anchored at
first decision) is the pilot's measuring instrument.

**Pilot launch path (W3.5, mechanism only — no live run in this repo's
environments; see E16).** `POST /api/admin/runs`'s
`config.target.practice_item_specs[]` now actually dispatches:
`src/generation/practice-item-factory/spec-to-atom.ts` converts each spec
to an `AtomSpec`; `src/generation/run-dispatcher.ts`'s practice-item mode
calls the shared batch orchestrator's `prepareBatchRun()` (same instance
the poller uses, same T4a launch guard); the rest of the lifecycle
(submit→poll→download→process→gate-ledger write→bank write) is the
existing async batch-poller lane. `src/generation/practice-item-factory/
cost.ts` is the single mode-mix-aware cost estimator shared by dry-run and
the prepare-time budget check. `docs/ops/content-verification-runbook.md`
is the operator's procedure for the 50-item anatomy pilot + wave 1;
§6 ("Measured results") is committed empty by design — filled in by
whoever runs the pilot, in the same commit as its output.

**Intent lanes ON (P0).** `VIDHYA_INTENT_LANES=on` lands in committed
`render.yaml` (auditable, survives service recreation; rollback = one
env-var flip); `ci:demo-rails` gained a lanes-on assertion so "shipped but
dark" (the failure mode that opened this whole plan) cannot recur silently.
DPS tone pass: LA `pain_point` copy across ~26 concept pages reordered so
exam-intent leads the sentence, loss language demoted.

**`npm run ci` aggregate + drift check (D12).** One aggregate the CI
workflow actually invokes (local ↔ CI cannot drift): `lint:fork-test` then
15 `ci:<noun>` gates in sequence, `ci:aggregate-drift` separately verifying
the aggregate's script list matches what `ci.yml` runs. Migrations
050–055 auto-apply on boot per `src/db/auto-migrate.ts`, same as always.

**Writer overwrite guard (D5).** `practice-item-factory/writer.ts` refuses
by id to overwrite any item with a set `verification_method` — refusal
names the id and the method; `--supersede` is the explicit escape. Protects
the 123 hand-verified LA items (and everything verified since) from a
re-run before any wave ever launches.

**No new env vars beyond `VIDHYA_INTENT_LANES=on` in `render.yaml`.**

**What waited on the operator for the flag itself is done:** PR #129 merged
2026-08-27 and `VIDHYA_INTENT_LANES=on` has been live on the production
Render service since that deploy (confirmed via Render's own deploy
history). Still open (see the plan doc's IMPLEMENTATION RECORD appendix for
the full list): a provider key to run the 50-item pilot and start the
6-week/300-item kill clock; the W-A activation-push follow-up PR; and the
open P2c call on whether `intent-profiles.yml`'s proposed error-tag strings
ever become real `ErrorTag` members. This section's own work went
undocumented in CHANGELOG.md/VERSION for two days after merging — backfilled
as `4.37.0` once the gap was caught (see CHANGELOG.md).

### Wolfram as the T3 standard: Move B — SymPy tier + verifier contract infra (PR #130, merged 2026-08-28, v4.38.0)

Closes Move B of `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`.
Like PR #129, this shipped without a CHANGELOG entry or version bump —
backfilled as `4.38.0` in the same pass that caught PR #129's gap.

**The `AnswerVerifier` contract was vaporware.** `EXTENDING.md`'s Tier 4+
tutorial and `registerVerifier()`'s own docstring had been describing
`runAnswerVerifierContract` and a reference `AlwaysTrueVerifier` that
didn't exist, and Tier 4+ verifiers registered via `registerVerifier()`
were populate-only — nothing ever called `.verify()` on them. Both are
real now: `verify()` runs the built-in cascade (renamed `verifyCore`),
then executes every registered extra verifier and folds results into
`checks` as advisory evidence, without letting one override the cascade's
own `tierUsed`/`status`/`confidence`. `EXTENDING.md`'s broken `@/` import
alias and stale file-tree references (a cited `llm-consensus.ts` that
never existed, `wolfram.ts` wrongly held up as an `AnswerVerifier`
template when it implements a separate internal interface) are fixed too.

**A new Tier 2.5 SymPy stage** (`src/verification/verifiers/sympy.ts`)
sits between the LLM dual-solve and the metered Wolfram call — a
hardcoded constructor slot, not a `registerVerifier()` extension (those
are reserved for tier ≥ 4, after Wolfram, per the locked tier-ordering
decision). Runs after an LLM disagreement; short-circuits Tier 3 on a
decisive verdict, falls through to Wolfram on a refusal. Shells out to
`python3 -c` with sympy for equality/solve checks; refuses (never guesses)
on unparseable input, subprocess timeout, or a missing sympy/python3.
`tierUsed` gains `'tier25_sympy'` as an additive value — every consumer of
the closed union was grepped and checked, including `VerifyPage.tsx`'s
display formatter. **Authoring/CI only by design**, locked in a header
comment on `sympy.ts`: a test greps `src/api/**` and confirms
`src/server.ts` (the one production orchestrator call site) never
imports it — the Tier 2.5 slot stays `null` in production, since neither
Dockerfile has `python3`.

**Provenance enforcement (B2).** `check-practice-items.ts` gains
`checkProvenanceVerificationMethod()`, scoped only to items carrying a
`generation_run_id` (the 505 hand-verified committed items have no run to
point to and are untouched). Such an item's `verification_method` must be
either a grandfathered bare value (`dual_model_consensus`,
`wolfram_verified`) or match the `+sympy`/`+wolfram` suffix convention
with `verified_at` set.

**`verify-sweep` doc rewritten against reality (B3).** The old doc
described a CLI, a `verification_audit_log` table, and a
`quarantine_problems` table that were never built. Rewritten against the
real machinery — `src/jobs/wolfram-verify-job.ts`, invoked via
`npm run content:verify` — covering the atomic per-problem checkpoint, the
three-way verified/failed/inconclusive outcome, and the real env caps
(`WOLFRAM_RATE_MS=1200`, `WOLFRAM_MAX_CALLS_PER_RUN=200`,
`WOLFRAM_STEPS_MAX_PER_RUN=50`). A drift test fails if the doc's claims
about job name or rate caps diverge from the source that enforces them.

**B4** confirmed (not open work — a QA check) that `ReviewQueuePanel`
already renders gate evidence naming `wolfram_verified` visibly once a row
is expanded; added a test locking that in.

**Deliberately not activated by this PR:** `WOLFRAM_APP_ID` stayed unset —
Move A's licensing gate (§0 of `docs/ops/content-verification-runbook.md`)
shipped unfilled on purpose, per the plan's premise that nothing
license-bearing activates before the terms are read. Cleared the next day;
see the `v4.39.0` section below.

### GATE Linear Algebra: mnemonic/exam_pattern/interleaved_drill for all 26 concepts, and Wolfram Tier 3 licensing cleared (v4.39.0)

Closes a real content-type gap: three of the platform's eleven `AtomType`
categories — `mnemonic`, `exam_pattern`, `interleaved_drill` — had zero seed
content anywhere in the content base, on any topic, until this release. All
26 GATE Linear Algebra concepts now carry all three, on top of the 11 atoms
each concept already had (hooks, intuition, worked examples with
confident/anxious stance variants, formal definitions, common traps, a
micro-exercise, a retrieval prompt, a visual analogy) — the first content
pass that reads as a genuine course, not just practice drills. `mnemonic`
atoms are memory aids; `exam_pattern` atoms are GATE exam-craft notes (NAT
vs MCQ patterns, time budgets, the traps GATE actually sets);
`interleaved_drill` atoms pair each concept with a mathematically natural
partner for cross-concept retrieval (`determinants` ↔ `matrix-inverse`,
`svd` ↔ `spectral-theorem`, 26 pairings total, all under
`modules/project-vidhya-content/concepts/<id>/atoms/`). Every numeric claim
in the new content was verified live against Wolfram|Alpha, not
hand-computed.

**Four pre-existing content bugs found and fixed along the way**, surfaced
incidentally while the authoring agents read each concept's existing atoms
for grounding — unrelated to the new atom types themselves:
- `matrix-operations/atoms/micro-exercise.md` — answer key said C (4) for a
  question whose correct answer is A (1); also stripped visible internal
  self-correction text ("Wait, let me recalculate...") that had shipped to
  students.
- `matrix-norms/atoms/worked-example.md` — eigenvalues of AᵀA stated as
  ~18.3/~2.7; correct values (Wolfram-verified) are ~17.30/~3.70, which
  cascaded into wrong σ₁ and κ₂ in both the prose and the embedded
  `interactive-spec`. The fix was then propagated to the
  `worked-example-assured.md` / `worked-example-shaken.md` stance variants,
  which `ci:variant-agreement` had caught as now disagreeing with the
  corrected base.
- `positive-definite-matrices/atoms/micro-exercise.md` — discriminant
  arithmetic error (`25-24=1` instead of `25-4·5=5`) gave eigenvalues that
  failed the trace/det sanity check; corrected to `(5±√5)/2`.
- `spectral-theorem/atoms/micro-exercise.md` — a "which statement is false"
  question had all five options true (independently confirmed, not just
  taking the shipped reasoning's word for it); option E replaced with a
  genuinely false statement (unnormalized eigenvectors) so the question has
  a real answer.

**Coverage measured, not asserted.** `loadConceptAtoms()` verified for all
26 concepts: each resolves to 11 folded base atoms with `mnemonic` /
`exam_pattern` / `interleaved_drill` present, zero parse errors.
`npm run ci:la-walkthrough`: still 26/26 concepts pass all 4 legs.
`frontend/src/components/lesson/MarkdownAtomRenderer.regression.test.tsx`
widened from a 3-concept sample (derivatives-basic, complex-numbers,
eigenvalues — meaning only eigenvalues' own 3 new atom files were ever
mounted through a real `render()` call) to a named `LINEAR_ALGEBRA_CONCEPTS`
array covering all 26 LA concepts. Pinned base-atom count recomputed from
disk, not guessed: 26×11 + derivatives-basic(9) + complex-numbers(8) = 303
base atoms, 442 files counting stance variants. The 75 previously-untested
new atom files are now proven to render without throwing, not just
structurally valid.

**Wolfram Tier 3 licensing gate cleared.** §0 of
`docs/ops/content-verification-runbook.md` (shipped unfilled by PR #130) is
now filled with the operator's own attestation (mathconcepts1@gmail.com,
2026-08-29, recorded in-doc since the licensing pages themselves stay
proxy-blocked from agent sessions): the pilot qualifies for the Wolfram|Alpha
API free tier's non-commercial clause (2,000 calls/mo cap), and the Wolfram
MCP connector — confirmed live and authenticated this session, a real query
returned eigenvalues of `[[2,1],[1,2]]` = 3, 1 — carries no separate LLM Kit
subscription charge. `WOLFRAM_APP_ID` is now set on the production
`vidhya-demo` Render service. Rows 3–4 of §0 (Wolfram Engine
production-license terms, Show Steps redistribution terms) stay
`_(unfilled)_` on purpose — they gate the still-parked "batch Engine
generation" and "Show Steps" TODOs, not Tier 3 activation.

**Also this release:** fixed a stale `VERSION` file — stuck at `4.35.0`
since before the explicit `4.36.0` release, silently drifted from
`package.json`. Synced up, not down. Landed as `4.39.0` (not `4.37.0`) once
PR #129 and PR #130's own undocumented work was backfilled into CHANGELOG.md
as `4.37.0`/`4.38.0` ahead of it — see those entries.

**Tests:** `frontend/src/components/lesson/MarkdownAtomRenderer.regression.test.tsx`
now exercises 442 atom files across 28 concepts (up from 3). No backend test
count change in this release.

### Live-QA rendering fixes + the content-generation spec gets a repo home

Four rendering bugs found by live mobile QA on the eigenvalues lesson, plus
a first landing for the founder's per-subtopic content-generation
specification (previously an ad-hoc upload with no durable home).

**Bug fixes:**

1. **Hook/animation out of sync.** `SimulationSpec` (`frontend/src/components/lesson/interactives/types.ts`)
   gains optional `narration_steps: {at_progress, text}[]` — text beats keyed
   to playback progress. `Simulation.tsx` shows the last step whose
   `at_progress <= progress`, fading between them (`activeNarrationStep()`,
   exported for testing). Falls back to the old static `caption` when a spec
   has none. `eigenvalues/atoms/hook.md` now authors 4 narration steps
   instead of one static caption.
2. **`visual_analogy` rendering with no visual.** Root cause: the demo boots
   seed-then-serve fire-and-forget (`demo:seed-media` renders ~70 GIFs in a
   background subshell while the HTTP server already accepts traffic — see
   `demo/Dockerfile`'s CMD comment for why that ordering is deliberate), so a
   freshly-woken instance can serve a `visual_analogy` atom before its GIF
   file exists on disk. `MediaSidecar` (`AtomCardRenderer.tsx`) now detects
   an authored `gif-scene` block with no `gif_url` yet and shows "Animation
   still generating — check back in a moment" instead of silently rendering
   nothing.
3. **`guided_walkthrough` showing raw LaTeX source.** `GuidedWalkthrough.tsx`
   and `DecisionTreeWalkthrough.tsx` interpolated `prompt`/`hint`/`answer`/
   `question`/`method`/`reason` as plain strings, never entering the KaTeX
   pipeline `MarkdownAtomRenderer.tsx` already provides for atom bodies. Both
   now route through `MarkdownAtomRenderer`, which gained an optional
   `className` prop (`.vidhya-atom-body` sets `color` explicitly, so a
   parent's inline style can't retint it — new `--hint`/`--hint-neutral`
   modifier classes in `globals.css` do instead).
4. **Practice pool feeling repetitive ("only saw 10/15 questions").** Two
   compounding causes in `frontend/src/lib/content/resolver.ts`'s `tier0`:
   a hard `Math.min(matches.length, 3)` sampling cap made every match ranked
   4th-or-lower permanently unreachable (now samples the full pool); and
   `content-bundle.json` never included the 505-item hand-verified
   `data/practice-items/*.json` bank at all, only the smaller PYQ set (7
   items for eigenvalues). `src/content/build-content-bundle.ts` now folds
   that bank in via `collectPracticeItems()` — **deliberately without**
   `correct_answer`/`options`/`answer_index`/`solution_steps`, since
   `content-bundle.json` ships to every browser as a public static file and
   these items are meant to be graded server-side via the existing
   `GET /api/practice/item/:id` → `/attempt/:id` hand-off
   (`getLearningObjectCatalog()`'s file catalog already serves them; only the
   client never knew the ids existed). Eigenvalues went from 7 reachable
   items to 22. Regenerating the bundle lost zero previously-committed
   problems (verified: all 251 old ids present in the new 756).

**Content-generation spec gets a repo home.** `docs/content-spec/` now holds
the founder's 116-topic GATE Engineering Mathematics content-generation
specification, committed verbatim (was previously only ever shared as a
chat upload, with no durable place to live): two structure-map CSVs
(recommended hooks / base sequence / delta slots / attention-design
hypothesis per topic, and the deeper pipeline spec — prerequisites, quality
gates, generated artifacts, monitoring metrics), the "Integrated
Self-Improving Learning System v2.0" design doc, its research-notes
citations, and the target relational schema for the eventual base+delta
content system (`content-generation-schema.sql` — not applied; a future
design, not a migration).

`src/content/atomic-topic-spec.ts` is a real, tested (not just filed-away)
consumer: a memoized loader parsing both CSVs into `AtomicTopicSpec`,
keyed by `atomic_id` (e.g. `LA-06`). `GET /api/admin/content-spec/atomic-topics`
(+ `/:atomicId`, `requireRole('admin')`) exposes it so an operator planning a
run can pull up a topic's recommended hooks/sequence before launching
generation.

**The `atomic_id` ↔ `concept_id` crosswalk is now real** (follow-up, same
day, per explicit direction that the two id spaces are meant to be the
same): `src/content/atomic-concept-map.ts` hand-verifies each of the 116
`atomic_id`s against the real concept-graph `label` + `description` it
corresponds to — never string-distance guessing. 100 of 116 resolve; the
other 16 are recorded with a real reason in `UNMAPPED_ATOMIC_IDS` (a
genuine coverage gap, or a cross-cutting skill that isn't one concept —
e.g. VC-11 "theorem selection across Green/Stokes/Gauss" is the
already-shipped branching walkthrough). The two id spaces are confirmed
NOT identical: the concept graph is richer for Linear Algebra (15 concepts
— SVD, spectral theorem, Jordan form, and more — have no atomic_id,
added by the v4.34.0 "all 26 concepts" pass beyond the base spec's 11
foundational LA topics), and several concepts fold multiple atomic topics
into one (all 8 PDE subtopics teach as the single `pde-basics` concept).
`GET /api/admin/content-spec/atomic-topics[/:atomicId]` now returns each
topic's `concept_id` (null + reason when unmapped); `GET /api/admin/content-spec/mapping`
gives the coverage report. The founder page (`/admin/founder`) surfaces it
directly. Still future work, not attempted here: wiring this *into*
`src/blueprints/template-engine.ts` (today's `CONCEPT_TEMPLATE_FAMILY`,
codegen'd from `data/curriculum/gate-em/template-families.yml`, already
covers all 101 concept-graph concepts on its own, separately-verified
path) so generation itself consults the spec's hooks/sequence — the
mapping now exists to make that safe, but the wiring itself is a distinct
follow-up.

### Stance-adaptive content course-wide + personalisation activated (v4.43.0)

Stance variants existed for Linear Algebra's 26 concepts and nowhere else.
They now cover **all 101 concepts — 606 base/variant pairs**, one `shaken` and
one `assured` body for every `hook`, `intuition` and `worked_example` atom
that exists.

**Where the two axes differ.** `shaken` leads with concrete numbers before
symbols, takes the smallest true first step, does the arithmetic in full, and
makes the check explicit — no praise, no reassurance, no mention of how the
reader might be feeling. `assured` assumes the mechanics and spends its budget
on the distinction that costs marks: where two neighbouring ideas are not
interchangeable, where a condition is necessary and nowhere near sufficient,
and a counterexample rather than a restatement.

**What the gates enforce.** `ci:variant-agreement` (`src/content/variant-agreement.ts`)
holds each variant to its base: shaken prose words ≤ base, assured ≤ the
per-atom-type budget (hook 130 / intuition 200 / worked_example 220 via
`countProseWords` in `src/content/prose-budget.ts`), fenced blocks
byte-identical, no emoji, no h1, headings ≤ base + 1, and a 4-gram appearing in
more than 20% of a topic's CONCEPTS (`repeatedPhrases` keys by concept, not by
file). That last rule earns its keep — it caught calculus hooks converging on a
single mould across five concepts.

**Two id fields that must diverge.** A variant's `id` has to satisfy
`scripts/check-content-integrity.ts:207` (strip a leading `<concept>.` prefix,
map dots to hyphens, compare to the filename stem) while `variant_of` has to
match the base atom's *literal* `id` — and a number of base atoms carry legacy
dash-only ids like `laplace-transform-intuition`. Tidying `variant_of` to the
dotted form silently detaches the variant: `foldStanceVariants`
(`src/content/stance-variants.ts:95`) warns and drops it, and no gate fails.

**Coverage is all-or-nothing per concept, across every narrative atom.**
`computeStanceFigures` (`src/api/admin-content-maturity-routes.ts:415`) counts a
concept covered only when EVERY narrative atom it has carries both stances —
not just the three canonically-named files. `derivatives-basic` and
`z-transform` each carry a second `worked_example`, so a filename-based count
reported 101/101 while the real figure was 99. Measure this through
`loadConceptAtoms`, never by globbing filenames.

**Rollout opt-in is a top-level `stances:` key** in
`modules/project-vidhya-content/templates/<topic>.yaml`, read by
`loadTopicsWithStancesBlock`. All ten topics with concepts in the graph now
carry it. `algorithms.yaml` deliberately does not — it has no concepts, so
opting it in would assert something about nothing. The per-atom-type `stances:`
guidance blocks lower in each template are authoring instruction and cannot
double as the signal (every template has them, so they would opt every topic in
at once and collapse the rollout figure into the course-wide one).

**Personalisation activation** is `scripts/activate-personalised-selector.ts`
(idempotent, `--deactivate`, `--dry-run`) creating the single `experiments` row
`personalized_selector_v1_gate_ma` that `src/personalization/lesson-wire.ts`
reads. A script and not a migration, per §5.2 — a migration enrols every
environment the schema touches.

**`scripts/seed-demo-personalisation.ts` is demo fixtures, not generator
output.** It seeds 9 `thinking_gap_cache` rows across 9 framing cohorts and 2
`student_atom_overrides` under the `0aded0a0-` persona prefix. The text is
hand-authored, so those rows demonstrate the shape of the feature and NOT the
quality of what the generator writes. The content-maturity report cannot see
that distinction — it counts rows.

Whether the generator can run is a separate question with a checkable answer.
`src/sessions/thinking-gap-service.ts:175` calls `getLlmForRole('chat')`, and
`personalized-regen.ts` reaches a provider through `generateConcept`.
`loadConfigFromEnv` (`src/llm/config-resolver.ts`) resolves the first of
`VIDHYA_LLM_PRIMARY_PROVIDER`+`_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`,
`OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`,
`MISTRAL_API_KEY`. The server's boot banner is emitted from that same
`getLlmForRole('chat')` call (`src/server.ts:1201`), so
`[server] Verification tiers: RAG + LLM (<provider>/<model>) + Wolfram` in the
logs IS the proof that the personalisation generators have a provider — and a
banner reading `RAG + Wolfram` with no LLM segment is the proof they do not.
Read the banner rather than assuming either way.

**The atom-render regression covers the whole corpus now.**
`frontend/src/components/lesson/MarkdownAtomRenderer.regression.test.tsx`
derives its concept list from disk rather than hardcoding it; the old hardcoded
28 meant ~73 concepts were never mounted through React by any test. 1489
assertions, base-atom count pinned at 880.

### Resonance beats (v4.44.0)

Fuses a hook/intuition atom's prose, its motion, and its one moment-of-need
mistake into a single scripted experience instead of three siloed cards.
Plan: `docs/designs/2026-08-30-resonance-fused-atoms-plan.md`.

**Schema — additive on `SimulationSpec` (`v: 1` unchanged).**
`frontend/src/components/lesson/interactives/types.ts`'s `narration_steps[]`
gains, per beat: `text_shaken` / `text_assured` (per-stance overrides, base
`text` is the fallback), `emphasize` (heavier stroke on that beat's trace
arc while active, reverts after), and `trap: { text, avoid }` (makes that
beat THE trap beat — schema-enforced at most one per scene). An optional
top-level `ghost: { x_expr, y_expr }` draws the mistaken path dashed grey
once the trap beat is reached. Beats are capped at 8; `parseInteractiveSpec`
validates all of it — the same real parser every consumer uses, never a
second copy of the rules (see below).

**Design contract highlights** (full 13-item contract in the plan's §W1):
a scene carrying beats **autoplays once on mount** (reduced motion never
autoplays — static final-frame + full text storyboard instead); the beat
caption is full **17px body text**, not metadata size; a thin **segmented
beat bar** (not a second dot row) renders in ink (`#1d1d1f`) and
`--separator` hairline only — no accent color, since progress here is
neither mastery (green) nor AI/tutor (indigo); the trap row ("Where marks
are lost") is hairline-ruled plain text, no icon, and **persists on screen
for the rest of playback** once reached rather than blinking past; and
**at most one trap beat per scene**, third-person register only ("students
read the 2 as…", never "you might…").

**Delivery.** `AtomCardRenderer.tsx`: when a hook/intuition atom's body
parses as a `simulation` spec, it renders as the card's actual figure (the
`.vidhya-atom-stage` slot GIFs already use) instead of below the prose as a
separate sidecar — one hoisted parse feeds the entry-preset choice, the
figure slot, and sidecar suppression. A `retrieval_prompt` atom mid-answer
disclosure is exempt (a promoted scene there would leak the answer early).

**Generation (batch/operator runs only).** `src/content/resonance-strategy.ts`
joins the founder's 116-topic content-generation spec
(`atomic-topic-spec.ts`) to `concept_id` via `atomic-concept-map.ts`
(100/116 resolve); a concept mapped from more than one atomic id — e.g.
`eigenvalues` ← `LA-06`+`LA-07` — merges hooks by concatenation + dedup,
takes `base_sequence`/`attention_design_hypothesis` from the lowest atomic
id. `orchestrator.ts`'s `buildPrompt()` adds a fifth block instructing
hook/intuition generation to emit one fused scene (beats + exactly one trap
woven from the concept's own pain-point registry) instead of the retired
"keep to a single learning beat" line. Every generated fence is
re-validated post-generation through the SAME renderer parser — one
regeneration attempt on an invalid shape, then the fence is stripped and
the prose kept, never served broken or silently empty.

**Personalization safety exclusion — deliberate, two layers.** The
per-student regeneration path (`personalized-regen.ts` → `generateConcept`)
never receives the beat-scripting prompt block in the first place (layer 1:
`buildPrompt` reads `generation_context`); and *any* `simulation`-kind fence
that reaches `generateOne` on that path is stripped unconditionally before
the write into `student_atom_overrides` (layer 2, defense-in-depth — schema
validation can't catch well-formed but wrong mathematics). That path has no
CI gate, no Wolfram check, and no human pedagogy review before a struggling
student sees it, so an unreviewed scene must never reach it.

**Shared parser loader.** `src/content/interactive-spec-loader.ts` is the
ONE guarded dynamic-import of the frontend's real `parseInteractiveSpec`
(`orchestrator.ts`'s fence policy and `admin-content-maturity-routes.ts`'s
resonance coverage figures both call it — never a duplicate validator).
Dynamic because this package's `rootDir: "./src"` forbids a static import
into `frontend/src`; guarded because the demo image ships `frontend/dist`
without `frontend/src`, so it degrades to `null` there — every dev/test/CI
environment gets the real validator.

**Admin resonance coverage.** `GET /api/admin/content-maturity` reports,
per concept-graph topic (via `loadConceptAtoms` + the shared parser, same
family as `computeStanceFigures`): how many hook atoms carry a beats
scene, how many of those carry the trap beat, how many carry per-stance
beat text. `null` (not zero) when the validator can't be loaded in this
process. Additive on `MaturityReport` — a new `resonance` field plus a
`resonance_coverage` signal; no existing field reshaped.

**Coverage: 24 of 26 GATE Linear Algebra concepts, plus 2 non-LA proof
scenes** (`limits`, `derivatives-basic`) — 26 fused scenes × 3 stance files
each. Two honest pass-overs, named rather than faked: `vector-spaces` (the
idea's generality can't be captured by one 2D trace) and `lu-factorization`
(a procedural algorithm — no honest geometry to animate).

**Measurement.** `scripts/activate-resonance-experiment.ts` (idempotent,
`--dry-run`, `--deactivate`, same pattern as
`activate-personalised-selector.ts`) creates the `resonance_hooks_v1_gate_ma`
experiments row so the existing lift ledger can evaluate resonance hooks
once real session volume exists — no auto-promotion behavior change.

**Known-unrun:** no provider key is configured in this environment, so a
live generation run of a resonance-carrying hook has not been exercised
end-to-end — coverage on the generation side is unit-level (prompt assembly
+ fence validation against fixtures). The first live batch is the
operator's smoke test, same as the v4.33.0 precedent.

### Seven live-QA fixes on the lesson page + a scrub slider (v4.45.0)

Same discipline as the v4.36.0/v4.43.0 live-QA passes: root-caused against
the real rendering pipeline, not patched at the symptom.

- **`stripAllInteractiveSpecFences()`** (`frontend/src/components/lesson/interactives/types.ts`)
  replaces the single-fence strip `WorkedExampleCard`/`DefaultAtomCard`
  relied on. `parseInteractiveSpec`'s own `body_without_spec` only ever
  stripped the FIRST `` ```interactive-spec``` `` fence (and nothing on a
  parse failure) — a second or malformed fence in the same atom body fell
  through to `MarkdownAtomRenderer` as literal JSON. Caught live on
  `eigenvalues.intuition.shaken`, which had authored two fences by mistake
  (content fixed too, `modules/project-vidhya-content/concepts/eigenvalues/atoms/intuition-shaken.md`).
- **CSS-only row/paragraph stagger.** The existing
  `.vidhya-atom-body--structured li` entrance (exam-pattern/common-traps
  rows) gains a sibling `.vidhya-atom-body--progressive > p` for
  `visual_analogy` and `mnemonic` caption prose (`AtomCardRenderer.tsx`,
  `globals.css`). Entry-once, `--ease-standard`/`--dur-base` tokens,
  collapses under `prefers-reduced-motion` — same discipline as every other
  motion in the system. `formal_definition` deliberately opts out (see the
  new design doc below — pacing a definition fights its own job).
- **`ProblemStatementBlock`'s framing line is now a real CTA.** "Most
  students come here to practise real questions" used to be inert text; an
  optional `onSeeWhatsNext` prop turns it into a 44px button that scrolls to
  the concept's WalkthroughRail — no duplicate live-availability fetch, the
  block stays fetch-free for first paint.
- **Error-streak auto-modality-switch now actually switches.** The nav
  footer has said "· streak switched modality" since before this release;
  nothing ever flipped `showVisually`. `AtomCardRenderer.tsx` now pulls the
  concept's visual-modality atoms to the front after 3 consecutive misses
  (`ERROR_STREAK_MODALITY_SWITCH_THRESHOLD` — the one literal both the
  effect and the footer label read, so they can't drift independently
  again), gated so a manual toggle-off sticks (`autoSwitchedRef`, resets
  only when the streak itself breaks) and is a true no-op — footer label
  hidden too — when the concept has no visual atom to switch to.
- **Manual scrub slider on every `Simulation` scene** (`ScrubSlider` in
  `interactives/Simulation.tsx`) — a native `<input type="range">`,
  `step=0.02` (fine enough for pointer drag, ~50 keyboard presses end to
  end), ink-accented (scrubbing is neither a mastery nor an AI/tutor
  signal), pauses autoplay on grab. Renders for both beat and non-beat
  scenes; hidden under `prefers-reduced-motion` (nothing to scrub once the
  scene is a static frame).

**Not shipped, proposed:** `docs/designs/2026-09-01-definition-mnemonic-engagement-framework.md`
lays out why animation is the wrong lever for `formal_definition`
specifically (Sweller's split-attention effect — a moving figure competes
with parsing a precise statement for the same working memory), six
research-grounded rules, and a composable "delivery modifier" scheme
(`#term-first`, `#restate-check`, `#not-this`, `#device-reveal`,
`#apply-once`). `#device-reveal` (the `mnemonic` stagger above) is the one
row shipped in this pass; the rest is future content/schema work, not
decided here — see TODOS.md.

### Content strategy: research integration (2026-09-02)

Five external research documents proposing a "research-first, static-core +
evidence-triggered-delta" content framework for the 116 atomic GATE
Engineering Mathematics topics were reconciled against what Vidhya already
ships. Full comparison + rationale:
`docs/designs/2026-09-02-content-strategy-research-integration-plan.md`.

**Verdict:** six of the research's ten core requirements were already at or
above the research bar (atomic topic contract, template families, evidence
labels, assessment contract, quality gate pipeline — all pre-existing and
in most cases more mature than the research's own proposal). Four were real
gaps, closed this pass as infrastructure — not hand-authored content, since
this environment has no live LLM provider key (same "known-unrun"
constraint as `npm run variants:eval` elsewhere in this doc):

- **`docs/content-spec/`** gained the two missing research documents
  (`adaptive-content-generation-framework.md`,
  `atomic-static-dynamic-content-framework.md` + `.csv`, a richer
  21-column per-topic schema) and the previously-truncated
  `integrated-self-improving-learning-system.md` was updated to its full
  text. The already-wired 13-column `atomic-content-structure-map.csv` and
  `src/content/atomic-topic-spec.ts`'s loader are deliberately left
  untouched — swapping the schema under `GET /api/admin/content-spec/
  atomic-topics` is a breaking API change that deserves its own pass.
- **Method Selector** (a mandatory anchor per the research: state the
  decision rule for when a method applies, name one tempting-but-wrong
  alternative) was missing entirely — closed via the Pedagogy Pattern
  Library (E4, `src/registry/pedagogy-patterns.ts`), NOT a new `AtomType`.
  A new atom type has a huge blast radius (template YAML,
  `ci:template-coverage`, prose-budget rules, stance-variant rules, the
  walkthrough gate, `ATOM_ANIMATION_MAP`) and would leave every one of 101
  concepts "failing" a brand-new coverage gate with no live provider key to
  backfill content. `ped_method_selector` in
  `data/registry/pedagogy-patterns.yml` is the first pattern with
  full-catalogue reach (`applicable_modules`: all 10 topics — the existing
  5 patterns cover only linear-algebra/calculus), injected at the
  `formalism`/`worked_example` stages via the existing `buildPatternPromptBlock()`
  seam every future generation call already reads.
- **Typed delta-kind taxonomy.** `student_atom_overrides.trigger_reason`
  was free text with no closed vocabulary anywhere. `src/content/delta-
  kinds.ts` (`DeltaKind`, migration `056_delta_kind.sql`'s CHECK
  constraint) codifies the research's 10 named kinds plus an 11th,
  honestly-named `general_remediation` for the one trigger path that
  actually exists today (3-failures-in-7-days → whole-atom regen) — it
  doesn't cleanly match any single research kind, and mislabeling it as one
  would fabricate precision the detector doesn't have. Wiring the other 10
  kinds to real trigger detectors (a prerequisite-gap probe, a
  representation-shift detector, ...) is each its own follow-up (TODOS.md)
  — this makes the taxonomy real and queryable, not nine new detectors.
- **Source freshness monitoring** — `docs/designs/2026-08-27-content-
  readiness-market-research-integration.md:97` had explicitly parked this
  as "an annual operator checklist item, not a system." `src/jobs/source-
  freshness-monitor.ts` (+ `GET /api/admin/source-freshness`, weekly in
  `src/jobs/scheduler.ts`) hashes the two official GATE 2026 pages
  (syllabus, question-pattern) and flags drift via the existing
  `durableCollection` pattern (migration-free — `durable_records`'
  `collection` discriminator). Network reachability from any given
  deployment isn't guaranteed; the job never throws on a fetch failure
  (per-source `fetch_failed` status) and is unit-tested against a mocked
  `fetch`.

**Deliberately not touched:** `content_gate_ledger` (5 gates),
`assessment_contracts`, no new `AtomType`/`StageKind`,
`ci:template-coverage`/`ci:la-walkthrough` unchanged.

**Second pass, same day — the four items above were re-scoped and shipped:**

- **Per-claim source locator.** `src/content/source-locator.ts`
  (`SourceLocator`) sits beside `evidence_level` on `AuthoredItem` and
  `PyqBankProblem`. Does NOT touch `historical-evidence.yml` — that file's
  own header already refuses to invent per-item locators for its 116
  topic-level D/P/S rows without a real coding protocol, and doing so here
  would be exactly that fabrication. Instead, `scripts/check-practice-
  items.ts`'s `checkPhraseRule` now requires a locator on the one
  combination that needs it: `evidence_level: 'directly_reviewed'` PLUS an
  actual phrase-rule-licensed claim in the text. Zero committed items
  trigger this today (a forward-looking tightening, not a breaking change).
- **Three-tier delivery length.** `src/content/delivery-length.ts`
  (`'micro' | 'standard' | 'deep'`) is a pure filter wired into
  `pedagogy-engine.ts`'s `selectAtoms()` via a new `RouteRequest.
  delivery_length` field (`/api/lesson/compose` now reads `body.
  delivery_length` / `body.session_mode`). `'micro'` keeps only the
  research's 6 named anchors; `'standard'`/`'deep'` are honest no-ops today
  (Vidhya's base already matches "Standard," and a real "Deep" layer
  doesn't exist yet — claiming otherwise would be fabricated precision).
  `SessionMode.micro_sprint` (previously modality-only) now also compresses
  the atom set via `deliveryLengthFromSessionMode()`. Resonance-beat
  safety: `carriesInteractiveScene()` keeps any atom with a real
  ` ```interactive-spec` `` / ` ```gif-scene` `` fence regardless of
  atom_type, so a fused scene authored on `intuition` is never silently
  dropped by the micro filter.
- **Bounded-depth diagnostic probe — additive, not a replacement.**
  `src/gbrain/diagnostic-probe.ts`'s `diagnoseWrongAnswer()` implements the
  research's bounded traversal + ranking + "smallest discriminating probe"
  + converging-evidence gate (reusing FIRe's own `FIRE_MAX_DEPTH` bound,
  not a second depth constant). `traceWeakestPrerequisite` and
  `refreshPrerequisiteAlerts` — the live path gating real interventions —
  are untouched; the new function is wired ADDITIVELY into
  `student-audit.ts`'s report (`diagnostic_probes` field + a new markdown
  section), an on-demand coaching view, never the live decision path.
- **Custom-PDF ingestion scaffold.** `src/content/custom-source/types.ts`
  is the full research §15.6 data model (`CustomSourceDocument`,
  `SourceSpan`, `ClaimDraft`) with a `CustomSourceExtractor` interface left
  deliberately UNIMPLEMENTED — same LLMJudge/CASChecker split: an interface
  first, a concrete OCR/extraction adapter in its own wiring PR once a
  provider decision is made. `src/content/custom-source/repo.ts` is the
  real, usable half — `CustomSourceRepo` (Pg + File, same two-impl pattern
  as every repo in `src/storage/repositories/`) with hash-deduped
  registration, permission-gated span attachment, and a review workflow
  (`resolveClaim` refuses to reject/quarantine without a `review_note`, and
  is idempotent). Migration `057_custom_source_ingestion.sql` creates the
  three tables, empty until an upload flow calls in. `ClaimDraft` reuses
  `DeltaKind` and `SourceLocator` from the two pieces above rather than
  inventing its own vocabulary.

**Still deliberately out of scope, named in TODOS.md:** migrating the live
prerequisite-alert path onto the bounded algorithm (vs. the additive view
that already ships), a concrete `CustomSourceExtractor` adapter (needs an
OCR/storage product decision), and wiring the remaining 8 unwired
`DeltaKind` values to real trigger detectors (each its own scoped project).

### Five live-QA fixes: motion framework, control placement, tone directive, error-diagnosis leak, correct-answer CTA (2026-09-02)

Second live-QA `/investigate` pass the same day as the seven-fix pass
above, on five issues reported with screenshots. All five root-caused
before any fix, per the skill's Iron Law; three land as code-level
framework changes so they reach every concept and topic — existing and
future — without a content rewrite.

1. **"Just static text" (motion/animation for prose, not just images).**
   `.vidhya-atom-body--progressive` (the paragraph-stagger CSS class from
   the earlier attention-span pass) only ever reached `visual_analogy` and
   `mnemonic` atoms — every other `DefaultAtomCard` type (`hook`,
   `intuition` outside the resonance-beat scenes, `micro_exercise`,
   `retrieval_prompt`, `interleaved_drill`) rendered with zero motion, not
   by design but because the mechanism had never been extended past the
   first two types. `AtomCardRenderer.tsx`'s `DefaultAtomCard` now applies
   it to every type except two deliberate holdouts: `formal_definition`
   (Sweller's split-attention effect — see the definition/mnemonic
   engagement-framework doc, v4.45.0 section above) and `exam_pattern`
   (already animates via the `structured` list-row stagger; `progressive`
   targets `> p` and would be an inert no-op on its bullet-list markup).
   Gated by `atom_type` in code, so it applies to every existing concept
   and every concept the generator produces from here on — no content
   edits needed. Self-disables under `prefers-reduced-motion` via the
   existing `--dur-base` token collapse, same as `--structured`.

2. **Interactive control too far from the image (`/design-review`
   finding).** `Simulation.tsx`'s beat-bar + play/pause/reset + scrub
   slider used to render below the narration caption and the trap row, so
   reaching the control that changes what the SVG shows meant scrolling
   past a paragraph of text first. Reordered: SVG → controls (beat bar +
   buttons + scrub slider) → caption → trap row. The caption still updates
   live as the student scrubs (`activeBeatIndex`'s "last beat whose
   `at_progress` ≤ progress" rule, unchanged) — it now reads as a caption
   for the control just touched instead of a paragraph to read before
   touching anything.

3. **Tone: ELI5 + anxious-student register + Indian English by default.**
   `orchestrator.ts`'s `buildPrompt()` gained an unconditional
   `TONE_REGISTER_BLOCK` — the first thing in every generation prompt,
   every atom type, not just hook/intuition: write for an anxious exam
   student, ELI5 the reasoning, gloss any technical term in plain words
   the first time it appears, default to Indian English (every exam pack
   Vidhya ships — GATE, BITSAT, NEET, civil services — is an Indian
   competitive exam, so that's the region-appropriate default for "all
   exams" as the platform stands today; there's no per-exam locale field
   yet, so a genuinely non-Indian exam pack would need one, not a special
   case bolted onto this block). This is a generation-time fix, not a
   content rewrite: no LLM provider key is configured in this environment
   (same "known-unrun" constraint noted elsewhere in this doc — see
   v4.33.0), so the existing 505+ committed practice items and 880+ base
   atoms were NOT reprocessed against the new register. The dense-jargon
   example that surfaced this (a `common_traps` atom naming "Hermitian
   matrix"/"symmetric matrix" with no gloss) is real content debt on the
   existing corpus, tracked in TODOS.md, not silently fixed by this prompt
   change alone.

4. **"Conceptual gap unavailable" leaking as if it were real analysis.**
   `classifyError` (`src/gbrain/error-taxonomy.ts`) has three fallback
   paths that all return filler shaped like a diagnosis: no LLM configured
   (marker `unclassified`), the LLM returning no text, and the LLM
   returning unparseable JSON (the latter two both set marker
   `classification-failed`, diagnosis text "The answer was incorrect.
   Error classification unavailable."). `ErrorDiagnosis.tsx`'s
   render-nothing guard was added in an earlier pass but only checked
   `unclassified` — so a real LLM hiccup or bad JSON parse on a live-LLM
   deploy still rendered "Conceptual Gap — Error classification
   unavailable" under headings like "Why this was tempting" as if it were
   a genuine analysis. The guard now keys on both markers
   (`PLACEHOLDER_MISCONCEPTION_IDS`).

5. **Smart Practice gave no way to keep practicing after a correct
   answer.** `PracticeAttemptPage.tsx`'s post-answer CTA row ("Explore
   this concept" / "Practice more like this") was gated on
   `!result.grade.correct` — added in the earlier same-day pass for wrong
   answers, but the guard hid BOTH buttons on a correct answer too, so a
   student who answered right had no path to another problem on the same
   concept short of navigating away and re-searching. "Explore this
   concept" stays wrong-answer-only (remediation framing is backwards for
   an answer the student just proved they know); "Practice more like
   this" now always renders when the item carries a `node_id`, correct or
   not.

### Wolfram-inspired prompt resource registry (2026-09-02)

`/autoplan` on 9 uploaded research files (a Wolfram Prompt Repository
design study, a prompt-resource registry YAML, a 116-topic atomic mapping,
research notes, and their validator/generator scripts). Full plan:
`docs/designs/2026-09-02-wolfram-prompt-resource-registry.md`.

**Scope-defining fact found before any design work:** 8 of the 9 uploaded
files were already committed verbatim by the SAME-DAY prior pass
(`docs/designs/2026-09-02-content-strategy-research-integration-plan.md`)
— `diff` confirmed byte-identical content for the first 928 of 942 lines
of the shared design doc. The only genuinely new idea across all 9 files
was a typed, versioned **prompt resource registry** layer — this pass
built that, not a from-scratch "10000x" system. The source document's own
closing section is explicit that "10000x" is an operational-leverage
hypothesis (reuse, consistency, production speed), not a content-quality
claim measured or promised by this pass.

**`src/content/prompt-registry/`** — `PromptResource`/`Modifier` types
across the uploaded registry's 9 categories (`persona`,
`research_function`, `teaching_function`, `assessment_function`,
`diagnosis_function`, `modifier`, `verifier`, `renderer`, `governance`),
an approval-state lifecycle (`draft`/`benchmarked`/`pilot`/`released`/
`deprecated`/`blocked` — only `released`/`pilot` resources ever resolve
into a live prompt, mirroring `pain-points.ts`'s reviewed-only discipline)
and `runPromptResourceContract()` every resource must pass (mirrors
`marking-strategy-contract.ts`'s pattern). Registered as the
`prompt-resource-registry` seam in `seam-registry.json`.

**Deliberately does NOT duplicate what already exists.** The registry's
`verifier` category REGISTERS the existing `AnswerVerifier`/
`ContentVerifier` cascade, never reimplements it. Resource-approval-state
(is this PROMPT RESOURCE safe to use) is kept as a separate axis from
`content_gate_ledger` (is this GENERATED ITEM safe to serve) — the
uploaded registry's own `release_gates` block conflated the two, which
this plan corrected before building rather than shipping a duplicate gate.

**`orchestrator.ts`'s `buildPrompt()` now composes from the registry**
instead of 4 hardcoded function calls (pain-point/pattern/resonance/tone
blocks — each wrapped as a registered resource in `src/content/prompt-
registry/resources/`, not rewritten). Behavior-preserving: the existing
`resonance-prompt.test.ts`, which asserts on exact prompt-string output,
passes unmodified.

**Named-but-unimplemented is honest, not silently absent.** The uploaded
registry names 5 modifiers Vidhya has no implementation for
(`visual_first`, `simple_words`, `exam_timed`, `prerequisite_repair`,
`hindi_glossary`) — registered at `approval_state: 'draft'`, which the
registry's own `resolvePromptResources()` never returns, so they can never
silently ship in a real prompt. `npm run content:registry-audit` (new,
zero-LLM-call) reports them explicitly rather than pretending 10-for-10
coverage.

**`src/content/wolfram-content-family.ts`** classifies all 116 GATE-EM
atomic topics into 14 Wolfram content families (matrix/eigen/limit/
derivative/integral/optimization/vector/ode/pde/complex/probability/
statistics/numerical/discrete — the uploaded generator script's own
keyword-matching `classify()` ported verbatim, quirks included: e.g. any
domain containing "differential equations" classifies as `derivative`,
never `ode`, because the `derivative` keyword check runs first in the
source script's own precedence and "differential" is a substring match —
faithfully reproduced, not fixed, since the ask was to adapt the uploaded
framework, not silently correct its internals), joined via the existing
`atomic-concept-map.ts` crosswalk.

**Regeneration: the user explicitly redirected the "no provider key"
premise.** This session flagged that literal corpus regeneration was
blocked on a missing `GEMINI_API_KEY`/`ANTHROPIC_API_KEY`/etc. — the same
"known-unrun" wall documented throughout this doc. The user's answer:
"Use claude sonnet subagents from here to generate the materials" — i.e.
bypass the app's runtime LLM client entirely and use this session's own
Claude Sonnet model access (the Agent tool) to do real content rewrites
directly. This is the same mechanism the "21 batch subagents, 101
concepts" precedent used earlier in this repo's history, and it worked
again here: **all 26 GATE Linear Algebra concepts' `common_traps` atoms**
were rewritten against the ELI5/Indian-English tone directive via 5
parallel subagent batches (5-6 concepts each), each under hard
constraints (frontmatter byte-identical, every math/LaTeX expression
unchanged, same trap count/order/underlying mistake, no fabricated
claims, no emoji). The confirmed jargon gap that motivated this pilot —
`symmetric-matrices/atoms/common-traps.md` Trap 1's ungossed "Hermitian
matrix" — is fixed; every rewrite glosses each technical term on first
use. Validated clean against `ci:katex-fences`, `ci:content-integrity`,
`ci:la-walkthrough`, `ci:template-coverage`, `ci:variant-agreement`, and
the frontend's 1726-assertion `MarkdownAtomRenderer.regression.test.tsx`.

**What this pilot does NOT claim:** it covers exactly one (atom_type,
topic) slice — `common_traps` on Linear Algebra. Every other atom_type
across all 101 concepts, and `common_traps` on the other 9 topics, is
untouched and tracked in TODOS.md as the next wave, with the exact
pattern (5-6 concepts per subagent batch) that worked here as the
template to repeat.

**This framework is also the one future content handling should use.**
Every new prompt-shaping block (a new modifier, a new teaching_function)
should register through `src/content/prompt-registry/` and pass
`runPromptResourceContract()` rather than being added as a fifth
hardcoded call inside `buildPrompt()` — the whole point of this pass was
to stop that pattern from compounding.

---

### Why-first interactive framing (2026-09-03)

Live-QA report (4 screenshots, matrix-operations lesson) via `/investigate`:
students couldn't tell why an interactive widget was on the page, a
"Linear map y = Ax (1D slice)" exploration widget appeared with no
explanation of why a scalar simplification was shown for a 2×2-matrix
lesson, the "Try It: 2×2 Matrix Multiplication" walkthrough rendered
cramped bracket-array text instead of typeset matrices, and a resonance
scene's "circle has become a tilted ellipse" line never explained why.
Full root-cause + design: `docs/designs/2026-09-03-why-first-interactive-
framing.md`.

**Root causes, not just symptoms:** (1) `InteractiveSidecar.tsx` never
framed any of the 380 authored interactive-spec blocks — structural, not
content. (2) `ConceptMathViz.tsx` is a SEPARATE, hardcoded 53-entry widget
system bolted onto every lesson page (`LessonPage.tsx`), entirely outside
the atom-authoring/tone-directive/prompt-registry pipeline this repo has
spent the whole day building — its `matrix-operations` entry was scope-
mismatched and unglossed. (3) `matrix-operations/atoms/intuition.md`'s
guided-walkthrough spec wrote matrices as un-delimited bracket arrays
(`A = [[1,2],[3,4]]`) instead of LaTeX, so KaTeX never touched them —
confirmed systemic across 5 concepts / 15 files (matrix-operations,
lu-factorization, eigenvalues, change-of-basis, numerical-linear-algebra),
all fixed. (4) the circle→ellipse resonance beat explained the "why" only
in the `text_assured` register, never in `text`/`text_shaken`.

**The fix is a reusable field, not four patches.** `why?: string` added to
all three `InteractiveSpec` kinds (`frontend/src/components/lesson/
interactives/types.ts`, capped at `MAX_WHY_CHARS=220`, optional so all
existing content keeps validating) and to `ConceptMathViz`'s `VizSpec`.
`WhyThisHelps.tsx` is the ONE shared framing component, rendered by both
`InteractiveSidecar` and `ConceptMathViz` — renders nothing when `why` is
absent. `src/hooks/useEliFraming.ts` is the "option in backend to remove"
the report asked for, built as a client preference (mirrors
`useCalmMode.ts`'s persistence pattern exactly) rather than a literal
backend flag, since this content is static pre-authored markdown with no
per-request LLM call to gate server-side. Defaults ON (unlike Calm Mode);
"Hide these tips" turns it off everywhere, persisted.

**Pilot slice shipped:** the framework itself, plus all 4 reported issues
fixed at the source (matrix-operations' guided walkthrough + hook scene +
ConceptMathViz entry; the 4 other concepts sharing the bracket-array bug).
18 of 380 interactive-spec blocks now carry `why`; 1 of 53 `ConceptMathViz`
entries audited. The other 362 blocks and 52 entries are the next wave —
tracked in TODOS.md, same 5-6-per-batch pattern as the common_traps pass
above. `matrix-inverse/atoms/hook.md` carries the same ellipse scene
pattern (checked, not assumed) and is a natural next candidate, untouched
here since the live-QA report was scoped to matrix-operations.

**Verification:** `ci:katex-fences`, `ci:content-integrity`,
`ci:interactive-specs`, `ci:variant-agreement`, `ci:la-walkthrough`
(26/26) all clean. Frontend 94 files / 2567 tests (full corpus render
regression included). Backend untouched, 362 files / 4672 tests. `tsc
--noEmit` clean both sides.

---

### Motion coverage + plain-language strategy (2026-09-03)

Follow-up ask: research where more motion helps (topic-wise), simplify
exploration language further, and add a rule for long text (chunk it or
animate it). Full research + audit + priority ranking:
`docs/designs/2026-09-03-motion-and-plain-language-strategy.md`.

**Research (4 sources, fresh-searched):** Mayer's segmenting principle
(learner-paced segments beat one continuous unit) and signaling principle
(cues that direct attention) — this repo's resonance-beat mechanism
(`narration_steps`+`emphasize`+`trap`+`why`) already encodes both
correctly. Betrancourt/Tversky meta-analyses: animation isn't inherently
better than static — the "substantial effect size" cases are specifically
learner-paced, narrated, interactive ones, and passive looping animation
sits closer to the "not encouraging" end; a caution that motion can add
"fictional steps" that mislead if it implies a process the math doesn't
have. Linear algebra specifically is called out as animation's best-suited
subject. Math readability research: more concepts per sentence than any
other text type — short sentences, common words, active voice.

**Audit corrected an assumption before it shipped:** a first grep for
`simulation`-kind blocks per topic said "6 topics have zero motion" — wrong,
because it ignored `gif-scene` (the older §4.15 passive-GIF system), which
covers nearly every concept already. Re-run against both systems: the real
gap isn't "no motion," it's that 5 topics — vector-calculus,
probability-statistics, transform-theory, numerical-methods, and largely
discrete-mathematics/graph-theory — are 100% passive-GIF with **zero**
`simulation`-kind (scrubbable, narrated, signaling) coverage, while
linear-algebra alone holds 21 of the platform's 34 `simulation` scenes.
10 concepts are genuinely visual-free; 2 of those (Change of Basis, LU
Factorization) are documented deliberate exclusions from the original
resonance-beats pass, not oversights.

**Topic-wise priority** (subject-motion fit × current gap):
1. vector-calculus — flux/flow IS motion through space; 0/8 `simulation`.
2. numerical-methods — iterative convergence is the textbook system-paced-
   animation case; 0/6.
3. probability-statistics — distribution-vs-parameter is a `manipulable`
   case; CLT convergence a classic animated demo; 0/9 on both kinds.
4. complex-variables — geometric by nature; worst DEPTH coverage (4 of 6
   concepts have neither `simulation` nor `guided_walkthrough`).
5. calculus — already 7/19, real but lower-urgency extension.
6. discrete-mathematics — LOWER priority for continuous motion on purpose;
   discrete/symbolic content risks the "fictional steps" failure mode;
   wants segmented reveal, not animation.
7. graph-theory — its 3 fully-uncovered concepts (Eulerian & Hamiltonian,
   Connectivity, Trees) need a node-highlight-sequence primitive the
   current schema doesn't have — flagged as a real schema gap, not forced
   into the wrong widget kind.

**Language rule:** `description` says what to do/see (active voice, ≤~20
words); `why` alone carries the "this is a simplification" framing — never
duplicate it across both fields; a short symbol chain is not simplified
just because it's short (gloss notation on first use). Caught and fixed
the previous pass's own miss: `ConceptMathViz`'s `matrix-operations`
description had drifted to 59 words, one block, repeating its own `why`
line — rewritten to 19 words, redundancy removed.

**Segment-or-motion rule:** a process/transformation over time → prefer a
`simulation` scene's `narration_steps` (the segmenting mechanism already
built) over a wall of static prose; a set of discrete facts/conditions →
segment via `guided_walkthrough`'s paced reveal or short progressive-
stagger paragraphs; never leave a long paragraph undivided next to an
animation it should have deferred to.

**Shipped:** the doc itself (the deliverable for "topic-wise" as asked);
the `ConceptMathViz` self-correction above; one new `simulation` scene on
`line-integrals/atoms/hook.md` (+ shaken/assured, byte-identical) — vector-
calculus's #1 priority slot, animating $\mathbf F(x,y)=(-y,x)$ along the
unit circle (reusing the exact field + path already verified in
`hook-shaken.md`'s prose) to show the "closed loop, still nonzero work"
paradox, with a `trap` beat and a `why` line.

**Deliberately deferred, tracked in TODOS.md:** the other 7 vector-
calculus concepts and all of probability-statistics/transform-theory/
numerical-methods/complex-variables' gaps; a new interactive-spec kind for
graph-theory's discrete-traversal case; the remaining 52 `ConceptMathViz`
descriptions (several symbol-dense); probability-statistics's
`manipulable`-slider opportunity.

**Verification:** `ci:interactive-specs` (383 blocks, +3),
`ci:katex-fences`, `ci:content-integrity`, `ci:variant-agreement` (610
pairs) all clean.

---

### Content teaching arc: predict-before-reveal + solver discoverability (2026-09-03)

Live-QA report (2 screenshots) on spectral-theorem, plus a broader ask to
"reimagine content delivery from first principles" as "a common framework
across all topics for any exam." Full root-cause + honest scoping:
`docs/designs/2026-09-03-content-teaching-arc-framework.md`.

**Bug 1 — a resonance beat revealed the rule with no prior prediction.**
`spectral-theorem/atoms/hook.md`'s "flipped arrow" scene combined OBSERVE
and REVEAL in one beat (`at_progress: 0.55`): showed the eigenvector flip
AND stated the rule AND gave the eigenvalue's sign, together. Split into a
5-beat Predict-Observe-Explain sequence (`hook.md` + `hook-shaken.md` +
`hook-assured.md`, byte-identical fences per `ci:variant-agreement`): a
narrow, answerable predict cue ("does a flipped arrow still count?") now
precedes the reveal, which is followed by its own why-beat, with the
trace/det cross-check moved to a separate beat and the existing
perpendicularity trap unchanged.

**Bug 2 — a practice-item solution read out of register with the lesson.**
`pi-spectral-theorem-002` in `data/practice-items/gate-ma-la-eigen.json`
had `solution_steps` written as a compressed proof dump. Rewritten to
reference the concept page's own demo matrix/eigenvalues and state each
computational move's reason in plain English before the arithmetic. A
structural finding surfaced alongside it, NOT fixed in this pass:
`PracticeAttemptPage.tsx` renders `solution_steps` as plain strings with no
`MarkdownAtomRenderer`/KaTeX pipeline — the same "independently-drifted
content surface" bug class as `ConceptMathViz`'s pre-2026-09-02
disconnection and the `guided_walkthrough` bracket-array bug, both fixed
earlier the same day. Tracked in TODOS.md.

**The "solver for different problem types" ask was already built —
just undiscoverable.** `GuidedWalkthrough.tsx`'s `branches` extension
(W2.5/D1-D3, `TheoremWizardPage`/`DistributionSelectorPage`) already IS a
method-selection solver — `THEOREM_WIZARD_TRAINERS['linear-algebra']`'s
`la_power`/`la_definite` nodes already cover exactly the eigenvalue-power/
definiteness territory spectral-theorem sits in. The gap was that
`/theorem-wizard/:module` and `/distribution-selector` were reachable only
via direct URL — no lesson or practice page ever linked to them.
`PracticeAttemptPage.tsx` now shows a "Which method applies? Work through
it" CTA on a wrong answer when the item's `topic` maps to a trainer
(`wizardRouteForTopic()`, normalizing casing since one bank drifted to
`"Linear Algebra"` where the rest use the kebab-case slug). Fails closed —
an unmapped topic (7 of 10 topic families have no trainer yet) shows no
button rather than a guessed link.

**The "common framework" ask, honestly scoped.** An audit found most of
the requested loop already exists platform-wide and pre-dates this pass:
diagnosis (Elo, `error-taxonomy.ts`, `distractor_failure_tags`,
`diagnostic-probe.ts`), intervention (`nextBestAction()`'s four-arm loop,
`MotivationAwareTeachingPolicy`, FIRe, personalization's 5-layer
re-ranker), tracking (FSRS-6, mastery snapshots, `attempt_facts`), and
next-action (the same `nextBestAction()`, wired live). The real, closable
gap was **presentation sequencing** — closed as a new reusable pedagogy
pattern rather than a one-off content edit: `ped_predict_before_reveal`
in `data/registry/pedagogy-patterns.yml` (Track E4's Pedagogy Pattern
Library — the same real, tested mechanism `ped_method_selector` uses, not
a new system). Full-catalogue reach across all 10 topic families,
`blueprint_stages: [intuition, discovery]`; directives require a separate
narrowly-cued predict beat before any reveal, explicitly reject open-ended
"what do you think happens?" prompts (Sweller's worked-example effect —
novices need scaffolding, not blank-page discovery), and distinguish a
predict cue from a trap/misconception callout so a future generator
doesn't conflate the two. Evidence cites White & Gunstone 1992 (POE) and
Slamecka & Graf 1978 (generation effect). Verified via
`buildPatternPromptBlock()` — every future `intuition`/`discovery` atom
generated for any topic now carries this directive automatically.

**Deliberately not done, named in TODOS.md:** auditing the other ~33
`simulation`-kind scenes for the same reveal-without-predict defect; an
ELI5/register pass over the other ~504 practice items' `solution_steps`;
the `solution_steps` LaTeX-pipeline fix; extending
`THEOREM_WIZARD_TRAINERS` to the 7 topics with no trainer yet.

**Tests:** 5 new (`PracticeAttemptPage.test.tsx`, 11→16). Full suite
backend 4672/4672, frontend 2572/2572. `npm run ci` (18 gates) clean.
`tsc --noEmit` clean both sides.

**Same-day follow-up fix (v4.53.1):** live-QA screenshot showed the wizard
link stacked ABOVE "Explore this concept" and "Practice more like this",
plus the "What's next for me?" text link below — 3 buttons + a link on a
wrong answer, decision overload against Vidhya Clarity's one-focal-action
rule. Fixed: the wizard link and "Explore this concept" are both "go
learn" moves and now share ONE slot — the wizard wins only when the
server's diagnosis (`failure_tag === 'method_selection' || 'method'`) says
the miss was actually a method choice and the topic has a trainer; every
other wrong answer (including an untagged one — a guessed diagnosis is
worse than the safe generic default) gets the lesson instead, never both.
3 new tests (16 → 19).

---

### Adaptive hook pacing + wizard-to-practice mistake loop (2026-09-03)

`/investigate` on three follow-ups: hook animations play at one fixed
speed for every student; the method-selection wizard is a good idea but
doesn't connect to the actual problem or correct the misunderstanding;
reimagine it as identify-the-mistake → correct-it → practice-more. Full
root-cause + honest scoping:
`docs/designs/2026-09-03-adaptive-pacing-and-wizard-mistake-loop.md`.

**Pacing.** `Simulation.tsx`'s `duration_sec` was a single author-time
constant applied identically to every student, even though `servedStance`
was already threaded into the component for per-beat TEXT
(`resolveBeatText`) and never for pacing. `paceMultiplierForStance()` (new,
pure, exported) scales playback speed by the same shaken=slower/
assured=faster philosophy `framingInstructions()`
(`src/sessions/learner-framing.ts`) already codifies for register — 1.35×
for shaken, 0.75× for assured, 1× (unchanged) for steady/undefined, beat-
carrying scenes only. No new tracking: `servedStance` was already
server-derived from `motivation_state`/`consecutive_failures`/mastery band
and already reaching this exact component.

**Wizard context + practice loop.** `PracticeAttemptPage.tsx`'s wizard
link now carries `?concept=<node_id>&mistake=<label>` (the same
plain-language label the wrong-answer screen already shows via
`COMMON_MISTAKE_LABEL`). `TheoremWizardPage`/`DistributionSelectorPage`
read it and render `WizardContextBanner` (names the concept + mistake
above the tree) and `WizardPracticeCTA` (a "Practice more like this" link
to `/smart-practice?concept=<concept>`) — both new,
`frontend/src/components/app/WizardMistakeLoop.tsx`, both no-ops when the
wizard is opened directly with no query params.

**A real constraint surfaced mid-build and was respected, not routed
around.** The first draft added an `onLeaf` callback to
`DecisionTreeWalkthrough` so the practice CTA could reveal only once a
leaf was reached. `DecisionTreeWalkthrough.test.tsx` already has an
explicit structural guard against exactly this: "A future onLeaf/onGraded
prop would be the hole E5 closes" — even a non-grading callback is a
foothold for a future caller to report the client-visible `leaf.best` as
a correctness signal, reopening the client-trusted-grading class of bug
the mock-exam fix closed. The callback was dropped rather than renamed to
dodge the guard's regex; `WizardPracticeCTA` is instead always available
once a concept is known (an honest "when you're ready" door, not a gated
"you're done" reward). `DecisionTreeWalkthrough.tsx` and
`GuidedWalkthrough.tsx` are unchanged in this pass — verified via `git
status`, not asserted.

**Deliberately not done, named in TODOS.md:** the practice CTA routes to
the concept's whole practice pool, not problems selected for the specific
diagnosed misconception — `ProtoCATSelector` has no misconception filter
today; threading one through is real, separate selection-logic work.

**Tests:** 9 new (3 pace-multiplier unit tests, 1 concept/mistake
query-param propagation test on `PracticeAttemptPage`, 5 wizard-page
context/CTA tests). Full frontend suite 2584/2584. `tsc --noEmit` clean.

---

### Two systemic rendering bugs: raw LaTeX and dead markdown tables (2026-09-03)

`/investigate` on a live-QA screenshot ("Poor formatting... $/text is
rendered??") of the systems-of-equations lesson. Root-caused BEFORE any
content rewrite, per the skill's Iron Law — most of what looked like a
content-quality problem turned out to be two rendering bugs.

**Bug 1 — trap rows leaked raw LaTeX.** `Simulation.tsx`'s `TrapRow`
("Where marks are lost") rendered `trap.text`/`trap.avoid` as plain JSX
string interpolation — `{trap.text}` — never through
`MarkdownAtomRenderer`. Any trap authored with inline math (every one of
them; `$\text{rank}(A)$` is a completely ordinary trap sentence) leaked
the literal LaTeX source to students instead of typeset math. Fixed: both
lines now route through `MarkdownAtomRenderer` with a new
`.vidhya-atom-body--trap` modifier class reproducing the prior plain
styling; `"Avoid: "` stays a plain-text prefix folded into the SAME
markdown string rather than a separate element, so label and reason still
read as one sentence.

**Bug 2 — every authored table in the corpus rendered as literal pipes.**
`MarkdownAtomRenderer.tsx`'s remark pipeline (`remark-parse` +
`remark-math` + `remark-directive` + `remark-rehype`) never had
`remark-gfm` — GFM tables are not CommonMark, so a `| Condition |
Solutions |` block was never recognized as a table at all, just an
unparsed paragraph. This wasn't a one-atom bug: EVERY table across the
whole content corpus was silently broken the same way, on every deploy,
since the renderer was written. Installed `remark-gfm@4.0.1`, added it to
the pipeline right after `remark-parse`. The CSS
(`.vidhya-atom-body table/th/td`, wide-table horizontal scroll) was
already fully written in `globals.css` — someone had anticipated tables
and it was simply waiting on the plugin the whole time.

**Content pilot, same concept the screenshot named.**
`systems-of-equations/atoms/visual-analogy.md` rewritten: leads with a
concrete "three sheets of glass" picture instead of the formal definition,
splits the three-outcome paragraph into a scannable bulleted list (every
rank formula kept, just reordered after the plain-English shape), and
closes by connecting back to the concept's own hook animation instead of
a bare "stays verbal" disclaimer. `intuition.md`'s dense closing paragraph
(homogeneous-systems fact + GATE exam-pattern facts crammed together) got
a one-line split into two paragraphs.

**Design brainstorm, published as an artifact — not code.** A short
"One Idea Per Screen" page (Vidhya Clarity's own tokens, no new palette)
laying out: the two bugs' before/after, a 4-rule density-reduction
principle (LEAD/SPLIT/DEFER/CONNECT), and a real capsule-hook layout
mockup — folding the current 3-stacked-cards hook (animation card, prose
card, trap card) into one bounded capsule object with the beat-bar and a
tap-to-expand trap pill inside it, built from the concept's own now-fixed
content. Explicitly a mockup, not a build — a real capsule layout is its
own `Simulation.tsx` change plus a design-system scope decision (every
hook, or only revisit cards?), named as future work.

**Predict-before-reveal wave — complete, all 29 remaining scenes.** The
prior pass (CLAUDE.md, "Content teaching arc") fixed exactly one reported
scene (spectral-theorem) and named the rest as deferred content debt. This
pass found the precise, closed worklist first — every `simulation`-kind
scene lives exclusively in a `hook.md` (none in any other atom type),
29 concepts remaining — then dispatched 6 parallel background agents (5
concepts each) to audit and split any combined-observe-reveal beat.
**22 of 29 concepts had a real defect and were fixed**; 7 were already
clean (`determinants`, `eigenvalues`, `null-space-column-space`,
`orthogonality`, `quadratic-forms`, `rank-nullity`, `cayley-hamilton`) and
were left untouched rather than forced into an unneeded split. Every
touched concept got the identical fence applied byte-for-byte across
`hook.md`/`hook-shaken.md`/`hook-assured.md`. One agent (batch 3) also
trimmed a pre-existing 287-char `linear-independence` beat that was
blocking its own validation run — a real, in-scope fix, not scope creep.

Every batch validated its own concepts against `ci:interactive-specs`,
`ci:variant-agreement`, `ci:katex-fences`, `ci:content-integrity` before
reporting done; a final full-repo run of all four plus `npm run ci`
(18 gates) and both test suites confirmed the combined result — no commit
happened until every batch had actually reported back, per the standing
rule against fabricating results from work still in flight.

**Tests:** 2 new (GFM table renders as a real `<table>`,
`MarkdownAtomRenderer.test.tsx`; trap math renders through KaTeX,
`Simulation.test.tsx`). Full frontend suite 2586/2586, backend
4672/4672. `tsc --noEmit` clean both sides. `npm run ci` (18 gates) clean.
Content gates (`ci:interactive-specs` 383 blocks, `ci:variant-agreement`
610 pairs, `ci:katex-fences` 1723, `ci:content-integrity` 1729) clean,
unchanged counts throughout.

**Same-day follow-up: a `line-panels` gif-scene type, for the one thing
prose genuinely can't do.** The systems-of-equations `visual-analogy.md`
rewrite above still described its three rank outcomes one at a time —
resonant enough per-outcome, but the actual point (three ways a system can
go, compare them) needs to be seen side by side, not read serially. No
existing scene type supported that: `parametric`/`function-trace`/
`parametric-curve`/`level-set` all plot ONE curve (or two, on `level-set`'s
shared axes) on a single canvas; `discrete-bars` draws literal bars, not
line geometry.

`src/content/concept-orchestrator/gif-generator.ts` gains `'line-panels'`
— N independent static panels (default 1 frame; a new
`DEFAULT_FRAMES_BY_TYPE` map plus a shared `resolveTotalFrames()` helper
replacing four copies of the same `scene.frames ?? DEFAULTS.frames` line,
so line-panels doesn't have to re-encode 30 identical frames just because
an author forgot to write `"frames": 1`), each with literal `[x,y]` line
endpoints (same no-new-eval-surface discipline as `discrete-bars`' literal
`values` — this never touches `compileExpression`) and a caption
underneath. A panel naming exactly two lines gets a small accent dot at
their intersection when one exists and falls inside the panel — free
reinforcement of "this is where they agree," computed via `lineIntersection()`,
not authored by hand. Panel-caption placement reuses the
`computeBarGeometry`-style pattern: one `computeLinePanelGeometry()`
function feeds both the draw pass and `computeSceneLabels`, so a caption
can never drift from the panel it names. Wired into `KNOWN_SCENE_TYPES` /
`SceneDescription`, so the existing CI gate (`ci:gif-scenes`) and QA
pipeline (label-overlap + near-blank/low-contrast checks) cover it for
free — no parallel validation path.

`systems-of-equations/atoms/visual-analogy.md`'s closing paragraph (which
restated the hook's own opening sentence — "two lines cross once, sit on
top of each other, or run parallel," near-verbatim) is replaced with a
`line-panels` scene showing exactly that, side by side: one point, a
shared line, no crossing. 88/88 gif-scenes render clean (was 87), 0 new
QA findings.

**Tests:** 6 new (`gif-generator-qa.test.ts`) — static single-frame
default, QA passes clean, per-panel caption boxes in left-to-right order,
an explicit `frames` override is honored, a panel with no lines doesn't
throw, layout holds for panel counts other than 3. Backend suite
4672/4672 → 4678/4678. Frontend untouched (server-side render; MediaSidecar
serves any `kind: gif` generically regardless of scene type), 2586/2586.
`npm run ci` (18 gates) clean.

**Same-day follow-up: the text/diagram mismatch, corpus-wide.** The
systems-of-equations fix above (prose written as if the diagram appeared
inline at the `gif-scene` fence's position, when `visual_analogy` atoms
are actually `stage: 'above'` in `ATOM_PRESENTATION_MAP` — figure always
before the prose on mobile, sticky beside it on desktop, never at the
fence's literal position) turned out to be a real pattern, not a one-off.
Audited all 87 other `visual_analogy` atoms carrying a `gif-scene` block
for the same defect class: deictic real-time-reveal language ("watch",
"notice how", "let's see") and explicit-but-wrong positional claims
("below" — always wrong, the figure never trails; "above" — only
accurate on mobile, wrong on desktop's sticky side column) pointing at a
diagram the reader had already scrolled past. Dispatched 6 parallel
background agents (14-15 concepts each); **39 of 87 had a real defect and
were fixed, 48 were already clean and left untouched** — every fix a
minimal single-phrase rewording to "the diagram/curve/bars on this card,"
matching the systems-of-equations precedent; no LaTeX, JSON, or unrelated
prose touched. `ci:content-integrity` (1729), `ci:katex-fences` (1723),
`ci:gif-scenes` (88 render + 88 QA clean), `ci:variant-agreement` (610
pairs) all clean, unchanged counts.

---

### Student-paced hook beats + progressive worked-example reveal (2026-09-03)

`/design-review` on two live-QA screenshots (hook mid-scroll, worked
example) plus the note "look at all places where static text is
displayed, think about a better motion/animation/progression/transition."
Both fixes reuse existing machinery rather than inventing new interaction
languages; no live browser was available in this sandbox (Chromium
revision mismatch, `playwright install` off-limits per environment
policy), so this was a source-level review against the real render code
and the two supplied screenshots, not a live `browse` audit.

**Hook: every beat now holds for the student, not a clock.**
`Simulation.tsx`'s resonance-beat scenes autoplayed straight through every
beat on one author-time `duration_sec` (stance-adjusted, but still a
single fixed pace) — a confident student waited on text they'd already
read, an anxious one got swept past text they hadn't. `shouldHoldForTrap`'s
own crossing-detection was already exactly the right primitive, just
scoped to the trap beat alone; generalized to `shouldHoldAtBeatArrival`,
called once per beat boundary in the tick loop. Arrival at ANY beat now
pauses (indefinitely, not `DUR_SLOW_S`'s old timed re-arm) until the
student taps a new "Continue" button — reusing `GuidedWalkthrough`'s own
advance-button convention verbatim (same colors, 44px height, trailing
chevron) rather than a second button language for the same gesture. The
arc WITHIN a beat still autoplays (the motion stays the delight); only
the transition INTO the next beat waits for the reader. Net simplification,
not just an addition: the trap's bespoke timed-hold + `heldTrapRef`/
`holdUntilRef` bookkeeping is gone — every beat's hold already covers the
trap moment, and progress being monotonic during normal playback means no
"already held" guard is needed (a crossed boundary can't re-trigger).
11 new tests (`shouldHoldAtBeatArrival`'s boundary cases + the Continue
button's presence/absence across play/pause/reset/finished states).

**Worked example: steps reveal one tap at a time, not one paint.**
`WorkedExampleCard` faded every step in within the same render pass
(`delay: i * 0.05` — a stagger, not a reveal) even on a first view, so the
entire solution, boxed final answer included, was on screen almost
immediately. `applyScaffoldingFade`'s blank-out ceiling for REPEAT views
is untouched (`visibleCount` still gates what a returning student can see
at all); steps within that ceiling now reveal one at a time via the same
"Show next step" advance-button convention as the hook's Continue button.
Reduced motion collapses straight to every workable step visible at once,
matching every other reduced-motion surface in the app. One added delight:
a step containing `\boxed{...}` (KaTeX's own final-answer command, no new
authoring convention) gets a brief green settle-flash instead of the flat
fade every other step gets — `--green` (mastery/correct, DESIGN-SYSTEM.md),
never indigo (AI/tutor only), since this is a verified result. 7 new
tests; 3 existing tests (T19a/T19b/T20) updated to click through the new
reveal rather than asserting instant full visibility — their original
intent (no JSON leak, hairline-row styling, shaken-stance exemption) is
unchanged, only the interaction path to reach later steps.

**Scope, named honestly.** The broader "audit all static text" note is
NOT fully executed — `DefaultAtomCard`'s `.vidhya-atom-body--progressive`
paragraph-stagger already reaches every atom type except the two
deliberate holdouts (`formal_definition`, `exam_pattern` — see the
2026-09-02 sections above), so those surfaces were already covered before
this pass. `GuidedWalkthrough`/`DecisionTreeWalkthrough` were already
progressive. What's still genuinely static and un-audited: practice/mock-
exam question pages, `CommonTrapsCard`'s row content beyond the existing
`structured` stagger, and any card type outside this file. Tracked in
TODOS.md rather than claimed as covered.

**Tests:** frontend 2586 → 2604 (+18). `tsc --noEmit` clean. Backend
untouched (frontend-only change).

---

### `/ui-ux-pro-max` on Continue/advance buttons: adopting the unused design-system Button (2026-09-03)

Follow-up to the pacing pass above: "look at the continue button and other
buttons and design them for an intuitive ux." Audit found the "Continue" /
"Show next step" / GuidedWalkthrough's "Show hint"/"Show answer" buttons —
three copies of the same hand-rolled advance-button style object — never
used `frontend/src/components/ui/Button.tsx`, the app's own design-system
button (press-scale feedback via `--press-scale`, `disabled` opacity/cursor
handling, tone/variant system) already wired into 8 other pages. Same root
cause for the play/pause/reset icon buttons: `IconButton.tsx` existed,
carried the same press-scale polish, and was imported **nowhere in the
app** — every icon-only control (including Simulation.tsx's) was a raw
`<button>` with no hover/press feedback and a 12px icon, below the
`ui-ux-pro-max` skill's own icon-legibility guidance.

**Fixed by wiring the existing components, not writing new ones:**
`Simulation.tsx`'s two play/pause/reset control pairs now render
`<IconButton tone="neutral" filled>` (icons bumped 12px → 16px — legible
inside a 44px target, matches the touch-target-size guideline the file's
own comment already cited); its "Continue" button, `AtomCardRenderer.tsx`'s
"Show next step", and `GuidedWalkthrough.tsx`'s advance button (the
convention's origin, which the other two explicitly "reuse verbatim") all
now render `<Button variant="grey" tone="neutral" size="md">` with a
`style` override for `background: var(--surface-fill-strong)` (needed
because each of these three cards' own wrapper background is
`var(--surface-fill)` — the `Button` component's default `grey` fill would
nearly vanish stacked on the same token). GuidedWalkthrough's call also
overrides `fontSize`/`minHeight` to satisfy its own locked test invariants
(17px body floor, 44px touch target via `minHeight` specifically — `Button`
sets `height`, not `minHeight`, so the two coexist rather than conflict).

**One button language now has one implementation.** A future restyle of
"tap when you're ready" changes `Button.tsx` once instead of three
independently-drifting copies — closes the exact "parallel truths that
drift" bug class named elsewhere in this doc (v4.25.0's model-id drift).

**Deliberately not touched, named honestly:** `DecisionTreeWalkthrough.tsx`
has the same hand-rolled pattern on its option/back/restart buttons, and
`AtomCardRenderer.tsx` has more of it on the prev/next nav arrows and the
"Not yet"/"Got it" recall buttons — same fix, different files, tracked in
TODOS.md rather than expanded into this pass.

**Tests:** frontend 2604/2604 unchanged (component swap, not new
behavior). `tsc --noEmit` clean.

**Second pass, same day — the deferred items above, closed.** "Check for
other buttons similarly" audited every remaining `<button>` in
`frontend/src/components/lesson/` (10 files) individually rather than
mechanically swapping all of them onto `Button`/`IconButton`. Two classes
came back:

- **Same shape family, fixed:** `DecisionTreeWalkthrough.tsx`'s Back
  (leading icon via `Button`'s `icon` prop) and Restart buttons — its
  OPTION buttons stay hand-rolled on purpose (the file's own docblock:
  "Full-width 44px choice buttons", a list-row shape `Button`'s centered
  pill doesn't fit). `AtomCardRenderer.tsx`'s "Not yet"/"Got it" recall
  pair (`Button` with `full` for the existing flex-1 half-width layout —
  "Got it" needed no style override at all, since `variant="filled"
  tone="mastery"` already resolves to exactly `var(--green)` /
  `var(--text-on-accent)`), its prev/next nav chevrons, and its
  show-visually-first toggle — all three were genuine **44px touch-target
  violations** (~36px hand-rolled tap zones), not just missing press
  feedback, so this doubled as a `touch-target-size` fix per
  `ui-ux-pro-max`'s own severity-High guideline. `Verify.tsx`'s inline
  "Check" submit button got `Button size="sm"` rather than the 44px `md`
  used everywhere else — it sits beside a compact text input in one row,
  and a full-height button there would tower over its own input rather
  than fix anything.
- **Different shape family, correctly left alone:** `ConceptMathViz.tsx`'s
  accordion header, `ProblemStatementBlock.tsx`/`AnswerReveal.tsx`'s
  full-width disclosure rows, `WhyThisHelps.tsx`'s plain underlined text
  link, `interactives/Recall.tsx`'s whole-card flashcard flip, and
  `interactives/Quiz.tsx`'s full-width MCQ option rows are all
  deliberately NOT the centered-pill/circle shape `Button`/`IconButton`
  render — forcing the swap there would have been a visual regression,
  not a fix, so they were reviewed and excluded rather than silently
  skipped.

`IconButton.tsx` gained two props it needed to keep pace with `Button.tsx`:
`style` (so a caller can keep a token-driven background — e.g. the
show-visually toggle's green "on" tint — the same way every `Button` call
in this pass already could) and `disabled` (opacity + `cursor: not-allowed`
+ suppressed press-scale, matching `Button`'s existing contract; the
prev-arrow at index 0 needed it).

**Tests:** frontend 2604/2604 unchanged. `tsc --noEmit` clean.

---

### Content delivery: a first-principles review (2026-09-03)

`/design-review`, invoked not on a live URL but on the question "why did
content delivery get it right/wrong, where to concentrate, how to explain
more in less." Full findings, evidence, and priority order:
`docs/designs/2026-09-03-content-delivery-first-principles-review.md`. No
live browser in this sandbox — source-level review against the real
pedagogy/generation code and the real corpus (101 concepts, 1,723 atom
files), not a screenshot audit.

**Verdict, in one line:** the density discipline this platform already
built (stance guidance blocks, `ASSURED_PROSE_BUDGET`, the
`ci:variant-agreement` gate) is real and works — it just has a coverage
gap wide enough to miss the platform's own newest content, and one atom
type slipped through without ever being covered at all.

**Finding 1 — the prose-budget gate can't see resonance-beat text.**
`countProseWords()` strips every fenced block before counting, on the
(once-true) assumption a fence is 15-30 lines of JSON, never prose. Since
resonance beats (v4.44.0), a beat-carrying hook's `narration_steps[].text`
— what a student actually reads while the scene plays — lives inside that
same fence. Measured corpus-wide with two new pure functions,
`countBeatProseWords()`/`countTotalReadingLoad()`
(`src/content/prose-budget.ts`): 102 of 1,723 atoms carry a beat scene, and
the gate undercounts every one, up to 6.1x (`matrix-inverse/hook-assured.md`:
gate sees 28 words, real reading load 172). `matrix-operations/hook.md`
reads at 287 words in practice against a 64-word gate reading — more than
the platform's *widest* existing ceiling (worked_example's 220), reported
as under a third of it.

**Finding 2 — `common_traps` is the longest atom type and the only
unbudgeted one.** No `ASSURED_PROSE_BUDGET` entry, no `stances:` guidance
block in any topic template, no density check anywhere. Measured across
all 101 concepts: average 146 words, 18 of 101 already exceed 220 (every
*other* atom type's widest ceiling) with no ceiling of their own; worst
case 406 words (`symmetric-matrices`). This is the wrong atom type to
leave undisciplined: `pedagogy-engine.ts`'s error-streak handling (E5)
force-injects a student's `common_traps` atom to the front of the queue
after 3 consecutive wrong answers — exactly the moment cognitive load is
already highest (Eysenck's Attentional Control Theory: anxiety consumes
the working-memory capacity a task needs).

**Shipped, report-only by design.** `countBeatProseWords()`/
`countTotalReadingLoad()` (`src/content/prose-budget.ts`, 10 new tests) —
mirrors `resolveBeatText`'s exact per-stance fallback rather than a second
copy of that rule, via the existing shared `interactive-spec-loader.ts`.
`scripts/check-reading-load.ts` (`npm run content:reading-load-report`, 4
new tests on its pure filename-parsing helper) is the corpus-wide report
this doc's numbers came from — always exits 0, never a CI gate. Turning
either finding into a blocking gate needs an editorial ceiling decision
(what SHOULD a beat-carrying hook or a `common_traps` atom cost in words)
this review measured but did not make unilaterally — see the design doc's
"Where to concentrate" section and TODOS.md for the scoped follow-up.

**Deliberately not done:** no content was rewritten (every number is a
measurement, not a rewrite instruction); the intro-paragraph/beat-1
redundancy check ran on one example (`eigenvalues.hook.md`), not the
corpus; `common_traps`'s guidance block and budget entry were not
authored; `pedagogy-engine.ts`'s error-streak behavior is untouched — it
correctly prioritizes `common_traps` when a student struggles, the gap is
that atom type's own length discipline, not the selector.

**Tests:** backend 4678 → 4692 (+14). `tsc --noEmit` clean.
`ci:variant-agreement` unchanged (610 pairs, clean).

---

### `/investigate` on a live-QA report: cramped CTAs + Cayley-Hamilton silo (2026-09-03)

Three screenshots, four numbered asks: the practice-page CTA row reads
cramped; explanation content isn't resonant (mandatory: motion/animation/
progression); Cayley-Hamilton's intuition and its interactive hook read as
two disconnected pieces, not one; static text + unglossed jargon is
"non-negotiable" to fix; `mnemonic`/`intuition`/`hook` should replace
static text with a more intuitive interface. Root-caused each before
touching anything.

**Cramped CTAs — root cause confirmed, not assumed.**
`PracticeAttemptPage.tsx`'s `NEXT_MOVE_BUTTON_BASE` set two multi-word
labels ("Explore this concept", "Practice more like this", each with a
leading icon) at `flex: 1` inside a narrow card — on a phone-width screen
each pill got ~150-170px, not enough for either label on one line, so text
wrapped 2-3 lines inside a nominally-44px pill. `fontSize` was also
`var(--text-caption)` (12px) — below DESIGN-SYSTEM.md's own 13px floor for
anything a student reads. Fixed: the row is now `flexDirection: 'column'`
(each button full-width, stacked) at `var(--text-subhead)` (15px). The
floating `TutorFab` visually crowding the row in the screenshot is not a
FAB bug — it sits at a fixed, safe-area-aware screen position; the crowding
was a symptom of the same cramped row scrolling into that spot, not a
separate defect, so it wasn't touched.

**Cayley-Hamilton — the concrete worked example the report asked to
"generate."** `intuition.md` was a wall of static prose (274 real prose
words: a formal definition, a 3-item "Why This Matters" numbered list, a
closing paragraph) with zero interactive content and zero connection to
`hook.md`'s own resonance-beat scene — literally the "interactive and text
are in silos" complaint, verified by reading both files side by side.
Rewritten: the new `intuition.md`/`-shaken.md`/`-assured.md` triple carries
a NEW resonance-beat scene (predict-before-reveal, matching the
`ped_predict_before_reveal` pedagogy pattern) that reuses the SAME matrix
$A=\begin{pmatrix}1&1\\0&2\end{pmatrix}$ and the SAME eigen-directions
`hook.md` already established — closing the silo by continuing one thread
instead of introducing a second disconnected example. The scene's own
"why" IS the theorem's intuition: on each eigen-direction $A$ acts like its
eigenvalue, both eigenvalues are roots of $p(\lambda)$, and since the two
eigen-directions span the plane, $p(A)$ must be zero everywhere — watched,
not asserted. A trap beat is honest about scope: this argument only
directly works for a diagonalizable matrix; the general proof (any size)
goes through the adjugate identity instead, named explicitly in the
`assured` variant rather than left as a silent overclaim. Every numeric
claim (eigenvalues 1 and 2, $p(1)=0$, $p(2)=0$, $A^2=\begin{pmatrix}1&3\\0&4\end{pmatrix}$)
verified live against Wolfram|Alpha before authoring. Base prose word
count: 274 → 70 (the interactive scene now carries what the numbered list
used to spell out) — a real, measured "explain more in less," not a claim.
`mnemonic.md` (no stance variants to keep in sync) got a lighter pass:
"trace" and "determinant" glossed in plain words on first use, the
unexplained "adjugate method" comparison removed rather than left dangling.

**Verified against the real gates, not just typechecked.**
`ci:interactive-specs` (386 blocks, +3), `ci:variant-agreement` (610 pairs,
unchanged — the new fence is byte-identical across all three stance
files), `ci:katex-fences` (1723 files), `ci:content-integrity` (1729
files), `ci:la-walkthrough` (26/26, cayley-hamilton's interactive-leg
count 6→9) all clean. Full suites: backend 4692/4692, frontend 2604/2604,
`tsc --noEmit` clean both sides, `npm run ci` (18 gates) clean.

**Scope, named honestly — this fixed ONE concrete example, not the
corpus.** The report's "mnemonic, intuition, hook... wherever needed" and
"non-negotiable" language reads as a corpus-wide standard, but only
Cayley-Hamilton's `intuition`/`mnemonic` were touched (hook already had a
real scene, confirmed by reading it before assuming otherwise). No second
interactive scene was built for `mnemonic.md` — a slider-driven
`manipulable` widget (trace/determinant → $A^{-1}$) is a real, distinct
next step, not attempted here given the same authoring + Wolfram-verification
cost as the intuition scene. The same wall-of-text pattern almost
certainly recurs on other concepts' `intuition`/`mnemonic` atoms — not
audited corpus-wide in this pass. Both tracked in TODOS.md with the exact
pattern that worked here (reuse the hook's own example, verify every
number, keep fences byte-identical across stance triples) as the template.

### `/investigate` follow-up: the "revert" claim was false, and the trace-concept silo is the same pattern again (2026-09-03)

Second `/investigate` pass the same day, on a new report: "static
unintuitive text" on `trace`'s intuition card, an ELI5/Indian-English
register ask, and a claim that a prior motion/progression fix "got
reverted." The revert claim was investigated before anything else was
touched, per the skill's Iron Law and the "claimed limitations need
evidence" rule — checked against two independent primary sources, not
agreed with or dismissed on the user's word alone.

**The Cayley-Hamilton fix was NOT reverted.** `git log origin/main` shows
no revert commit; `git show origin/main:.../cayley-hamilton/atoms/
intuition.md` confirms the fixed content is on `main` right now. More
directly: Render's own deploy history shows commit `13efd76` — the commit
that shipped the Cayley-Hamilton fix — as the service's current `live`
deploy, finished `2026-09-03T13:40:50Z`. Nothing regressed; the resonance-
beat mechanism is exactly as live as it was when it shipped. The likely
explanation for the report: the attached Cayley-Hamilton screenshot is
byte-for-byte the same one from the PREVIOUS `/investigate` turn earlier
the same day (a stale/reused screenshot, not a fresh repro), and/or it
predates that turn's deploy.

**The `trace` concept has the exact same silo defect Cayley-Hamilton had,
independently confirmed by reading `hook.md` first.** `trace/atoms/
hook.md` is genuine, working resonance-beat content — matrix
$A=\begin{pmatrix}5&1\\2&4\end{pmatrix}$, a 5-beat scene establishing
eigenvalues $6$ and $3$ on directions $(1,1)$/$(1,-2)$, a trap about
summing all four entries instead of the diagonal. `intuition.md` was a
single dense abstract paragraph with zero shared numbers and zero
interactivity — the same "interactive and text are in silos" pattern,
found for the second time, confirming the TODOS.md item's prediction that
it "likely recurs." `intuition-shaken.md` was a second, independent
instance: it used an entirely different (already-triangular) matrix than
the concept's own hook.

**Fixed with the now-twice-proven template.** All three files
(`intuition.md`/`-shaken.md`/`-assured.md`) get a byte-identical new
`interactive-spec` fence reusing hook's exact matrix and parametric
formula, this time telling the WHY hook doesn't cover: trace is
basis-independent — change the axes you describe $A$ in and the diagonal
entries change, but their sum never does, because the eigenvalues (the
real stretch factors) don't move under a change of basis. A predict cue
("would that $9$ still show up under different axes?") precedes the
reveal, an explain-why beat states the similar-matrices/shared-
characteristic-polynomial reason, and a trap beat calls out the false
inference (seeing the diagonal entries change and assuming the trace
changed). Every numeric claim (eigenvalues $6$/$3$, trace $9$, the exact
plotted points at $t=45°$ and progress $0.824$) is reused verbatim from
hook's own already-shipped, already-verified values — hand-verified again
independently via a local Python script (Wolfram MCP was disconnected
this session) before authoring, not re-derived from scratch. Base prose:
ELI5, Indian-English register, short sentences, ~90 words total (intro +
closing) — down from one 175-word paragraph with no interactivity.
`intuition-shaken.md` is rewritten onto the SAME matrix as hook (closing
its own independent silo instance) rather than the old unrelated
triangular example. `intuition-assured.md` keeps its existing
Vieta's-formula/similarity-invariance content — genuinely good, terse,
exam-relevant — and only gains a one-line bridge plus the shared fence.

**Verified against the real gates.** `ci:interactive-specs` (389 blocks,
+3), `ci:variant-agreement` (610 pairs, unchanged — fence byte-identical
across the trio), `ci:katex-fences` (1723), `ci:content-integrity` (1729),
`ci:la-walkthrough` (26/26, trace's own interactive-leg count 6→9,
matching the Cayley-Hamilton precedent's identical delta) all clean. Full
suites: backend 4692/4692, frontend 2604/2604, `tsc --noEmit` clean both
sides, `npm run ci` (18 gates) clean.

**Scope, named honestly — one more concrete example, still not the
corpus.** This is the SECOND of an open-ended set of concepts likely to
have the same silo defect. `npm run content:reading-load-report` (shipped
earlier the same day) remains the designated worklist source for a
systematic audit; not run as a triggered sweep in this pass, since the
report named one specific concept (`trace`), not a corpus-wide ask.
TODOS.md's existing "audit other concepts" entry stands, now with a
second confirmed instance as evidence rather than a prediction.

### Method-selection wizard: `startAt` deep link (2026-09-03)

`/office-hours` brainstorm on the wizard-mistake-loop feature (W2.5's
`DecisionTreeWalkthrough`, PRs #157-158's `?concept=&mistake=` context):
the wizard always opened at its tree's root, so a student diagnosed with
ONE specific mistake still had to re-walk the whole topic classification
chain (4-6 forks) to reach the fork that actually mattered — "tailored to
the mistake" was aspirational, not real. `item.node_id` (the concept) was
already threaded through the URL and unused for routing; `failure_tag` is
too coarse to pick a fork (it says "method mix-up", not which one), but
concept id is exactly the right granularity.

**Shipped:**

- `DecisionTreeWalkthrough` gains an optional `startAt?: string` prop —
  the node id to open at instead of `branches.nodes[0]`. Render-time only,
  never part of the persisted spec (so an authored `branches` tree still
  means the same thing everywhere it's rendered). Unknown/absent id fails
  closed to the true root — never a broken render, never a guess.
  `restart()` returns to the deep-linked fork ("try this decision again",
  not "abandon the shortcut"); a separate "See the full picture from the
  top" control (rendered only while the deep link is in effect) walks from
  the true root. `GuidedWalkthrough` forwards `startAt` straight through;
  `InteractiveSidecar`'s lesson-embedded call site passes nothing, so a
  lesson-authored branching walkthrough is unaffected.
- `CONCEPT_TO_WIZARD_NODE` (`method-selection-trainers.ts`) — a small
  per-trainer `concept → node id` map, verified against the real
  `node_id` values in `data/practice-items/gate-ma-la-*.json`,
  `gate-ma-vector-calculus.json`, `gate-ma-probability-statistics.json`
  (not assumed from the concept graph). `wizardStartNodeForConcept()`
  resolves it; a test asserts every mapped node id is real in that
  trainer's own tree, so the map can't silently drift from the content.
  Coverage is partial and the two reasons are different: linear-algebra
  and vector-calculus map every fork that IS a method decision (a few
  purely foundational vector-calculus concepts correctly fall through to
  the classification root, since they aren't "which theorem" questions);
  distributions can only skip the count-vs-measurement root question,
  because the curriculum has no per-distribution concept id (only
  `discrete-distributions`/`continuous-distributions`) — a real content-
  model limit, named rather than silently narrowed.
- `TheoremWizardPage`/`DistributionSelectorPage` resolve `startAt` from
  the existing `?concept=` param and pass it through — zero new routing,
  zero new authoring for the 3 existing trainers.

**Deliberately not done, tracked as the next wave:** the micro-solver
authoring pass (a single fork + leaves as its own authorable unit,
concept-by-concept, for the other 8 topic families that have no tree at
all) — the second half of the brainstormed workflow. Follows the same
5-6-concept subagent batch pattern used elsewhere in this doc, with
Wolfram/hand-verification on every claim before any content ships.

**Tests:** 10 new (`DecisionTreeWalkthrough.test.tsx` +7 deep-link/escape-
hatch cases, `method-selection-trainers.test.ts` +3 map-resolution/self-
consistency cases). Frontend suite 2604 → 2614/2614. `tsc --noEmit` clean.

### Micro-solver wave 1: 4 more topics get a tailored wizard (2026-09-03)

`/loop` continuation of the wizard brainstorm above — the "close coverage
for the other topic families" half. 4 parallel Claude Sonnet subagents
(isolated worktrees, no shared file access, real content only — no repo
edits, drafts written to a scratch path) each authored ONE single-fork
`MethodSelectionTrainer` for a topic with no wizard before this: root-
finding method choice (`numerical-methods`), which-transform choice
(`transform-theory`), first-order-ODE method choice
(`differential-equations`), shortest-path algorithm choice
(`graph-theory`). Every claim was hand-verified by the authoring agent
(Wolfram MCP was disconnected all session) before this file incorporated
it — Newton-Raphson's two iteration steps checked against direct
arithmetic, the ODE's separability/non-linearity/non-exactness checked via
∂M/∂y vs ∂N/∂x and a degree check (confirmed with SymPy locally), the
Laplace/Fourier derivative identities and the four shortest-path
algorithms' complexity/correctness conditions checked against standard
results. All four merged in, wired, and validated by this session, not
committed sight-unseen.

**Same mechanism, no new component.** A "tree" with one node is the
identical `BranchesSpec` shape a 6-fork tree uses — `DecisionTreeWalkthrough`
needs no changes to render it, and the `steps[0]` `GuidedWalkthroughSpec`
still requires (fallback path) is derived directly from the node/best-leaf
pair, never a second independently-authored copy. `THEOREM_WIZARD_TRAINERS`
grew from 2 keys to 6; `wizardRouteForTopic()`
(`PracticeAttemptPage.tsx`) grew its allowlist to match;
`CONCEPT_TO_WIZARD_NODE` gained one entry per new trainer's concept(s) —
`transform-theory` tags all three transform concepts
(`laplace-transform`/`fourier-transform`/`z-transform`) to its one shared
fork, mirroring how `la_invertible` was already shared by two LA concepts.

**Coverage after wave 1:** 6 of 10 topic families have a wizard
(linear-algebra, vector-calculus, distributions, numerical-methods,
transform-theory, differential-equations, graph-theory — 7, not counting
distributions' different route). Still bare: calculus, complex-variables,
discrete-mathematics — tracked in TODOS.md as the next batch, same pattern.

**Tests:** 15 new (`method-selection-trainers.test.ts` +15: per-wave-1-
trainer single-node-tree assertions, steps-derived-not-duplicated checks,
concept-map self-consistency, the shared transform-theory fork). Full
route-key list test updated (2 keys → 6). Frontend suite 2614 → 2636/2636.
`tsc --noEmit` clean.

### Wizard surfaced in the knowledge graph, not just after a wrong answer (2026-09-03)

Follow-up ask: "see if this is connected to any knowledge graph, or if not,
something can be done here." Researched before building anything —
`src/constants/concept-graph.ts`/`data/curriculum/gate-ma.yml` is the real
prerequisite DAG (every wizard-covered concept has declared
`prerequisites:`, e.g. `diagonalization` needs `[eigenvalues,
vector-spaces]`); `FrontierSpine.tsx` is its one visual surface (a
topological spine, never a literal graph — see the T13 section above). A
repo-wide grep for `"theorem-wizard"`/`"distribution-selector"` found
exactly one linker outside the wizard's own files: `PracticeAttemptPage`'s
reactive post-wrong-answer CTA. The wizard was invisible to the knowledge
graph in both directions — not reachable from browsing it, and not
consulting its prerequisite edges at all (`CONCEPT_TO_WIZARD_NODE` is a
flat id→node lookup, confirmed unchanged).

**Shipped:** `FrontierSpine.tsx`'s per-concept bottom sheet (the existing
"Builds on: …" detail view, opened by tapping any row) now also renders a
"Which method applies?" link when the tapped concept resolves through
`wizardStartNodeForConcept('linear-algebra', concept)` — nothing when it
doesn't, since a guessed/generic link would be worse than none. Lives in
the sheet, not the row itself, to keep ONE focal element per screen (the
row's own tap target stays "open detail", not "open detail OR launch a
wizard"). Reuses the exact indigo-tint/`GitBranch` visual identity
`PracticeAttemptPage`'s reactive wizard CTA already established, for one
consistent "this leads to the wizard" affordance app-wide rather than two
independently-styled ones. `FrontierSpine` is LA-only today (its own H1 is
hardcoded "Linear Algebra" — see the T13 doc comment), so the trainer id is
always `'linear-algebra'`; a future multi-topic frontier would need to
thread the topic through instead of hardcoding it.

**Deliberately not done, and why:** routing FROM the live prerequisite-
alert path (`traceWeakestPrerequisite`/`refreshPrerequisiteAlerts` in
`concept-graph.ts`/`student-model.ts`) into the wizard when a WEAK
PREREQUISITE of a wizard-covered concept is flagged — a real forward-
looking nudge, not just a reactive one — was considered and deferred as
separate, larger wiring into an active production path (TODOS.md). Feeding
a wizard leaf INTO `StudentModel`/FIRe credit was considered and rejected
outright, not deferred: `DecisionTreeWalkthrough.test.tsx` has a structural
guard against exactly this (`"A future onLeaf/onGraded prop would be the
hole E5 closes"`) — the leaf's `best` flag is client-visible, so treating
it as a trusted grading signal would reopen the client-trusted-grading
class of bug the mock-exam fix closed.

**Tests:** 3 new (`FrontierSpine.test.tsx` — link present for a mapped
concept with the right href, absent for an unmapped one, 44px touch
target). Existing 7 tests now render through `MemoryRouter` (the sheet's
link requires a Router context). Frontend suite 2636 → 2639/2639.
`tsc --noEmit` clean.

### Wizard routed from weak prerequisites — student takeaway, teacher detail (2026-09-04)

Direct follow-up: "look at how this connection to knowledge graph can help
students focus on overcoming their weak areas... under the hood
computation need not be visible... at least key takeaways. the teacher
might get more information." Closes the TODOS.md item from the previous
section — the BACKWARD direction (weak prerequisite → wizard), not just
forward (browse graph → wizard).

**The live path already existed and was already student-visible** —
research before building anything found `refreshPrerequisiteAlerts`
(`src/gbrain/student-model.ts`) fires on every real attempt
(`POST /api/gbrain/attempt`), writes `prerequisite_alerts` to the student
model, and `ErrorDiagnosis.tsx`'s "Foundation gap detected" card already
renders `shaky_prereqs` in plain language on `PracticePage` after a wrong
answer. What was missing was the wizard connection on top of it.

**`wizardRouteForConcept(conceptId)`** (`method-selection-trainers.ts`) —
resolves a full route from a bare concept id alone, searching every
trainer's `CONCEPT_TO_WIZARD_NODE` map (unlike `wizardRouteForTopic`,
which starts from a known topic). Handles the `distribution-selector`
special case (a dedicated page, not a `/theorem-wizard/:module` route).
Returns `null` for an unmapped concept — no guessed link.

**Student takeaway, not the computation.** `ErrorDiagnosis.tsx`'s
existing "Foundation gap detected" card gains one line — "Which method
applies?" — when `wizardRouteForConcept(prerequisiteAlerts[0].concept)`
resolves. No mastery numbers, no distance metrics, nothing the student
didn't already see in that card's plain-language "Strengthen first: …"
line; the link is the one new actionable thing.

**Teacher detail.** `student-audit.ts`'s `auditStudent()` (backend,
`@ts-nocheck`) — the source of `GET /api/gbrain/audit/:sessionId` and the
`StudentAuditPage` at `/audit` — gains a `wizard_route: string | null`
field on each `prerequisite_alerts` entry. `StudentAuditPage.tsx`'s
existing "Foundation Alerts" card renders it as "Method-selection wizard
available for `<concept>`" when present — visible only in the teacher-
facing detail view, never the student-facing one.

**Backend can't statically import frontend code** (`rootDir: "./src"`
forbids it — same constraint `interactive-spec-loader.ts` documents).
`src/content/wizard-route-loader.ts` is the SAME guarded dynamic-import
pattern, one new file, so the backend never carries its own copy of
`CONCEPT_TO_WIZARD_NODE` to drift from the frontend's (exactly the
"parallel truths" bug class named in this doc's v4.25.0 section). Falls
back to `null` when `frontend/src` isn't on disk (the demo image) — the
teacher detail line simply doesn't render; nothing crashes.

**Still deliberately out of scope**, per the prior section's TODO entry:
this wires the ALERT surfaces the alert already reaches (student's
post-wrong-answer card, teacher's audit report) — it does not add a NEW
proactive nudge somewhere a student would see a weak-prerequisite alert
before ever attempting the downstream concept (e.g. on `KnowledgeHomePage`
before a wrong answer happens at all). That's a bigger, separate feature
decision, not a wiring gap.

**Tests:** 15 new — `method-selection-trainers.test.ts` +4
(`wizardRouteForConcept`: theorem-wizard route, distribution-selector
route, null for unmapped/absent, URL-encoding), `wizard-route-loader.test.ts`
+5 (backend loader: resolves, real mapping, null-not-throw, caches, reset),
`ErrorDiagnosis.test.tsx` +4 (new file: link present/absent, plain-language
line unchanged either way, no alert → no card), `StudentAuditPage.test.tsx`
+2 (new file: teacher link present/absent). Backend suite 4692 → 4701/4701
(365 files). Frontend suite 2639 → 2649/2649. `tsc --noEmit` clean both
sides. `npm run ci` (18 gates, including `ci:boot`) clean.

### `/design-review` on a live-QA report: hook coordinate focus, static-text motion, and wizard coverage for all 10 topics (2026-09-04)

Four asks in one report: ELI5/"convey more in less" outside plain static
text; a hook's coordinates/vectors should stay in focus as the narration
discusses them; motion/animation/progression used generously across
sections; every practice question mapped to a concept-level solver, "any
topic of any exam." Root-caused against three screenshots (all three, it
turned out, the same concept — `positive-definite-matrices` — a Smart
Practice MCQ, its "Correct" result panel, and its hook mid-scroll) before
touching anything, per the skill's own discipline.

**Hook coordinate focus — new `focus_eigen` schema field.**
`Simulation.tsx`'s `LinearMapScene` already highlights the payoff
eigen-arrows green with a `×λ` label, but only once the scene's `emphasize`
beat (the reveal) is reached. `positive-definite-matrices/atoms/hook.md`'s
beat at `at_progress: 0.45` names specific coordinates and stretch factors
("The one along $(1,0.618)$ stretched to about 3.618 times its length...")
a full beat BEFORE the reveal — during that beat the arrow it is talking
about rendered identically to the other 15 anonymous ones, exactly the
reported defect. `focus_eigen?: number[]` (new, additive field on
`narration_steps[]`, `frontend/src/components/lesson/interactives/types.ts`)
names which `linear_map.eigen[]` indices a beat is discussing RIGHT NOW,
independent of the reveal: the named arrow(s) draw at a heavier ink stroke
(never green — nothing is confirmed as the payoff yet) plus a coordinate
label reading the AUTHORED direction (not the internal normalized unit
vector, which would silently disagree with the narration's own numbers).
Validated against `linear_map.eigen.length` (out-of-range/negative/empty
refused) and refused entirely on a scene with no `linear_map` (nothing to
index). Wired into `positive-definite-matrices/atoms/hook.md` +
`hook-shaken.md` + `hook-assured.md` (byte-identical fence, `focus_eigen:
[0,1]` on the beat naming both eigen-arrows) — a corpus-wide sweep for
other scenes with the same defect is future work, not attempted here (this
pass fixed the reported instance and shipped the reusable mechanism).

**A propagation bug caught before it shipped, not after.** The first
attempt to copy the updated fence from `hook.md` into its two stance
variants used `grep -o` (single-line matching) to extract/compare the
fence — silently wrong on a 3-line ` ```interactive-spec\n{...}\n``` `
block, since `grep -o` never spans lines without `-z`/`-P`. The "same
fence" diff check that seemed to pass was comparing two empty outputs, and
the follow-up propagation script substituted the real fence with that same
empty string, deleting it from both variant files entirely.
`ci:variant-agreement` caught it immediately (`[interactive-dropped] base
has 1 fenced blocks, variant has 0`) — re-fixed with a proper
`re.DOTALL`-based Python extraction and re-verified byte-identical before
moving on. Recorded here because the almost-shipped failure mode (a
shell one-liner that looks right against a single-line pattern, silently
wrong against a multi-line one) is a real trap for future content edits
touching these fenced blocks.

**Static-text motion — the practice-item solution-steps panel.**
`PracticeAttemptPage.tsx`'s post-answer "D1 = 4 > 0. D2 = det(A)..." panel
(`result.solution_steps`) rendered as a plain `<ol><li>` of raw strings —
the exact "static text, no motion" complaint, and also the same
"independently-drifted content surface" bug class named elsewhere in this
doc (`ConceptMathViz`'s pre-2026-09-02 disconnection, the
`guided_walkthrough` bracket-array bug, the trap-row raw-LaTeX bug): any
step authored with LaTeX would have leaked its raw source instead of
typesetting, since this panel never went through `MarkdownAtomRenderer`.
Now routed through it with `structured` — one shared component instead of
a second copy of list rendering, which gets both fixes for free: real
KaTeX typesetting AND the same hairline-separated, once-on-mount staggered
row entrance (`.vidhya-atom-body--structured`) every other structured list
in the app already has.

**Wizard coverage — micro-solver wave 2, all 10 topic families closed.**
`positive-definite-matrices` was ALREADY correctly wired
(`CONCEPT_TO_WIZARD_NODE['linear-algebra'].positive-definite-matrices ->
'la_definite'`, whose `la_leaf_diag_entries` leaf directly names the exact
trap in the screenshot's wrong MCQ option — "diagonal entries are
positive" — so no fix was needed there, just confirmation the existing
system already covers this exact question). The genuinely open half of
the "any topic" ask was the 3 remaining bare topic families named in
TODOS.md's wave-2 entry: **calculus, complex-variables,
discrete-mathematics.** Closed with the same single-fork pattern as wave 1
(`CALCULUS`/`COMPLEX_VARIABLES`/`DISCRETE_MATHEMATICS` in
`method-selection-trainers.ts`), every numeric claim hand-verified via
local SymPy (Wolfram MCP was disconnected this session, same fallback wave
1 used):
- **calculus** — ∫x·ln(x)dx: integration by parts is correct
  ((x²/2)ln x − x²/4 + C, SymPy-confirmed); the substitution trap shows
  u = ln x just relabels the problem into a NEW integral (u·e^(2u)du) that
  itself needs by parts; partial fractions is refused outright since
  ln(x) is transcendental, not a polynomial ratio.
- **complex-variables** — ∮ 1/[(z−1)(z−3)]dz on |z|=2: only z=1 is inside,
  so direct Cauchy Integral Formula gives −πi (SymPy residue-verified).
  The trap leaf shows what happens if a student wrongly includes the
  OUTSIDE pole (z=3) in a residue sum: −1/2 + 1/2 = 0, silently zeroing
  out the correct nonzero answer — a concrete, computed trap, not a vague
  "wrong" gesture. The third leaf correctly refuses Cauchy's theorem
  (needs zero poles inside, and there is one).
- **discrete-mathematics** — "divisible by 2 or 5 from 1-100" is
  inclusion-exclusion (50+20−10=60), not a direct `C(n,r)` combination
  (wrong question shape — no selection is happening) or pigeonhole (an
  existence principle, never a counting one).

`THEOREM_WIZARD_TRAINERS`, `ALL_METHOD_SELECTION_TRAINERS`,
`CONCEPT_TO_WIZARD_NODE`, and `PracticeAttemptPage.tsx`'s
`wizardRouteForTopic()` allowlist all gained the three new keys — same
diff shape as wave 1. One existing test broke as a DIRECT, expected
consequence: `PracticeAttemptPage.test.tsx`'s "unmapped topic" example
used `complex-variables`, which is now mapped — swapped for a genuinely
fictional topic string (`some-topic-with-no-trainer`) rather than a real
subject that happens not to be covered, so the test still means what it
claims to mean.

**Coverage after wave 2: all 10 of 10 GATE-EM topic families have a
wizard entry point** (linear-algebra, vector-calculus,
probability-statistics, numerical-methods, transform-theory, graph-theory,
differential-equations, calculus, complex-variables,
discrete-mathematics) — up from 6/10 after wave 1. TODOS.md's wave-2 entry
is closed and replaced with an honest scope note: wave 2 covers exactly
one concept (or a small cluster) per new topic, not every concept in
those topics — most concepts in calculus/complex-variables/discrete-math
still have no fork of their own, tracked as a possible wave 3.

**Tests:** 4 new (`types.test.ts` focus_eigen validation) + 1 new
(`Simulation.test.tsx` render/clear behavior) + 3 new
(`PracticeAttemptPage.test.tsx` solution_steps rendering, incl. a LaTeX
step actually typesetting through KaTeX) + 10 new
(`method-selection-trainers.test.ts` wave-2 single-fork + concept-map
tests) + 1 existing test's fixture corrected. Frontend suite 2649 →
2678/2678. Backend untouched (frontend-only change), 4701/4701 (365
files), `1 todo` unchanged. `tsc --noEmit` clean. `npm run ci` (18 gates,
including `ci:la-walkthrough` 26/26 and `ci:variant-agreement` 610 pairs)
clean.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Design variants → invoke design-shotgun
- DevEx audit → invoke devex-review
- "Why is student X struggling?" / parent report → invoke student-audit
- "What's everyone struggling with?" / systemic patterns → invoke cohort-analysis
- "Fill problem bank" / "add more problems" → invoke content-gap
- "Is gbrain healthy?" / "check system" → invoke gbrain-health
- Mine/aggregate misconceptions → invoke misconception-miner
- Generate mock exam / full practice test → invoke mock-exam
- Weekly student email / progress report → invoke weekly-digest
