/**
 * src/experiments/lift.ts
 *
 * Mastery-lift computation. The single number that decides if a content
 * experiment shipped well.
 *
 *   lift_v1 = mean(post_window_mastery) - mean(pre_window_mastery)
 *
 *   …computed for the treatment cohort (sessions assigned to this
 *    experiment) and minus the same delta for a matched control cohort
 *    (sessions in the same exam pack who weren't assigned).
 *
 * Significance via Welch's t-test on the per-session mastery deltas.
 * For p-value we use a normal approximation (good for n >= 30, which
 * is the threshold the ledger uses for promotion decisions anyway).
 *
 * Versioning: this is `lift_v1`. If we change the formula in the future,
 * add `lift_v2` as a new column on `experiments` and never overwrite
 * historical lift_v1 values — that would invalidate every prior decision.
 */

import { getExperimentsPool } from './db';
import { getAssignments, updateExperimentLift, getExperiment } from './registry';
import type { LiftResult } from './types';

// ============================================================================
// Public API
// ============================================================================

export interface ComputeLiftOptions {
  /** Days before/after experiment start to use as windows. Default 7. */
  window_days?: number;
  /** If set, also writes lift back to experiments.lift_* columns. Default true. */
  persist?: boolean;
}

export async function computeLift(
  experimentId: string,
  options: ComputeLiftOptions = {},
): Promise<LiftResult | null> {
  const pool = getExperimentsPool();
  if (!pool) return null;

  const exp = await getExperiment(experimentId);
  if (!exp) return null;

  const windowDays = options.window_days ?? 7;
  const persist = options.persist ?? true;

  // 1. Resolve treatment cohort: sessions assigned to this experiment.
  //    Atom/flag/gen_run-level experiments are converted to a session list
  //    via mastery_snapshots — i.e. we count any session that received any
  //    treatment artifact. Session-level experiments use direct assignment.
  const treatmentSessions = await resolveTreatmentSessions(experimentId, exp.exam_pack_id);

  if (treatmentSessions.size === 0) {
    return {
      experiment_id: experimentId,
      lift: 0,
      n_treatment: 0,
      n_control: 0,
      p_value: 1,
      computed_at: new Date().toISOString(),
      window_days: windowDays,
      mean_treatment: 0,
      mean_control: 0,
    };
  }

  // 2. Compute per-session mastery delta over the window for treatment.
  const treatmentDeltas = await sessionMasteryDeltas(
    Array.from(treatmentSessions),
    exp.started_at,
    windowDays,
    exp.exam_pack_id,
  );

  // 3. Control cohort = sessions in same exam pack NOT in treatment, that
  //    were active during the window (had any snapshot in pre or post).
  const controlSessions = await resolveControlSessions(
    exp.exam_pack_id,
    treatmentSessions,
    exp.started_at,
    windowDays,
  );
  const controlDeltas = await sessionMasteryDeltas(
    Array.from(controlSessions),
    exp.started_at,
    windowDays,
    exp.exam_pack_id,
  );

  // 4. Stats: mean delta + Welch's t with normal approx.
  const meanT = mean(treatmentDeltas);
  const meanC = mean(controlDeltas);
  const lift = meanT - meanC;
  const p = welchPValue(treatmentDeltas, controlDeltas);

  const result: LiftResult = {
    experiment_id: experimentId,
    lift,
    n_treatment: treatmentDeltas.length,
    n_control: controlDeltas.length,
    p_value: p,
    computed_at: new Date().toISOString(),
    window_days: windowDays,
    mean_treatment: meanT,
    mean_control: meanC,
  };

  if (persist) {
    await updateExperimentLift(
      experimentId,
      lift,
      treatmentDeltas.length + controlDeltas.length,
      p,
    );
  }

  return result;
}

// ============================================================================
// Cohort resolution
// ============================================================================

async function resolveTreatmentSessions(
  experimentId: string,
  examPackId: string,
): Promise<Set<string>> {
  const sessions = new Set<string>();

  // Direct session-level assignments
  const sessionAssignments = await getAssignments(experimentId, 'session');
  for (const a of sessionAssignments) {
    if (a.variant !== 'control') sessions.add(a.target_id);
  }

  // Atom-level: any session that engaged with assigned atoms gets pulled in.
  // We resolve via atom_engagements which keys on student_id (UUID) — need to
  // join through student_model.user_id to get session_id.
  const atomAssignments = await getAssignments(experimentId, 'atom');
  if (atomAssignments.length > 0) {
    const pool = getExperimentsPool();
    if (pool) {
      const atomIds = atomAssignments
        .filter((a) => a.variant !== 'control')
        .map((a) => a.target_id);
      if (atomIds.length > 0) {
        const { rows } = await pool.query<{ session_id: string }>(
          `SELECT DISTINCT sm.session_id
             FROM atom_engagements ae
             JOIN student_model sm ON sm.user_id = ae.student_id
            WHERE ae.atom_id = ANY($1::TEXT[])`,
          [atomIds],
        );
        for (const r of rows) sessions.add(r.session_id);
      }
    }
  }

  // gen_run-level: pull all sessions that saw any atom/problem with that run_id.
  // Best-effort — we look at generated_problems used in sr_sessions.
  // Implementation: deferred until we have a query path. For now treat
  // gen_run experiments as session-list experiments via explicit assignment.

  // Annotation: examPackId not used yet for filtering (we trust assignments
  // are correctly scoped at create time). Future v2 may double-check.
  void examPackId;

  return sessions;
}

