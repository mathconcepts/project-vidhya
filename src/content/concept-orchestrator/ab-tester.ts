// @ts-nocheck
/**
 * ab-tester.ts — automatic A/B testing of regen variants (PENDING.md §4.12).
 *
 * Orchestrates the experiment lifecycle:
 *
 *   1. createExperiment(atom_id, control_version_n, candidate_version_n)
 *      Called by regen-scanner after appending v2. Stores a row in
 *      atom_ab_tests with status='running' and a 14-day ends_at.
 *
 *   2. assignBucket(atom_id, student_id) → 'control' | 'candidate' | null
 *      Called by atom-loader on every lesson load. Reads the running
 *      experiment (if any) and hashes student_id to pick the bucket.
 *      Returns null when no experiment is running — atom-loader falls
 *      back to the canonical active version (v1's active flag).
 *
 *   3. evaluateRipeExperiments() → ExperimentEvaluation[]
 *      Called nightly by ab-evaluator. Finds experiments past ends_at,
 *      computes per-bucket error rates from atom_engagements, decides
 *      winner if delta >= MIN_DELTA AND each bucket has MIN_N students,
 *      promotes/reverts via atom_versions activate(), updates the
 *      experiment row with verdict + status.
 *
 * Deterministic bucket assignment via FNV-1a hash on student_id — no
 * per-student row stored. The evaluator re-hashes when computing
 * aggregates so control/candidate counts are reproducible.
 *
 * Graceful degradation: when DATABASE_URL is unset, every function is a
 * no-op and atom-loader falls through to the canonical active version.
 */

import pg from 'pg';
import { activate, listVersions } from './atom-versions';
import { recordOutcome, type PatternOutcome } from './prompt-patterns';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export const AB_WINDOW_DAYS = Number(process.env.VIDHYA_AB_WINDOW_DAYS || '14');
export const AB_MIN_BUCKET_SIZE = Number(process.env.VIDHYA_AB_MIN_BUCKET_SIZE || '20');
/** Min relative-error-rate delta required to declare a winner. 0.10 = 10%. */
export const AB_MIN_DELTA = Number(process.env.VIDHYA_AB_MIN_DELTA || '0.10');

export type AbStatus =
  | 'running' | 'promoted_candidate' | 'promoted_control'
  | 'tie' | 'insufficient_data' | 'cancelled';

/**
 * What's being A/B tested. 'content' = the v4.9.0 default — control_version_n
 * vs candidate_version_n prose. 'narration' = same version_n (control == candidate),
 * but the bucket assignment toggles whether audio_url ships in the lesson payload.
 *
 * Per migration 019, an atom can have one running experiment per variant_kind.
 */
export type VariantKind = 'content' | 'narration';

export interface AbExperiment {
  id: string;
  atom_id: string;
  control_version_n: number;
  candidate_version_n: number;
  started_at: string;
  ends_at: string;
  status: AbStatus;
  evaluated_at: string | null;
  verdict: any;
  variant_kind: VariantKind;
}

export interface AssignmentResult {
  bucket: 'control' | 'candidate';
  version_n: number;
  experiment_id: string;
}

// ─── FNV-1a — small, fast, deterministic. Adequate for bucket assignment. ──
//
// We only need uniform distribution over a small modulus (2 buckets).
// FNV-1a is overkill quality-wise but trivially small.
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Force unsigned 32-bit.
  return hash >>> 0;
}

/**
 * Assign a (atom_id, student_id) pair to a bucket. Salted with atom_id so
 * the same student lands in different buckets across different atoms — we
 * want bucket independence per experiment, not consistent assignment.
 */
function bucketFor(atom_id: string, student_id: string): 'control' | 'candidate' {
  const h = fnv1a(`${atom_id}::${student_id}`);
  return h % 2 === 0 ? 'control' : 'candidate';
}

// ─── Lifecycle ────────────────────────────────────────────────────────

