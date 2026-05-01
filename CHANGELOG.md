# Changelog

All notable changes to Vidhya are documented here.

> **Operator note format** — each release includes an `Operator action` line listing any ENV vars added, migrations to run, or seed commands needed. If absent, no action is required to upgrade.

## [4.7.0] - 2026-05-01 — Concept Orchestrator v1 (Phase 4 — closed loop)

**Operator action:** none beyond `VIDHYA_CONCEPT_ORCHESTRATOR=on`. Optional env: `VIDHYA_REGEN_NIGHTLY_CAP` (default 20), `VIDHYA_REGEN_ERROR_THRESHOLD` (0.5), `VIDHYA_REGEN_FRESHNESS_HOURS` (24), `VIDHYA_PERSONAL_FAILURE_THRESHOLD` (3), `VIDHYA_PERSONAL_OVERRIDE_TTL_DAYS` (14).

### Added

- **Closed-loop nightly regen.** New `regen-scanner` job runs at 03:00 UTC (1h after `cohort-aggregator` populates `cohort_signals`). Reads atoms with `error_pct > 0.5 AND n_seen >= 10`, dedupes against atoms regenerated in the last 24h, calls the orchestrator with the misconception baked into the prompt, appends inactive `atom_versions` for admin review. Cap 20/night.
- **Freshness-gate (eng-review decision A).** Scanner refuses to run when `cohort_signals.MAX(updated_at) > 24h ago` — better silent skip than regen on stale data. Loud warning surfaced for ops.
- **Per-student personalized regen (E5).** When a student fails the same atom 3+ times in 7 days, the lesson engagement endpoint fires-and-forgets `maybeQueueRegenForStudent`. The orchestrator generates a custom variant and writes it to `student_atom_overrides` with a 14-day expiry. Cap 1/concept/student/week. Student sees the variant on their NEXT lesson load. Lesson submit unblocked.
- **"Improved" student-facing badge (E7).** Atom card header shows an emerald `Sparkles` pill when `atom.improved_since > student.last_seen_at`. Tooltip surfaces the LLM-judge or scanner's `improvement_reason` (e.g., "Cohort error 52% — top miss: students confused tangent slope with secant"). Auto-dismisses on first engagement post-improvement (uses existing engagement endpoint, no new API). prefers-reduced-motion respected.
- **Atom-loader enrichment.** New `applyStudentOverrides()` and `applyImprovedSince()` functions wired into `lesson-routes` after the existing engagement enrichment. Single SELECT each, no N+1, graceful no-op without DB.
- **Improved badge on every lesson serving.** `ContentAtom` v2 schema gains optional fields `improved_since`, `improvement_reason`, `is_student_override`, `last_seen_at`. Server populates from `atom_versions` + `student_atom_overrides` per student.

### Architecture notes