async function resolveControlSessions(
  examPackId: string,
  excludeSessions: Set<string>,
  experimentStartIso: string,
  windowDays: number,
): Promise<Set<string>> {
  const pool = getExperimentsPool();
  if (!pool) return new Set();

  // Active = had at least one snapshot in [start - windowDays, start + windowDays].
  const { rows } = await pool.query<{ session_id: string }>(
    `SELECT DISTINCT session_id
       FROM mastery_snapshots
      WHERE exam_pack_id = $1
        AND taken_at >= $2::TIMESTAMPTZ - ($4::TEXT || ' days')::INTERVAL
        AND taken_at <= $2::TIMESTAMPTZ + ($4::TEXT || ' days')::INTERVAL
        AND session_id <> ALL($3::TEXT[])`,
    [
      examPackId,
      experimentStartIso,
      Array.from(excludeSessions),
      String(windowDays),
    ],
  );

  return new Set(rows.map((r) => r.session_id));
}

// ============================================================================
// Per-session mastery delta over window
// ============================================================================

/**
 * For each session, compute (mean post-window mastery) − (mean pre-window
 * mastery) averaged across all concepts in the exam pack. Returns one
 * scalar per session.
 *
 * Concepts with no pre-window snapshot are skipped (we can't measure delta).
 * Sessions ending up with zero measurable concepts are dropped.
 */
async function sessionMasteryDeltas(
  sessionIds: string[],
  experimentStartIso: string,
  windowDays: number,
  examPackId: string,
): Promise<number[]> {
  if (sessionIds.length === 0) return [];
  const pool = getExperimentsPool();
  if (!pool) return [];

  const { rows } = await pool.query<{
    session_id: string;
    concept_id: string;
    pre_mastery: number | null;
    post_mastery: number | null;
  }>(
    `WITH window_bounds AS (
       SELECT $2::TIMESTAMPTZ AS exp_start,
              $2::TIMESTAMPTZ - ($4::TEXT || ' days')::INTERVAL AS pre_start,
              $2::TIMESTAMPTZ + ($4::TEXT || ' days')::INTERVAL AS post_end
     )
     SELECT s.session_id,
            s.concept_id,
            (SELECT mastery FROM mastery_snapshots ms2
              WHERE ms2.session_id = s.session_id
                AND ms2.concept_id = s.concept_id
                AND ms2.taken_at >= (SELECT pre_start FROM window_bounds)
                AND ms2.taken_at <  (SELECT exp_start FROM window_bounds)
              ORDER BY ms2.taken_at DESC LIMIT 1) AS pre_mastery,
            (SELECT mastery FROM mastery_snapshots ms3
              WHERE ms3.session_id = s.session_id
                AND ms3.concept_id = s.concept_id
                AND ms3.taken_at >= (SELECT exp_start FROM window_bounds)
                AND ms3.taken_at <= (SELECT post_end FROM window_bounds)
              ORDER BY ms3.taken_at DESC LIMIT 1) AS post_mastery
       FROM (
         SELECT DISTINCT session_id, concept_id
           FROM mastery_snapshots
          WHERE exam_pack_id = $3
            AND session_id = ANY($1::TEXT[])
       ) s`,
    [sessionIds, experimentStartIso, examPackId, String(windowDays)],
  );

  // Aggregate per session
  const perSession = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    if (r.pre_mastery == null || r.post_mastery == null) continue;
    const delta = Number(r.post_mastery) - Number(r.pre_mastery);
    const cur = perSession.get(r.session_id) ?? { sum: 0, n: 0 };
    cur.sum += delta;
    cur.n += 1;
    perSession.set(r.session_id, cur);
  }

  const result: number[] = [];
  for (const { sum, n } of perSession.values()) {
    if (n > 0) result.push(sum / n);
  }
  return result;
}

// ============================================================================
// Stats
// ============================================================================

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return s / (xs.length - 1);
}

/**
 * Welch's t-test, two-sided, with normal approximation for the p-value.
 * Accurate for n>=30; conservative-ish for smaller n. Returns 1 (no info)
 * if either sample has fewer than 2 points.
 */
function welchPValue(a: number[], b: number[]): number {
  if (a.length < 2 || b.length < 2) return 1;
  const ma = mean(a);
  const mb = mean(b);
  const va = variance(a);
  const vb = variance(b);
  const se = Math.sqrt(va / a.length + vb / b.length);
  if (se === 0) return ma === mb ? 1 : 0;
  const t = (ma - mb) / se;
  // Two-sided normal approx
  return 2 * (1 - normalCdf(Math.abs(t)));
}

/** Standard normal CDF via Abramowitz–Stegun approximation. */
function normalCdf(x: number): number {
  // Constants
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

// Exported for unit tests
export const __testing = { mean, variance, welchPValue, normalCdf };
