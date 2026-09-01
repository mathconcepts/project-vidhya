# TODOS

Deferred work with enough context to pick up cold. Each entry states its
trigger — the condition that makes it worth doing — so nothing sits here
being vaguely important forever.

## "Concept learning" room silently bounces students with no knowledge track

**Trigger:** the next time someone touches `RoomsPage`, `KnowledgeHomePage`,
or the room-switcher header — or a support/QA report of "I picked Concept
learning and landed on my exam plan instead."

**What:** `frontend/src/pages/app/KnowledgeHomePage.tsx:67` redirects to
`/planned` whenever `profile.exams[0].knowledge_track_id` is unset — correct
behavior for a student whose only registered exams have no knowledge track
(e.g. the demo's `student-active` persona, registered for
`EXM-BITSAT-MATH-SAMPLE` / `EXM-JEEMAIN-MATH-SAMPLE`, neither of which
carries one). The room-selection screen (`/rooms`) doesn't know this: it
offers "Concept learning — Build deep understanding... follow a concept
curriculum" as a live, tappable card regardless, with no eligibility check
and no messaging when the promise can't be kept. A student picks the room
they want and is silently placed on a different page than the one they
chose, with zero explanation.

**Why not fixed inline:** found during a `/qa` pass (2026-08-30) that fixed
three other bugs in the same journey (see git log around that date), but the
right fix here is a product call, not a guess: grey out / hide the
"Concept learning" card when the student has no knowledge-track exam, show
an inline "not available for your exam yet" state, or route the CTA into
`/warmup` (which *does* work anonymously/track-less) instead of silently
landing on `/planned`. Any of these is a small change; picking the wrong one
guesses at intended room-switching semantics ("switch rooms anytime from the
header" implies rooms should always be choosable) without a decision.

**Where to start:** `frontend/src/pages/app/RoomsPage.tsx` (or wherever the
room cards render — grep for "Build deep understanding") for the gate;
`KnowledgeHomePage.tsx:60-82`'s effect for the existing redirect logic to
mirror the eligibility check from.

**Effort:** S human / few min CC once the desired behavior is picked.
**Priority:** P2 (silent, promise-breaking redirect on a primary nav choice).

**Deferred from:** `/qa` 2026-08-30, branch
`claude/engineering-math-qa-testing-a6r75p`.

## Post-LA scaling of the Math-Academy layer

**Trigger:** LA lift evidence in the effectiveness ledger (the `fire_v1_gate_ma`
experiment resolving) AND catalog depth exceeding ~10 practice items per
concept.

**What:** two mechanisms that only pay off after Linear Algebra proves the
pattern: (a) encompassing edges (`encompasses:` in `data/curriculum/gate-ma.yml`)
for the remaining 71 concepts, and (b) interleaving / non-interference task
ordering in the readiness engine.

**Why:** both are core Math Academy mechanisms (see
`docs/designs/linear-algebra-realtime-and-math-academy-plan.md`). Encompassing
edges beyond LA multiply FIRe's review compression across the whole graph;
interleaving needs item volume that does not exist below ~10/concept, which is
also why quizzes carry a content-depth gate.

**Where to start:** the LA edge-authoring guide and validation CI from B1 apply
unchanged — scaling is authoring, not architecture. Interleaving slots into
`ProtoCATSelector` scoring (`src/scoring/proto-cat-selector.ts`) as a
similarity penalty between consecutively served items.

**Effort:** XL human / L with CC, spread over months. **Priority:** P3.

**Deferred from:** `/plan-ceo-review` 2026-08-18 (D7/OV review), branch
`claude/linear-algebra-realtime-demo-evwq4b`.

## Blueprint stance axis for cadence attribution

**Trigger:** a second cadence worth testing against the first, and session
volume supporting n≥30 per arm.

**What:** add a stance axis to the blueprint layer as `BlueprintDecisionsV2`
plus a `decisions_v2 JSONB` column, so the lift ledger can group measured
outcomes by which cadence produced a variant.

**Why:** six topic cadences will generate 566 variant files. Nothing currently
records *which* cadence shape produced a given variant, so when lift numbers
arrive you can compare "variant vs base" but not "cadence A vs cadence B".
Cadence quality stays a taste call rather than something with evidence.

**Why not now:** with one cadence per topic there is nothing to compare
against. The lift ledger already answers the more basic question.

**Where to start:**
- `src/blueprints/types.ts:10` forbids mutating v1 ("v1 is permanent") and
  names the migration path: a parallel V2 type + a new persisted column.
- `experiment_assignments.target_kind` already accepts `'atom'`, so per-atom
  assignment works today with no schema change. The only missing piece is the
  cadence label to group by.
- `src/experiments/lift.ts` computes `lift_v1` via Welch's t-test with the
  n≥30 / p<0.05 promotion thresholds. That formula is locked — a new metric
  ships as `lift_v2` in a new column, never as an edit.

**Depends on:** ~~the 566-file generation landing~~ (landed in 4.43.0 — 606
base/variant pairs across all 101 concepts), and real session volume.

**Deferred from:** `/plan-eng-review` 2026-08-16, Issue 3 (authoring recipe
correctly lives in `templates/<topic>.yaml`; measurement is the separate
reason the blueprint might earn it later). See
`docs/stance-axis-scaling-plan.md`.

## Flat-file stores are single-instance only

**Trigger:** before any deploy that runs more than one server instance.

**What:** finish the async migration for the three stores now mirrored to
Postgres — `auth/user-store.ts`, `feedback/store.ts`,
`syllabus-bridge/store.ts`.

**Status:** the DATA-LOSS half is fixed (migrations 041 and 042). User
accounts, student feedback and generated bridge content all mirror on write
and restore at boot when `.data` has been wiped. What remains is concurrency.

**Why it is still open:** the file is the read path and it is per-instance.
Two servers each hold their own copy and hydrate only at boot, so a write on
instance A is invisible to B until B restarts. Render's free tier is
single-instance, so this is not a live bug — it becomes one the day the
service scales out.

**Why it was not done:** every export in these modules is synchronous and
Postgres is not. `user-store.ts` alone has 17 sync exports across 13
production files including every auth route, on modules carrying
`@ts-nocheck`. That is a reviewed change, not a loop task.

**Where to start:** the mirrors exist and round-trip, so the work is
mechanical — make the read path async, follow the type errors, drop the file
once every caller awaits. `src/sessions/session-store.ts` is the model for the
finished shape, and `src/storage/repositories/durable-store-repo.ts` already
holds the table mapping.

**Also still file-only:** roughly nine other `createFlatFileStore` call sites
(exams, attention, sample-check, admin-orchestrator, exam-builder, content
telemetry, teaching turns). None were audited for whether they hold anything
worth keeping. That audit is the honest next step, not an assumption that they
are fine.

## The circumstance filter has no empty-set fallback

**Trigger:** the moment work starts on the circumstance axis (T11).

**What:** when a language / bandwidth / device filter removes every candidate
atom, serve degraded content rather than nothing.

**Why:** the CEO review moved circumstance out of the ranking scorer and made
it a pre-ranking FILTER, because low bandwidth means "do not send the 4MB GIF",
not "rank it slightly lower". That is the right call and it introduces a
failure a weight cannot have: a weight can only reorder a non-empty set, a
filter can empty it. A Tamil-medium student on a low-bandwidth connection
would then get a blank lesson, silently, with no error path.

This codebase has already learned the same lesson once: dedup in
`src/personalization/selector.ts` needed progressive backoff (7d → 3d → 1d →
0d) for exactly this reason.

**Where to start:** the filter belongs upstream of `applyPersonalizedRanking`
— that function only re-ranks an already-selected set — so in
`src/personalization/lesson-wire.ts` or the compose route. Mirror the dedup
backoff: relax the constraint by steps rather than returning empty, and when
every step is exhausted serve the unfiltered set instead of nothing.

**Depends on:** T11. **Blocked by:** T1's column allowlist decision, since
where circumstance is stored determines what the filter can read.

## Four board curricula need four bridge mappings, not just four syllabi

**Trigger:** when board expansion is scheduled and someone is named to author
the content.

**What:** correct the scope of "author the missing state-board curricula".

**Why:** `src/syllabus-bridge/registry.ts` registers a curriculum AND a
mapping, and `batch-runner.ts` throws without a `BridgeMapping` entry. Tamil
Nadu is 148 lines of curriculum plus 256 lines of hand-authored mapping
(`gap_class`, `difficulty_jump`, `bridge_note` per topic). The mapping is the
larger half and the one that needs subject-matter judgement about where a
board syllabus and an exam syllabus diverge.

So CBSE, ICSE, Karnataka PUE and Maharashtra HSC are eight artifacts, not
four, and the expensive half cannot be generated from the syllabus alone.

**Depends on:** a named author. This is a sourcing problem inside an
engineering timeline, and no estimate is meaningful until someone owns it.

## The flat-file stores left on disk on purpose

**Trigger:** anyone reading migration 043 and asking "why not all of them?"

**What:** eleven of the 30 `createFlatFileStore` call sites are NOT mirrored,
and that is a decision rather than an omission. Recorded here so the next
audit does not re-derive it.

**Recomputable — mirroring them would store a cache:**

- `src/content/telemetry.ts` — derived from the events it counts
- `src/curriculum/quality-aggregator.ts` — rolls up verification results that
  are themselves persisted

**Working state of a single run — a lost one is re-runnable:**

- `src/admin-orchestrator/agent.ts` and its `task-store.ts`
- `src/exam-builder/event-log.ts`
- `src/marketing/sync-engine.ts`
- `src/syllabus-bridge/store.ts`'s batch half. Its *content* half IS mirrored
  (migration 042) because generating it cost model spend; the batch record
  that produced it did not.

**Wired but hydrated differently:** notebooks. Each student's notebook is its
own file (`.data/notebooks/{user_id}.json`), so there is no single collection
for `hydrateAllDurable` to walk. `hydrateNotebook(user_id)` restores one on
first read instead. If notebooks ever move into a single file, fold them into
the boot sweep.

**If this changes:** the list of what IS wired is asserted in
`src/__tests__/unit/storage/durable-flat-file.test.ts`, so adding a store
there without registering it fails CI rather than failing at the next restart.

## The single-instance assumption under durable_records

**Trigger:** before running more than one server process against one database.

**What:** `mirror()` deletes rows in the collection (or scope) that are not in
the set it was handed, so two instances with divergent local files would take
turns deleting each other's records.

**Why it is acceptable today:** Render runs one instance, and the file is the
source of truth with Postgres as the mirror — not the other way round.

**What it needs:** either a last-writer-wins timestamp check on delete, or
promoting the hot collections (retention, trajectory) to real tables that the
application reads from directly instead of hydrating into a file. The second
is the better end state; the first is the cheap stopgap.

## Generation cost is attributed to a provider that may not have served it

**Trigger:** before trusting the spend cap's numbers, or before the cost meter
gates anything a customer pays for.

**What:** `src/syllabus-bridge/batch-runner.ts` decides which provider to
record by asking which API key is present, not which provider answered:

```ts
const provider = hasAnthropic ? 'anthropic' : hasGemini ? 'gemini' : 'openai';
```

`LLMClient` picks the route itself and can fall back. So on a deploy with two
keys set, a call the router sent to Gemini gets recorded as Anthropic and
priced at Anthropic's rate by `estimateCost(provider, tokens)`.

**Why it matters and how much:** `cost_usd` feeds `recordSpend`, so the run's
accumulated spend — the number the cap is compared against — can be wrong in
either direction. Bounded, because the pre-call check uses
`estimateUnitCost(unit)` rather than the accumulated total, so the cap still
refuses before an over-budget call. The damage is reporting accuracy, not
runaway spend.

**Not a regression:** main has the same shape with the branches in the other
order. This branch flipped the precedence to match `BRIDGE_MODEL_ID`, which
now names Claude explicitly. Wrong either way.

**The fix:** `LLMClient` already knows the answer — it emits
`generate:complete` with `provider: current.provider` and calls
`logRoutingDecision({ servedProvider })`. Either surface that on the response
object or subscribe to the event and read it. Deliberately not done during a
ship: it changes a return shape every caller of the LLM client shares, and
that is not a change to rush on the way to production.

## A corrupt .data file still loses data, mirror or not

**Trigger:** before describing migrations 041-043 as "your data is safe" to
anyone. They make data survive a WIPE. They do not make it survive
CORRUPTION, and the difference is invisible from the outside.

**What:** `createFlatFileStore.read()` returns the empty default shape when a
file exists but will not parse — the same value it returns for a file that was
never written. Verified: writing `{ this is not json` to a store's path makes
`read()` return `{items: []}` with no throw.

For a mirrored store the consequence now reaches further than it used to. The
next write persists the empty shape locally and then mirrors it, and
`mirror()` deletes every row not in the list it was handed. So one unparseable
file empties the durable copy that existed to protect it.

**Not a regression:** before 043 there was no durable copy, so corruption was
total loss then too. It is a limit on what the durable stores promise, not a
new way to lose data.

**Done so far:** `read()` now logs loudly on both the parse failure and the
shape-check failure, so the event is visible instead of silent. Behaviour is
unchanged on purpose — returning the default is what all 30 call sites expect,
and throwing would take the server down over one bad file.

**The real fix:** distinguish "absent" from "unparseable" in the return, and
have the durable layer refuse to mirror a delete-everything when the local
read was the unparseable kind. That needs a signal `read()` does not currently
carry, touching a helper shared by 30 call sites — deliberately not attempted
on the way to a production deploy.

## Practice-item batch runs need real verifier deps wired at the poller call site

**Trigger:** before anything populates `config.target.practice_item_specs`
(i.e. before a real practice-item `GenerationRun` can be launched — nothing
creates one today).

**What:** `src/generation/batch/poller.ts`'s `getOrchestrator()` calls
`handleJobProcessed` → `deps.dispatchPracticeItemJob(job.atom_spec, job.result)`
with only two arguments — the third, `PracticeItemDispatchDeps`, is never
passed, so it defaults to `{}` on every real poll pass. `solveSecondary` and
`wolframCheck` are always undefined in production.

**Why it matters:** `dispatchPracticeItemJob` (`src/generation/practice-item-
factory/batch-dispatch.ts`) is fail-closed by design when a verifier isn't
wired: mcq/msq refuse terminally (correct, and unaffected by this TODO — a
refusal is a valid terminal outcome). nat items used to return `pending_retry`
in the same structural-absence case, which is NOT terminal — it tells the
orchestrator to skip stamping `processed_at` and try again next pass. Since no
future pass ever populates `deps.wolframCheck` on its own, a run containing
even one nat spec would poll forever and never reach `'complete'`.

**Fixed here (adversarial-review pass):** the structural case (no
`wolframCheck` at all) now refuses terminally, same shape as the mcq/msq
`solveSecondary` check — a run with unwired deps can finish (with everything
refused) instead of hanging. The genuinely transient case — Wolfram itself
gets called and returns `status: 'inconclusive'` — is unchanged and still
`pending_retry`, because that one really might succeed on a later pass.

**RESOLVED (2026-08-25, intent-restructure branch):** `poller.ts` now builds
real `PracticeItemDispatchDeps` per job (`buildSolveSecondaryFn` over the
distinct-secondary provider routing; `verifyProblemWithWolfram` gated on the
existing wolfram feature flag), and `orchestrator.ts`'s `prepare()` carries a
launch guard (`assertPracticeItemLaunchReady`) that fails a FRESH practice-item
run loudly at launch when its item kinds' verifiers aren't configured — resume
of in-flight runs is structurally unaffected. What remains open is only the
original trigger: nothing populates `config.target.practice_item_specs` yet,
so the first real launch caller should re-verify end-to-end against a live
provider config.

## `intent-profiles.yml`'s proposed error-tag strings never got a mapping decision

**Trigger:** before anyone claims the W3.4/E4 `ErrorTag` extension "covers" the
market-study's error taxonomy, or the next time an `ErrorTag` union grows.

**What:** `data/curriculum/gate-em/intent-profiles.yml`'s `error_tags.proposed`
lists (`over-calculation`, `condition-check`, `orientation`,
`distribution-selection`, `rounding`, `stopping-condition`, `definition-confusion`,
and others across the 8 profiles) were never moved to `existing`, and no
decision was recorded on what should happen to them.

**Why it's still open:** E4 asked for exactly this move wherever a proposed
string matched one of the 7 new `ErrorTag` members
(`method_selection`/`representation`/`mode_msq`/`mode_nat_entry`/
`time_pressure`/`risk_decision`/`prerequisite`). Checked in commit `470d09a`
(`docs/designs/2026-08-27-content-readiness-market-research-integration.md`,
IMPLEMENTATION RECORD §"P2c"): none of the proposed strings match any new
member by name, so nothing moved — correctly, since inventing a mapping would
have been worse than leaving it undecided. But that leaves the proposed list
sitting there unresolved: some of those strings (e.g. `condition-check`,
`definition-confusion`) look like plausible synonyms for tags that DO exist
now, and an operator, not a pattern-match, should decide synonym-vs-distinct
per string.

**Where to start:** `src/core/interfaces.ts`'s `ErrorTag` union is the lockstep
anchor (migration `053`, `ERROR_TAGS` mirror in `scripts/check-intent-catalogue.ts`,
`KNEW_IT_TAGS` in `src/readiness/mock-to-marks.ts` — see that file's
union-completeness test for what a new member must touch). Walk each proposed
string against the 13 current tags one at a time: either it's a synonym (drop
it from `proposed`, tag content with the existing member) or it names a real
14th gap (open a new plan amendment — do not add it silently, per the same D9
discipline that classified `mode_msq` explicitly rather than defaulting it).