- Scheduler order: `cohortAggregator` → `regenScanner` (both DAY_MS interval, scanner is gated on freshness so order matters but isn't strictly enforced).
- Async fire-and-forget for E5 (eng-review decision A): lesson submit returns 204 immediately; the regen check + variant generation happens off-thread.
- regen-scanner is gated behind `VIDHYA_CONCEPT_ORCHESTRATOR=on` — when off, the scheduler entry returns `{status: 'skipped'}` with no DB queries.
- 15 new tests (8 backend + 7 frontend). Backend 818/818 (was 810). Frontend 92/92 (was 85). Typecheck clean.

## [4.6.0] - 2026-05-01 — Concept Orchestrator v1 (Phase 3 — admin dashboard)

**Operator action:** none beyond the v4.5.0 setup (`VIDHYA_CONCEPT_ORCHESTRATOR=on`). The new admin route `/admin/concept-orchestrator` is feature-flagged with the same env var.

### Added

- **Admin "Concepts needing content" dashboard** at `/admin/concept-orchestrator`. Priority-sorted queue showing each concept's state (missing / partial / stale / current), atom counts, cohort error %, monthly spend with violet → amber → rose progress meter, and one-click Generate. Sort weight: `exam_weight × n_students × cohort_error_pct`.
- **Live progress modal.** Click Generate → modal shows step-by-step progress (atom_type · sources · judge score) updated every 2s. Admin can close the modal — the job continues server-side. Done state shows total cost.
- **Atom version diff viewer.** Side-by-side rendered markdown for two atom versions. "Models disagree" badge on math atoms where Claude + Gemini diverged. "Why better" tooltip from the LLM-judge `improvement_reason`. One-click Activate.
- **Async generate endpoint.** `POST /api/admin/concept-orchestrator/generate` now returns a `job_id` immediately and runs generation in the background. Frontend polls `GET /api/admin/concept-orchestrator/status/:job_id` every 2s. Jobs auto-expire 5 min after completion.
- **Queue endpoint.** `GET /api/admin/concept-orchestrator/queue?limit=N&topic_family=X&state=Y` returns the priority-sorted concept list. Supports filtering by topic family and state.

### Architecture notes

- New module `src/content/concept-orchestrator/jobs.ts` — in-memory job state map, GC sweeper every 60s, 5min TTL. Server restart loses in-flight jobs (admin can re-issue Generate, idempotent for atom drafts already persisted).
- Orchestrator gets a new `on_progress` callback. Each progress event is pushed to the job's event log via `recordProgress(job_id, event)`. Frontend renders the event stream as the live progress modal.
- New module `src/content/concept-orchestrator/queue.ts` — composes ALL_CONCEPTS (in-memory) + cohort_signals + atom_versions counts + per-concept spend in 2 SQL queries (no N+1).
- 13 new tests (backend 810/810, was 797). Frontend 85/85 (no new tests on the admin page — manual verification once VIDHYA_CONCEPT_ORCHESTRATOR=on is set in production).
- V0 diff viewer ships side-by-side rendered markdown without word-level highlighting. The `diff-match-patch` integration is in PENDING.md as a polish follow-up.

## [4.5.0] - 2026-05-01 — Concept Generation Framework v1 (Phases 1+2)

**Operator action:** migration `014_concept_orchestrator.sql` runs automatically on server startup (idempotent, `IF NOT EXISTS`). Adds three tables: `atom_versions`, `student_atom_overrides`, `concept_cost_log`. To expose admin endpoints, set `VIDHYA_CONCEPT_ORCHESTRATOR=on` (default off — phased rollout per the CEO plan §9). Optional env: `VIDHYA_CONCEPT_MONTHLY_CAP_USD` (default 10), `VIDHYA_LLM_JUDGE_THRESHOLD` (default 7).

### Added

- **Concept generation orchestrator.** Given a concept_id + topic_family, generates a coherent atom draft set across 11 atom types in one batch via cascaded sources (Wolfram → Claude → Gemini → URL → uploads). New module at `src/content/concept-orchestrator/` with single entry point `generateConcept()`. Drafts persist into the existing content-studio JSONL audit log.
- **Per-topic-family templates (E6 YAML DSL).** Six bundled topic families at `modules/project-vidhya-content/templates/{calculus,linear-algebra,probability,complex-numbers,algorithms,discrete-math}.yaml`. Each defines per-atom-type scaffold, guidance, bloom_floor, and exam_pattern_required. Template loader fail-fasts at boot on schema violations.
- **PYQ-pattern grounding (E3).** Exam-relevant atom types are grounded in the top-3 past-year-questions for the topic. Generated atoms mirror real exam phrasing.
- **LLM-judge eval gate (E1).** Every atom scored 1-10 on clarity / math_correctness / exam_alignment. Min of the three gates the atom (default threshold 7). Sub-threshold atoms auto-rejected with a human-readable reason.
- **Multi-LLM consensus on math atoms (E2).** formal_definition + worked_example go through Claude AND Gemini in parallel. Disagreement doesn't block — both versions stored, surfaced to admin via diff UI flag.
- **Atom versioning (E4 foundation).** Stable atom_id + version_n model preserves atom_engagements continuity across regens. Partial unique index enforces single active version per atom. Activation is transactional.
- **Per-concept cost ceiling (E8).** Hard-stops generation mid-batch at $10/concept/month default cap. Admin sees per-concept LLM/Wolfram spend before clicking regen.
- **Admin HTTP endpoints (gated).** `POST /api/admin/concept-orchestrator/generate`, `GET .../cost/:concept_id`, `GET /api/admin/atoms/:atom_id/versions`, `POST /api/admin/atoms/:atom_id/activate`. All admin/owner/institution-only. Feature-flagged behind `VIDHYA_CONCEPT_ORCHESTRATOR=on`.

### Architecture notes

- 22 new unit tests (797 total, was 775). Backend typecheck clean for the orchestrator code.
- 1867 lines added across 21 files.
- Admin frontend dashboard (Phase 3), regen-scanner nightly job + per-student override (Phase 4), and "Improved" student badge (E7) deferred to follow-up PRs.

## [4.4.1] - 2026-05-01 — Concept-orchestrator deferred items in PENDING.md

**Operator action:** none. Documentation-only change.

### Changed

- **Roadmap visibility.** `PENDING.md` §4 (Content subsystem) gains seven entries (4.10–4.16) capturing the deferred scope from the concept-generation framework CEO plan: external best-practices KB, vector PYQ search, auto A/B testing of regen variants, self-improving prompts, bulk approve, multi-modal generation, lazy-load PYQ corpus. Each entry includes status, priority, effort, rationale, and dependencies so the work is pickable up by anyone without re-reading the full CEO plan.

## [4.4.0] - 2026-05-01 — Content Module v3: math, interactives, pillar UI

**Operator action:** none. No DB migrations. Optional `WOLFRAM_APP_ID` env var for the new `:::verify` directive — when unset, the route falls back to a deterministic local equality check, so the demo grades correctly without Wolfram.

### What changed for students

- **Atoms render real math.** Inline `$f'(x) = 2x$` and display `$$\int_0^1 x^2\,dx$$` are typeset by KaTeX. No more `\frac{}{}` ASCII bleeding through prose.
- **Interactive directives instead of monoliths.** Atoms now embed `:::interactive{ref=name}` blocks that resolve from a prefilled library — drag a slider, see the curve respond. Tier-disciplined cascade: real Desmos calculator from the CDN when reachable, falls through to a built-in SVG plotter on metered connections or CDN failure. 3D directives (`math3d`, `surface`, `vectorfield`) load mathbox.js + three.js on demand for atoms that actually need them; 2D atoms never pay the WebGL bundle cost.
- **Calm Mode.** A Sun/Moon toggle in the header collapses chrome (header, bottom nav, tutor FAB) so one concept centers on the page. Persisted across sessions.
- **Mastery dots fill emerald + a single particle on completion.** When you finish the last atom of a concept, one emerald particle floats up. Once per concept per day; honors `prefers-reduced-motion`.
- **Reading-time estimate + swipe gestures.** Each card shows a Clock estimate (220 wpm + math/directive inflation). Swipe left for next, right for previous, down on the last atom to exit. Works on iOS Safari without scroll conflict.
- **Show-me-visually toggle.** An Eye button reorders the atom sequence so visual-modality and visual_analogy atoms come first. localStorage-persisted.
- **Strategy callout on mastered atoms.** A small violet card surfaces exam emphasis + the canonical cohort trap on atoms you've shown mastery of.
- **`:::verify` directive.** Authors write `:::verify{expected="2*x*sin(x) + x^2*cos(x)"}` and the student types their answer; the server compares via `Simplify[(student) - (expected)] = 0` when Wolfram is configured, deterministic local check otherwise.

### What changed for content authors

- New authoring guide at `modules/project-vidhya-content/AUTHORING.md` with copyable frontmatter + body templates for all 11 atom types and the directive reference table.
- Prefilled interactives library at `modules/project-vidhya-content/interactives-library/<name>.json`. Reference once, reuse across atoms. `npm run lint:interactives` catches broken refs and orphan entries at build time.
- Manim authoring scaffold at `modules/project-vidhya-content/manim/` (Python, separate from the Node toolchain). `build.py` walks scenes, invokes the manim CLI at 720p30, flattens output into `media/manim/<basename>.mp4`, auto-emits the matching `.vtt` from each scene's `CAPTION_LINES`. `--check` mode for CI staleness gating. Includes `_template.py` and a real worked example: `calculus-derivatives-tangent.py`.

### Architecture notes

- 5-tier provider cascade per directive type (Static → MathBox → Desmos → GeoGebra → Wolfram). Free tiers are default; paid tiers (Wolfram) are NEVER fallback, only opt-in via env var.
- `InteractiveBoundary` walks the chain on render error and honors `prefers-reduced-data` by jumping straight to the static fallback.
- New shared `frontend/src/lib/loadScript.ts` — promise-based, deduplicated, timeout-bounded CDN loader used by Desmos and MathBox.
- Atom body parse is memoized per atom_id in `MarkdownAtomRenderer`; on parse error, plain-text fallback so atoms NEVER fail to render.

### Tests

- 45 new frontend tests across renderer, registry, calm mode, mastery particle, reading-time, loadScript, plus regression on every existing seed atom (3 concepts × 6 atoms).
- 8 new backend tests for the `:::verify` route (validation, local check, Wolfram success, numeric-residue failure, abort/timeout).
- Frontend 85/85, backend 775/775, typecheck clean, lint:interactives 0 errors.

## [4.3.0] - 2026-05-01 — ContentAtom v2 + PedagogyEngine + Daily Cards

**Operator action:** migration `013_atom_engagements_cohort_signals.sql` runs automatically on server startup (idempotent, `IF NOT EXISTS`). The new `cohort_signals` table is populated nightly by `cohortAggregator` registered in `src/jobs/scheduler.ts`. No env vars added.

### What changed for students

- **Lessons now adapt to where you actually are.** A new content engine reads your mastery and serves the right kind of explanation: a hook+intuition pair when you're cold, formal definitions and worked examples when building, common-traps drills when solidifying, and rapid recall when exam-ready. Each concept is broken into typed atoms (hook, intuition, formal definition, worked example, micro exercise, common traps) instead of one monolithic page.
- **Worked examples fade as you re-visit them.** On a second pass, the last step blanks out and you fill it in. On a third pass, the last two steps blank. You do more of the work each time — proven retention boost from cognitive load research.
- **Get three wrong in a row → the lesson switches modality.** The engine notices the streak, injects a common-traps card, and pivots from text to visual analogy (or mnemonic, or worked example) until you reset.
- **Exam in under three weeks → automatic mode shift.** When `exam_proximity_days < 21`, lessons reorder to lead with exam patterns and common traps, then recall and quick exercises. No setting to flip.
- **New /daily route.** A minimal flip-card surface that returns one recall card per concept currently due via SM-2 (filtered to mastery 0.6-0.95). Empty queue says "All caught up for today" — no clutter, no busywork.
- **"X% miss this on the practice problem" callouts on common-traps cards.** A nightly job aggregates anonymous engagement to surface real cohort error rates. Callout only appears once 10+ peers have hit the linked exercise — no callout means not enough data yet, not a missing feature.

### What changed for content authors

- **New atom format under `concepts/{concept_id}/atoms/*.md`.** Each atom is a markdown file with YAML frontmatter (id, atom_type, bloom_level, difficulty, exam_ids, optional scaffold_fade and tested_by_atom). 18 seed atoms shipped across calculus-derivatives, complex-numbers, and linear-algebra-eigenvalues.
- **`meta.yaml` is additive.** Existing fields (title, exams, tags, contributor) preserved; new optional fields are `learning_objectives` (Bloom-aligned with mastery criteria) and `exam_overlays` (per-exam customisation: required bloom levels, skip-types, emphasis).
- **Atoms with `exam_ids: ["*"]` are universal** — they bypass `skip_atom_types` overlays but still respect `required_bloom_levels`.
- **Hot-reload in dev.** `fs.watch` on `modules/project-vidhya-content/concepts/` clears the atom cache automatically. Production uses explicit `reloadAtoms()`.

### What changed for engineers

- **PedagogyEngine is synchronous and pure** — `selectAtoms(conceptId, studentModel, sessionContext, routeRequest)`. No DB reads, no I/O. Engagement enrichment (count, last_recall_correct, cohort signals) happens in `lesson-routes.ts` AFTER selection via a single SELECT.
- **Existing `StudentModel` reused as-is** — `mastery_vector: Record<concept_id, MasteryEntry>` keyed by concept_id. The plan-doc's invented shape was rejected during eng review.
- **Session-local error streak lives on a separate `SessionContext`** — never persisted to `student_models`.
- **`POST /api/lesson/compose` now returns `atoms[]` alongside `components[]`** (additive). Frontend `AtomCardRenderer` activates whenever atoms is non-empty; older clients continue to render legacy components. `personalize()` is marked `@deprecated` for follow-up removal.
- **`POST /api/daily-cards` mirrors the existing `/review-today` pattern** — accepts `last_lesson_visit` map in body. SM-2 state stays in client IndexedDB; server doesn't need to track it.
- **51 new vitest tests** (810 total): tier classification, E5 fallback chain, E6 countdown, exam overlay filtering, wildcard atom rule, atom-loader fallback chain, REGRESSION test for legacy components[] shape, engagement upsert SQL, cohort aggregator GROUP BY + ON CONFLICT math.

### Added

- `src/content/content-types.ts` — `ContentAtom`, `AtomType`, `BloomLevel`, `AnimationPreset`, `SessionContext`
- `src/curriculum/types.ts` — `LearningObjective`, `ExamOverlay`, `ConceptMeta` (additive)
- `src/content/atom-loader.ts` — `loadConceptAtoms`, `loadConceptMeta`, `reloadAtoms` + dev fs.watch
- `src/content/pedagogy-engine.ts` — synchronous `selectAtoms` with tier ordering + E5 + E6 + overlay filtering
- `src/jobs/cohort-aggregator.ts` — nightly aggregator writing `cohort_signals` (idempotent upsert)
- `supabase/migrations/013_atom_engagements_cohort_signals.sql`
- `frontend/src/components/lesson/AtomCardRenderer.tsx` — declarative `ATOM_ANIMATION_MAP`, scaffolding fade, cohort callout, debounced engagement
- `frontend/src/pages/app/DailyCardsPage.tsx` + `/daily` route
- 18 atom files across 3 seed concepts
- New endpoints: `GET /api/lesson/:concept_id` (now returns atoms[]), `POST /api/lesson/:concept_id/engagement`, `GET /api/knowledge/concepts/:id/objectives`, `POST /api/daily-cards`

### Changed

- `src/api/lesson-routes.ts` — `POST /compose` returns atoms[] alongside components[]; new engagement enrichment join
- `frontend/src/pages/app/LessonPage.tsx` — atom path activates when `lesson.atoms[]` is non-empty
- `src/jobs/scheduler.ts` — registers nightly `cohortAggregator`
- `meta.yaml` for 3 seed concepts — augmented with learning_objectives + exam_overlays

### Deprecated

- `src/lessons/personalizer.ts` — superseded by PedagogyEngine; stays in place as backward-compat fallback until all concepts have full atoms/ coverage and frontend confirms the atom path renders correctly.

## [4.2.0] - 2026-05-01 — Persona shells + pillar synergy

**Operator action:** none required. Three new API endpoints added under `/api/knowledge/tracks/:id/` (progress, next-concept, concept-tree) — no migrations needed, they read from existing `student_models` flat-file store.

### What changed for students

- **Your home screen now matches your actual goal.** If you're studying a curriculum (CBSE, JEE, etc.), you land on a concept map showing exactly what you've mastered and what's next today. If you're exam-focused, you land directly on your session plan. No more wrong-persona home.
- **Compounding evidence is visible every day.** The Compounding card (your progress proof) now appears on the session plan page — every returning student sees it, not just those who happened to reach State C of the old home screen.
- **Strategy is one tap away.** "See your full strategy →" link lives next to the plan headline. The exam strategy page is no longer an orphan URL.
- **"Why this order" on every action card.** Tap to expand the GBrain rationale for why this topic is prioritised right now. Collapsed by default so it doesn't clutter the plan.
- **No more dead ends after a session.** Finishing a planned session now returns you to `/planned` instead of the anonymous landing page. Drop-in practice (StudymateSession) shows a "Continue your plan →" button for signed-in users.
- **Knowledge-track home — new.** `/knowledge-home` shows: track progress bar (mastered/total), today's recommended concept with a why-next rationale, full concept map with mastery status (green/violet/dim), CompoundingCard, and a K→E bridge card that surfaces once when you hit ≥70% curriculum coverage.
- **Ready to add an exam? The app tells you.** When knowledge-track students hit ≥70% mastery, a one-time "Set your exam date →" card appears pointing to the onboarding flow. Shown once, remembered in localStorage.

### What changed for teachers

- **Confidence picker before briefs.** When you open a teaching brief, you rate your confidence in the concept (1–5). Rating 1 or 2 prepends a "Your prep" section: canonical definition, two worked examples, and the top misconceptions in your cohort. Rating 3–5 opens the brief as-is — no extra friction for concepts you know cold.
- **UX: reduced friction throughout.** Dismissible welcome banner on the Teaching Dashboard; teacher shell now shows `Teach | Students` nav instead of the exam-student nav.

### What changed for engineers

- `frontend/src/components/app/AppLayout.tsx` — persona detection on mount. Reads `/api/student/profile`, derives persona (knowledge / exam / teacher), renders shell-specific nav. Skeleton shown while profile resolves to prevent flash of wrong nav.
- `frontend/src/pages/app/KnowledgeHomePage.tsx` — new page at `/knowledge-home` for knowledge-track students.
- `frontend/src/pages/app/Home.tsx` — redirect updated: knowledge-track users go to `/knowledge-home`, exam users go to `/planned`.
- `src/api/knowledge-routes.ts` — three new endpoints: `GET /api/knowledge/tracks/:id/progress`, `GET /api/knowledge/tracks/:id/next-concept`, `GET /api/knowledge/tracks/:id/concept-tree`. All require auth; mastery data from `student_models.mastery_vector`.
- `src/api/me-routes.ts` — CompoundingCard threshold lowered from 5 problems to 1. Card now appears after a single practice problem, not after 5.
- `frontend/src/pages/app/PlannedSessionPage.tsx` — CompoundingCard + DigestChip added; strategy link; "Why this order" accordion per action card; post-completion navigates to `/planned`.
- `frontend/src/pages/app/StudymateSessionPage.tsx` — "Continue your plan →" CTA for auth'd users at session end.
- `frontend/src/pages/app/TeachingDashboardPage.tsx` — confidence picker (1–5) + animated "Your prep" section at confidence ≤ 2.

## [4.1.0] - 2026-05-01 — KAG corpus + content infrastructure hardening

**Operator action:** none required. New flat files created on first write: `.data/kag-corpus.jsonl` (KAG store), `.data/content-review.json` (teaching content-review queue). Both are gitignored by the existing `.data/` rule. Optional: set `WOLFRAM_APP_ID` to enable Wolfram grounding in the KAG generator. Run `npx tsx scripts/kag-corpus-builder.ts --all` to seed the KAG corpus from the concept graph.

### What changed for students

- **Content answers are now Wolfram-grounded before they reach you.** When a KAG corpus entry exists for a concept, the router serves it at priority 0 — before subscriptions, before the library, before anything. KAG entries are generated with Wolfram Alpha context in the LLM prompt AND the worked example answer is re-verified against Wolfram after generation. If you ask about eigenvalues and the KAG corpus has a verified entry, that's what you get.

### What changed for teachers

- **New content-review queue.** `GET /api/teaching/content-review` lists items flagged for review. `POST /api/teaching/content-review/:id/approve` and `POST /api/teaching/content-review/:id/reject` close the loop. All three endpoints require teacher or admin role.

### What changed for engineers

- New source `'kag'` in the `Source` union (`src/content/content-types.ts`). Router tier 0.
- `src/content/kag-store.ts` — append-only JSONL store with in-memory cosine search (float[] embeddings). Upgrade to pgvector when corpus exceeds 2000 entries.
- `src/gbrain/operations/kag-concept-generator.ts` — runtime generator. Wolfram plays two roles: (1) grounding context included verbatim in the Claude Opus prompt; (2) worked example answer re-queried for post-generation verification.
- `scripts/kag-corpus-builder.ts` — CLI-only corpus builder. Never imported by `src/`. Acquires `.data/corpus-build.lock` to prevent cron + manual double-build. Run with `--all` to rebuild, `--concept <id>` for one concept, `--dry-run` to preview.
- `src/jobs/content-refresh-queue.ts` — owns the `MAX_PER_NIGHT = 5` invariant. Single source of truth; midnight UTC auto-reset.
- `src/data/vector-store.ts` — `Number.isFinite(sim)` guard on both `cosineSimilarity` methods. Blank/zero vectors previously returned NaN, which could bypass threshold checks.
- `src/auth/middleware.ts` — `requireAnyRole(req, res, allowed_roles[])` for endpoints that need multiple distinct roles without a clean hierarchy expression.
- `src/content-library/store.ts` — `SEED_DIR` exported (was private `const`). CLI scripts that need the seed path import it; no duplicate string.
- Doc cleanup: 5 pure-legacy agent-system files deleted; legacy banners on 9 mixed-content docs/; 3 factual path fixes in CLAUDE.md, CONTRIBUTING.md, README.md.

## [4.0.0] - 2026-04-30 — Persona delight + retention architecture

**Operator action:** none for runtime. Email surface is now branded "Vidhya" (was leaking "GATE Math" from `src/jobs/retention-engine.ts`); set `FROM_EMAIL` and `BASE_URL` env vars if you want to override the defaults in `src/lib/brand.ts`. Frontend test scripts added — run `cd frontend && npm install && npm test` to enable the new component test suite.

### What changed for users

- **Streak appears on Home.** CompoundingCard's "streak: coming soon" placeholder is replaced with the live count from `GET /api/streak/:id`. Glance at Home and see "7-day streak" right next to your mastery ring. (P2)
- **Sessions end with closure, not a void.** Finishing a planned session shows a 5-second screen with what you covered + tomorrow's first priority before navigating Home. Headline rotates from a 6-variant array — no mechanical template. Respects `prefers-reduced-motion` (manual Continue, no auto-navigate). (P3)
- **Diagnostic results feel like the system understands you.** A 3-step interstitial reveals your top strength (with confetti, the only place confetti fires per design system rules), your biggest gap, and "your plan is ready" before navigating to /planned. Reduced-motion users get manual continue per step. (P4)
- **Returning students feel remembered.** Lapsed for 2+ days? Home shows: "Linear Algebra is still here when you're ready. It's been 4 days. Nothing's changed but the date." Personalized from the actual weak concept — never the AI-slop "Welcome back". Account-age guard prevents the card firing for users who never practiced in the first place. (P5)
- **Weekly Digest is discoverable.** A chip on Home Mon/Tue surfaces the digest at /digest (the best narrative the product produces, previously orphaned). Dismissible per ISO week. (P6)
- **Teachers get a weekly cohort brief.** New page at /teaching/brief showing cohort mastery, week-over-week delta, top performer, students-needing-attention, and one suggested action. Backed by `/api/teaching/weekly-brief` which uses Promise.all to load the full cohort in <100ms. Snapshot key includes a sha256 of the sorted roster so cohort changes don't miscompute delta. (P7)
- **Anonymous visitors can try a real problem.** MarketingLanding now renders one GATE problem inline — answer it, get instant feedback, see a "Create your free plan" CTA. No auth required. The first problem is the most memorable moment in any student's journey with a learning product. (P8)
- **Emails finally say Vidhya.** All 5 templates (welcome day-0/3/7, streak reminder, weekly digest) rebranded. `welcome_day3` CTA now links to `/planned` (was `/`). FROM_EMAIL and BASE_URL centralised in `src/lib/brand.ts`. (P1)

### What changed for engineers

- New module `src/lib/brand.ts` — single source of truth for `BRAND_NAME`, `FROM_EMAIL`, `BASE_URL`. The next rebrand is a one-file edit. (Q2)
- New hook `frontend/src/hooks/useDismissible.ts` — `{ dismissed, dismiss }` per `(key, ttlHours)`. Used by CompoundingCard, DigestChip, WelcomeBackCard. Failure-soft when localStorage is unavailable. (Q1)
- 8 new components on the frontend: `DigestChip`, `SessionEndScreen`, `DiagnosticInterstitial`, `WelcomeBackCard`, `StaticSampleProblem`, `WeeklyTeacherBriefPage`, plus refactored `CompoundingCard` and instrumented `Home`/`PlannedSessionPage`/`DiagnosticPage`/`MarketingLanding`/`TeachingDashboardPage`.
- New backend endpoint `GET /api/teaching/weekly-brief` in `src/api/teaching-routes.ts`. Auth-gated to `teacher` role; aggregates over `teacher.teacher_of[]` via `Promise.all(getOrCreateStudentModel)`; persists weekly snapshots in `.data/teacher-brief-snapshots.json` keyed by `teacher_id + ISO_week + sha256(sorted teacher_of[])`. The fingerprint key means a roster change creates a fresh snapshot rather than miscomputing delta against a different cohort.
- Frontend test infrastructure bootstrapped — `vitest` + `@testing-library/react` + `jsdom`. Run with `cd frontend && npm install && npm test`. 5 test files committed (`useDismissible.test.ts`, `WelcomeBackCard.test.tsx`, `DigestChip.test.tsx`).
- Backend tests added: `src/__tests__/unit/lib/brand.test.ts` (6 tests, env-fallback contract) and `src/__tests__/unit/jobs/retention-engine-templates.test.ts` (15 tests, brand regression guard for every template).
- 23 `trackEvent` calls instrumenting all 8 features (closure_screen_viewed, welcome_back_shown/clicked/dismissed, digest_chip_shown/clicked/dismissed, sample_problem_attempted/converted, teacher_brief_opened, etc.) so every retention feature can be measured and falsified.
- New static asset module `frontend/src/data/marketing-samples.ts` — 3 hand-verified GATE Engineering Mathematics problems for the anonymous try-one experience.

### Persona journey map (post-v4.0)

```
ANONYMOUS                NEW STUDENT              ACTIVE STUDENT
  ↓ MarketingLanding       ↓ OnboardPage            ↓ Home
  + Try one problem        DiagnosticPage           + Live streak (P2)
  inline (P8)              + 3-step interstitial    + DigestChip Mon-Tue (P6)
  No auth wall             celebrating result (P4)  + CompoundingCard

LAPSED STUDENT (2d+)     TEACHER                  OWNER/ADMIN
  ↓ /planned                ↓ TeachingDashboard      ↓ FounderDashboard
  + WelcomeBackCard         + "This week's brief →"  Email surface
  with personalized copy    + WeeklyTeacherBriefPage rebranded (P1)
  + account-age guard (P5)  page (P7)
  
  Session ends: SessionEndScreen with summary + tomorrow priority (P3)
```

### What we deliberately deferred

- **MilestoneCard (P9):** "first concept mastered", "10th problem solved", etc. — defer to v4.1. The current 8 features cover the high-leverage moments; milestone celebration can be added once we see retention data.
- **Personalized welcome email chain (P10):** day-3/day-7 emails currently use generic copy. Personalization with real progress data deferred to follow-up.
- **Parent portal:** scaffolded in `src/auth/types.ts` but not built. Separate initiative.
- **Push notifications:** `Settings` UI exposes the toggle but the backend FCM integration is not implemented.
- **Real-time teacher alerts:** WebSocket/SSE for "student just struggled" notifications. Deferred — the weekly brief covers the cadence cohort owners actually want.
- **A/B testing of delight copy variants:** requires feature-flag infrastructure not in scope.

## [3.0.0] - 2026-04-30 — Exam-agnostic structural cleanup (Phase 3)

**Operator action:** none for runtime. CI/IDE caches that index `frontend/src/pages/gate/*` paths should be invalidated — the directory is now `frontend/src/pages/app/` and the components dir is `frontend/src/components/app/`. No public URL or API contract changed.

### Why a major bump
The directory rename from `gate/` → `app/` is structurally significant: 44 page files + 16 component files moved, 60+ import paths rewritten, the layout component renamed (`GateLayout` → `AppLayout`). No code-level behavior changes — but third-party tooling that targets the old paths (linters, codemods, deploy hooks, IDE workspace roots) needs to update. Major version signals "your local references may need a refresh."

### What changed for users
Nothing visible. Phase 3 is structural cleanup that pays down the GATE-as-product naming debt accumulated since v1.

### What changed for engineers
- **Directory rename: `frontend/src/pages/gate/` → `frontend/src/pages/app/`.** 44 page files moved via `git mv` (history preserved). All 60+ `@/pages/gate/*` imports rewritten to `@/pages/app/*`.
- **Directory rename: `frontend/src/components/gate/` → `frontend/src/components/app/`.** 16 component files moved (CompoundingCard, AnnouncementBanner, ExamCountdownChip, GiveawayBanner, MasteryRing, StreakBadge, etc.).
- **`GateLayout` → `AppLayout`.** The shell layout component renamed; its file path moved alongside the components dir.
- **`Home as GateHome` alias dropped from `App.tsx`.** The home page is now imported as `Home` directly — no compat shim left.
- **`src/constants/topics.ts` deprecated to a re-export stub.** All consumers were already migrated to `getTopicsForExam(examId)` in v2.7's exam adapter rollout. The legacy `getGateMathTopicIds` / `getGateMathTopicLabels` / `getGateMathTopicIcons` / `getGateMathTopicKeywords` functions remain as `@deprecated` thin wrappers around `getTopicsForExam('gate-ma')` for one release of grace; **REMOVAL TARGET: v3.0** (this release marks them deprecated; deletion lands in a follow-up).
- **CHANGELOG header rebranded** from "GATE Math" to "Vidhya" to match the rest of the product surface.

### What we deliberately deferred (with rationale)

These items were on the Phase 3 plan but were triaged "engineered enough" after audit. Rationale captured inline so future contributors don't re-litigate:

- **PracticePage.tsx refactor** — the file is 600+ lines but each section has a clear single responsibility (problem rendering, answer input, verify flow, error diagnosis, next-step chip). Splitting now would create coupling overhead without reducing complexity. Refactor when a third major surface needs to share logic with it (currently only PracticePage + SmartPracticePage do, and they share via hooks).
- **ExamSetupPage.tsx wizard split** — 1318 lines, but 70% is exam-specific copy + per-step validation that doesn't compress well. The wizard pattern is correct; the line count is the weight of correctness, not abstraction debt.
- **Content admin consolidation** (ContentAdminPage / ContentStudioPage / ContentSettingsPage → one) — three pages serve three distinct workflows (review queue, generation studio, runtime config). Forcing them into one nav surface makes the consolidated page harder to use. Keep them separate; if discoverability is the issue, the fix is a sub-nav, not a merge.

### Migration notes
- If you have local branches with imports against `@/pages/gate/*` or `@/components/gate/*`, run a sed sweep on rebase:
  ```bash
  find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) \
    -exec sed -i 's|@/pages/gate/|@/pages/app/|g; s|@/components/gate/|@/components/app/|g; s|GateLayout|AppLayout|g' {} +
  ```
- If your editor/IDE shows broken imports after pull, restart the TS language server.

## [2.6.0] - 2026-04-30 — UX coherence + Compounding made daily-visible (Phase 2)

**Operator action:** none. The new `/api/student/compounding` endpoint is additive and renders nothing on the frontend if the student has no activity yet — no UX regression for fresh accounts.

### What changed for users
- **Compounding Visibility Card.** Periodic, dismissible card on home that surfaces concrete evidence of improvement: "47 problems this month — 12 concepts mastered." Click to expand for detail. Hidden when there's nothing yet to celebrate. Anchors the v2.4 Compounding promise into the daily product loop.
- **Today's plan, focused.** PlannedSessionPage now leads with "Today's plan" + the three things that move your score most. The first pending action gets a **NEXT** label and violet accent — unambiguous starting point. New progress ribbon below the timing bar: "2 of 5 done. 3 to go."
- **Home, decluttered.** Giveaway banner removed from the home stack. YourTeacher card removed from default home (still surfaces from teacher's roster + chat). AnnouncementBanner + ExamCountdown kept — these earn their pixels.
- **Teaching dashboard, delighted.** Cohort mastery percentage promoted to a top-of-page indicator ("Cohort mastery: 73% across 24 students"). Students-needing-attention promoted from a tiny inline link to a prominent amber alert when count > 0. Page now uses Fraunces serif for headlines (v2.4 alignment).
- **One canonical sign-in route.** `/admin` redirects to `/admin/dashboard` (canonical). `/smart-notebook` redirects to `/notebook` (canonical). `/practice` redirects to `/planned` (Study Commander default). Existing deep links to specific pages still work — only the bare-route entry points are deduplicated.

### What changed for engineers
- New component: `frontend/src/components/gate/CompoundingCard.tsx` — failure-soft (renders nothing on API error), localStorage-dismissible (per-day), self-loading.
- New endpoint: `GET /api/student/compounding` in `src/api/me-routes.ts`. Returns `{ should_show, headline, subline, details }` based on student model state. Cadence: shown when 5+ problems in last 30d OR 1+ concept mastered.
- Route consolidations (App.tsx): `/login → /sign-in`, `/admin → /admin/dashboard`, `/smart-notebook → /notebook`, `/practice → /planned`. Old routes redirect via `<Navigate replace />` so back-button + bookmarks behave correctly.
- Practice-surface hierarchy documented inline: 4 surfaces (PracticePage, SmartPracticePage, PlannedSessionPage, StudymateSessionPage) serve distinct entry needs; PlannedSessionPage is canonical.
- AdminPage's social queue moved from `/admin` to `/admin/social` (kept functional as a dedicated admin sub-route).

### Phase 3 (deferred)
- GATE_TOPICS dynamic per-exam loader (the structural fix to make the platform truly exam-agnostic).
- PracticePage refactor (split into smaller components + edge-case tests).
- ExamSetupPage 1318-line wizard split.
- 3 content admin pages → ContentStudioPage consolidation.
- `frontend/src/pages/gate/` → `app/` directory rename (50+ import paths).

## [2.5.0] - 2026-04-30 — Customer delight + exam-agnostic Phase 1

**Operator action:** if you previously relied on `DEFAULT_EXAM_ID = 'gate-ma'` as a silent default in jobs, configure an exam now (POST /api/exams or via the admin UI) — the silent fallback is gone. Optionally set `ENV DEFAULT_EXAM_ID` to override the auto-resolved default.

### What changed for users
- New visitors land on a marketing page that leads with the student promise ("know exactly the three things to study tomorrow") instead of architecture ("82-concept prerequisite graph"). The technical depth is still there — collapsed under "For builders & the curious."
- Practice answer-checking no longer plays a 3-stage "Checking knowledge base / Running AI verification / Confirming result" theater. Fast verifies show no spinner; slow ones (>1.5s) show a single subtle shimmer.
- Smart Practice no longer exposes tier names, latency in milliseconds, or per-problem USD cost to students. The "Wolfram-verified" trust badge is preserved (the only provenance that helps students). Session footer simplified to "problems this session."
- Sign-in is now one canonical page. `/login` redirects to `/sign-in` (the production-validated auth path).
- Anonymous visitors who land on the home page get a subtle "New here? See how Vidhya works →" link to the marketing page.
- Onboarding never shows fake topics anymore. When the exam profile fails to load, you see "Pick exam first" with an explicit CTA — not a generic algebra/calculus/geometry fallback.
- "Viewing as {role}" indicator on TurnsPage when teachers/admins view another student's history.

### What changed for the platform (exam-agnostic cleanup)
- The product is now branded "Vidhya" everywhere (was "GATE Math" in DESIGN-SYSTEM.md, App.tsx, CLAUDE.md). GATE is one of N exams the platform serves, not the product identity.
- `src/gate-server.ts` → `src/server.ts` (filename + 14+ doc/config references updated).
- `frontend/src/pages/gate/GateHome.tsx` → `frontend/src/pages/gate/Home.tsx` (function renamed too). Directory rename queued as a follow-up PR (50+ import paths, too risky for this batch).
- New `src/exams/default-exam.ts` resolves the default exam id with proper precedence: ENV `DEFAULT_EXAM_ID` → first registered exam → throw clear error. Replaces 4 hardcoded `'gate-ma'` fallbacks (3 jobs files + commander-routes anonymous seeding).

### What changed for engineers
- **Auth system unified.** Two parallel auth systems coexisted: Vidhya JWT (validated by the backend) and Supabase Auth (frontend-only state never validated by the backend). The Supabase one is gone:
  - Deleted `frontend/src/pages/gate/LoginPage.tsx`
  - Deleted `frontend/src/hooks/useAuth.ts`
  - Deleted `frontend/src/lib/supabase.ts` (auth-only client)
  - Migrated `GateLayout.tsx`, `ContentAdminPage.tsx`, `GBrainAdminPage.tsx` to use `@/contexts/AuthContext` (Vidhya JWT). Field names map: `display_name` → `name`, `avatar_url` → `picture`. Async `getToken()` → sync `getToken()` from `@/lib/auth/client`.
- Documentation updated: `CLAUDE.md`, `DESIGN-SYSTEM.md`, `ARCHITECTURE.md`, `DEPLOY.md`, `LAYOUT.md`, `INSTALL.md`, `PRODUCTION.md`, `FEATURES.md`, `PENDING.md`, `PLAN-gbrain-mvp.md`.

### Phase 2 + 3 (deferred)
The CEO review accepted 23 items in 3 phases. Phase 1 (this release) shipped 12 customer-visible quick wins. Phases 2 + 3 (decoration declutter on Home, /notebook + /smart-notebook merge, 4 practice surfaces consolidation, Compounding Visibility Card, admin-landing consolidation, GATE_TOPICS dynamic loader, ExamSetup wizard split, etc.) are tracked in `PLAN-exam-agnostic-and-delight.md` and will land in subsequent PRs. Phase 3 items each need their own `/plan-eng-review`.

## [2.4.0] - 2026-04-30 — Design system v2.3 lands in the frontend

**Operator action:** none. Render auto-deploys from `main`. Three new fonts (Fraunces, DM Sans, JetBrains Mono) load from Google Fonts on page open.

### What changed for users
- The app now reads with serif headlines (Fraunces) — gives the product the editorial weight that matches the Compounding promise. Body text is DM Sans (was Inter).
- AI/Tutor surfaces use a soft violet (`#a78bfa`) — the new signature color reserved for the tutor FAB, study planner suggestions, and AI tutor surfaces. Mastery stays emerald. Sky was retired.
- The blog reads as the same product as the app (was visually different): same Fraunces serif headlines, same violet/emerald palette, softer 1.5px borders and 8px corners (was 2px / 4px neubrutalist), and a calm border-color hover instead of the offset-shadow shift.

### What changed for engineers
- `frontend/index.html` now loads Fraunces + DM Sans + JetBrains Mono. Inter retained as a fallback during the migration window.
- `frontend/tailwind.config.cjs` adds `navy.*`, `emerald.*`, `violet.*` color tokens and `font-display` (Fraunces) / `font-sans` (DM Sans) / `font-mono` (JetBrains) / `font-legacy` (Inter) family utilities.
- `globals.css` sets `body { font-family: 'DM Sans' }` and routes `h1, h2, h3, .font-display` through Fraunces with `font-optical-sizing: auto` and `letter-spacing: -0.01em`.
- CSS custom properties (`--primary`, `--accent`, `--ring`) realign to v2.3 emerald + violet in both light and dark modes. shadcn/ui components inherit automatically.
- `src/templates/blog-post.ts` and `blog-index.ts` regenerated: Fraunces headlines, DM Sans body, 1.5px borders, 8px corners, border-color hover (was translate+shadow), no UPPERCASE labels.

### Added
- Tailwind tokens: `navy.{50..950}` (background), `emerald.{50..950}` (mastery), `violet.{50..950}` (AI/Tutor signature).
- Font utilities: `font-display`, `font-sans`, `font-mono`, `font-legacy`.
- Light-mode CSS variables that pick darker shades (emerald-600, violet-500) for white-bg contrast.

### Changed
- 57 frontend files: `bg-sky-*` / `text-sky-*` / `border-sky-*` / etc. → `*-violet-*` (sky retired per v2.3 design tweak; violet is the new AI/info accent).
- `frontend/src/pages/gate/StudymateSessionPage.tsx`: removed dead inline `style={{ fontFamily: 'Satoshi' }}` references; uses `font-display` utility now (Fraunces).
- `src/templates/blog-{index,post}.ts`: Space Grotesk → Fraunces + DM Sans, neubrutalist styling softened to editorial.
- CSS variables `--primary` / `--accent` / `--ring` realigned to emerald + violet.

### Known issues / deferred
- `@ts-nocheck` re-applied to `src/content/blog-pipeline.ts` (broken `../prompts/repository` import, pre-existing) and `src/verification/verifiers/{wolfram,sympy,llm-consensus}.ts` (type drift with internal LLM/HTTP types). Tracked as TODOs.
- Frontend `tsc --noEmit` reports 5856 pre-existing errors (broken JSX intrinsic types — separate tsconfig issue, not introduced by this PR). Frontend build (`vite build`) succeeds cleanly.
- Light-mode pass is a CSS-variables update only; no per-page light-mode QA performed. May need accent saturation tweaks on individual pages.
- The 4-tab nav vs FAB tutor question (raised in design consultation) is not in scope for this PR.

## [2.3.0] - 2026-04-30 — Content module DX expansion

**Operator action:** none. Render auto-deploys from `main`. Optional: set `VIDHYA_CONTENT_DEBUG=true` locally to see every router decision logged.

### What changed for operators
- `/health` now returns `content: { miss_rate, total_events }` covering the last 24 hours so the content cascade is observable from one endpoint.
- Server boot now logs a clear WARN if `VIDHYA_INTENT_CLASSIFIER=llm` is set without LLM keys (or set when the LLM path is still a stub). Operators no longer fall into silent-misconfiguration mode.

### What changed for engineers
- New `EXTENDING.md` at the repo root maps the four extension contracts (AnswerVerifier, ContentVerifier, CadenceStrategy, PedagogyReviewer) with file paths, walkthroughs, and pitfalls. Time to first extension drops from ~75 min to <20 min.
- `npm run test:content` runs only the content + verification suites (~3s feedback) instead of the full 654-test suite (~45s).
- `src/verification/verifiers/example.ts` (`AlwaysTrueVerifier`) is a Tier 9 live reference engineers copy when adding a new AnswerVerifier. Its contract test fails first if the interface drifts.
- `TieredVerificationOrchestrator.registerVerifier(v)` accepts Tier 4+ AnswerVerifiers with zero orchestrator edits. Tier 1-3 stay reserved for the built-in cascade.
- Snapshot regression test gates the orchestrator change so its Tier 1-3 behavior is byte-identical to pre-refactor.

### Added
- `ContentVerifier` interface (`src/content/verifiers/types.ts`) plus `runContentVerifierContract`.
- `AnswerVerifier` interface (`src/verification/verifiers/types.ts`) plus `runAnswerVerifierContract`.
- `CadenceStrategy` interface (`src/content/cadence.ts`) plus `runCadenceStrategyContract`. `session_mode` and `exam_proximity_days` added to `RouteRequest`.
- `PedagogyReviewer` interface (`src/content/pedagogy.ts`, async post-delivery) plus `runPedagogyReviewerContract`. Score writes back to RAG cache; bad content gets demoted on next request. Never blocks student-facing latency.
- `registerVerifier()` and `listExtraVerifiers()` on `TieredVerificationOrchestrator`.
- `userHasUploads()` fast-path with cached count, invalidated on createUpload / deleteUpload / dropAllForUser.
- `RouteResult.blended_uploads` — concept-matched uploads surface alongside the primary source on every route (when the user has uploads).
- `ResolvedContent.declined_reason` typed enum so callers can distinguish RAG miss from Wolfram timeout from rate-limit hit.
- `getTierMissRate24h()` aggregator wired into `/health`.
- `warnIfLlmClassifierStubActive()` startup check.
- `npm run test:content` and `test:content:watch` package scripts.

### Changed
- `src/content/types.ts` renamed to `src/content/blog-types.ts` — that file held blog/marketing types, not content module types. New `src/content/content-types.ts` holds the actual content module domain (RouteRequest, RouteResult, ResolvedContent, Source, SessionMode, DeclinedReason).
- `Intent` type consolidated to a single source (`src/content/intent-classifier.ts`); re-exported from `src/content/index.ts`.
- Router post-filter blends user uploads when `concept_id` matches and `intent !== 'find-in-uploads'`. Skipped entirely when the user has zero uploads.

### Deferred (TODOs)
- Scaffold CLI (`npx vidhya-scaffold verifier <name>`): `AlwaysTrueVerifier` covers the copy-paste workflow.
- `@ts-nocheck` removal from `src/content/router.ts` and other content files: separate focused PR.
- Full LLM intent classifier implementation: stub still in place; startup warning surfaces the gap.

## [Unreleased] — 2026-04-29 (DX pass — demo login, feature health, error surfaces)

**Operator action:** none. Render auto-deploys from `main`. Demo seed runs automatically on every boot.

### What changed for operators
- `/health` now returns `features: {ai_chat, wolfram, google_auth, analytics, telegram, whatsapp, database}` — shows exactly which capabilities are configured on your deployment.
- `/demo-login?role=student` — new endpoint that logs anyone into the demo student account instantly. Share this URL with teachers evaluating the platform. Requires `demo:seed` (runs automatically on every Render boot).
- `render.yaml` — ENV var comments now explain what each key does and where to get it. `POSTHOG_HOST`, `DEFAULT_EXAM_ID`, `DATABASE_URL` added to the form.
- Chat page — when AI chat is unconfigured (503), the UI now shows the specific reason instead of a generic error.
- `README.md` — live demo link added at the top.

## [Unreleased] — 2026-04-28 (the production trio)

Three commits that close the highest-leverage production gaps and stand up the founder-ecosystem surface. Two distinct decisions bundled per the user's request:

  1. Vidhya as a production-grade end-user app — close the LLM-cost runaway gaps (rate limiting + per-user budget caps)
  2. Vidhya as a solo-founder ecosystem — small adapter module + the FOUNDER.md runbook

The honest framing: production-grade is a property of an observed deployment, not code in a PR. What ships here is *production-readiness work* — concrete fixes, gates, docs. Real readiness arrives only after deployment and observation. PRODUCTION.md (shipped previously in `98bdc16`) frames this distinction at the top.

### `48b50ad` — rate limit + per-user LLM budget cap

Two of the eight gaps from PRODUCTION.md closed in one commit because both protect the operator from runaway LLM costs. Without rate limiting, an authenticated student could in principle hammer the chat endpoint as fast as the network allows; each call costs Gemini tokens. Without per-user budget caps, a single user could consume an outsized share of the operator's daily LLM budget.

**`src/lib/rate-limit.ts`** — hand-rolled token-bucket (~150 LOC). Buckets keyed by `${endpoint}:${actor_id}`. Lazy refill on each check (no background CPU). In-memory only; multi-process is shared-nothing. `VIDHYA_RATE_LIMIT_DISABLED=true` override for load testing.

Default limits:
- chat: 30/min
- content-studio.generate: 10/hour
- content-library.write: 60/min
- attempt-insight: 100/min

Unknown endpoints fail-open (allowed=true). New endpoints are unlimited until added.

Why hand-rolled instead of `express-rate-limit`: ~30 lines of logic auditable in one screen, zero new deps, codebase already eschews deps for small things. Token-bucket is the right semantic — smooth refill, no window-reset thundering herd.

**`src/lib/llm-budget.ts`** — per-user daily token budget (~140 LOC, default OFF). Opt in via `VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER`. UTC-midnight reset (predictable for users, simple bookkeeping). Reservation/recordUsage/cancelReservation flow.

Cost math (Gemini 2.5 Flash, ~$0.13 per million mixed tokens):
- 100k tokens/day cap = ~$0.013/user/day = ~$0.40/user/month

**Wiring into chat-routes**: rate limit + budget reservation AFTER input validation BEFORE `getChatModel()`. recordUsage at the success tail with token estimate from response length (~1 token per 4 chars). cancelReservation on error and on the no-LLM-degraded path so the budget tracks actual spend, not attempted spend.

**Live verified against real backend**: 35 rapid chat calls → 29 passed + 6 rate-limited with HTTP 429 + `retry_after_ms: 512`. Budget cap verified via `npm run verify:budget` script that sets the env var BEFORE module load (vitest can't reliably override at module-load time).

13 unit tests + 9 runtime assertions. Vitest 169→182.

### (this commit) — operator module + FOUNDER.md

A new `operator` module (13th in modules.yaml). Small by design — three adapters with local-JSONL defaults so a fresh deployment tracks revenue and events on day one without any external accounts.

**Module surface**:

- `localPaymentsAdapter` — Stripe-compatible PaymentEvent shape, append-only JSONL at `.data/payments.jsonl`, list/totalRevenue/record API
- `localAnalyticsAdapter` — event recording with query + countByType, recordEvent never throws (analytics shouldn't break the request)
- `buildDashboard` — aggregator pulling from user store, payments, teaching turns, content-studio drafts, budget module, and `/api/orchestrator/health`. `caveats` array on every response is honest about what's missing

**Four HTTP endpoints**:

- `GET /api/operator/dashboard` — admin only
- `POST /api/operator/payments/record` — admin only, manual payment entry
- `POST /api/operator/payments/webhook` — shared-secret via `OPERATOR_WEBHOOK_SECRET`, default 503 if unset
- `POST /api/operator/analytics/event` — admin only

The webhook endpoint is auth-by-shared-secret because the caller is an external provider (Stripe, Razorpay), not a logged-in user. Stripe's raw webhook shape is NOT what the endpoint expects — operators normalise via either an in-codebase shim or a service like Hookdeck, then POST the normalised shape. Documented in FOUNDER.md.

**Live verified**: dashboard as admin returns full aggregated view (6 users, 13 modules, honest caveats). Dashboard as student → 403. Manual payment recorded ($29 USD = 2900 minor units), dashboard immediately reflects total_30d / paid_users_30d / arpu_30d. Webhook correctly refuses 503 when secret unset.

**`FOUNDER.md`** — ~340-line solo-founder runbook. The honest framing up front: almost nothing a solo founder needs lives in this codebase. A "marketing module" written in TypeScript would be a worse Mailchimp. What the codebase does is provide clean integration points; FOUNDER.md is what to plug in and why.

Sections:
- Stack with cost estimates: Render, Netlify, Cloudflare, Resend, Stripe, Plausible, Sentry, BetterStack — total floor cost $0, realistic monthly $20
- Day-1 checklist (~1 hour, $10)
- Marketing — channels worth trying, channels that won't work yet
- Acquisition — the funnel + the time-to-value lever
- Strategy — how to decide what to build next, things to deliberately NOT build
- Revenue — when to charge, how, what; concrete pricing
- Operations — you are the on-call; monitoring, errors, status page, backups, runbook
- Support — at solo-founder scale, an email forwarded to your inbox is a system
- Dependencies — critical-path vs convenience vs setup-time, with fallback paths
- Anti-patterns to avoid

11 unit tests for the operator module. Vitest 182→193.

**Coherence pass**: module count 12→13 across OVERVIEW, DESIGN, ARCHITECTURE, LAYOUT, MODULARISATION, PRODUCTION, README. FOUNDER.md added to OVERVIEW doc map and README's "where to go next" + collapsed doc tree. PENDING.md gets four new entries in the post-banner shipped table.

### Regression — 10 gates green for each commit

```
Backend tsc            0 errors
Frontend tsc           0 errors
Vitest                 193 / 193   (was 169 — 24 new tests across the trio)
Smoke stdio            49 / 49
Smoke SDK compat       65 / 65
Graph validator        56 agents valid
Subrepo check          passed
Demo verify            14 / 14
Teaching loop verify   10 / 10
Budget verify          9 / 9
```

### Honest non-goals

**Production gaps still open** (from PRODUCTION.md):

- Single-process state — flat-file persistence assumes one writer; a multi-instance deploy would need DATABASE_URL plus a re-architecture
- No moderation flow — content-library POST is admin-only but bypasses studio approval; studio gates correctly
- No retention policy on append-only logs — three logs (turns, library additions, studio drafts) grow unbounded; monthly rotation deferred
- Limited observability — no APM, no request tracing, no per-endpoint latency histograms
- No SLO / no incident response runbook — each operator writes their own
- No third-party security audit
- No PII redaction in logs — log lines include user IDs, sometimes emails
- Rate limit + budget aren't yet wired to other LLM-spending surfaces beyond chat — content-studio's LLM source could in theory bypass them

**Operator module non-goals**:

- No Stripe SDK in code — operators wire Stripe via webhook normalised to the local shape (in-process shim or Hookdeck). Keeps the codebase free of provider lock-in
- No PostHog / Plausible adapter shipped — adapters are documented in the type contract but only `localAnalyticsAdapter` ships today; adding one is a ~50-line addition the operator can do when they sign up
- No founder dashboard UI — `/api/operator/dashboard` returns JSON. An admin React page is a follow-up if useful
- No global per-deployment budget — per-user is what was asked for; an operator-wide cap layers on top
- No real-time dashboard for budget consumption — `getBudgetStatus` exposes the data; UI is a follow-up

**Content-studio commits 2 + 3 still open** from before this trio: HTTP routes + GBrain feedback hook (commit 2), admin UI + STUDIO.md + commit-3 doc coherence (commit 3). The trio split was made before these production decisions came in; will be resumed if requested.

## [Unreleased] — 2026-04-28 (the content library)

Three commits in sequence that add an 11th module: a runtime-
augmentable, DB-free store of teaching materials. Pre-populated with
3 starter concepts so a fresh deployment has something to teach with
on day one. Pluggable via API for admins or LLMs to add new entries
without committing to git or running a sub-repo sync.

The user originally asked for "GBrain to already contain predefined
teaching materials." Pushed back — content is a different concern
from the cognitive layer (mastery, motivation, error patterns).
Coupling them would make GBrain harder to swap and violate the
modular boundary. The cleaner shape is "GBrain consults
content-library at decision time" — which is what the existing
content router already does, just with a better-stocked place to
consult. User said go.

### `4df51ba` — module substrate

A new `content-library` module (11th in modules.yaml, `foundation:
true`). Two sources: seed at `data/content-library/seed/<concept_id>/`
(committed in git, ships with repo) and additions at
`.data/content-library-additions.jsonl` (appended at runtime via
POST). In-memory Map<concept_id, LibraryEntry> built at boot,
additions override seeds.

The schema mirrors the existing community-content `meta.yaml` shape
(`modules/project-vidhya-content/concepts/`) — don't invent a parallel
vocabulary. Difficulty values: `intro | intermediate | advanced`.
Three starter concepts copied (not moved) from the subrepo into the
seed dir: calculus-derivatives, complex-numbers,
linear-algebra-eigenvalues.

One feature flag: `content_library.user_authoring`, default off.
When on, broadens the POST endpoint to teacher+ (commit 2). Default
off because there's no moderation flow yet.

Files:
- `src/content-library/types.ts` — schema (140 LOC)
- `src/content-library/store.ts` — two-source loader, in-memory index,
  add API, validation, masteryToDifficulty helper (280 LOC)
- `src/modules/content-library/{index.ts, feature-flags.ts}` — barrel
  + flags
- `data/content-library/seed/{README.md, ...}` — three starter concepts
- modules.yaml entry, health probe, feature-flag aggregator wiring
- 14 unit tests covering all ranking vectors, validation,
  additions-override-seeds, stats, mastery-to-difficulty bands

### `4aea4d2` — HTTP endpoints

Three endpoints. Reads are public (the library is content, not
personal data); writes go through admin by default with a feature
flag for teacher+ broadening.

- `GET /api/content-library/concepts` — list summaries, optional
  `?source=seed|user|llm` filter
- `GET /api/content-library/concept/:id` — full LibraryEntry
- `POST /api/content-library/concept` — admin (or teacher+ when
  flag), creates a runtime addition

Three security choices, all noted at the call site:

1. POST always overrides client-supplied `added_by` with the actor's
   identity. Spoofing attempts are silently dropped.
2. POST rejects `source: 'seed'` at the API layer. Seeds come from
   disk at boot, not from POSTs.
3. For LLM-tagged adds, the optional `llm_provider` field annotates
   `added_by` as `llm:<provider> (via <admin-id>)` so the audit
   trail records both the LLM and the human admin who wired it up.
   No separate "LLM auth" path — LLMs are wired via admin running a
   script.

Real bug caught and fixed during test writing: `handleListConcepts`
read `(req.query as any)?.source` treating `req.query` as a plain
object. But `req.query` is a `URLSearchParams` in production
(`gate-server.ts:590`). The buggy access returned undefined silently,
so `?source=seed` would never filter — every request would return
all entries. Without the route tests this would have shipped silently
broken.

11 route tests cover the auth model end-to-end:
- public reads
- 401 unauth, 403 student/teacher-flag-off, 201 admin
- env-var hint in 403 message
- spoof attempts dropped
- seed source rejected
- kebab-case enforcement
- llm:provider annotation

### (this commit) — router cascade integration + master doc

The library plugs into the existing content router cascade between
the `subscription` and `bundle` tiers:

```
1. uploads / wolfram (intent-specific early routes)
2. subscription      ← user-explicit
3. library           ← THIS MODULE
4. bundle            ← legacy shipped content-bundle.json
5. community         ← unsubscribed community repos
6. generated         ← LLM live generation
```

When the router receives a `concept_id`, it calls `getEntry(concept_id)`.
If found, returns immediately with `source: 'library'` and
`source_ref: library:<seed|user|llm>:<concept_id>`. If not found, the
cascade continues to the legacy bundle.

For `practice-problem` and `walkthrough-problem` intents, the library
prefers the `worked_example_md` body. For all other intents, it
returns `explainer_md`. Disclosure text reflects the choice and the
source — a student sees "From the built-in content library —
explainer (MIT)" for a seed, "From the content library,
user-contributed — explainer (user-contributed)" for a user-added
entry.

`RouteRequest` gains two optional fields, `preferred_difficulty` and
`preferred_exam_id`. These are forward-looking scaffolding — today
the cascade does exact-match by `concept_id` so the hints don't
change behaviour. They'll matter when concepts start having multiple
difficulty entries (e.g. `derivatives-intro` + `derivatives-advanced`).

8 router cascade tests verify:
- library wins for a seeded concept
- disclosure varies by source
- intent → body selection (worked example vs explainer)
- considered-list ordering (library before bundle)
- user-contributed disclosure phrasing
- intent vocab preserved through library hits
- walkthrough-problem also gets worked example

New `LIBRARY.md` master doc (~340 lines) is the contract:
- The two sources (seed + additions) with the override rule
- The full LibraryEntry schema
- The three API endpoints with their auth model
- The router cascade tier + intent → body selection
- The `masteryToDifficulty` thresholds
- Three workflows for adding content (seed, runtime POST, LLM script)
- Durability properties of the JSONL log
- Honest non-goals (no versioning, no moderation queue, no bulk
  import, no rate limit, no delete API)

Coherence pass on existing docs:
- OVERVIEW.md — module count 10 → 11, LIBRARY.md added to doc map
- DESIGN.md — three references to "10 modules" → 11
- ARCHITECTURE.md — `## The 11 modules`, content-library row in
  module table, new "Content library" section with cascade + endpoints
- LAYOUT.md — `src/content-library/` and `src/modules/content-library/`
  added, `data/content-library/` mentioned in the data/ row,
  LIBRARY.md added to top-level doc listing
- MODULARISATION.md — `## The 11 modules`, new §10 `content-library`
  section with the why-not-inside-gbrain rationale, orchestrator
  bumped §10 → §11
- PENDING.md — three new entries in the post-banner shipped table,
  intro count 6 → 9 follow-up commits

### Regression — 9 gates green for each commit

```
Backend tsc            0 errors
Frontend tsc           0 errors
Vitest                 154 / 154   (was 121 — 33 new tests across the trio)
Smoke stdio            49 / 49
Smoke SDK compat       65 / 65
Graph validator        56 agents valid
Subrepo check          passed
Demo verify            14 / 14
Teaching loop verify   10 / 10
```

### Honest non-goals

- The router cascade does **exact-match** by `concept_id`. The
  `preferred_difficulty` / `preferred_exam_id` hints exist on
  `RouteRequest` but don't change behaviour today. They'll matter
  when the library has multiple difficulty entries per concept — a
  separate PR.
- The router doesn't yet pass `preferred_difficulty` automatically.
  The chat handler / lesson handler / etc. would need to compute it
  from the gbrain student model and pass it. Wiring that is a
  separate small commit.
- No frontend UI for content authoring. Admin can curl the POST or
  wire an LLM script; a `/gate/admin/content-library` page would be
  a follow-up.
- No bulk import endpoint. 100 entries means 100 POSTs; a one-off
  script using `addEntry()` directly is cleaner for curated dumps.
- No rate limiting on POST. Admin is trusted; documented as a
  follow-up when middleware exists.
- No content versioning. Re-POST silently overrides; previous version
  stays in the JSONL log but isn't queryable through the API.
- No moderation queue. The flag exists to gate the surface; once
  moderation lands, the flag becomes meaningful to flip.
- No delete endpoint. To remove an entry, an operator manually edits
  `.data/content-library-additions.jsonl` and restarts.
- No expansion of seed beyond the 3 existing concepts. Migrating
  more is mechanical (drop new dirs in `data/content-library/seed/`)
  but not this PR's scope.

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
