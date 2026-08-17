# TODOS

Deferred work with enough context to pick up cold. Each entry states its
trigger — the condition that makes it worth doing — so nothing sits here
being vaguely important forever.

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

**Depends on:** the 566-file generation landing, and real session volume.

**Deferred from:** `/plan-eng-review` 2026-08-16, Issue 3 (authoring recipe
correctly lives in `templates/<topic>.yaml`; measurement is the separate
reason the blueprint might earn it later). See
`docs/stance-axis-scaling-plan.md`.

## Auth user store is single-instance only

**Trigger:** before any deploy that runs more than one server instance.

**What:** finish the async migration of `src/auth/user-store.ts`.

**Status:** the data-loss half is FIXED (migration 041 +
`storage/repositories/auth-user-repo.ts`). Accounts now mirror to Postgres on
every write and are restored at boot when `.data` has been wiped. What remains
is the concurrency half.

**Why it is still open:** the file is the read path and it is per-instance.
Two servers each hold their own `users.json` and hydrate only at boot, so a
signup on instance A is invisible to instance B until B restarts. Render's
free tier is single-instance, so this is not a live bug — it becomes one the
day the service scales.

**Why it was not done now:** all 17 exports are synchronous and Postgres is
not. Making them async is a breaking change through 13 production files
including every auth route, on two modules carrying `@ts-nocheck` so the
compiler helps with none of it. That is a reviewed change, not a loop task.

**Where to start:** the mirror already exists and round-trips, so the work is
mechanical — make `readStore()` async, follow the type errors, and delete the
file path once every caller awaits. `src/sessions/session-store.ts` is the
model for the finished shape.

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

## The verifier conflates "Wolfram is down" with "the answer is wrong"

**Trigger:** before re-running the Wolfram sweep and publishing verification
rates.

**What:** decide what `inconclusive` means, and apply it in both pipelines.

**Why:** `src/verification/verifiers/wolfram.ts` returns `status:
'inconclusive'` on service unavailability — a timeout, a 5xx, a rate limit.
`src/jobs/content-flywheel.ts` then rejects anything that is not exactly
`'verified'`. So an outage at the arbiter reads as a content failure and the
item is discarded. The only Wolfram run on disk shows 6 verified, 2 disagreed
and 11 errors out of 19, so this is not a rare path — it is most of them.

Publishing a verified-rate before this policy exists publishes a number that
mixes content quality with third-party uptime, and it will have to be
retracted.

**Order matters:** this precedes the re-run, not the other way round.

**Both pipelines must be named:** `content-flywheel.ts` (the cron flywheel)
and `wolfram-verify-job.ts` are separate consumers with separate logic. Fixing
one leaves the other conflating.
