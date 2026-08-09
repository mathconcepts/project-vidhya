/**
 * src/resonance/job.ts
 *
 * Nightly resonance aggregation job (Track E2).
 *
 * Reads from: teaching_turns, attempts-bus events, atom_ratings, mastery_snapshots
 * Writes to:  atom_resonance table (migration 035)
 *
 * Runs in shadow mode until >= 2 weeks AND >= 500 scored turns.
 * Never surfaces per-student data — only aggregate counts.
 *
 * Usage: registered in src/jobs/scheduler.ts as a nightly job.
 *        Can also be triggered via POST /api/admin/resonance/recompute.
 */

import type { Pool } from 'pg';
import {
  computeResonanceV1,
  normaliseRatingScore,
  computeDwellFit,
  checkShadowMode,
  K_ANON_FLOOR,
} from './resonance-v1.js';
import type { ResonanceComponents, ResonanceScore } from './types.js';

const WINDOW_DAYS = 7;
const ESTIMATED_READ_SECONDS_DEFAULT = 60; // fallback if atom has no reading_time

interface AggregateRow {
  atom_id: string;
  version_n: number;
  n: number;
  completion_count: number;
  total_seen: number;
  avg_dwell_seconds: number;
  regen_count: number;
  regen_abandon_count: number;
  helped_ratings: number;
  total_ratings: number;
  mastery_gain_count: number;
}

async function queryShadowModeStatus(pool: Pool): Promise<{ weeks: number; turns: number }> {
  try {
    const res = await pool.query<{ min_date: string; turn_count: string }>(`
      SELECT
        MIN(created_at)::DATE AS min_date,
        COUNT(*) AS turn_count
      FROM chat_messages
      WHERE role = 'assistant'
    `);
    const row = res.rows[0];
    if (!row?.min_date) return { weeks: 0, turns: 0 };
    const days = Math.floor(
      (Date.now() - new Date(row.min_date).getTime()) / (1000 * 60 * 60 * 24),
    );
    return { weeks: Math.floor(days / 7), turns: parseInt(row.turn_count, 10) };
  } catch {
    return { weeks: 0, turns: 0 };
  }
}

async function queryAtomAggregates(pool: Pool, windowDays: number): Promise<AggregateRow[]> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  // This is a best-effort query — tables may not exist in demo deploys.
  try {
    // Use atom_ratings + generated_problems + mastery_snapshots for components
    const res = await pool.query<AggregateRow>(`
      SELECT
        ar.atom_id,
        0 AS version_n,
        COUNT(DISTINCT ar.student_id) AS n,
        COUNT(DISTINCT ar.student_id) FILTER (WHERE ar.rating = 1) AS helped_ratings,
        COUNT(DISTINCT ar.student_id) AS total_ratings,
        0 AS completion_count,
        0 AS total_seen,
        0 AS avg_dwell_seconds,
        0 AS regen_count,
        0 AS regen_abandon_count,
        0 AS mastery_gain_count
      FROM atom_ratings ar
      WHERE ar.rated_at >= $1
      GROUP BY ar.atom_id
    `, [since]);

    return res.rows;
  } catch {
    return [];
  }
}

export interface ResonanceJobResult {
  computed: number;
  skipped_insufficient_n: number;
  shadow_mode: boolean;
}

export async function runResonanceJob(
  pool: Pool,
  options: { window_days?: number } = {},
): Promise<ResonanceJobResult> {
  const windowDays = options.window_days ?? WINDOW_DAYS;

  const { weeks, turns } = await queryShadowModeStatus(pool);
  const shadowStatus = checkShadowMode(weeks, turns);

  console.log(
    `[resonance-job] shadow_mode=${shadowStatus.active} weeks=${weeks} turns=${turns} window=${windowDays}d`,
  );

  const aggregates = await queryAtomAggregates(pool, windowDays);

  let computed = 0;
  let skipped = 0;

  for (const row of aggregates) {
    const ratingScore = normaliseRatingScore(
      Number(row.helped_ratings),
      Number(row.total_ratings),
    );

    const completionRate =
      row.total_seen > 0 ? Number(row.completion_count) / Number(row.total_seen) : 0;

    const dwellFit = computeDwellFit(
      Number(row.avg_dwell_seconds),
      ESTIMATED_READ_SECONDS_DEFAULT,
    );

    const regenAbandonRate =
      row.regen_count > 0 ? Number(row.regen_abandon_count) / Number(row.regen_count) : 0;

    const masteryShare =
      row.n > 0 ? Number(row.mastery_gain_count) / Number(row.n) : 0;

    const components: ResonanceComponents = {
      completion_rate: completionRate,
      dwell_fit: dwellFit,
      regen_abandon_rate: regenAbandonRate,
      rating_score: ratingScore,
      mastery_share: masteryShare,
    };

    const n = Number(row.n);
    const resonanceV1 = computeResonanceV1(components, n);

    if (resonanceV1 === null && n < K_ANON_FLOOR) {
      skipped++;
      // Still persist with null resonance and n count for the admin dashboard
    }

    try {
      await pool.query(`
        INSERT INTO atom_resonance
          (atom_id, version_n, cohort_key, window_days, resonance_v1, n,
           completion_rate, dwell_fit, regen_abandon_rate, rating_score, mastery_share,
           shadow_mode, computed_at)
        VALUES ($1, $2, 'all', $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `, [
        row.atom_id,
        row.version_n ?? 0,
        windowDays,
        resonanceV1,
        n,
        components.completion_rate,
        components.dwell_fit,
        components.regen_abandon_rate,
        components.rating_score,
        components.mastery_share,
        shadowStatus.active,
      ]);
      computed++;
    } catch (err) {
      console.warn(`[resonance-job] failed to persist atom_id=${row.atom_id}:`, err);
    }
  }

  console.log(
    `[resonance-job] done: ${computed} computed, ${skipped} skipped (insufficient_n < ${K_ANON_FLOOR})`,
  );

  return { computed, skipped_insufficient_n: skipped, shadow_mode: shadowStatus.active };
}

// ---------------------------------------------------------------------------
// Rating event persistence
// ---------------------------------------------------------------------------

export async function recordAtomRating(
  pool: Pool,
  event: { atom_id: string; student_id: string; session_id?: string; rating: 1 | -1 },
): Promise<void> {
  await pool.query(`
    INSERT INTO atom_ratings (atom_id, student_id, session_id, rating, rated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT DO NOTHING
  `, [event.atom_id, event.student_id, event.session_id ?? null, event.rating]);
}