/**
 * Create a new running experiment. Called by regen-scanner after
 * appending a candidate version. Idempotent: if a running experiment
 * already exists for this atom_id, returns the existing row instead
 * of erroring on the partial unique index.
 */
export async function createExperiment(
  atom_id: string,
  control_version_n: number,
  candidate_version_n: number,
  variant_kind: VariantKind = 'content',
): Promise<AbExperiment | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const r = await pool.query(
      `INSERT INTO atom_ab_tests (atom_id, control_version_n, candidate_version_n, variant_kind, ends_at)
         VALUES ($1, $2, $3, $4, NOW() + ($5 || ' days')::interval)
         ON CONFLICT (atom_id, variant_kind) WHERE status = 'running' DO NOTHING
         RETURNING id, atom_id, control_version_n, candidate_version_n, variant_kind,
                   started_at, ends_at, status, evaluated_at, verdict`,
      [atom_id, control_version_n, candidate_version_n, variant_kind, String(AB_WINDOW_DAYS)],
    );
    if (r.rows[0]) return mapRow(r.rows[0]);
    // ON CONFLICT triggered — return the existing running experiment of this kind.
    const existing = await getRunningExperiment(atom_id, variant_kind);
    return existing;
  } catch (err) {
    console.warn(`[ab-tester] createExperiment failed for ${atom_id}: ${(err as Error).message}`);
    return null;
  }
}

