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
