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

// ============================================================================
// Phase 2 of Curriculum R&D — pyq_accuracy_delta_v1
// ============================================================================
//
// Direct measurement against the holdout PYQ bank. Works alongside lift_v1:
// lift_v1 measures mastery delta (leading); pyq_accuracy_delta_v1 measures
// accuracy on the actual exam questions (lagging, north-star).
//
// Method:
//   1. Resolve treatment + control session cohorts the same way as lift_v1.
//   2. For each cohort, read sr_attempts (or equivalent) WHERE the
//      attempted problem is a holdout PYQ for the experiment's exam pack
//      AND the attempt happened within ±window_days of experiment start.
//   3. Compute: treatment_accuracy − control_accuracy.
//   4. Significance: 2-proportion z-test (normal approximation; conservative
//      for small samples, fine for n ≥ 30 cohort attempts which is the
//      promotion threshold).

import type { PyqAccuracyDeltaResult } from './types';

export interface ComputePyqDeltaOptions {
  window_days?: number;
  persist?: boolean;
}

export async function computePyqAccuracyDelta(
  experimentId: string,
  options: ComputePyqDeltaOptions = {},
): Promise<PyqAccuracyDeltaResult | null> {
  const pool = getExperimentsPool();
  if (!pool) return null;

  const exp = await getExperiment(experimentId);
  if (!exp) return null;

  const windowDays = options.window_days ?? 7;
  const persist = options.persist ?? true;

  const treatmentSessions = await resolveTreatmentSessions(experimentId, exp.exam_pack_id);
  if (treatmentSessions.size === 0) {
    return emptyDeltaResult(experimentId, windowDays);
  }
  const controlSessions = await resolveControlSessions(
    exp.exam_pack_id,
    treatmentSessions,
    exp.started_at,
    windowDays,
  );

  // Pull cohort attempts on holdout PYQs within the post-window.
  // sr_sessions stores attempts; we filter by problem_id reaching pyq_questions
  // where is_holdout = TRUE and exam_id matches the experiment's pack.
  // (Joining via TEXT(problem_id) tolerates both UUID and string ids.)
  const treatmentAttempts = await fetchHoldoutAttempts(
    pool,
    Array.from(treatmentSessions),
    exp.exam_pack_id,
    exp.started_at,
    windowDays,
  );
  const controlAttempts = await fetchHoldoutAttempts(
    pool,
    Array.from(controlSessions),
    exp.exam_pack_id,
    exp.started_at,
    windowDays,
  );

  const accT = computeAccuracy(treatmentAttempts);
  const accC = computeAccuracy(controlAttempts);

  // Distinct holdout PYQs touched (debug signal in result).
  const touched = new Set<string>();
  for (const a of treatmentAttempts) touched.add(a.problem_id);
  for (const a of controlAttempts) touched.add(a.problem_id);

  const p = twoProportionPValue(
    accT.correct, accT.total,
    accC.correct, accC.total,
  );

  const result: PyqAccuracyDeltaResult = {
    experiment_id: experimentId,
    delta: accT.rate - accC.rate,
    n_treatment_attempts: accT.total,
    n_control_attempts: accC.total,
    p_value: p,
    computed_at: new Date().toISOString(),
    accuracy_treatment: accT.rate,
    accuracy_control: accC.rate,
    holdout_pyqs_observed: touched.size,
  };

  if (persist) {
    // Stash into experiments.metadata.pyq_accuracy_delta_v1 — keeps schema
    // additive. A future migration can promote to columns once stable.
    await pool.query(
      `UPDATE experiments
          SET metadata = COALESCE(metadata, '{}'::JSONB)
                       || jsonb_build_object(
                            'pyq_accuracy_delta_v1', $2::JSONB
                          )
        WHERE id = $1`,
      [experimentId, JSON.stringify(result)],
    );
  }

  return result;
}

interface AttemptRow {
  problem_id: string;
  is_correct: boolean;
}

