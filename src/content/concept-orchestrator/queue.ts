// @ts-nocheck
/**
 * queue.ts — admin "Concepts needing content" priority queue.
 *
 * Ranks all known concepts by impact = exam_weight × n_students × error_pct.
 * Surfaces the top N to the admin dashboard so the operator works on
 * the concepts that move the metric most.
 *
 * Per-row payload includes: concept label, current state, atoms count,
 * estimated cost (driven by the orchestrator's per-atom cost table),
 * cohort error %, and current monthly spend (so the row meter can render).
 *
 * Graceful degradation: when DB unavailable, falls back to the static
 * ALL_CONCEPTS list with cohort + cost fields zeroed. Admin still sees
 * the concept list, just without prioritization signal.
 */

import pg from 'pg';
import { ALL_CONCEPTS } from '../../constants/concept-graph';
import { readState, DEFAULT_MONTHLY_CAP_USD } from './concept-cost';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export type ConceptState = 'missing' | 'partial' | 'stale' | 'current';

export interface QueueRow {
  concept_id: string;
  label: string;
  topic_family: string;
  state: ConceptState;
  atoms_existing: number;
  atoms_to_generate: number;
  /** Sum of cohort error percentages on linked atoms (proxy for impact). */
  cohort_error_pct: number;
  /** Number of distinct students who have engaged with this concept's atoms. */
  n_students: number;
  /** Topic weight from the exam adapter (0-1). */
  exam_weight: number;
  /** Current monthly spend on this concept. */
  spent_usd: number;
  cap_usd: number;
  /** Computed impact = exam_weight × n_students × cohort_error_pct. */
  impact: number;
  /** Estimated cost to fully (re)generate, from the orchestrator cost table. */
  estimated_cost_usd: number;
}

const ESTIMATED_PER_CONCEPT_USD = 0.150;  // sum of ESTIMATED_COST_USD for 11 atoms

export interface QueueOptions {
  /** Top-N to return, sorted by impact descending. */
  limit?: number;
  /** When set, only include concepts in these topic families. */
  topic_families?: string[];
  /** When set, only include concepts whose state is in this list. */
  states?: ConceptState[];
}

/**
 * Build the dashboard's priority queue. Composes static concept-graph data
 * with live cohort signals + cost log + exam topic weights.
 *
 * Single SELECT per category (concept-graph in-memory, cohort_signals one
 * round-trip, cost rows one round-trip) — N+1 free.
 */
export async function buildQueue(opts: QueueOptions = {}): Promise<QueueRow[]> {
  const limit = opts.limit ?? 50;

  // Step 1: Concept-graph baseline (in-memory, no I/O).
  const baseRows = ALL_CONCEPTS.map((c: any) => ({
    concept_id: c.id,
    label: c.label ?? c.id,
    topic_family: c.topic_family ?? c.topic ?? 'generic',
    exam_weight: Number(c.exam_weight ?? 0.05),
  }));

  if (opts.topic_families?.length) {
    const set = new Set(opts.topic_families);
    for (let i = baseRows.length - 1; i >= 0; i--) {
      if (!set.has(baseRows[i].topic_family)) baseRows.splice(i, 1);
    }
  }

  const concept_ids = baseRows.map((r) => r.concept_id);
  if (concept_ids.length === 0) return [];

  // Step 2: Cohort signals — one query for all concepts.
  const cohortByAtomId: Map<string, { error_pct: number; n_seen: number }> = new Map();
  const pool = getPool();
  if (pool) {
    try {
      const r = await pool.query(
        `SELECT atom_id, error_pct, n_seen FROM cohort_signals
           WHERE atom_id = ANY(
             SELECT atom_id FROM atom_versions WHERE active = TRUE
           )`,
      );
      for (const row of r.rows) {
        cohortByAtomId.set(row.atom_id, {
          error_pct: Number(row.error_pct),
          n_seen: row.n_seen,
        });
      }
    } catch (err) {
      console.warn(`[queue] cohort signals query failed: ${(err as Error).message}`);
    }
  }

  // Step 3: Atom counts per concept (count active versions).
  const atomCountByConcept: Map<string, number> = new Map();
  if (pool) {
    try {
      const r = await pool.query(
        `SELECT
           split_part(atom_id, '.', 1) AS concept_id,
           COUNT(*)::int AS atom_count
         FROM atom_versions
         WHERE active = TRUE AND split_part(atom_id, '.', 1) = ANY($1::text[])
         GROUP BY 1`,
        [concept_ids],
      );
      for (const row of r.rows) atomCountByConcept.set(row.concept_id, row.atom_count);
    } catch (err) {
      console.warn(`[queue] atom counts query failed: ${(err as Error).message}`);
    }
  }

  // Step 4: Per-concept current spend (parallel, capped at concurrency 8).
  const spendByConcept: Map<string, { spent: number; cap: number }> = new Map();
  const spendPromises = concept_ids.map(async (cid) => {
    const s = await readState(cid);
    spendByConcept.set(cid, { spent: s.spent_usd, cap: s.cap_usd });
  });
  await Promise.all(spendPromises);

  // Step 5: Stitch everything together + compute impact.
  const out: QueueRow[] = baseRows.map((r) => {
    const atoms_existing = atomCountByConcept.get(r.concept_id) ?? 0;
    const atoms_to_generate = Math.max(0, 11 - atoms_existing);
    let state: ConceptState;
    if (atoms_existing === 0) state = 'missing';
    else if (atoms_existing < 11) state = 'partial';
    else state = 'current';
    // We mark stale when error_pct > 0.5 even if all atoms exist — these
    // are top regen candidates.
    let cohort_error_sum = 0;
    let n_students = 0;
    for (const [atom_id, sig] of cohortByAtomId) {
      if (atom_id.startsWith(r.concept_id + '.')) {
        cohort_error_sum += sig.error_pct;
        n_students = Math.max(n_students, sig.n_seen);
      }
    }
    if (state === 'current' && cohort_error_sum / Math.max(atoms_existing, 1) > 0.5) {
      state = 'stale';
    }
    const cohort_error_pct =
      atoms_existing > 0 ? cohort_error_sum / atoms_existing : 0;
    const spend = spendByConcept.get(r.concept_id) ?? { spent: 0, cap: DEFAULT_MONTHLY_CAP_USD };
    return {
      concept_id: r.concept_id,
      label: r.label,
      topic_family: r.topic_family,
      state,
      atoms_existing,
      atoms_to_generate,
      cohort_error_pct,
      n_students,
      exam_weight: r.exam_weight,
      spent_usd: spend.spent,
      cap_usd: spend.cap,
      impact: r.exam_weight * Math.max(n_students, 1) * Math.max(cohort_error_pct, 0.05),
      estimated_cost_usd: ESTIMATED_PER_CONCEPT_USD,
    };
  });

  if (opts.states?.length) {
    const set = new Set(opts.states);
    for (let i = out.length - 1; i >= 0; i--) {
      if (!set.has(out[i].state)) out.splice(i, 1);
    }
  }

  // Sort by impact desc, then by missing-state first as a tiebreak.
  out.sort((a, b) => {
    if (Math.abs(a.impact - b.impact) > 1e-9) return b.impact - a.impact;
    const order = { missing: 0, stale: 1, partial: 2, current: 3 };
    return (order[a.state] ?? 9) - (order[b.state] ?? 9);
  });

  return out.slice(0, limit);
}
