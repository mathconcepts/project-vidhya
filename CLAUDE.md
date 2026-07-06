# CLAUDE.md

## Project: Vidhya

Vidhya is a focused, mobile-first exam-prep platform. Exam-agnostic by design — GATE, BITSAT, NEET, civil services, or any competitive exam configured via the exam adapter system. This is the active project — the legacy 7-agent system (src/index.ts, agents/) is NOT in use.

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
- `src/constants/topics.ts` — Single source of truth for 10 GATE topics (labels, icons, keywords)
- `src/constants/content-types.ts` — Single source of truth for blog content types (labels, accents)
- `src/db/auto-migrate.ts` — Applies pending SQL migrations on server startup
- `src/api/gate-routes.ts` — Core API (topics, problems, verify, SR)
- `src/api/chat-routes.ts` — AI tutor chat (SSE streaming)
- `src/api/auth-middleware.ts` — JWT verification + role-based access
- `src/verification/tiered-orchestrator.ts` — 3-tier verification engine + `registerVerifier()` for Tier 4+ extensions
- `src/verification/verifiers/types.ts` — `AnswerVerifier` interface (math correctness)
- `src/verification/verifiers/example.ts` — `AlwaysTrueVerifier` live reference; copy this when adding new verifiers
- `src/content/content-types.ts` — Content module domain types (RouteRequest, ResolvedContent, SessionMode, DeclinedReason)
- `src/content/blog-types.ts` — Blog/marketing types (renamed from content/types.ts in v2.3.0)
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

### Design System
Always read DESIGN-SYSTEM.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
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

### First-time setup (run once after cloning)
```bash
bash .claude/bootstrap-skills.sh
```
This clones gstack, installs bun if needed, and wires all skill symlinks. After this, every `/skill-name` below is available as a Claude Code slash command.

### Available gstack skills
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /setup-gbrain, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /plan-devex-review, /devex-review, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn, /context-save, /context-restore

Skills are vendored at `.claude/skills/gstack/` (cloned from github.com/garrytan/gstack). All skill directories in `.claude/skills/<name>/SKILL.md` are relative symlinks into the vendored gstack. If a skill isn't resolving, re-run `bash .claude/bootstrap-skills.sh`.

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
- **Frontend platform:** Netlify (auto-deploys via `netlify.toml`, separate repo target)
- **Deploy workflow:** none — Render watches the `main` branch directly. There is no GitHub Actions deploy step.
- **Health check:** `curl -sI https://vidhya-demo.onrender.com` — the API root returns HTTP 403 by design (auth-gated). Treat any non-5xx response as "deploy is live"; treat 502/503 as "Render is still spinning the service up."
- **Typical deploy duration:** ~2-5 minutes after push to `main`.
- **Staging:** none configured.
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

**Still deferred (the bigger roadmap, in order):**

- FSRS/SM-2 swap — A7 mapping spec first, then swap the live review scheduler.
- E1 runtime LLM budget ladder (<₹10/student/month, routing ladder, semantic help-cache).
- Cockpit drill-downs.
- Phase 4 — DKT/AKT for `StudentModel`, IRT + true CAT for `ItemSelector`.

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
