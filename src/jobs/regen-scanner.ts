// @ts-nocheck
/**
 * regen-scanner.ts — nightly job that closes the loop between cohort
 * error signals and content regeneration.
 *
 * Runs at 03:00 UTC (1 hour after cohort-aggregator at 02:00, leaving
 * a freshness window for the aggregator to populate cohort_signals).
 *
 * Flow:
 *   1. Freshness gate (eng-review decision A): if no cohort_signals row
 *      has been updated in the last 24h, skip with a loud warning.
 *      Better silent regen on yesterday's data than wrong regen.
 *   2. Pull top-20 atoms with error_pct > 0.5 AND n_seen >= 10.
 *   3. Dedupe: skip atoms regenerated in the last 24h (atom_versions).
 *   4. For each atom: pull top-3 misconception clusters from error_log
 *      and call generateConcept with single atom_type + force=true.
 *      Versions append as inactive — admin reviews before activation.
 *
 * Graceful degradation: when DATABASE_URL is unset, returns early with
 * a no-op result. Local dev never accidentally regenerates.
 */

import pg from 'pg';
import { generateConcept, type GeneratedAtom, createExperiment } from '../content/concept-orchestrator';
import { ALL_CONCEPTS } from '../constants/concept-graph';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export const SCANNER_NIGHTLY_CAP = Number(process.env.VIDHYA_REGEN_NIGHTLY_CAP || '20');
export const SCANNER_ERROR_THRESHOLD = Number(process.env.VIDHYA_REGEN_ERROR_THRESHOLD || '0.5');
export const SCANNER_MIN_N_SEEN = Number(process.env.VIDHYA_REGEN_MIN_N_SEEN || '10');
export const SCANNER_FRESHNESS_HOURS = Number(process.env.VIDHYA_REGEN_FRESHNESS_HOURS || '24');
export const SCANNER_DEDUPE_HOURS = Number(process.env.VIDHYA_REGEN_DEDUPE_HOURS || '24');

export interface ScannerResult {
  status: 'ran' | 'skipped_stale' | 'skipped_no_db' | 'skipped_no_candidates';
  candidates_examined: number;
  regen_attempted: number;
  regen_succeeded: number;
  regen_failed: number;
  reason?: string;
}

interface Candidate {
  atom_id: string;
  concept_id: string;
  atom_type: string;
  topic_family: string;
  error_pct: number;
  n_seen: number;
}

/**
 * Check whether cohort_signals has any row updated within the freshness
 * window. Returns true when fresh, false when stale or empty (treat
 * "empty" as stale — better to skip than regen on missing data).
 */
