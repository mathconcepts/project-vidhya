# Linear Algebra Real-Time + Math Academy Layer — CEO-Reviewed Plan

- **Date:** 2026-08-18
- **Branch:** `claude/linear-algebra-realtime-demo-evwq4b`
- **Review:** `/plan-ceo-review`, mode **HOLD SCOPE** on user-locked scope "Approach B, sequenced A-first"
- **Status:** ACTIVE

## Problem statement (CEO brief)

1. **Linear Algebra must feel real-time, not sample-demo.** Everything available in
   Linear Algebra must be available the same way in real time — any topic, all
   cases. Rethink whether LLM generation alone solves this, or whether extra
   machinery (PDF upload, Wolfram generation, a rebuilt knowledge graph) is needed.
2. **Math Academy benchmark.** Measure Vidhya against
   mathacademy.com/how-our-ai-works (Justin Skycak's system, documented at
   justinmath.com) and adopt what makes Vidhya better.

## Verdict on the two premises

**The knowledge graph does NOT need regenerating.** It is the healthiest artifact
in the repo: 97 hand-authored concepts, 140 acyclic prerequisite edges, load-time
cycle assertion, CI gate, and Linear Algebra is its deepest subgraph (26 nodes,
40 edges, fully self-contained with a clean spine from `matrix-operations` to
`svd`/`jordan-normal-form`). What it lacks is a **second edge type**
(Math Academy's "encompassing graph") and **consumers that can reach it** — the
prereq redirect is built, tested, and structurally unreachable in production.

**LLM generation alone does not produce "real-time feel" — and live student-facing
generation is architecturally excluded on purpose** (no LLM anywhere on the lesson
path; render.yaml ships no provider key; "only AI chat is disabled" is the
documented posture). The demo feels canned because the *adaptive loop is starved*,
not because lessons are missing: all 26 LA concepts already have 8–14 authored
atoms, but the entire product has **3 gradable practice items**, the readiness
engine answers "building your baseline" for every fresh student, demo rails are
hardcoded 3-atom scripts, and six structural bugs sever the loop. Generation is
the **factory** (offline, batch, verified, committed as files); the **product** is
files — same trust model as the existing corpus. Wolfram's role is verification of
generated items, not generation. PDF upload already exists (born-digital
`pdf-parse` + client-side MiniLM RAG that already outranks authored content in
lesson composition) and is not on the critical path for LA breadth.

## Research: Math Academy vs Vidhya (gap table)

Sources: mathacademy.com/how-our-ai-works, justinmath.com
("Optimized, Individualized Spaced Repetition in Hierarchical Knowledge
Structures", /interests/), FAQ.

| Mechanism | Math Academy | Vidhya today | This plan |
|---|---|---|---|
| Prerequisite graph | thousands of topics, expert-encoded | ✅ 97 nodes / 140 edges, CI-guarded (`data/curriculum/gate-ma.yml`) | keep |
| **Encompassing graph** (separate, weighted, "backwards" graph) | ✅ tens of thousands of expert-encoded records | ❌ none | **B1** (LA subgraph) |
| **FIRe** (fractional implicit repetition: credit trickles down, penalties up) | ✅ core theory | ❌ FSRS is per-card, independent | **B2** (FIRe-lite) |
| **Repetition compression** (task selection knocks out due reviews implicitly) | ✅ | ❌ `expectedGain` hardcoded `1.0` (`next-best-action.ts:143`) | **B3** |
| Adaptive diagnostic → knowledge frontier | ✅ order-of-magnitude fewer questions | ⚠️ **built** (`diagnostic-warmup.ts`, API live) but **zero frontend consumers** | **A8** (wire it) |
| Knowledge frontier visualization | ✅ | ❌ concept tree is a synthetic linear chain (`knowledge-routes.ts:233`) | **A9/B4** |
| Student model | spaced-repetition-count profile | ✅ Elo + FSRS (arguably more principled), but **two disconnected models** | **A5** (bridge) |
| XP economy (1 XP ≈ 1 min, daily goals, negative XP for guessing) | ✅ | ❌ (own motivation layer exists) | **B5** — personal XP only |
| Timed quizzes every ~150 XP (testing effect, automaticity) | ✅ | ❌ | **B5** |
| Leagues / leaderboards | ✅ | ❌ and **forbidden** by the no-peer-comparison surveillance invariant | **excluded** (decision D2) |
| Interleaving / non-interference ordering | ✅ | ❌ | NOT in scope (TODO) |
| Mastery gates per knowledge point | ✅ | ⚠️ atoms exist; `eligibleNodes` gates concepts, thresholds broken (A6) | A6 |
| Human-authored lessons | ✅ | ✅ 97 concepts / 883 atom files | keep |

## Locked decisions

| # | Decision | Choice | Why |
|---|---|---|---|
| D0 | Implementation approach | **B via A** — close the loop first, then the Math-Academy layer | User-locked. A makes every LA topic live; B compounds it. |
| D1 | Review mode | **HOLD SCOPE** | Scope already ambitious + sequenced; adjacent ideas go to TODOS. |
| D2 | Engagement economy | **Timed quizzes + personal XP; no leagues** | Exam-relevant + invariant-compatible; leagues violate the locked no-peer-comparison rule. |
| D3 | Canonical student model | **Elo+FSRS canonical**; `student_model` becomes a derived read model fed by an attempts-bus subscriber | Single write path; the bus exists; no route writes the derived store directly. |
| D4 | Demo-deploy persistence | **Set `DATABASE_URL` (Supabase) on the Render demo service** | Config not code; auto-migrate targets it already; verified by T16 smoke (`recorded: true` on deployed URL). |
| D5 | FIRe rollout posture | **Live behind `VIDHYA_FIRE` flag**, property-test suite as the safety gate | fsrs-shadow proves volume-gated shadow modes deadlock at demo scale; blast radius is scheduling, not marks. |
| D6 | Floor-gate ratchet | **Enforce for linear-algebra concepts once A7 lands**; rest stays report-only | Makes "any topic, all cases" a machine-checked contract; regression = red CI. |
| D7 | Adjacent content streams | **In scope**: stance variants for all 26 LA concepts (T17), interactives for the 23 uncovered LA concepts (T18), chat off-corpus provider key + spend/abuse guardrails (T19) | User opted all three from deferred to build-now. Post-LA scaling (encompassing ×97, interleaving) stays a TODO. |
| D8 | Outside-voice amendments | **All adopted** (see "Outside-voice amendments" section): catalog composition, FIRe granularity rule, capped compression bonus, consensus verification, factory pilot gate, honest A5 identity scoping, curated warmup probes, penalty wording, quiz no-repeat + depth gate, FIRe experiment row, metric split, factory as repeatable operator run | Independent reviewer found confirmed contradictions; user approved all three slates. |
| D9 | B demo visibility | **Keep B + seed persona history (T20)** — persona seeder writes plausible multi-day FSRS/Elo/XP history so FIRe, quizzes, and the frontier view demo live on day one | Answers the outside voice's "B is invisible on demo day" without deferring B. |

## Milestone A — close the loop (every LA topic live, end-to-end)

Each task lists files + verification. Effort uses human / CC+gstack dual scale.

**A1 — Make the prereq redirect reachable** *(P1, human ~1d / CC ~30min)*
`src/api/readiness-routes.ts:254` (`resolveAllowedNodes` returns all 97 ids incl.
6 prereq-free roots) + `src/readiness/syllabus-aware-engine.ts:96-107` (redirect
only fires on `eligible.length === 0`, which can never happen). Fix: trigger the
redirect when the eligible set contains **no content-backed node** (use
`AtomLoaderContentChecker` + catalog coverage), and scope `allowedNodes` to the
student's exam/topic context where known. Verify: integration test — fresh student
with LA intent receives a content-backed LA-chain on-ramp action, not
`"building your baseline"`.

**A2 — Backfill `concept_id` on the 150 authored PYQs** *(P1, human ~0.5d / CC ~15min)*
`src/db/seed-static-pyqs.ts` seeds `tags: ["eigenvalues", …]` but never
`concept_id`; `session-store.ts:118` queries `WHERE concept_id = $1`, so 15 real
LA PYQs are invisible. Map tags→concept ids at seed time (idempotent UPDATE for
existing rows), with an explicit tag→concept table for names that aren't concept
ids. Verify: seeded DB returns LA PYQs from `fetchProblemsForConcept('eigenvalues')`.

**A3 — Fix the deployed-bundle path bug** *(P1, human ~1h / CC ~5min)*
`src/lessons/source-resolver.ts:73` reads `frontend/public/data/content-bundle.json`
only; neither Dockerfile ships `frontend/public`, so every deployed lesson's legacy
`components[]` silently degrades. Reuse `src/content/resolver.ts:76-82`'s candidate
list (checks `frontend/dist` first). Verify: container build + smoke asserts a
bundle explainer appears in a composed lesson.

**A4 — Un-stale the client concept graph** *(P1, human ~2h / CC ~10min)*
`frontend/public/data/concept-graph.json` is frozen at 82 concepts / 11 LA
(exported 2026-04-19); `scripts/export-bundles.ts` claims a build hook that doesn't
exist. Wire it as a real `prebuild` step in `frontend/package.json` (or the root
build), regenerate, and add a CI drift check (exported count == YAML count).
Verify: client graph shows 97/26/140.

**A5 — Bridge the two student models** *(P1, human ~3d / CC ~2h)*
`student_model.mastery_vector` (session-keyed, gbrain path) and
`student_skill_elo`+`fsrs_cards` (user-keyed, practice path) never communicate;
`prerequisite_alerts` is only refreshed by `POST /api/gbrain/attempt`. Direction
per decision **D3**. The `attempts-bus` (`src/events/attempts-bus.ts`) already
publishes `attempt.recorded` post-commit — subscribe and fan out to the derived
model. Verify: one attempt through `/api/practice/attempt` moves Elo, FSRS, AND
`prerequisite_alerts`/`mastery_vector`; invariant test that no route writes the
derived model directly.

**A6 — Recalibrate `masteryState` thresholds** *(P1, human ~1h / CC ~10min)*
`student-model-pg.ts:70-76`: `learning` until `n ≥ 5`, and `learning` blocks
prereq edges — unreachable with a thin catalog. Recalibrate (e.g. clear `learning`
at `n ≥ 2` with success-rate condition, or make the block content-aware). Also fix
the phantom `objects_for_skill` view query silently swallowed at
`student-model-pg.ts:100-109` (either create the view in a migration or remove the
dead `at-risk` branch — no silent catch). Verify: unit tests over threshold table;
prereqs unblock after realistic attempt counts.

**A7 — 130 verified LA practice items (the factory)** *(P1, human ~2w / CC ~1-2d incl. review)*
5 items × 26 LA concepts to clear the floor (`gate-ma.floor.yml`), committed to
`data/practice-items/` exactly like the existing 3. Pipeline: offline batch
generation (existing `src/generation/batch/` + `deriveMarking()` from
`src/gbrain/marking-derivation.ts` — refuses unmarkable material) → deterministic
re-grade self-check → Wolfram verification for numerically checkable items →
human spot-check → commit. **Precondition:** fix the Wolfram
`inconclusive`-conflation policy (TODOS.md item: outage ≠ wrong answer) in BOTH
consumers (`content-flywheel.ts`, `wolfram-verify-job.ts`) before trusting
verification rates. Items carry `verification_method` provenance. Verify:
`scripts/check-syllabus-floor.ts` reports 0 LA practice deficits; every item
passes a deterministic re-grade test in CI.

**A8 — Wire the diagnostic warmup UI (knowledge frontier onboarding)** *(P1, human ~3d / CC ~2h)*
`POST /api/readiness/warmup/next` + `/apply` are live and stateless with zero
frontend consumers. Build the onboarding flow (entry from PlannedSessionPage /
KnowledgeHomePage for students with no attempt history): 4–8 bracketing probes,
result seeds Elo priors. Feed the warmup catalog from the A7 items. Verify: fresh
demo student completes warmup and their next-best-action returns a real object.

**A9 — GATE-MA knowledge track + real DAG concept tree** *(P2, human ~2d / CC ~1h)*
`src/knowledge/tracks.ts` has no GATE track (`EXAM.GATE` declared, never used);
Meera's persona names `knowledge_track_id: GATE-MA` which resolves to nothing →
blank cards. Add the GATE-MA track; replace the synthetic linear-chain edges in
`knowledge-routes.ts:233` with the real prerequisite DAG (concept-tree endpoint
serves actual edges); make `status: 'locked'` mean prereq-locked or rename it.
Verify: KnowledgeHomePage renders 26 LA concepts with real edges for Meera.

## Milestone B — the Math Academy layer

**B1 — Encompassing graph for the LA subgraph** *(P1 within B, human ~1w / CC ~1d incl. expert review)*
New `encompasses:` edge type in `data/curriculum/gate-ma.yml` per concept:
`[{id, weight}]`, weight ∈ (0,1] = fraction of the simpler topic practiced
implicitly (Skycak's semantics). LA-only initially (~26 nodes, est. 40–80 edges).
LLM-drafted, human-reviewed (the review IS the deliverable — Skycak hand-encodes
these for a reason). Loader in `concept-graph.ts` mirrors the prereq loader;
validation: acyclic, weights in range, warning when an encompassing edge has no
prereq path (usually-but-not-always overlap is legal, per the source). CI check
alongside `prereq-cycles`. Verify: schema test + graph-integrity test.

**B2 — FIRe-lite credit propagation** *(P1 within B, human ~1w / CC ~4h)*
On each recorded attempt (single integration point: inside `PgStudentModel.update`
transaction or an attempts-bus subscriber, per D3): propagate **discounted
fractional review credit** down encompassing edges into the FSRS cards of
encompassed concepts (multiply weight per hop, depth cap 2, credit discount
factor); on failure, propagate a **bounded penalty** up (a failed prereq review
flags dependents' cards due sooner — never below-floor resets; one careless slip
must not crater a chain). Rollout per decision **D5**. Verify: property tests —
credit monotone decreasing with depth, bounded, idempotent under attempt dedup;
penalty bounded; no propagation when graph has no encompassing edges (non-LA
concepts unchanged).

**B3 — Repetition-compression-lite in task selection** *(P2 within B, human ~3d / CC ~2h)*
Replace `practiceCandidate`'s hardcoded `expectedGain: 1.0`
(`next-best-action.ts:143`) with
`1.0 + Σ (encompassing weight × due-ness of encompassed card)` — i.e. prefer the
task whose implicit repetitions knock out the most due reviews. Also fix
`teachCandidate`'s arbitrary `allowedNodes[0]` (topologically order / frontier
order instead of YAML file order — today it always proposes `sequences`). Verify:
unit tests — given due reviews on `determinants`+`matrix-operations`, an
`eigenvalues` practice action outranks fresh unrelated practice.

**B4 — Knowledge-frontier view** *(P2 within B, human ~3d / CC ~2h)*
Student-facing frontier rendering on the real DAG (mastered / frontier /
locked-by-prereq), consistent with A9's concept tree. Clarity design system:
green = mastery only, no gamification visuals. Verify: component tests +
states coverage (loading/empty/error/success/partial).

**B5 — Timed quizzes + personal XP** *(P2 within B, human ~1w / CC ~4h)*
Personal XP: 1 XP ≈ 1 minute of focused effort, awarded on graded work (partial
credit; none on skip). Quiz every N XP (start N=100): timed, 4–6 items sampled
from due FSRS reviews + frontier concepts via the existing catalog; server-graded
via the same deterministic scorer; quiz results feed the same attempt path (so
FIRe applies). **No leagues, no peer comparison** (D2 — surveillance invariant
10 extends to XP fields: personal-only, allowlisted). New tables (migration
044+, idempotent): `xp_events`, `quiz_sessions`. Answer keys never serialized to
the client pre-submission (mirror the `/api/practice/item/:id` leak test).
Verify: marking-matrix tests, leak test, timer edge cases (below).

## Additional in-scope streams (D7, user-opted from deferred to build-now)

**T17 — Stance variants for all 26 LA concepts** *(P2, human ~1w / CC ~1d incl. review)*
Extend shaken/assured variant files (today: eigenvalues, determinants,
orthogonality only — 6 files each) to the other 23 LA concepts via the A7
factory. ~140 variant files, generate → review → commit. Depends on A7's
factory being proven. Verify: `served_stance` differs for shaken vs assured
persona on every LA concept; demo-rails CI extended.

**T18 — Interactive-spec blocks for the 23 uncovered LA concepts** *(P2, human ~1w / CC ~1d incl. review)*
~50–70 fenced `interactive-spec` blocks (manipulable / simulation /
guided_walkthrough) using the existing dependency-free widgets. Every spec
human-reviewed (formula-evaluator specs are the hardest content to auto-generate
safely); CI: spec parses + evaluator hardening tests already exist. Verify: each
LA concept renders ≥1 interactive off-rail.

**T19 — Chat off-corpus provider key + guardrails** *(P2, human ~3d / CC ~2h + operator config)*
Set a production provider key so the AI tutor answers outside the 883 atoms
(today: honest "needs an API key" error). Guardrails before the key goes live:
per-session rate limit, daily spend cap wired to the existing
`rate-limit-tracker` + cost-meter machinery, and the atom-first path stays
primary (LLM only on atom miss). Needs a named budget owner. Verify: off-corpus
question streams an answer on the deployed URL; cap trips are logged and refuse
gracefully.

## NOT in scope (explicitly deferred)

- **Leagues/leaderboards** — violates locked no-peer-comparison invariant (D2).
- **Post-LA Math-Academy scaling** (encompassing edges for the remaining 71
  concepts; interleaving/non-interference ordering) — → TODOS.md; trigger: LA
  lift evidence + catalog >10 items/concept.
- **Live student-facing LLM generation on the lesson path** — deliberate
  architectural exclusion stands (T19 touches chat only, atom-first preserved).
- **Scanned-PDF/OCR ingestion** — existing honest refusal stands.
- **True CAT / IRT, DKT/AKT** — Phase 4 of the 100x blueprint, unchanged.
- **FSRS/SM-2 swap (Wave 13)** — separate gated track; B2 writes through the
  existing FSRS card layer and inherits whatever scheduler wins.

## What already exists (leverage map)

| Sub-problem | Existing code | Reused? |
|---|---|---|
| Prereq DAG + validation | `gate-ma.yml`, `prereq-cycles.ts`, admin graph browser | ✅ unchanged |
| Prereq redirect logic | `src/readiness/content-gate.ts` (built, tested, dead) | ✅ A1 makes it reachable |
| Adaptive diagnostic | `src/readiness/diagnostic-warmup.ts` + live routes | ✅ A8 wires UI |
| Elo + FSRS + dedup | `elo.ts`, `fsrs.ts`, `student-model-pg.ts`, migration 029/030 | ✅ B2 writes through it |
| Attempt event fan-out | `src/events/attempts-bus.ts` | ✅ A5 subscriber |
| Deterministic grading + marking derivation | `deterministic-scorer.ts`, `marking-derivation.ts` | ✅ A7, B5 |
| Batch generation + cost caps | `src/generation/batch/*`, run-dispatcher | ✅ A7 factory |
| Wolfram verification | `tiered-orchestrator.ts`, `wolfram-verify-job.ts` | ✅ A7 (after policy fix) |
| Demo rails + CI gate | `config/demo-rails.json`, `check-demo-rails.ts` | ✅ extended, not replaced |
| Floor gate | `check-syllabus-floor.ts` + `gate-ma.floor.yml` | ✅ A7 acceptance metric |
| Durable stores pattern | `src/storage/durable-flat-file.ts` | ⚠️ D4-dependent |

## Dream state delta

```
  CURRENT STATE                    THIS PLAN                     12-MONTH IDEAL
  Beautiful canned rails on 3     Any of 26 LA concepts:        Any concept, any exam pack:
  LA concepts; adaptive loop      lesson + graded practice +    diagnostic → frontier →
  starved (3 items, dead          diagnostic onboarding +       compressed reviews →
  redirect, split student         FIRe-compressed review +      mock-to-marks, with the
  model); Math Academy            frontier view + timed         encompassing graph and item
  mechanisms absent or unwired    quizzes. LA = the proof.      factory as routine ops.
```

The plan moves directly toward the 12-month ideal: every mechanism lands
LA-scoped but built generically (edge type in YAML, propagation in the student
model, factory as a pipeline), so scaling = authoring, not re-architecture.

---

# Deep review (11 sections, HOLD SCOPE)

## Section 1 — Architecture

New/changed component graph:

```
                       data/curriculum/gate-ma.yml
                    (concepts + prereqs + NEW encompasses:)
                                  │ load+validate (cycle CI)
                                  ▼
   ┌──────────────┐     ┌──────────────────────┐      ┌──────────────────┐
   │ diagnostic    │     │ SyllabusAwareReadiness│◀────│ ProtoCATSelector  │
   │ warmup UI(A8) │────▶│ Engine (A1 fix, B3    │      │ over catalog      │
   └──────────────┘     │ compression scoring)  │      │ (A7: 133 items)   │
                        └──────────┬───────────┘      └──────────────────┘
                                   ▼ next-action
                        ┌──────────────────────┐
                        │ PracticeAttemptPage / │
                        │ Quiz (B5)             │
                        └──────────┬───────────┘
                                   ▼ POST /api/practice/attempt
                        ┌──────────────────────┐
                        │ PgStudentModel.update │──── tx: dedup → Elo → FSRS
                        │  + FIRe-lite (B2)     │      → FIRe propagation
                        └──────────┬───────────┘
                                   ▼ attempt.recorded (attempts-bus)
                        ┌──────────────────────┐
                        │ derived model (A5):   │
                        │ mastery_vector +      │
                        │ prerequisite_alerts   │
                        └──────────────────────┘
```

Findings:
1. **F1.1 (decision D3):** A5 must pick a canonical model before B2 has a home.
   Recommended: Elo+FSRS canonical; `student_model` becomes a derived read model
   fed by an attempts-bus subscriber. Single write path, event fan-out — no dual
   writes from routes.
2. **F1.2 (decision D4):** the Elo/FSRS/quiz state requires Postgres; the demo
   deploy may run DB-less (render.yaml: `DATABASE_URL sync:false`), in which case
   attempts grade honestly but `recorded: false` — mastery never moves and the
   "real-time feel" dies exactly where the CEO is looking. Must be resolved at
   deploy config level or via the durable-store fallback.
3. **F1.3:** encompassing edges live in the same YAML as prereqs (one source of
   truth, one loader family, one CI gate) — not a new file/table. Resolved in plan.
4. **F1.4:** identity seam — demo personas are seeded under namespaced UUIDs;
   warmup/attempt flows must use the same id the Elo tables key on. A5/A8 must
   thread one `StudentId` end-to-end. Resolved: A5 acceptance test covers it.

## Section 2 — Error & Rescue Map (registry)

```
CODEPATH                          | WHAT CAN GO WRONG                  | HANDLING (planned)
----------------------------------|------------------------------------|--------------------------------------
A7 batch generation               | provider 5xx/timeout               | existing batch retry/backoff; run resumable (batch_jobs ledger)
                                  | cost cap exceeded                  | refused BEFORE call (existing)
                                  | unmarkable material                | deriveMarking refuses → honest unmarked row, excluded from catalog
                                  | malformed LLM JSON                 | item dropped + logged with concept id; never committed
A7 Wolfram verify                 | outage / 429 / timeout             | status='inconclusive' ≠ failure (policy fix); item queued for re-verify, not discarded
A2 PYQ backfill                   | tag with no concept mapping        | loud log + report row; PYQ left unmapped (visible in floor report), never guessed
A1 redirect                       | chain node missing content         | findPrereqRedirect returns null (existing fail-closed); falls back to diagnose WITH reason logged
A5 bus subscriber                 | derived-model write fails          | exception-isolated (existing bus contract); logged with student+object id; primary tx unaffected
B2 FIRe propagation               | encompassing cycle (bad YAML)      | load-time assertion — server refuses to boot (mirrors prereq behavior)
                                  | depth explosion                    | hard depth cap 2 + per-attempt propagation budget
                                  | duplicate attempt replay           | attempt_dedup PK short-circuits before propagation
B5 quiz submit                    | double-submit                      | idempotent on (student, quiz, ts) like practice attempts
                                  | timer expiry mid-answer            | server-side deadline; late submits graded but flagged 'late', no XP bonus
                                  | DB-less deploy                     | grade honestly, recorded:false, UI says so (existing pattern)
A8 warmup                         | empty catalog for probe band       | bracket falls back to nearest-band item; if none, warmup ends early with partial placement (never spins)
A4 export drift                   | export forgotten                   | build hook + CI equality check — cannot drift silently again
```

GAPs in current code the plan explicitly closes: silent `catch {/* skip */}` on
lesson prereq-review (A2/A7 make it resolvable; log when skipped), phantom
`objects_for_skill` silent catch (A6), unconsumed `getAtomFallbackCounts` (Section 8).

## Section 3 — Security & Threat Model

- **Quiz/practice answer keys:** never serialized pre-submission; mirror the
  existing leak test (`/api/practice/item/:id` pattern). Likelihood M / Impact M
  — mitigated by test.
- **Warmup state forgery:** client round-trips reducer state; a hostile client
  could submit a fabricated placement to inflate initial Elo. Impact L (self-harm
  only: worse recommendations; no marks, no peer visibility). Mitigation: clamp
  placement range server-side on apply; log placement events. Accepted risk.
- **XP integrity:** XP awarded server-side only, from graded attempts — no
  client-asserted XP. Surveillance invariants: XP fields are personal-only;
  extend invariant tests so `xp_*` never appears in any cohort/peer payload.
- **Generated content injection:** A7 items are committed files reviewed in PR +
  CI-re-graded; no runtime LLM output reaches students. Prompt-injection surface
  unchanged.
- **New endpoints:** quiz routes require auth (student role); admin surfaces
  unchanged. No new secrets; provider keys stay operator-side for the factory.

## Section 4 — Data Flow & Interaction Edge Cases

FIRe attempt flow (shadow paths):

```
 attempt ──▶ validate(422 paths exist) ──▶ grade(deterministic) ──▶ tx:
   │                                                                dedup? ──dup──▶ no-op (idempotent)
   │                                                                Elo/FSRS update
   │                                                                FIRe: for hop≤2: credit×w×discount
   ▼                                                                └ penalty (bounded) on fail
 nil/empty response ──▶ 422 (existing gateResponseFromBody)
 unknown object ──▶ 404 (existing)
 DB down mid-tx ──▶ tx rollback; grade still returned; recorded:false
```

Interaction edge cases (quiz + warmup):

| Interaction | Edge case | Handling |
|---|---|---|
| Quiz | navigate away mid-quiz | server deadline stands; resume shows remaining time; expiry → auto-submit answered items |
| Quiz | retry submit while in-flight | idempotent ts key |
| Quiz | zero eligible items (fresh student) | quiz not offered below item threshold — honest empty state, never a padded quiz |
| Warmup | abandon mid-diagnostic | stateless — nothing persisted until apply; re-entry restarts (cheap: ≤8 probes) |
| Warmup | double-apply | apply is a pure reducer; server clamps + upserts priors idempotently |
| Frontier view | 26-node graph on mobile | scrollable container, no horizontal page scroll (design rule) |
| NextBestActionCard | slow next-action (N+1) | fixed by §7 batching; loading state exists |

## Section 5 — Code Quality

- **Third-spacing-policy risk:** B2 must write through FSRS cards — no fourth
  schedule. The unused `retrieval_schedule [3,10,30]` default on
  `curriculum_units` is documented as vestigial (TODO note, not touched).
- **DRY:** propagation math lives in one pure module (`src/gbrain/fire.ts`
  suggested), imported by the student model — never re-implemented in routes.
  Frontier UI and A9 concept tree consume ONE graph endpoint.
- **Naming:** `encompasses` (Skycak's term) over invented synonyms.
- **Dead code closed:** phantom `objects_for_skill` (A6), `fetchWolframExample`
  (noted stale, removal optional), `getAtomFallbackCounts` consumer (§8).
- **Complexity:** propagation is recursive with cap 2 — keep as explicit loop over
  precomputed 2-hop closure to stay testable.

## Section 6 — Test Review

New things → tests:

- **Graph:** encompassing schema validation (weights, acyclicity, LA coverage) —
  unit + CI gate. Hostile QA: cycle via 3 hops; weight 0; weight > 1; self-edge.
- **FIRe:** property tests (credit strictly decreasing per hop; total implicit
  credit ≤ explicit credit; idempotence under dedup replay; penalty bounded;
  non-LA concepts byte-identical behavior). Chaos: 1000 random attempt sequences
  → invariants hold.
- **Compression scoring:** deterministic ranking test (due-review domino case).
- **A7 factory:** every committed item must pass deterministic re-grade in CI
  (extend the existing golden gates); msq/mcq distractor rules via deriveMarking
  refusal tests; floor gate goes green for LA.
- **Warmup UI:** e2e — fresh student completes warmup, next-action returns real
  objectId (the 2am-Friday test for this whole plan).
- **Quiz:** marking matrix, leak test (serialize response, assert no answer
  fields), timer expiry, double-submit.
- **A1:** regression test pinning that a content-starved eligible set triggers
  redirect (the exact production wiring, not narrow test-only allowedNodes).
- **Flakiness:** quiz timer tests use injected clock; no wall-clock sleeps.
- Pyramid: heavy unit (pure functions), thin integration (routes+pg), 2–3 e2e.

## Section 7 — Performance

- **Existing N+1 (aggravated by A1/B3):** `eligibleNodes` = up to 97 `getNode` +
  140 `masteryState` awaits per request, each a Pg round-trip. Fix inside A1:
  batch-fetch all Elo rows + FSRS cards for the student in 2 queries, evaluate in
  memory. Same for B3's due-review scan. p99 target < 150ms DB-backed.
- **FIRe write amplification:** ≤ (edges within 2 hops) card updates per attempt
  — LA worst case ~10 rows; single transaction, one UPDATE … FROM unnest batch.
- **Indexes:** `fsrs_cards(due_at)` exists; add `(student_id, due_at)` if quiz
  sampling scans; `xp_events(student_id, created_at)`.
- **Catalog size:** 133 file items DB-less — trivial. concept-graph.json 97
  nodes — trivial.

## Section 8 — Observability

- **The metric for this whole effort:** `% of /api/readiness/next-action responses
  carrying a real objectId` (vs diagnose-fallback). Log per-arm selection; expose
  on the admin dashboard. Today this is ~0% for fresh students; ship target ≥ 90%
  for LA-intent students.
- Consume the dangling `getAtomFallbackCounts` in an admin surface.
- FIRe: structured log per propagation (attempt id, hops, credit total); daily
  counter into existing content telemetry.
- Quiz: completion rate, timeout rate. Warmup: completion rate, placement spread.
- Factory: per-run verified/refused/inconclusive counts (post-policy-fix, the
  number is finally honest).
- Runbooks: factory run fails → resume via batch ledger; Wolfram outage →
  inconclusive queue drains on next sweep.

## Section 9 — Deployment & Rollout

- **Migrations (044+):** `xp_events`, `quiz_sessions`, optional
  `objects_for_skill` view — all idempotent `IF NOT EXISTS`, auto-applied. No
  destructive changes; PYQ backfill is additive UPDATE.
- **Order:** A3/A4 (pure fixes) → A2 → A6 → A1 → A5 → A7 (content lands
  incrementally per concept — partial coverage is fine and visible in the floor
  report) → A8/A9 → B1 → B2 (per D5) → B3 → B4/B5.
- **Flags:** FIRe behind `VIDHYA_FIRE` (per D5); quizzes behind `VIDHYA_QUIZ`
  until content threshold met. A-fixes need no flags (they repair intended
  behavior).
- **Deploy risk window:** old client + new server benign (additive APIs). A4
  changes a public JSON file — additive.
- **Rollback:** git revert per slice; FIRe flag off restores per-card FSRS
  exactly (propagation only ever adds reviews/credit — cards remain valid);
  quiz flag off hides UI, tables inert.
- **Post-deploy smoke:** extend the existing deployed-URL smoke workflow: compose
  an LA lesson and assert a bundle explainer present (A3 regression), fetch
  next-action for a seeded persona and assert objectId present.

## Section 10 — Long-Term Trajectory

- **Debt introduced:** encompassing graph is a living artifact — every new
  concept/item needs edge review (Skycak: "I still have to update it every
  rollout"). Mitigation: authoring guide + CI validation + LA-only blast radius.
- **Path dependency:** none adverse; edge type + propagation generalize to all 97
  concepts and future exam packs by authoring, not re-architecture.
- **Reversibility:** 4/5 (YAML + flags + additive migrations; only the A5 model
  unification is a real commitment — and it removes debt rather than adding it).
- **1-year question:** a new engineer reading `gate-ma.yml` sees two edge types
  with names from published literature and a plan doc explaining why. Clear.

## Section 11 — Design & UX specification (rewritten by /plan-design-review, DR-1..4 + DR-T1..2)

Wireframes: `docs/designs/linear-algebra-wireframes.html` (built from the real
Clarity tokens — these ARE the visual reference for T8/T13/T14). Classification:
APP UI — calm hierarchy, hairline rows on canvas, cards only when the card is
the interaction. Where this conflicts with earlier text, this section wins
(it supersedes the pre-review flow diagram, which assumed 4–8 probes).

User flow (corrected for the OV2-8 warmup scope):

```
 first visit ──▶ Warmup: 4–6 spine concepts, 15–25 probes ──▶ Placement result ──▶ Frontier
                   │ "Stop here" (partial placement)                                 │
                   │ "Skip" → A1 on-ramp ("we'll start at the beginning")            ▼
              PlannedSession ◀── NextBestActionCard(+focused-work strip) ──▶ /attempt/:id
                     │                          │ meter full → quiz OFFER row        │
                     ▼                          ▼                                    ▼
                 Lesson (atoms)         Checkpoint quiz ──▶ quiz result       graded result
```

**DR-1 — Frontier (B4/A9, wireframe 3).** Never draw the graph. Topological
vertical spine in 4 labeled clusters (Matrix operations → Determinants &
systems → Eigen-theory → Decompositions); each concept a 44px hairline row with
a status DOT (no padlocks, no icons): solid green = demonstrated mastery;
hollow/tinted green = warmup-inferred, captioned "placed" (NEVER rendered as
proven — receipt-culture rule; detail copy: "Placed by your warmup — one
practice session confirms it"); ink-outline = frontier; grey = later, with the
prerequisite as the label ("after eigenvalues" — `locked` is renamed in copy
everywhere). "You are here" is the screen's ONE focal card (frontier concepts +
one green CTA), auto-scrolled into view on load. Mastered clusters collapse to
one-line rollups ("Matrix operations · 6 of 6"). Cross-branch edges appear only
in a per-concept bottom sheet ("Builds on: eigenvalues, determinants ✓"), never
drawn globally. Vertical scroll only. **KnowledgeHomePage demotion is in B4's
scope:** the existing four stacked shadow-cards become hairline rows so the
frontier is the only focal element. Full node-link rendering stays in the admin
graph browser.

**DR-2 — Warmup (A8, wireframes 1–2).** Progress is per-CONCEPT: a 5-segment
bar + "Concept 2 of 5 · Determinants" (never a 25-dot row). NO per-probe
verdicts — answer → quiet advance, ≤180ms crossfade via the shared
reduced-motion hook. "I haven't learned this yet" is a first-class answer
option (placement signal, styled secondary). "Stop here" early-exit is always
visible in the nav and triggers partial placement. The RESULT screen leads with
competence: headline "You're solid through {concept}", one placement line
("We'll start you at {concept} — the interesting part"), row list with
placed-vs-start-here dots, ONE green CTA ("Start practising"). No score, no
per-item review, no Elo number, no red anywhere in the warmup flow. Load-bearing
copy (verbatim, voice-reviewed):
- Framing (pre-probe 1): "This isn't a test. We expect you to miss some —
  that's how we find your starting line. Nothing here is graded."
- Probe meta: "not graded" (right-aligned, 13px).
- Early-exit: "Stop here — use what you've learned so far".
- Result footnote: "Placement is a starting point, not a grade. It adjusts as
  you work."
- Skip landing: "We'll start at the beginning."

**DR-3 — Checkpoint quiz (B5, wireframe 4).** The quiz is an OFFERED row, never
an interrupt: when the meter fills, a quiet row appears ("Checkpoint quiz
ready · 6 questions · whenever you are"); declining costs nothing, no shame
state, the offer persists. Header: "Checkpoint", never "Exam". ONE shared timer
primitive, two registers: MockExam keeps full exam chrome; the quiz gets the
light register — mono digits (system rule: timers are mono), grey static
capsule, ORANGE (`--orange-tint`/`--orange-ink`) below 20% remaining; never
red, never pulsing, no per-second color shifts. This standardizes on
DiagnosticPage's multi-stop treatment; MockExamPage's binary-red flip migrates
to the shared primitive under its exam register (with T22). Timer changes
announce via `aria-live="polite"` at register transitions only. Pre-quiz
framing: "6 questions · about 8 minutes · GATE is timed — this is practice for
the clock. Running over won't lose you marks." Sub-timer line: "running over
won't lose marks". Expiry: "Time's up — what you answered is graded" (warm,
never "you failed to finish"); late submits per the eng spec (graded, flagged,
no bonus). Question card reuses PracticeAttemptPage's vocabulary wholesale
(meta row, marking chip, option buttons, Submit+Skip, ReceiptBorder result).

**DR-4 — Focused work, not XP (B5, wireframe 5).** The student-facing form
speaks MINUTES ("XP" stays the internal unit in code/API): a hairline-topped
strip INSIDE the focal NextBestActionCard (like the existing readiness line) —
label "Focused work", 3px track (`--surface-fill`) with GREEN fill (mastery
semantic; never indigo), mono tabular figures "64 / 100 min". Fills once on
entry (`--dur-slow`, shared hook), then still. Award moment: one quiet line on
the graded result ("+3 min of focused work") — no toasts, no floating numbers,
no levels, no badges, and negative-XP events are never surfaced to students. At
threshold the strip's slot becomes the quiz offer row. XP detail folds into
CompoundingCard's existing expanded grid — NO third motivation card.

**Information hierarchy (first / second / third), per screen:**
- Warmup probe: question (17px+, the focal element) → answer options (44px) →
  concept-progress line (13px, top, quiet).
- Placement result: competence headline → placement line + rows → green CTA.
- Frontier: "You are here" card → its CTA → mastered rollups above (collapsed) →
  later clusters below (dimmed). Focused-work strip never first on any screen.
- Quiz: question → options → timer (secondary, corner) → "2 of 6".
- Quiz result: marks earned → one line of what it confirmed/unlocked → next
  action.

**Interaction states (what the student SEES):**

| Surface | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL |
|---|---|---|---|---|---|
| Warmup | ≤100ms optimistic advance between probes (no spinner flash) | no probe for band → early "Your starting line is ready" | "Couldn't save your placement — your answers are kept, tap to retry" | result screen (DR-2) | "Stop here" → same result screen from answered concepts |
| Frontier | skeleton rows (existing 80px pattern) | no placement → "Take the 2-minute warmup to light this up" + CTA | inline row "Couldn't load your map — pull to retry" (NEW — page has none today) | spine view | placement on 4/26 → placed dots only where known, rest "after …" |
| Quiz offer | — | pool below 2× quiz length → row reads "Checkpoint unlocks as you practise more" (visible, not hidden) | — | "Checkpoint quiz ready · whenever you are" | — |
| Quiz | pre-quiz framing screen | — | submit error: inline red caption, answer kept, Submit retries (existing pattern) | result: marks + confirmed line + next action | expiry: answered items graded, "Time's up —" framing; skipped marked no-cost |
| Focused-work strip | renders at last known value | 0 min: "Your first focused minutes land here" | hidden on fetch error (strip, not card) | fill-once animation | mid-goal value |

**Journey storyboard (Meera, anxious, 11pm):** warmup framing (fear → "not a
test" relief) → probes (no verdicts; "haven't learned this yet" removes bluff
pressure) → result (competence-first — the relief beat) → frontier ("you are
here" positions her; no wall of padlocks) → practice (existing graded flow,
warm retain copy — "Quick refresh: determinants · worth 2 marks", never
"recall at 0% and falling"; retain rationale copy joins the OV2-1 due-scan
work) → meter fills (progress she can feel in minutes) → quiz OFFER (her
choice — agency beat) → checkpoint (light register, mercy visible) → result
(marks + confirmed). Celebration stays where the system allows it: exactly
once, on completing the day's plan.

**Sanctioned motion (complete list — everything else is still):** probe
crossfade (≤180ms), focused-work fill-once on entry (`--dur-slow`), frontier
auto-scroll to "You are here" (`--ease-standard`). All three route through the
shared `usePrefersReducedMotion` hook (T24); framer-motion duration literals
are banned in new surfaces (they bypass the token collapse).

**Responsive & a11y:** 390px-first; ≥768px the frontier spine center-columns at
`--content-max` (clusters never go multi-column — vertical order IS the
semantics). All rows/options ≥44px. Quiz options: `role=radiogroup`/`radio`
with arrow-key nav (fix the existing selected-state no-op ternary,
PracticeAttemptPage:296, and give selection a real
`--surface-fill`+border-color change). Frontier rows are buttons (sheet
trigger) with the reason text in the accessible name ("Diagonalization, after
eigenvalues"). Timer: `aria-live=polite` at register changes only. Contrast:
`--green-ink`/`--orange-ink` on white for all sub-17px text (4.5:1). Bottom
padding reserves space for WalkthroughBar (fixed bottom bar, zIndex 60) on all
new surfaces.

**Design-debt work pulled into scope (DR-T1/T2):**
- **T23** — student-facing text-floor fixes: NextBestActionCard rationale
  12px→15px supporting, PracticeAttemptPage solution steps 15px→17px,
  KnowledgeHome `why_next` 13px→15px. (Admin-page clusters stay out.)
- **T24** — component hygiene, full: shared `usePrefersReducedMotion` hook
  (replaces 8+ ad-hoc copies); new surfaces import `ui/` primitives (Card,
  ListRow revived); delete dead `components/app/MasteryRing.tsx`; migrate the
  hand-rolled card in NextBestActionCard/PracticeAttemptPage/KnowledgeHome/
  MockExam to `ui/Card`; extend `ui/ProgressBar` for the focused-work strip
  (no fifth bar).
- **T17 addendum:** the stance-variant review rubric gains a voice-compliance
  line (no hype, no guilt, second person) — 140 generated files get voice
  review, not only pedagogy review.
- **T20 addendum:** the seeded demo state must assert the RENDERED shape:
  Meera's frontier shows ≥2 collapsed mastered clusters, mixed
  demonstrated/placed dots, dimmed later rows, mid-meter focused work, and one
  due review — a believable mid-journey screen exercising every visual state.

**AI-slop guards (explicit):** no stat-tile mosaics for XP; frontier is rows on
canvas, not a card grid; system-font stack is a deliberate Clarity/HIG choice
(documented exception to the generic "no system-ui" heuristic); the three
sanctioned motions are the complete motion budget.

---

## Failure Modes Registry

| CODEPATH | FAILURE MODE | RESCUED? | TEST? | USER SEES | LOGGED? |
|---|---|---|---|---|---|
| A7 factory | provider outage mid-run | Y (resume ledger) | Y | n/a (operator) | Y |
| A7 verify | Wolfram outage | Y (inconclusive≠fail) | Y | n/a | Y |
| A1 redirect | no content-backed chain | Y (null→diagnose+reason) | Y | honest baseline card | Y |
| A5 subscriber | derived write fails | Y (subscriber self-catches its async work — the bus isolates sync throws only, per OV2-7) | Y | nothing (primary intact) | Y |
| B2 FIRe | YAML cycle | Y (boot refusal) | Y | n/a | Y |
| B2 FIRe | dup replay | Y (dedup PK) | Y | nothing | Y |
| B5 quiz | expiry mid-answer | Y (server deadline) | Y | "time up" + graded partial | Y |
| B5 quiz | DB-less | Y (recorded:false) | Y | honest banner | Y |
| A8 warmup | empty probe band | Y (nearest band/early end) | Y | shorter warmup | Y |
| A4 export | forgotten regen | Y (CI equality) | Y | n/a | n/a |

No CRITICAL GAP rows remain (every row rescued + tested + visible).

## Outside-voice amendments (adopted, D8/D9)

An independent fresh-context reviewer challenged the plan; all findings below
were confirmed against the code and adopted by the user. They amend the tasks
above; where they conflict with earlier task text, **this section wins**.

1. **Catalog composition (amends A7 + T16, new T21).**
   `getLearningObjectCatalog()` (`src/scoring/learning-object-catalog-pg.ts:247-256`)
   picks the file catalog ONLY when `DATABASE_URL` is unset — so D4's database
   would make the 130 committed items invisible. Fix: a composite catalog
   (file items always available; `generated_problems` rows add on top; id
   collision → DB wins) or an idempotent boot-time seeder of
   `data/practice-items/*.json` into `generated_problems` (pattern:
   `seed-static-pyqs.ts`). Composite catalog preferred — files stay the source
   of truth for authored items on every deploy shape. Acceptance: with
   `DATABASE_URL` set, `/api/practice/item/la-eigen-trace-det-001` still serves.
2. **FIRe granularity rule (amends B2).** Encompassing edges are concept-level;
   FSRS cards are item-level. Rule: map the attempted item → its concept
   (`skill_id`); for each encompassed concept within depth 2, distribute the
   discounted credit across that concept's EXISTING cards, normalized so total
   implicit credit per concept ≤ weight × discount; **no cards → no-op**
   (nothing due = semantically correct). Property tests target this rule.
3. **Compression bonus bounded (amends B3).** Bonus term uses the same
   discounted weights B2 actually grants, and total practice `expectedGain` is
   capped at **1.8** — strictly below the extraction-first retain guarantee
   (overdue leaking card: `1.0 + (1 − recall)` → up to 2.0,
   `next-best-action.ts:124`). Property test: an overdue card with recall below
   `RETAIN_RECALL_THRESHOLD` outranks any compression-boosted practice.
4. **Real verification for non-numeric items (amends A7).** Deterministic
   re-grade is circular for MCQ/MSQ. The factory adds dual-model consensus
   (existing `requiresConsensus()` machinery) for every non-numeric item;
   Wolfram remains the arbiter for numeric ones. Items failing consensus are
   refused, not committed.
5. **Factory pilot gate (amends A7).** The batch pipeline has never produced
   practice items (its ingestion hook writes `atom_versions`). A7 begins with a
   practice-item output adapter + a **5-item pilot run on one concept**,
   reviewed end-to-end (generate → verify → commit → CI re-grade → served →
   graded), BEFORE the 130-item run. The pilot is the feasibility proof; the
   estimate for T7 is contingent on it.
6. **A5 honest scoping (amends A5).** The hard part is identity: `student_model`
   is session-keyed, Elo/FSRS user-keyed, the platform anonymous-first. A5
   includes the session↔user mapping (anonymous ids resolve via the existing
   anonymous-upgrade path; demo personas already use stable namespaced UUIDs).
   The "single write path" invariant applies to the **practice path** initially;
   legacy gbrain writers migrate in a follow-up, tracked, not silently assumed.
7. **Warmup calibration (amends A8).** LLM-guessed difficulties are noise below
   n=100 attempts (`elo.ts:173`). The warmup probe set is a curated subset
   (1–2 per LA concept) with **hand-assigned difficulty**, and A8 includes the
   missing persist-priors endpoint (warmup apply currently persists nothing).
8. **Penalty direction wording (amends B2).** Penalties flow ALONG encompassing
   edges upward: failing an **encompassed** (simpler) topic penalizes the
   **encompassing** (advanced) topics' schedules. Prereq edges are not involved
   in FIRe.
9. **Quiz pool protection (amends B5).** A quiz never re-serves an item the
   student saw within 14 days; quizzes are offered only when the eligible pool
   (due + frontier concepts, minus the no-repeat window) holds ≥ 2× the quiz
   length. Below that: honest "not enough fresh material yet" state.
10. **FIRe measured (amends B2/D5).** Alongside the `VIDHYA_FIRE` flag, create
    experiment row `fire_v1_gate_ma` (out-of-band activation, same pattern as
    `personalized_selector_v1_gate_ma`) so the lift ledger measures it. Exit
    criterion: review-load reduction (explicit reviews per retained concept)
    with lift_v1 non-negative; documented in the experiment hypothesis.
11. **Metric split (amends §8).** Two metrics, not one: (a) % of next-action
    responses with a real objectId (all students), (b) prereq-redirect
    fired-rate + its integration test. (a) alone is trivially satisfiable while
    only LA has items. Exam scoping for (a) arrives with A9's GATE-MA track.
12. **Factory as an installed routine (amends A7).** The factory is not a
    one-shot: wire it as a RunLauncher-launchable run type, with floor-gate
    deficits feeding the existing `run_suggestions` operator inbox, so the pool
    regrows as a routine operation. A session exhausting a concept's items is a
    suggestion, not a dead end.

## Engineering review corrections (ENG-D1..D4, verified against code)

`/plan-eng-review` fact-checked every integration seam. Where this section
conflicts with earlier text, **this section wins.**

**ENG-D1 — FIRe lives INSIDE the `PgStudentModel.update()` transaction** (not a
bus subscriber). Verified: the attempts-bus fires post-commit, isolates only
synchronous throws (`attempts-bus.ts:49-53`, listener type is `void` — an async
subscriber's rejection escapes), and the dedup key blocks replay, so a failed
propagation would be silently unrecoverable. A5's *derived-model* refresh stays
on the bus (best-effort is acceptable for a read model); B2's propagation is a
batched write inside BEGIN/COMMIT.

**ENG-D2 — Compression cap is 1.3, not 1.8.** Verified: a surfaced overdue
retain's gain floor is `1.0 + (1 − RETAIN_RECALL_THRESHOLD=0.7) = 1.3`
(`next-best-action.ts:216,227` — the formula lives in `pickDueReview`, not
:124), and the comparator already favors retain on ties (:75-81). Practice
`expectedGain ∈ [1.0, 1.3)`. Also verified: `armWeightsForPhase` multipliers
are applied POST-selection to the surfaced value only
(`syllabus-aware-engine.ts:85`) — they never re-rank; property tests target
`DefaultReadinessEngine.nextBestAction` directly.

**ENG-D3 — B5 coexists with MockExam; T22 fixes its leak.** A timed exam
already ships (`MockExamPage.tsx` + `GET /api/gbrain/mock-exam/:sessionId` →
`moat-operations.ts:347-436`). B5 remains the new server-graded quiz on the
deterministic-scorer path. **T22 (new, P2):** `generateMockExam` returns
`correct_answer` to the client and grades client-side — move grading
server-side; also `mock_exams` is created by runtime SQL
(`moat-operations.ts:403-414`), bypassing the schema column gate — give it a
real migration. B5 must NOT copy that pattern.

**ENG-D4 — corrections slate (all adopted):**

1. **A2 is bigger than a backfill.** `pyq_questions` has NO `tags` and NO
   `concept_id` column (base schema `001_rag_schema.sql:36-50`; the topic label
   lives in `topic`). A2 = (a) migration adding `concept_id TEXT` (+ baseline
   entry — already present in the column baseline), (b) seeder maps
   topic/question content → concept id at seed time, with the idempotent UPDATE
   running BEFORE the `existingCount` skip-guard (`seed-static-pyqs.ts:84-97`
   `continue`s past the whole topic), (c) migration 035's 11 LA rows mapped
   too, (d) **fix `fetchProblemsForConcept`** (`src/sessions/session-store.ts:127-134`)
   which references four wrong/absent columns (`concept_id`, `question`,
   `expected_answer`, numeric compare on `difficulty TEXT`) — it currently
   THROWS, it doesn't return empty.
2. **A5 absorbs two latent transaction bugs** in `student-model-pg.ts`: the
   `attempt_error_tags` insert's swallowed `.catch()` INSIDE the open tx
   (:272-279 — a failure aborts the tx, turning COMMIT into silent ROLLBACK
   while `update()` reports success and publishes the event), and the
   `attempt_dedup` insert living OUTSIDE the tx (:186-194 — a rolled-back
   attempt is permanently deduped-out). Fix: move dedup inside the tx; handle
   error-tags without swallowing inside the tx. Note `update()` also writes
   `item_difficulty_elo` — FIRe propagation must not disturb item ratings.
3. **B2's mechanism is pinned:** FSRS has NO fractional rating API
   (`Rating = 1|2|3|4`). FIRe credit = direct `stability` adjustment with
   `dueAt` recomputed via `intervalForRetention` (the two are coupled;
   `recallProbability` ignores `dueAt`, so due-date-only writes are invisible).
   Penalty = bounded stability reduction, same recompute.
4. **A4's hook is a Dockerfile step**, not an npm `prebuild`: the production
   image runs `npx vite build` directly (`Dockerfile:26-29`), bypassing npm
   lifecycle scripts, and a frontend-cwd prebuild would break
   `export-bundles.ts`'s cwd-relative OUT_DIR. Add
   `RUN npx tsx scripts/export-bundles.ts` before the vite build (public/ →
   dist/ is copied by vite) + the CI equality check.
5. **A1 needs a composite content-checker adapter:** `ContentExistenceChecker`
   is a one-method conceptId-only interface (`content-gate.ts:34-42`); "atoms +
   catalog coverage" = a new adapter beside `atom-content-checker.ts`, not a
   config change. `hasContent()` today checks atoms only.
6. **T20 prerequisites:** the persona seeder's `ON CONFLICT (user_id)`
   (`persona-seeder.ts:96`) targets a column with NO unique constraint
   (`011:47` is unique on session_id only) — re-seeding throws. Fix constraint
   or conflict target first; add the missing PRNG/determinism seam
   (`futureExamDate()`/`new Date()` are time-dependent today). Persona ids are
   TEXT-compatible with `student_skill_elo`/`fsrs_cards.student_id` ✓.
7. **B1's cycle check needs parameterizing:** `assertNoPrerequisiteCycles`
   hardcodes the `prerequisites` field name (`prereq-cycles.ts:16-19`); add a
   field-name param or a remapping shim for `encompasses`. Good news verified:
   the YAML loader whitelists fields, so adding `encompasses:` keys is safe —
   silently ignored until the new loader lands.
8. **A7 writes its own dual-model answer-key check.** `requiresConsensus()` is
   a 2-value type predicate; `compareMathAtoms` FAILS OPEN (`agreed: true`) for
   anything not worked_example/formal_definition, disagreement never blocks by
   design, and the logic is inlined in `orchestrator.ts:335-378`. Reuse
   `pickConsensusSecondary`/`consensusProvidersAreDistinct` + answer
   normalizers only. Refuse-on-single-leg: if no second distinct provider is
   available, the factory REFUSES the item (the atom path's ship-anyway
   fallback is not acceptable here). Also: raise the batch `max_output_tokens`
   (2048 today) for item+solution payloads; a factory bug emitting invalid JSON
   currently LOWERS the floor count silently (`check-syllabus-floor.ts:181-183`)
   — add a strict-parse CI step over `data/practice-items/*.json`; and stamp
   honest `verification_method` values (note `catalog-file.ts:105` hardcodes
   `'human_verified'` as the served verification label — fix to derive from
   `verification_method`).
9. **D6 needs a manifest key, not a value flip:** `ratchet` is a single global
   `'report_only'|'blocking'` (`check-syllabus-floor.ts:49-53`); per-topic
   scoping doesn't exist. Add `enforce_topics: [linear-algebra]` to
   `gate-ma.floor.yml` + corresponding script logic.
10. **Item count corrected: 123 net-new, not 130.** LA floor = 24×5 + 2×3
    (`vector-spaces` and `linear-transformations` override to 3) = 126, minus
    3 existing.
11. **B5 idempotency is per-item:** the real key is `(studentId, objectId, ts)`
    (`attempt-dedup.ts:30-32`) — no quiz dimension exists. Quiz submits send a
    stable per-item ts; add a `quiz_sessions`-level idempotency key in the new
    migration for the submission record itself.
12. **The XP/no-peer-comparison invariant must be WRITTEN, not extended:**
    invariant 10 only asserts `ATTENTION_CAP` + 4 PII field names in
    `admin-cohort-routes.ts`. B5 adds a new invariant test: XP fields never
    appear in cohort/peer payloads. New columns for migration 044 go into
    `scripts/schema-column-baseline.json` IN THE SAME PR (`xp_amount`,
    `total_xp`, `quiz_id`, `awarded_at`, `deadline_at`, `item_ids`, `graded_at`
    etc.); prefer already-baselined names (`student_id`, `status`,
    `started_at`, `submitted_at`, `score`) where honest.
13. **A6's phantom is a FUNCTION, not a view** (`objects_for_skill($2)` at
    `student-model-pg.ts:105`) — either ship a set-returning function in its
    own migration (sequenced against 044) or delete the dead at-risk branch;
    `'at-risk'` is unreachable today.
14. **eligibleNodes batching confirmed in A1's scope** (97 `getNode` + 140
    `masteryState` awaits per request today).
15. **Migration hygiene:** 044 is next ✓; `035` is duplicated on main (two
    files) — do not repeat; number A6's function and B5's tables explicitly
    (044 = quiz/XP, 045 = objects_for_skill or A2's concept_id — assign in
    implementation order, one number per file).

## Second outside voice (eng round) — adopted corrections (OV2-D1..D4)

A second fresh-context reviewer attacked the corrected plan; 11 findings, all
adopted. Where this conflicts with earlier text, **this section wins.**

1. **Build the due-card scan (P1, prerequisite for retain/B3/B5/T20).**
   `pickDueReview` (`next-best-action.ts:201-229`) never queries `fsrs_cards`
   — it asks the catalog for easy items and checks `retrievability`, which is
   **0 for never-seen items** (`student-model-pg.ts:137`). Once A7's items
   land, fresh students would get bogus "Review now — recall at 0%" retains on
   items they've never seen. New: a per-student due-card query
   (`fsrs_cards WHERE student_id=$1 AND due_at <= now()`), retain candidates
   only from cards with `reps > 0`, mapped to servable items. B3's due-ness,
   B5's sampling, and T20's knock-out all read from this scan.
2. **T20 seeds the demo AUTH identities** (`user_<sha256>` ids from
   `demo/seed.ts` via `upsertFromGoogle`), not the `0aded0a0-` scenario
   namespace — routes key on the JWT id, so persona-UUID history is invisible
   to logged-in Meera. Guard: seeder refuses any id not minted by demo
   seeding. Scenario personas keep their namespace for scenario runs.
3. **The export/build fix targets `demo/Dockerfile`** — the deployed demo
   builds from it (`render.yaml:70`), its builder stage runs `npm run build`
   (lifecycle NOT bypassed there) but copies neither `scripts/` nor `data/`.
   Fix: copy both into the builder stage + run the export before vite build;
   apply root-Dockerfile parity; A3's container smoke runs against
   demo/Dockerfile.
4. **T21 reconciles catalog units:** pg difficulty→Elo is `600 + 1800·d`, file
   is `800 + 1400·d` (file's "mirrors pg" comment is false); `examRelevance`
   defaults 0.5 (pg) vs 1.0 (file) — a 2× selection bias for file items in
   `scoreCandidate`. One shared mapping module. Also fix
   `recordProblemAttempt` (`problem-generator.ts:428`): `WHERE id = $1`
   against a UUID column errors on every TEXT-id authored item — guard by id
   shape or widen the column.
5. **B2's join path:** `fsrs_cards` has no concept column. Migration adds
   `fsrs_cards.skill_id TEXT` (+ schema-column-baseline entry, same PR),
   written on every card upsert from `attempt.skillId`; credit distribution
   and the due-card scan both join on it. Supersedes the `objects_for_skill`
   approach — A6 deletes the dead at-risk branch instead (no new SQL function).
6. **FIRe lock discipline:** propagation writes inside the tx acquire rows in
   deterministic `ORDER BY object_id` (and after the existing
   student-elo → item-elo → primary-card sequence) so concurrent attempts
   can't deadlock and void valid attempts.
7. **A5 subscriber contract:** the bus isolates only synchronous throws —
   the derived-model subscriber is a sync entry that launches its async work
   with an internal `.catch()` (logged with student+object id). The Failure
   Modes Registry row is corrected accordingly.
8. **A8 scope locked (OV2-D3):** warmup brackets 4–6 curated LA spine
   concepts (~15–25 probes); ancestors inferred from placement; the persist
   endpoint writes priors with `n` set to clear `'learning'` ONLY when the
   bracket converged, stamped with warmup provenance so A6's thresholds stay
   meaningful. Full 26-concept adaptive placement deferred (TODO trigger:
   post-LA scaling).
9. **Quiz no-repeat source (OV2-D4):** exclude items with
   `fsrs_cards.last_review_at` within 14 days + within-quiz-session dedup. NO
   new serve-log table — rendered-but-unattempted items are not tracked, by
   surveillance-discipline choice.
10. **T16 is a sized ops task, not "just config":** audit the ~53 lazy
    `new Pool(max:5)` singletons against Supabase connection limits (shared
    pool or reduced max); advisory-lock paths (`batch/pg-persistence.ts:151`)
    require session-mode pooling — document the connection string choice;
    deploy-time verification includes a connection-count check.
11. **T19 re-estimated:** chat has no spend metering today
    (`rate-limit-tracker` is passive; `cost-meter` is per-generation-run). The
    daily cap needs a durable counter (durable-records store, survives `.data/`
    resets). Estimate: human ~1w / CC ~4h.

**T22 — Mock-exam leak fix (ENG-D3)** *(P2, human ~1d / CC ~1h)*
Server-side grading for `/api/gbrain/mock-exam`; stop returning
`correct_answer` pre-submission; real migration for `mock_exams`. Verify: leak
test mirroring the practice-item pattern.

**T20 — Demo persona history seeding (D9)** *(P1 for demo day, human ~2d / CC ~1h)*
Extend the persona seeder (`src/scenarios/persona-seeder.ts`, namespaced UUID
discipline unchanged) to write plausible multi-day Elo/FSRS/XP history for the
demo personas, so FIRe scheduling, due-review compression, the frontier view,
and an unlockable quiz are all VISIBLE in a 3-minute demo. Deterministic
(seeded PRNG, same discipline as policy-runner). Verify: demo walkthrough stop
shows a due-review knock-out and a quiz offer for Meera.

## Implementation Tasks

Synthesized from findings; run with Claude Code, checkbox as you ship.

- [ ] **T1 (P1, human ~1h / CC ~5min)** — lessons — Fix deployed bundle path (`source-resolver.ts:73` candidate list) — *Surfaced by: system audit* — Verify: container smoke shows bundle explainer.
- [ ] **T2 (P1, human ~2h / CC ~10min)** — build — Wire `export-bundles.ts` into build + CI drift check — *Section 1/audit* — Verify: client graph 97/26.
- [ ] **T3 (P1, human ~0.5d / CC ~15min)** — db — PYQ `concept_id` backfill in seeder (+idempotent update) — *audit* — Verify: `fetchProblemsForConcept('eigenvalues')` ≥ 1.
- [ ] **T4 (P1, human ~1h / CC ~10min)** — gbrain — `masteryState` threshold recalibration + `objects_for_skill` resolution — *audit F5/F9* — Verify: threshold unit table.
- [ ] **T5 (P1, human ~1d / CC ~30min)** — readiness — Prereq redirect reachability (content-backed trigger + allowedNodes scoping + batched mastery fetch) — *audit F1, §7* — Verify: fresh-student LA on-ramp integration test.
- [ ] **T6 (P1, human ~3d / CC ~2h)** — student-model — Unify per D3 (attempts-bus subscriber feeds derived model) — *F1.1* — Verify: one attempt moves Elo+FSRS+alerts.
- [ ] **T7 (P1, human ~2w / CC ~1-2d)** — content — Wolfram inconclusive policy fix (tri-state `verifyProblemWithWolfram` return + both consumers), then 123-item LA factory run + commit + floor green — *§2, A7, ENG-D4* — Verify: CI re-grade + strict-parse + floor report.
- [ ] **T8 (P1, human ~3d / CC ~2h)** — frontend — Warmup onboarding UI — *A8* — Verify: e2e fresh-student flow.
- [ ] **T9 (P2, human ~2d / CC ~1h)** — knowledge — GATE-MA track + DAG concept tree — *A9* — Verify: Meera's KnowledgeHome renders.
- [ ] **T10 (P1-B, human ~1w / CC ~1d)** — curriculum — `encompasses:` edges (LA) + loader + validation — *B1* — Verify: graph CI.
- [ ] **T11 (P1-B, human ~1w / CC ~4h)** — gbrain — FIRe-lite propagation module + wiring per D3/D5 — *B2* — Verify: property suite.
- [ ] **T12 (P2-B, human ~3d / CC ~2h)** — readiness — Compression-aware expectedGain + teachCandidate ordering — *B3* — Verify: domino ranking test.
- [ ] **T13 (P2-B, human ~3d / CC ~2h)** — frontend — Frontier view — *B4* — Verify: states coverage.
- [ ] **T14 (P2-B, human ~1w / CC ~4h)** — practice — XP events + timed quiz (migration 044, flag-gated) — *B5* — Verify: marking + leak + timer tests.
- [ ] **T15 (P1, human ~2h / CC ~15min)** — observability — next-action objectId-rate metric + consume `getAtomFallbackCounts` — *§8* — Verify: admin surface shows both.
- [ ] **T16 (P1, deploy config)** — ops — Set Supabase `DATABASE_URL` on the Render demo service (D4) before demo day — *F1.2* — Verify: seeded persona attempt shows `recorded: true` on the deployed URL.
- [ ] **T17 (P2, human ~1w / CC ~1d)** — content — Stance variants for all 26 LA concepts via the factory — *D7* — Verify: `served_stance` differs per persona on every LA concept.
- [ ] **T18 (P2, human ~1w / CC ~1d)** — content — Interactive-spec blocks for the 23 uncovered LA concepts, human-reviewed — *D7* — Verify: each LA concept renders ≥1 interactive off-rail.
- [ ] **T19 (P2, human ~3d / CC ~2h + config)** — chat — Off-corpus provider key + per-session rate limit + daily spend cap — *D7* — Verify: off-corpus answer streams on deployed URL; cap trips refuse gracefully.
- [ ] **T20 (P1-demo, human ~2d / CC ~1h)** — demo — Persona multi-day history seeding so B mechanisms demo live — *D9* — Verify: walkthrough shows due-review knock-out + quiz offer.
- [ ] **T21 (P1, human ~1d / CC ~1h)** — scoring — Composite catalog (file + Pg) so authored items survive `DATABASE_URL` — *OV-1* — Verify: item serves with DB configured.
- [ ] **T22 (P2, human ~1d / CC ~1h)** — gbrain — Mock-exam server-side grading + real `mock_exams` migration (answer-key leak fix) + migrate its timer to the shared primitive (exam register) — *ENG-D3, DR-3* — Verify: leak test on the mock-exam payload.
- [ ] **T23 (P2, human ~0.5d / CC ~30min)** — frontend — Student-facing text-floor fixes (NextBestActionCard rationale, PracticeAttempt solution steps, KnowledgeHome why_next) — *DR-T1* — Verify: no sub-15px reading content on student surfaces.
- [ ] **T24 (P2, human ~2d / CC ~2h)** — frontend — Component hygiene: shared usePrefersReducedMotion hook, ui/ primitive adoption in new + existing student surfaces, dead-code removal (app/MasteryRing), ProgressBar extension for the focused-work strip, PracticeAttempt selected-state fix — *DR-T2, §11* — Verify: no framer duration literals in new surfaces; grep shows one MasteryRing.

## Test coverage map (eng review)

```
CODE PATHS                                          USER FLOWS
[+] FIRe propagation (in-tx, B2)                    [+] Warmup onboarding (A8)
  ├── [PLANNED ★★★] credit decreasing/bounded/       ├── [PLANNED →E2E] fresh student → probes →
  │    idempotent/no-op-without-edges (property)     │    placement → real next-action objectId
  ├── [PLANNED ★★★] penalty bounded, encompassing    ├── [PLANNED] abandon mid-warmup (stateless re-entry)
  │    direction only                                └── [PLANNED] empty probe band → early end
  └── [PLANNED ★★★] dedup replay → zero propagation
[+] Compression scoring (B3)                        [+] Practice → graded → mastery moves (A5/A7)
  ├── [PLANNED ★★★] cap 1.3; overdue retain wins     ├── [PLANNED →E2E] attempt moves Elo+FSRS+alerts
  └── [PLANNED ★★ ] domino ranking case              └── [PLANNED] DB-less → recorded:false banner
[+] Composite catalog (T21)                         [+] Quiz (B5)
  ├── [PLANNED ★★★] file+Pg merge, DB-wins collision ├── [PLANNED ★★★] leak test (no answer fields)
  └── [PLANNED ★★★] DATABASE_URL set → file item      ├── [PLANNED] timer expiry auto-submit; late flag
       still serves                                  ├── [PLANNED] double-submit idempotent (per-item ts)
[+] Redirect reachability (A1)                       └── [PLANNED] pool below 2x → honest empty state
  ├── [PLANNED ★★★] content-starved eligible set    [+] Frontier view (B4): states coverage
  │    fires redirect (production wiring)           [+] Mock-exam leak fix (T22): leak test
  └── [PLANNED ★★ ] batched mastery fetch parity
[+] Factory (A7): strict-parse CI, deriveMarking refusals, dual-model refuse-on-single-leg,
     CI re-grade of every committed item, floor gate enforce_topics
[+] A2: fetchProblemsForConcept regression test (currently THROWS — CRITICAL regression coverage)
[+] Graph (B1): encompassing schema + cycle validation (parameterized), loader ignores-unknown pin
COVERAGE TARGET: every planned branch above lands WITH its test in the same PR (repo norm).
```

## Worktree parallelization (eng review)

| Lane | Tasks | Shared modules | Depends on |
|---|---|---|---|
| A | T1, T2, T3+A2-migration, T4 | lessons/, scripts/, db/, gbrain/ (disjoint files) | — |
| B | T5 (redirect+batch), T15 | readiness/, api/readiness-routes | — |
| C | T6 (model unify), then T11 (FIRe), then T12 (cap/compression) | gbrain/student-model*, events/ | C sequential; T12 also touches readiness/ → after B merges |
| D | T7 factory (pilot → 123 items), T21, T17, T18 | generation/batch, data/practice-items, scoring/catalog | T21 first; content lands incrementally |
| E | T8 (warmup UI), T9 (track), T13 (frontier) | frontend/ | T8 needs D's pilot items for probes |
| F | T14 (quiz/XP), T22, T20 | api/practice-routes, gbrain/moat-operations, scenarios/ | T14 after C (attempt path stable) |

Launch A + B + D in parallel worktrees. C after B merges. E after D's pilot. F last. Conflict flag: C and F both touch the attempt path — keep sequential.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | clean | mode: HOLD_SCOPE; decisions D1–D9 locked; 13 outside-voice findings adopted; 0 critical gaps |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — (Codex not installed; Claude subagents served as outside voices, 3 rounds) | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clean | 26 verified findings folded (ENG-D1..D4 + OV2 1–11); 0 critical gaps open; coverage map + parallelization lanes |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | clean | score 5/10 → 9/10; 16 outside-voice findings absorbed; DR-1..4 + DR-T1..2 adopted; Section 11 rewritten as the full design spec; wireframes at `docs/designs/linear-algebra-wireframes.html` |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**CROSS-MODEL:** Four independent fresh-context challenges ran (CEO: 13 findings; eng verification: 2 line-level fact-check agents; eng: 11 findings; design: 16 findings + a frontend-pattern audit). Every confirmed finding was adopted via explicit user decision. Headline catches: file-vs-Pg catalog exclusivity (T21), dead prereq redirect trigger (A1), FIRe transaction/granularity/lock-order (ENG-D1, OV2-5/6), compression cap 1.8→1.3 (ENG-D2), the retain arm's missing due-card scan (OV2-1), demo identity mismatch (OV2-2), the deployed-image Dockerfile mismatch (OV2-3), and the design round's stale-warmup-scope / undesigned-result-screen / DAG-on-mobile / inferred-vs-proven-mastery set (DR-2, DR-1). No unresolved cross-model tension remains.

**VERDICT:** CEO + ENG + DESIGN CLEARED — ready to implement in the parallelization lanes (design specs in Section 11 + wireframes; run `/design-review` on the live app after implementation for visual QA).

NO UNRESOLVED DECISIONS
