// @ts-nocheck
/**
 * narration-experiment-scanner.ts — Phase F TTS A/B (PENDING.md §4.15).
 *
 * Nightly job that schedules narration A/B experiments on intuition atoms
 * with TTS audio available. Orthogonal to regen-scanner: it doesn't
 * generate content, it just opens an A/B experiment so the existing
 * v4.9.0 evaluator can decide whether narration helps retention.
 *
 * Cost gate (issue 8 in the eng review): hard cap MAX_ACTIVE_NARRATION
 * (default 50) running narration experiments at any time. Past the cap,
 * the scanner exits early — atoms wait their turn rather than blowing
 * the TTS budget.
 *
 * Eligibility:
 *   - atom_type = 'intuition' (only narratable kind in v1, per shouldNarrate)
 *   - has at least one media_artifacts row with kind='audio_narration' status='done'
 *   - active atom_versions row exists (control_version_n = candidate_version_n
 *     = active version — narration A/B varies the sidecar, not the prose)
 *   - no running narration experiment yet for this atom
 *
 * Cadence: same daily window as regen-scanner — 14-day window from creation.
 * Verdict path lives in ab-tester.evaluateRipeExperiments and uses the
 * variant_kind column to pick the right metric.
 *
 * Graceful degradation: no DATABASE_URL → no-op with skip message. Same
 * pattern as regen-scanner.
 */

import pg from 'pg';
import { createExperiment } from '../content/concept-orchestrator';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export const MAX_ACTIVE_NARRATION = Number(process.env.VIDHYA_MAX_NARRATION_AB || '50');

export interface NarrationScanResult {
  scheduled: number;
  skipped_existing: number;
  skipped_cap: boolean;
  active_count: number;
  error?: string;
}

export async function runNarrationExperimentScanner(): Promise<NarrationScanResult> {
  const pool = getPool();
  if (!pool) {
    return { scheduled: 0, skipped_existing: 0, skipped_cap: false, active_count: 0, error: 'no DATABASE_URL' };
  }

  // Cost cap: how many narration experiments are running already?
  let activeCount = 0;
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS n FROM atom_ab_tests
         WHERE variant_kind = 'narration' AND status = 'running'`,
    );
    activeCount = r.rows[0]?.n ?? 0;
  } catch (err) {
    return { scheduled: 0, skipped_existing: 0, skipped_cap: false, active_count: 0, error: (err as Error).message };
  }

  if (activeCount >= MAX_ACTIVE_NARRATION) {
    console.warn(
      `[narration-experiment-scanner] cap reached: ${activeCount} active narration experiments ` +
      `(VIDHYA_MAX_NARRATION_AB=${MAX_ACTIVE_NARRATION}). Exiting.`,
    );
    return { scheduled: 0, skipped_existing: 0, skipped_cap: true, active_count: activeCount };
  }

  const slotsLeft = MAX_ACTIVE_NARRATION - activeCount;

  // Find eligible atoms: intuition, with audio_narration done, active version,
  // no running narration experiment yet. Cap by slots remaining.
  let eligible: { atom_id: string; version_n: number }[] = [];
  try {
    const r = await pool.query(
      // atom_type derives from the atom_id suffix: '{concept_id}.{atom_type}'.
      // 'intuition' is the only narratable kind in v1 per shouldNarrate().
      `SELECT v.atom_id, v.version_n
         FROM atom_versions v
         JOIN media_artifacts m
           ON m.atom_id = v.atom_id AND m.version_n = v.version_n
         LEFT JOIN atom_ab_tests t
           ON t.atom_id = v.atom_id
          AND t.variant_kind = 'narration'
          AND t.status = 'running'
        WHERE v.active = TRUE
          AND m.kind = 'audio_narration'
          AND m.status = 'done'
          AND t.id IS NULL
          AND v.atom_id LIKE '%.intuition'
        ORDER BY m.generated_at DESC
        LIMIT $1`,
      [slotsLeft],
    );
    eligible = r.rows;
  } catch (err) {
    return { scheduled: 0, skipped_existing: 0, skipped_cap: false, active_count: activeCount, error: (err as Error).message };
  }

  let scheduled = 0;
  let skippedExisting = 0;
  for (const row of eligible) {
    // For narration variants, control_version_n === candidate_version_n.
    // The bucket assignment toggles the sidecar, not the prose version.
    const exp = await createExperiment(row.atom_id, row.version_n, row.version_n, 'narration');
    if (exp && exp.status === 'running' && exp.atom_id === row.atom_id) {
      scheduled++;
    } else {
      // ON CONFLICT path — race or pre-existing experiment.
      skippedExisting++;
    }
  }

  return {
    scheduled,
    skipped_existing: skippedExisting,
    skipped_cap: false,
    active_count: activeCount + scheduled,
  };
}

// CLI hook: `npx tsx src/jobs/narration-experiment-scanner.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  runNarrationExperimentScanner()
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