async function fetchHoldoutAttempts(
  pool: ReturnType<typeof getExperimentsPool> & object,
  sessionIds: string[],
  examPackId: string,
  experimentStartIso: string,
  windowDays: number,
): Promise<AttemptRow[]> {
  if (sessionIds.length === 0) return [];

  // sr_sessions stores attempts in a JSONB queue; problem_id is used in
  // many places as the canonical attempt key. We use a permissive query
  // that handles both schemas: if `attempts` table exists with explicit
  // rows, use it; else fall back to scanning sr_sessions.attempts JSON.
  // Safe both ways: if neither exists, the query catches and returns [].
  try {
    const { rows } = await pool.query<AttemptRow>(
      `SELECT a.problem_id::TEXT AS problem_id,
              COALESCE(a.is_correct, FALSE) AS is_correct
         FROM sr_attempts a
         JOIN pyq_questions p ON p.id::TEXT = a.problem_id::TEXT
        WHERE a.session_id = ANY($1::TEXT[])
          AND p.is_holdout = TRUE
          AND p.exam_id = $2
          AND a.attempted_at >= $3::TIMESTAMPTZ
          AND a.attempted_at <= $3::TIMESTAMPTZ + ($4::TEXT || ' days')::INTERVAL`,
      [sessionIds, examPackId, experimentStartIso, String(windowDays)],
    );
    return rows;
  } catch {
    // Fallback: sr_attempts table doesn't exist on this deployment.
    // Best-effort: pull sr_sessions.attempts JSONB and crack open each
    // attempt entry. This path is generous; the real path is the
    // explicit table, which is the production shape.
    try {
      const { rows } = await pool.query<{ session_id: string; attempts: any[] }>(
        `SELECT session_id, attempts
           FROM sr_sessions
          WHERE session_id = ANY($1::TEXT[])`,
        [sessionIds],
      );
      const out: AttemptRow[] = [];
      // Pull the holdout PYQ id set once, then filter in JS.
      const { rows: holdoutRows } = await pool.query<{ id: string }>(
        `SELECT id::TEXT AS id FROM pyq_questions WHERE is_holdout = TRUE AND exam_id = $1`,
        [examPackId],
      );
      const holdoutIds = new Set(holdoutRows.map((r) => r.id));
      const startMs = Date.parse(experimentStartIso);
      const endMs = startMs + windowDays * 24 * 60 * 60 * 1000;
      for (const r of rows) {
        const list = Array.isArray(r.attempts) ? r.attempts : [];
        for (const a of list) {
          if (!a || typeof a !== 'object') continue;
          const pid = String(a.problem_id ?? a.pyq_id ?? '');
          if (!pid || !holdoutIds.has(pid)) continue;
          const ts = Date.parse(a.attempted_at ?? a.ts ?? '');
          if (Number.isNaN(ts) || ts < startMs || ts > endMs) continue;
          out.push({
            problem_id: pid,
            is_correct: Boolean(a.is_correct ?? a.correct),
          });
        }
      }
      return out;
    } catch {
      return [];
    }
  }
}

function computeAccuracy(attempts: AttemptRow[]): { correct: number; total: number; rate: number } {
  let c = 0;
  for (const a of attempts) if (a.is_correct) c += 1;
  const total = attempts.length;
  return { correct: c, total, rate: total > 0 ? c / total : 0 };
}

/**
 * Two-proportion z-test, two-sided. Returns 1 (no info) if either sample
 * has 0 attempts. Pure function; exported for tests.
 */
export function twoProportionPValue(
  c1: number, n1: number,
  c2: number, n2: number,
): number {
  if (n1 === 0 || n2 === 0) return 1;
  const p1 = c1 / n1;
  const p2 = c2 / n2;
  const pPool = (c1 + c2) / (n1 + n2);
  const denom = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (denom === 0) return p1 === p2 ? 1 : 0;
  const z = (p1 - p2) / denom;
  // Two-sided normal-approx p-value
  return 2 * (1 - normalCdf(Math.abs(z)));
}

function emptyDeltaResult(experimentId: string, windowDays: number): PyqAccuracyDeltaResult {
  return {
    experiment_id: experimentId,
    delta: 0,
    n_treatment_attempts: 0,
    n_control_attempts: 0,
    p_value: 1,
    computed_at: new Date().toISOString(),
    accuracy_treatment: 0,
    accuracy_control: 0,
    holdout_pyqs_observed: 0,
  };
}

// Exported for unit tests
export const __testing = { mean, variance, welchPValue, normalCdf, twoProportionPValue, computeAccuracy };