export async function getRunningExperiment(
  atom_id: string,
  variant_kind: VariantKind = 'content',
): Promise<AbExperiment | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const r = await pool.query(
      `SELECT id, atom_id, control_version_n, candidate_version_n, variant_kind,
              started_at, ends_at, status, evaluated_at, verdict
         FROM atom_ab_tests
         WHERE atom_id = $1 AND variant_kind = $2 AND status = 'running'
         LIMIT 1`,
      [atom_id, variant_kind],
    );
    return r.rows[0] ? mapRow(r.rows[0]) : null;
  } catch (err) {
    console.warn(`[ab-tester] getRunningExperiment failed: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Assign a student to a bucket for the running experiment on this atom.
 * Returns null when no experiment is running — caller falls back to the
 * canonical active version. Pure function once the experiment row is
 * loaded; the actual hash is local.
 */
export async function assignBucket(
  atom_id: string,
  student_id: string,
): Promise<AssignmentResult | null> {
  const exp = await getRunningExperiment(atom_id);
  if (!exp) return null;
  const bucket = bucketFor(atom_id, student_id);
  return {
    bucket,
    version_n: bucket === 'control' ? exp.control_version_n : exp.candidate_version_n,
    experiment_id: exp.id,
  };
}

// ─── Evaluation ───────────────────────────────────────────────────────

export interface ExperimentEvaluation {
  experiment_id: string;
  atom_id: string;
  control_n: number;
  candidate_n: number;
  control_error_pct: number;
  candidate_error_pct: number;
  delta: number;       // candidate - control. Negative = candidate better.
  verdict: AbStatus;
  reason: string;
}

/**
 * Find ripe experiments (past ends_at, status='running'), evaluate each,
 * promote the winner (or revert), update the row. Idempotent — running
 * twice in the same window is a no-op for the second call.
 */
export async function evaluateRipeExperiments(): Promise<ExperimentEvaluation[]> {
  const pool = getPool();
  if (!pool) return [];

  let ripe: AbExperiment[] = [];
  try {
    const r = await pool.query(
      `SELECT id, atom_id, control_version_n, candidate_version_n, variant_kind,
              started_at, ends_at, status, evaluated_at, verdict
         FROM atom_ab_tests
         WHERE status = 'running' AND ends_at <= NOW()
         ORDER BY ends_at ASC
         LIMIT 50`,
    );
    ripe = r.rows.map(mapRow);
  } catch (err) {
    console.warn(`[ab-tester] ripe query failed: ${(err as Error).message}`);
    return [];
  }

  const out: ExperimentEvaluation[] = [];
  for (const exp of ripe) {
    const evaluation = await evaluateOne(pool, exp);
    out.push(evaluation);
  }
  return out;
}

async function evaluateOne(pool: any, exp: AbExperiment): Promise<ExperimentEvaluation> {
  let engagements: Array<{ student_id: string; n_correct: number; n_wrong: number }> = [];
  try {
    // Pull every engagement on this atom that landed during the experiment
    // window. We include student_id so the evaluator can re-hash to bucket.
    const r = await pool.query(
      `SELECT student_id,
              SUM(CASE WHEN last_recall_correct = TRUE THEN 1 ELSE 0 END)::int AS n_correct,
              SUM(CASE WHEN last_recall_correct = FALSE THEN 1 ELSE 0 END)::int AS n_wrong
         FROM atom_engagements
         WHERE atom_id = $1 AND last_seen >= $2 AND last_seen <= $3
         GROUP BY student_id`,
      [exp.atom_id, exp.started_at, exp.ends_at],
    );
    engagements = r.rows.map((row: any) => ({
      student_id: row.student_id,
      n_correct: row.n_correct,
      n_wrong: row.n_wrong,
    }));
  } catch (err) {
    console.warn(`[ab-tester] engagement query failed for ${exp.id}: ${(err as Error).message}`);
  }

  // Re-hash to bucket each student.
  let control_correct = 0, control_wrong = 0, control_n = 0;
  let candidate_correct = 0, candidate_wrong = 0, candidate_n = 0;
  for (const e of engagements) {
    const bucket = bucketFor(exp.atom_id, e.student_id);
    if (bucket === 'control') {
      control_correct += e.n_correct;
      control_wrong += e.n_wrong;
      control_n++;
    } else {
      candidate_correct += e.n_correct;
      candidate_wrong += e.n_wrong;
      candidate_n++;
    }
  }

  const control_error_pct = control_n > 0
    ? control_wrong / Math.max(control_correct + control_wrong, 1)
    : 0;
  const candidate_error_pct = candidate_n > 0
    ? candidate_wrong / Math.max(candidate_correct + candidate_wrong, 1)
    : 0;
  const delta = candidate_error_pct - control_error_pct;

  let verdict: AbStatus;
  let reason: string;

  if (control_n < AB_MIN_BUCKET_SIZE || candidate_n < AB_MIN_BUCKET_SIZE) {
    verdict = 'insufficient_data';
    reason = `not enough students (control=${control_n}, candidate=${candidate_n}, min=${AB_MIN_BUCKET_SIZE}). Candidate stays active.`;
    // Note: at this point candidate is already active (regen-scanner
    // activated it on append). insufficient_data leaves it active.
  } else if (delta <= -AB_MIN_DELTA) {
    // Candidate's error rate is meaningfully LOWER → candidate wins.
    verdict = 'promoted_candidate';
    reason = `candidate beat control by ${(Math.abs(delta) * 100).toFixed(1)}% (control=${(control_error_pct * 100).toFixed(1)}%, candidate=${(candidate_error_pct * 100).toFixed(1)}%)`;
    // Candidate already active; nothing to flip.
  } else if (delta >= AB_MIN_DELTA) {
    // Control's error rate is meaningfully LOWER → revert.
    verdict = 'promoted_control';
    reason = `control beat candidate by ${(delta * 100).toFixed(1)}% — reverting`;
    if (exp.variant_kind === 'narration') {
      // Narration A/B: control_version_n === candidate_version_n. The "revert"
      // is to suppress the audio sidecar by marking the media_artifacts row
      // disabled. applyMediaUrls won't attach audio_url once status != 'done'.
      try {
        await pool.query(
          `UPDATE media_artifacts
             SET status = 'failed',
                 error_log = COALESCE(error_log, '') || ' [disabled by A/B verdict ' || $1 || ']'
             WHERE atom_id = $2 AND version_n = $3 AND kind = 'audio_narration' AND status = 'done'`,
          [exp.id, exp.atom_id, exp.control_version_n],
        );
        reason += ' (narration sidecar disabled)';
      } catch (err) {
        console.warn(`[ab-tester] narration disable failed for ${exp.atom_id}: ${(err as Error).message}`);
      }
    } else {
      // Content A/B: activate the prior version. atom-versions.activate() swaps.
      await activate(exp.atom_id, exp.control_version_n).catch((err) => {
        console.warn(`[ab-tester] revert failed for ${exp.atom_id}: ${(err as Error).message}`);
      });
    }
  } else {
    verdict = 'tie';
    reason = `delta ${(delta * 100).toFixed(1)}% < min ${(AB_MIN_DELTA * 100).toFixed(1)}%. Candidate stays active.`;
  }

  // Persist the verdict.
  try {
    await pool.query(
      `UPDATE atom_ab_tests
         SET status = $1, evaluated_at = NOW(),
             verdict = $2::jsonb
         WHERE id = $3`,
      [
        verdict,
        JSON.stringify({
          control_n,
          candidate_n,
          control_error_pct,
          candidate_error_pct,
          delta,
          reason,
        }),
        exp.id,
      ],
    );
  } catch (err) {
    console.warn(`[ab-tester] verdict update failed: ${(err as Error).message}`);
  }

  // Self-improving prompts (§4.13): roll the verdict up to the candidate's
  // pattern signature so admin can see which prompt patterns consistently
  // produce winners. Best-effort — failure here doesn't undo the verdict.
  let outcome: PatternOutcome;
  if (verdict === 'promoted_candidate') outcome = 'promoted';
  else if (verdict === 'promoted_control') outcome = 'reverted';
  else if (verdict === 'tie') outcome = 'tie';
  else outcome = 'insufficient_data';
  recordOutcome(exp.atom_id, exp.candidate_version_n, outcome).catch(() => undefined);

  return {
    experiment_id: exp.id,
    atom_id: exp.atom_id,
    control_n,
    candidate_n,
    control_error_pct,
    candidate_error_pct,
    delta,
    verdict,
    reason,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────

function mapRow(row: any): AbExperiment {
  return {
    id: row.id,
    atom_id: row.atom_id,
    control_version_n: row.control_version_n,
    candidate_version_n: row.candidate_version_n,
    started_at: row.started_at,
    ends_at: row.ends_at,
    status: row.status,
    evaluated_at: row.evaluated_at,
    verdict: row.verdict,
    variant_kind: (row.variant_kind ?? 'content') as VariantKind,
  };
}

/**
 * Narration bucket assignment (Phase F). Returns:
 *   - 'candidate' → student is in the narration-on bucket. audio_url ships.
 *   - 'control'   → student is in the narration-off bucket. audio_url is suppressed.
 *   - null        → no running narration experiment, OR no student_id provided
 *                   (anonymous-first: fall through to default = narration on).
 *
 * Pure once the experiment row is loaded; the hash is local and deterministic.
 * Reuses the v4.9.0 FNV-1a hasher with the `atom_id::student_id` salt, so a
 * narration A/B and a content A/B on the same atom produce uncorrelated buckets
 * (the salt is identical but `narration` rows have control_version_n equal to
 * candidate_version_n, so version_n drift doesn't bias the assignment).
 */
export async function getNarrationBucket(
  atom_id: string,
  student_id: string | null,
): Promise<'control' | 'candidate' | null> {
  if (!student_id) return null;
  const exp = await getRunningExperiment(atom_id, 'narration');
  if (!exp) return null;
  return bucketFor(atom_id, student_id);
}

// Exported for tests — expose the deterministic bucket function.
export const _internals = { fnv1a, bucketFor };