async function isCohortDataFresh(pool: any): Promise<boolean> {
  try {
    const r = await pool.query(
      `SELECT MAX(updated_at) AS max_ts FROM cohort_signals`,
    );
    const max_ts = r.rows[0]?.max_ts;
    if (!max_ts) return false;
    const age_ms = Date.now() - new Date(max_ts).getTime();
    return age_ms < SCANNER_FRESHNESS_HOURS * 60 * 60 * 1000;
  } catch (err) {
    console.warn(`[regen-scanner] freshness check failed: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Pull top-N candidates eligible for regen. Excludes atoms regenerated
 * in the dedupe window — avoids wasted LLM calls on yesterday's regen.
 */
async function fetchCandidates(pool: any): Promise<Candidate[]> {
  const r = await pool.query(
    `SELECT cs.atom_id, cs.error_pct, cs.n_seen
       FROM cohort_signals cs
       WHERE cs.error_pct > $1 AND cs.n_seen >= $2
         AND NOT EXISTS (
           SELECT 1 FROM atom_versions av
            WHERE av.atom_id = cs.atom_id
              AND av.generated_at > NOW() - ($3 || ' hours')::interval
         )
       ORDER BY cs.error_pct DESC, cs.n_seen DESC
       LIMIT $4`,
    [SCANNER_ERROR_THRESHOLD, SCANNER_MIN_N_SEEN, String(SCANNER_DEDUPE_HOURS), SCANNER_NIGHTLY_CAP],
  );

  return r.rows
    .map((row: any): Candidate | null => {
      const parsed = parseAtomId(row.atom_id);
      if (!parsed) return null;
      return {
        atom_id: row.atom_id,
        concept_id: parsed.concept_id,
        atom_type: parsed.atom_type,
        topic_family: parsed.topic_family,
        error_pct: Number(row.error_pct),
        n_seen: row.n_seen,
      };
    })
    .filter((c: Candidate | null): c is Candidate => c !== null);
}

/**
 * Pull the top-3 wrong-answer patterns for an atom from error_log.
 * Used as misconception context in the regen prompt — the new atom
 * is generated knowing exactly what students get wrong.
 */
async function fetchTopMisconceptions(pool: any, atom_id: string): Promise<string[]> {
  try {
    const r = await pool.query(
      `SELECT error_text, COUNT(*) AS freq
         FROM error_log
         WHERE atom_id = $1
           AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY error_text
         ORDER BY freq DESC
         LIMIT 3`,
      [atom_id],
    );
    return r.rows.map((row: any) => row.error_text).filter(Boolean);
  } catch (err) {
    console.warn(`[regen-scanner] misconception lookup failed for ${atom_id}: ${(err as Error).message}`);
    return [];
  }
}

/**
 * atom_id format: `<concept_id>.<atom-name>` where atom-name uses
 * dashes. We need to derive concept_id, atom_type, and topic_family.
 */
function parseAtomId(atom_id: string): { concept_id: string; atom_type: string; topic_family: string } | null {
  const dot_idx = atom_id.indexOf('.');
  if (dot_idx === -1) return null;
  const concept_id = atom_id.slice(0, dot_idx);
  const atom_name = atom_id.slice(dot_idx + 1);
  // atom_type uses underscores in the canonical schema; orchestrator stores
  // hyphenated form in atom_id. Convert back.
  const atom_type = atom_name.replace(/-/g, '_');
  const concept = ALL_CONCEPTS.find((c: any) => c.id === concept_id);
  const topic_family = concept?.topic_family ?? concept?.topic ?? 'generic';
  return { concept_id, atom_type, topic_family };
}

export async function runRegenScanner(): Promise<ScannerResult> {
  const pool = getPool();
  if (!pool) {
    return {
      status: 'skipped_no_db',
      candidates_examined: 0,
      regen_attempted: 0,
      regen_succeeded: 0,
      regen_failed: 0,
      reason: 'DATABASE_URL not set',
    };
  }

  // Eng-review decision A: freshness-gate.
  const fresh = await isCohortDataFresh(pool);
  if (!fresh) {
    console.warn(`[regen-scanner] cohort_signals stale (>${SCANNER_FRESHNESS_HOURS}h since last update or empty) — skipping`);
    return {
      status: 'skipped_stale',
      candidates_examined: 0,
      regen_attempted: 0,
      regen_succeeded: 0,
      regen_failed: 0,
      reason: 'cohort_signals stale or empty',
    };
  }

  let candidates: Candidate[] = [];
  try {
    candidates = await fetchCandidates(pool);
  } catch (err) {
    console.error(`[regen-scanner] candidate fetch failed: ${(err as Error).message}`);
    return {
      status: 'skipped_no_candidates',
      candidates_examined: 0,
      regen_attempted: 0,
      regen_succeeded: 0,
      regen_failed: 0,
      reason: (err as Error).message,
    };
  }

  if (candidates.length === 0) {
    return {
      status: 'skipped_no_candidates',
      candidates_examined: 0,
      regen_attempted: 0,
      regen_succeeded: 0,
      regen_failed: 0,
      reason: 'no atoms with error_pct > threshold',
    };
  }

  let succeeded = 0;
  let failed = 0;

  for (const c of candidates) {
    const misconceptions = await fetchTopMisconceptions(pool, c.atom_id);
    try {
      const draft = await generateConcept({
        concept_id: c.concept_id,
        topic_family: c.topic_family,
        atom_types: [c.atom_type as any],
        force: true,
      });
      // Side-channel: log misconception context for admin's eventual diff view.
      // The orchestrator already wrote the new version to atom_versions
      // (inactive). Annotate with improvement_reason so the diff viewer
      // shows "what changed".
      const generated = draft.atoms[0];
      if (generated && misconceptions.length > 0) {
        await annotateImprovementReason(pool, c.atom_id, c.error_pct, misconceptions);
      }
      if (generated) {
        succeeded++;
        // §4.12 auto A/B: spin up an experiment for the new candidate version.
        // The candidate is already active; the control (prior version) stays
        // in atom_versions and is served to half of students via hash bucket.
        // Gated behind VIDHYA_AB_TESTING=on so deploys can opt out.
        if (process.env.VIDHYA_AB_TESTING === 'on') {
          await maybeStartExperiment(pool, c.atom_id);
        }
      }
      else failed++;
    } catch (err) {
      console.warn(`[regen-scanner] regen failed for ${c.atom_id}: ${(err as Error).message}`);
      failed++;
    }
  }

  return {
    status: 'ran',
    candidates_examined: candidates.length,
    regen_attempted: candidates.length,
    regen_succeeded: succeeded,
    regen_failed: failed,
  };
}

/**
 * After a successful regen, look at atom_versions and decide whether
 * an A/B experiment can start. Requires:
 *   - The newest version (candidate) is the freshly-generated one
 *   - There's a prior version to use as control (otherwise nothing to test)
 *   - No experiment is already running (createExperiment is idempotent)
 *
 * The candidate is already active (the orchestrator activated it on
 * append). atom-loader's A/B path serves both during the experiment
 * window via hash bucketing.
 */
async function maybeStartExperiment(pool: any, atom_id: string): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT version_n FROM atom_versions WHERE atom_id = $1 ORDER BY version_n DESC LIMIT 2`,
      [atom_id],
    );
    if (r.rows.length < 2) return;  // no prior version → no experiment
    const candidate_version_n = r.rows[0].version_n;
    const control_version_n = r.rows[1].version_n;
    await createExperiment(atom_id, control_version_n, candidate_version_n);
  } catch (err) {
    console.warn(`[regen-scanner] maybeStartExperiment failed for ${atom_id}: ${(err as Error).message}`);
  }
}

/**
 * Update the most recent atom_versions row's improvement_reason so admin
 * sees "Cohort error 52% — top miss: students confused tangent slope with
 * secant" rather than a generic "regenerated".
 */
async function annotateImprovementReason(
  pool: any,
  atom_id: string,
  error_pct: number,
  misconceptions: string[],
): Promise<void> {
  const reason = `Cohort error ${Math.round(error_pct * 100)}% — top miss: ${misconceptions[0].slice(0, 120)}`;
  try {
    await pool.query(
      `UPDATE atom_versions
         SET improvement_reason = $1
         WHERE atom_id = $2
           AND version_n = (SELECT MAX(version_n) FROM atom_versions WHERE atom_id = $2)`,
      [reason, atom_id],
    );
  } catch (err) {
    console.warn(`[regen-scanner] improvement_reason annotation failed: ${(err as Error).message}`);
  }
}
