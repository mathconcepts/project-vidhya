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
npx tsx src/server.ts        # backend on :8080
cd frontend && npm run dev        # frontend on :3000 (separate terminal)
```

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
