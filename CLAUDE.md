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