**Deferred from:** `docs/designs/2026-08-27-content-readiness-market-research-integration.md`
core-plan wrap-up, 2026-08-27, branch `claude/autoplan-content-readiness-4vfhcn`.

## No DB-backed SQL tests for `markRunStatus` / the budget-fallback COALESCE

**Trigger:** before trusting `generation_runs.status` reconciliation or
`budget_remaining_usd` under a real Postgres instance for the first time (i.e.
before or during the W3.5 pilot, since both sit on the pilot's launch path).

**What:** two SQL-shaped pieces of P3's batch-orchestrator wiring
(`docs/designs/2026-08-27-content-readiness-market-research-integration.md`
IMPLEMENTATION RECORD §"P3b", commit `d114fec`) are covered only by mocked-pool
unit tests, never against a real database:

- `src/generation/run-orchestrator.ts`'s `markRunStatus()` — a bare
  `UPDATE ... SET status = $2 ... WHERE id = $1 AND status = 'running'`. The
  `WHERE status = 'running'` guard (so this can never resurrect a run some
  other path, e.g. an operator abort, already terminalized) has never been
  exercised against real Postgres row-locking/visibility semantics.
- `src/generation/batch/pg-persistence.ts`'s `BUDGET_REMAINING_SQL` — a
  `COALESCE(config->>'budget_remaining_usd', ...)` expression whose fallback
  to `config.quota.max_cost_usd` (replacing a hardcoded $100 default) was the
  actual bug fix in `d114fec`. A mocked pool asserts the query STRING; it
  cannot catch a JSONB-path typo or an operator-precedence mistake the way a
  real `COALESCE` evaluation would.

**Why it's still open:** the full suite (4,138 backend tests as of this
branch) runs against mocked `pg.Pool` instances everywhere in this module —
there is no integration-test harness against a live Postgres in CI today
(the closest is `docker-compose.yml`'s local parity stack, which is manual).
Writing this properly means standing up that harness, or at minimum a
targeted `docker compose`-gated test file, which is bigger than this branch's
scope.

**Where to start:** `docker-compose.yml` already gives a real Postgres+pgvector
locally; a new `*.integration.test.ts` (gated behind a `DATABASE_URL` env
check, skipped when absent, matching the pattern several `__tests__` files
already use for DB-optional suites) exercising `markRunStatus` against a
seeded `generation_runs` row and `BUDGET_REMAINING_SQL` against a row with and
without `config.budget_remaining_usd` set would close this without touching
CI's default (mocked, fast) path.

**Deferred from:** `docs/designs/2026-08-27-content-readiness-market-research-integration.md`
core-plan wrap-up, 2026-08-27, branch `claude/autoplan-content-readiness-4vfhcn`.

## W-A activation-push pages (a)-(b) are a follow-up PR, not landed here

**Trigger:** once PR #129 (this branch) merges and the demo is confirmed live
with `VIDHYA_INTENT_LANES=on`.

**What:** the plan's W-A minimal activation push has three parts; only the
mechanism this branch shipped (the flag-on demo itself, P0) is live. Still to
build, agent-side:

- (a) publish the LA sub-topic pages as indexable public pages, using the
  intent catalogue's existing representative queries / SEO fields — per the
  plan, "data that has sat dormant through two plans."
- (b) one honest "what this is" landing section naming the actual problem
  statement (mock counterfactual + method selection + verified practice), not
  generic ed-tech copy.

(c) — sharing verified solutions into GATE Overflow / r/GATEtard — stays
operator-timed and is explicitly not agent work, per the plan.

**Why:** §7 metric 4 (the activation gate: ≥50 weekly-active students) is what
unlocks every gated expansion in the plan (W3.1 mode readiness, W3.3
remediation, W3.7 calibration, W3.8 triage/re-entry, W2.3/W2.4/W2.6 deltas).
Without real traffic to the now-live demo, that gate never opens, and the plan
says so explicitly rather than pretending artifact-completion is the same as
activation.

**Where to start:** `data/curriculum/gate-em/` already carries the
representative-query / SEO fields the plan references (see
`template-families.yml` and the intent catalogue's own schema); the LA
sub-topic page shell exists in `frontend/src/pages/app/` under the Knowledge
Shell — check `KnowledgeHomePage.tsx`'s routing for the nearest existing
pattern to extend rather than a new page type.

**Deferred from:** `docs/designs/2026-08-27-content-readiness-market-research-integration.md`
core-plan wrap-up, 2026-08-27, branch `claude/autoplan-content-readiness-4vfhcn`
(plan's W-A workstream, §"Minimal activation push").

## `attempt_facts.skill_id` is always null on mock-exam writes — topic accuracy needs a join

**Trigger:** before extending `src/gbrain/topic-accuracy.ts` to a NEW
attempt-writing surface, or the next time someone assumes `attempt_facts`
alone answers a per-concept question.

**What:** `src/api/mock-exam-routes.ts`'s per-question `attempt_facts` write
(the W3.2 counterfactual's evidence source) always sets `skillId: null`,
because a mock question carries only a coarse `topic` column, never a
concept id. `src/gbrain/topic-accuracy.ts` works around this today with a
`LEFT JOIN` against `pyq_questions.topic` / `generated_problems.topic` by
`object_id`, dropping any row that matches neither (documented in that
file's header comment).

**Why it's a gap, not a bug:** the join is correct and tested, but it means
"per-topic accuracy" and "per-concept (`skill_id`) accuracy" are two
different queries with two different reliability profiles forever, unless
mock questions gain a real concept id. Quiz-session and practice-item
attempts (which DO carry `skill_id` natively) don't need the join at all —
only the mock-exam lane does, and that asymmetry is easy to forget when
writing the next consumer of `attempt_facts`.

**Where to start:** native skill ids on mock questions would need
`mock_exams`' generated question set to carry a `concept_id` alongside
`topic` (the questions are drawn from `pyq_questions` / `generated_problems`
at exam-build time, both of which already have `concept_id` in some form —
see migration `044_pyq_concept_id.sql`), then `mock-exam-routes.ts`'s
`AttemptFact` construction threads it through instead of hardcoding `null`.
Until then, any new per-concept aggregate over `attempt_facts` should follow
`topic-accuracy.ts`'s join pattern rather than trusting `skill_id` to be
populated for every row.

**Deferred from:** `docs/designs/2026-08-27-content-readiness-market-research-integration.md`
core-plan wrap-up, 2026-08-27, branch `claude/autoplan-content-readiness-4vfhcn`
(flagged in the plan's P2a work, `src/gbrain/attempt-facts.ts`).

## Demonstrations-as-visual-standard curation

**Trigger:** a real legal read on independent re-implementation (whether
building a widget from a Demonstration's underlying MATHEMATICAL IDEA,
without copying its expression/code, clears CC BY-NC-SA 3.0 — copyright
protects expression, not the idea, but that inference is `design_hypothesis`
evidence level, not verified) AND the 50-item anatomy pilot is complete.

**What:** `concept → demo idea → widget spec` mappings — using the Wolfram
Demonstrations Project (~13,000 demos) as a DESIGN STANDARD for what a good
interactive looks like, never as an import/embed source. MIT-licensed
preview snapshots are usable as authoring reference in the meantime, if/when
this is picked up.

**Why not now:** the Demonstrations corpus itself is CC BY-NC-SA 3.0 (no
commercial embedding/redistribution) and CDF embedding has been dead since
~2021 — both close the direct-import path outright (see Move A/B's sibling
rejections R1/R2 in `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`).
This item is specifically the narrower "use a demo's IDEA as inspiration for
an original `interactive-spec` widget" path, which needs the legal read
before it is more than speculation, and doesn't serve the pilot either way.

**Deferred from:** `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`
(Move B implementation, parking lot), 2026-08-28, branch
`claude/autoplan-content-readiness-4vfhcn`.

## WL→safe-evaluator translation adapter

**Trigger:** 3+ authoring sessions each hand-translating Wolfram Language
output into the frontend's safe-evaluator grammar
(`frontend/src/components/lesson/interactives/types.ts`'s recursive-descent
parser — no `Function()`/`eval()`).

**What:** a dedicated adapter that converts WL expression output (from an
authorized Wolfram MCP session's `WolframLanguageEvaluator` calls, per
Posture W) directly into `interactive-spec` / `gif-scene` widget JSON,
instead of an agent doing the translation by hand each time.

**Why not now:** no live authoring session has exercised this yet — Posture
W is new. (Update 2026-08-29: the Wolfram MCP connector, unauthenticated
when this item was filed on 2026-08-28, is now live and authenticated — see
`docs/ops/content-verification-runbook.md` §0's updated Posture W note. That
changes only whether Posture W's ad hoc usage is possible, not this item's
trigger.) Building the adapter before a real session has hit the
hand-translation pain three times is building ahead of demonstrated need.

**Where to start:** `frontend/src/components/lesson/interactives/types.ts`'s
schema is the target shape; `src/content/concept-orchestrator/gif-generator.ts`
is the target shape for `gif-scene` blocks. The adapter's job is purely
syntactic translation — it must never call Wolfram itself (that stays
Posture W's ad hoc, human-authorized MCP usage).

**Deferred from:** `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`
(Posture W, parking lot), 2026-08-28, branch
`claude/autoplan-content-readiness-4vfhcn`.

## Show Steps content in worked examples

**Trigger:** §0 of `docs/ops/content-verification-runbook.md` (Wolfram
licensing terms) is filled in, specifically the Show Steps API's
redistribution terms for product content.

**What:** using Wolfram|Alpha's Show Steps API to generate or check
step-by-step worked solutions inside `worked_example` atoms, instead of
(or alongside) LLM-authored solution steps.

**Why not now:** Show Steps redistribution terms for product content are
unconfirmed (`docs/designs/2026-08-28-wolfram-t3-content-strategy.md`'s
ground-truth audit) — this is licensing-gated, same as Tier 3 activation
itself, and §0 is where that answer gets recorded once an operator pulls it.

**Where to start:** `src/services/wolfram-steps-cache.ts` and
`src/jobs/wolfram-verify-job.ts`'s step-harvest leg
(`.data/wolfram-steps/<problem_id>.json`, provenance-stamped) already fetch
and cache Show Steps output for VERIFICATION purposes — this item is about
whether that content can additionally be shown to students, which is a
different (redistribution) licensing question than the verification-only
use already live.

**Deferred from:** `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`
(Move B implementation, parking lot), 2026-08-28, branch
`claude/autoplan-content-readiness-4vfhcn`.

## Wolfram Engine batch asset generation

**Trigger:** a demonstrated need `gifenc`
(`src/content/concept-orchestrator/gif-generator.ts`) cannot meet, AND a
confirmed Wolfram Engine production license (§0 of
`docs/ops/content-verification-runbook.md`).

**What:** using a licensed Wolfram Engine to batch-generate visual assets
(plots, animations) for concept atoms, as an alternative or supplement to
the existing pure-JS `gifenc` pipeline.

**Why not now:** the free Wolfram Engine's license explicitly forbids
production use, including non-commercial end-user deployment — a paid
production license is a real cost with no confirmed price yet
(`docs/designs/2026-08-28-wolfram-t3-content-strategy.md`'s ground-truth
audit), and `gifenc` already covers `parametric-curve`, `level-set`, and
`discrete-bars` scenes with no live dependency or license exposure. There is
no known gap it fails to meet today (see the v4.36.0 "every topic walkable"
entry in `CLAUDE.md`: gif-scene renders went from 66/28-skipped/6-failed to
70/30/0 — zero known-broken scenes).

**Deferred from:** `docs/designs/2026-08-28-wolfram-t3-content-strategy.md`
(Move B implementation, parking lot / rejected R1), 2026-08-28, branch
`claude/autoplan-content-readiness-4vfhcn`.

## Resonance scenes for intuition atoms of the four pioneer concepts

**Trigger:** resonance hooks (branch `claude/autoplan-content-resonance-q5p197`)
ship and the `resonance_hooks_v1_gate_ma` experiment row shows engagement signal —
or the next authoring batch on LA content for any reason.

**What:** `determinants`, `eigenvalues`, `linear-transformations`, `orthogonality`
carry narration-beat simulations on their hook atoms; their `intuition` atoms
still use static `manipulable`/directive interactives. Author beat-fused scenes
(per the resonance schema: per-stance texts, one trap beat, ghost path) for those
four intuition atoms, propagated byte-identically into both stance variant files.

**Why:** deferred from the resonance plan's cherry-pick ceremony — it doubles the
W3 authoring load for four concepts while W4's generation wiring covers intuition
atoms for everything generated going forward. Worth doing by hand only once the
hook-level pattern shows signal.

**Where to start:** `docs/designs/2026-08-30-resonance-fused-atoms-plan.md` (the
schema + design contract), `modules/project-vidhya-content/concepts/<id>/atoms/intuition*.md`.

**Effort:** M human / ~30 min CC per concept incl. Wolfram verification.
**Priority:** P3.
**Deferred from:** /autoplan CEO phase, 2026-08-30.

## Trap-beat wording can drift from its source common-traps atom

**Trigger:** any edit to a `common-traps.md` file for a concept whose hook carries
a resonance trap beat; or a QA report of a trap beat contradicting the Common
Traps card in the same lesson.

**What:** resonance trap beats cite the highest-cost trap from the concept's
authored `common-traps.md`, but nothing mechanical links them — a later edit to
the traps atom can leave the beat teaching an outdated or contradicting version.
Options when this bites: a `ci:` check greping trap-beat text for a keyword
anchor into the source atom, or an authoring-note convention in the spec fence.

**Why:** named as the one debt item in the resonance plan's trajectory review
(S10); cheap to fix once real, speculative to build before any drift has occurred.

**Where to start:** `scripts/check-variant-agreement.ts` (walker precedent) or a
new small check; `docs/designs/2026-08-30-resonance-fused-atoms-plan.md` S10.

**Effort:** S human / ~15 min CC.
**Priority:** P3.
**Deferred from:** /autoplan eng phase, 2026-08-30.

## Delivery-modifier framework for `formal_definition`/`mnemonic` — only `#device-reveal` shipped

**Trigger:** the next content-authoring pass touching `formal_definition`
atoms, or renewed "definition/mnemonic feels thin, no MOAT" feedback.

**What:** `docs/designs/2026-09-01-definition-mnemonic-engagement-framework.md`
proposes five composable delivery modifiers grounded in six cognitive-load/
generative-learning results (Sweller, Roediger & Karpicke, Fiorella & Mayer,
Bjork & Bjork, Chi et al., Paivio/Mayer). `#device-reveal` (the `mnemonic`
paragraph stagger) shipped in v4.45.0. Four remain unbuilt: `#term-first`
and `#not-this` and `#apply-once` are content-only (wrap the statement in
the existing `<details>` convention; one authored line per atom);
`#restate-check` needs a distractor-sourcing pipeline off each concept's
`common-traps.md` — real work, not mechanical, since parsing prose traps
into MCQ-shaped near-misses isn't a lookup. A further `#mnemonic-scene`
(extending the resonance-beat `isBeatAtom` gate, `orchestrator.ts:598`, to
`mnemonic`) is named as a later follow-up only, not scoped here.

**Why not fixed inline:** each remaining modifier is either a product/
content-authoring call (what a good `#not-this` line says per concept) or
real engineering (the distractor picker) — the doc's own §4 explicitly
declines to decide either here.

**Where to start:** `docs/designs/2026-09-01-definition-mnemonic-engagement-framework.md`
§3 (modifier table), §7 (suggested build order).

**Effort:** S human / CC ~15 min per content-only modifier row;
`#restate-check`'s distractor picker is its own follow-up PR (M-sized).
**Priority:** P3.
**Deferred from:** `/investigate` session, 2026-09-01, branch
`claude/exam-pattern-engagement-bugs-wdff09`.
