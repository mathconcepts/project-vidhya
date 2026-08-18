/**
 * src/readiness/metrics.ts — T15: observability for the readiness engine.
 *
 * In-process counters only — no DB, no persistence. They reset on every
 * process restart/deploy, and the `/api/admin/readiness-metrics` response
 * (src/api/admin-readiness-metrics-routes.ts) carries a `since` timestamp
 * so an operator reading the numbers always knows exactly how much
 * history they represent, never mistaking "3 hours of traffic" for
 * "3 months".
 *
 * Two metrics from the plan's §8 (amended by the second outside voice —
 * see docs/designs/linear-algebra-realtime-and-math-academy-plan.md,
 * "Metric split (amends §8)"):
 *   (a) % of /api/readiness/next-action responses carrying a real
 *       objectId (`next_action_object_id_rate` below) — the headline
 *       metric for the whole effort.
 *   (b) the prereq-redirect fired-rate (`redirect_fired` below) — (a)
 *       alone is trivially satisfiable while only LA has items, so the
 *       redirect firing is tracked separately.
 *
 * Also tracks per-arm selection counts and the diagnose-fallback count
 * ("building your baseline" — cold-start / DB-less / error responses).
 *
 * A9 note (amendment 11 — "exam scoping for (a) arrives with A9's GATE-MA
 * track"): these counters are global, in-process, and unscoped by exam —
 * `recordObjectIdOutcome()` / `recordArmSelection()` don't know which exam
 * (or track) the calling request was for. That's a real gap: metric (a)
 * alone is trivially satisfiable while only linear-algebra has gradable
 * items, because a non-LA student's fallback response is indistinguishable
 * from an LA student's real one in the aggregate. Scoping this properly
 * means threading an `exam_id` (or track id) from `handleNextAction`
 * (src/api/readiness-routes.ts) through every `record*` call here AND
 * splitting `Counters` into a `Record<examId, Counters>` (plus the admin
 * route, src/api/admin-readiness-metrics-routes.ts, gaining an `?exam=`
 * filter) — a real seam exists (every call site already has `user.userId`
 * and, via GATE-MA, a resolvable track/exam), but wiring it is a second
 * change with its own blast radius across the counters' shape and the
 * admin consumer, deliberately left for a follow-up rather than bundled
 * into this track-only PR.
 */

import type { ActionKind } from '../core/interfaces';

const ARM_KINDS: ReadonlyArray<ActionKind> = ['diagnose', 'teach', 'practice', 'retain'];

interface Counters {
  armSelections: Record<ActionKind, number>;
  nextActionWithObjectId: number;
  nextActionWithoutObjectId: number;
  redirectFired: number;
  diagnoseFallback: number;
}

function freshCounters(): Counters {
  const armSelections = {} as Record<ActionKind, number>;
  for (const kind of ARM_KINDS) armSelections[kind] = 0;
  return {
    armSelections,
    nextActionWithObjectId: 0,
    nextActionWithoutObjectId: 0,
    redirectFired: 0,
    diagnoseFallback: 0,
  };
}

let _counters = freshCounters();
let _since = new Date();

/** Record which arm (`Action.kind`) the engine surfaced. */
export function recordArmSelection(kind: ActionKind): void {
  _counters.armSelections[kind] = (_counters.armSelections[kind] ?? 0) + 1;
}

/** Record whether this next-action response carried a real objectId. */
export function recordObjectIdOutcome(hasObjectId: boolean): void {
  if (hasObjectId) _counters.nextActionWithObjectId += 1;
  else _counters.nextActionWithoutObjectId += 1;
}

/** Record that the prereq-redirect (content-gate.ts's LA-chain on-ramp) fired. */
export function recordRedirectFired(): void {
  _counters.redirectFired += 1;
}

/**
 * Record a "building your baseline" response — the engine had nothing
 * concrete to recommend (cold start, DB-less, or a caught exception).
 */
export function recordDiagnoseFallback(): void {
  _counters.diagnoseFallback += 1;
}

export interface ReadinessMetricsSnapshot {
  /** ISO timestamp — when the current counting window started (process boot or last reset). */
  since: string;
  arm_selections: Record<ActionKind, number>;
  next_action_with_object_id: number;
  next_action_without_object_id: number;
  /** next_action_with_object_id / (with + without), or null with zero responses so far. */
  next_action_object_id_rate: number | null;
  redirect_fired: number;
  diagnose_fallback: number;
}

export function readinessMetricsSnapshot(): ReadinessMetricsSnapshot {
  const total = _counters.nextActionWithObjectId + _counters.nextActionWithoutObjectId;
  return {
    since: _since.toISOString(),
    arm_selections: { ..._counters.armSelections },
    next_action_with_object_id: _counters.nextActionWithObjectId,
    next_action_without_object_id: _counters.nextActionWithoutObjectId,
    next_action_object_id_rate: total > 0 ? _counters.nextActionWithObjectId / total : null,
    redirect_fired: _counters.redirectFired,
    diagnose_fallback: _counters.diagnoseFallback,
  };
}

/** Test hook — resets every counter and the `since` timestamp. */
export function resetReadinessMetrics(): void {
  _counters = freshCounters();
  _since = new Date();
}
