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

## Auth user records survive only until the host sleeps

**Trigger:** before any deploy where users register through the Telegram,
WhatsApp or operator surfaces and are expected to still exist tomorrow.

**What:** give `src/auth/user-store.ts` a durable backing store.

**Why:** it is flat-file only — `.data/users.json`, via `createFlatFileStore`
— with no Postgres path at all, and Render's free tier wipes `.data` on sleep.
Accounts created through `src/modules/auth/index.ts`, `telegram-adapter.ts`,
`whatsapp-adapter.ts` and the operator dashboard do not survive the night.
Its own docblock anticipates this: "Scales comfortably to ~10,000 users.
Beyond that, swap this module for a Postgres-backed implementation."

**Why it is not a backend swap.** All 17 exported functions are SYNCHRONOUS
(`getUserById`, `upsertFromGoogle`, `setRole`, `linkChannel`, …) and Postgres
is not. Making them async is a breaking API change through 13 production files
including every auth route, on a module carrying `@ts-nocheck`. That is not a
30-minute change and it should not land unreviewed.

**Where to start:** `src/sessions/session-store.ts` already solved the same
problem and is the model — Postgres when `DATABASE_URL` is set, flat file when
it is not, decided once at module load. But it had async methods from the
start. Two shapes worth weighing before writing code:

  (a) Full async migration. Honest, matches every other repo, breaks 13 files.
  (b) Write-through: keep the sync API reading an in-memory map, hydrate it
      from Postgres at boot, mirror every mutation to Postgres. No signature
      changes, no caller churn, and the data survives restart. Weaker under
      multi-instance deploys, which Render free tier does not do.

Put persistence in `src/storage/repositories/` either way. The pg-import
allowlist "may only SHRINK … or grow via an explicit, reviewable diff", and
its stated intent is migration onto that boundary — see
`pedagogy-shadow-repo.ts` for the pattern.

**Depends on:** nothing. **Blocked by:** a call on (a) vs (b).

**Found by:** `/plan-eng-review` Step 0, 2026-08-17, while scoping T15. It is
not one of the seven demo objections; it surfaced sideways.

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
