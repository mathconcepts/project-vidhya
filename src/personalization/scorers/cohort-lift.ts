/**
 * Cohort-lift scorer (Layer 3, weight 0.30).
 *
 * Reads cohort_signals (populated nightly by src/jobs/cohort-aggregator.ts)
 * to favor atoms that the broader cohort has performed WELL on (low error_pct,
 * sufficient n_seen). Atoms with canonical=TRUE on atom_versions get a +0.2
 * boost — those have been promoted by the learnings ledger after winning
 * an experiment.
 *
 * Stale-signal decay: signals older than 7 days contribute linearly less.
 * 7+ days old → 0 (not a "wrong" signal, just an absent one).
 *
 * Reads from existing tables only. No writes. DB-less safe.
 */

import pg from 'pg';
import type { AtomShape, RankingContext } from '../types';

const { Pool } = pg;
let _pool: pg.Pool | null = null;
function getPool(): pg.Pool | null {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  return _pool;
}

const STALE_DAYS = 7;
const MIN_N_SEEN = 5;
const CANONICAL_BOOST = 0.20;

interface SignalRow {
  atom_id: string;
  error_pct: number | null;
  n_seen: number | null;
  computed_at: string | null;
  canonical: boolean;
}

export async function scoreByCohortLift(
  atoms: AtomShape[],
  _ctx: RankingContext,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (atoms.length === 0) return out;

  const pool = getPool();
  if (!pool) {
    for (const a of atoms) out.set(a.id, 0);
    return out;
  }

  const ids = atoms.map((a) => a.id);
  let rows: SignalRow[] = [];
  try {
    const r = await pool.query<SignalRow>(
      `SELECT cs.atom_id,
              cs.error_pct,
              cs.n_seen,
              cs.computed_at::TEXT AS computed_at,
              COALESCE(av.canonical, FALSE) AS canonical
         FROM cohort_signals cs
         LEFT JOIN atom_versions av
           ON av.atom_id = cs.atom_id AND av.active = TRUE
        WHERE cs.atom_id = ANY($1::TEXT[])`,
      [ids],
    );
    rows = r.rows;
  } catch {
    // Table missing or query error → all atoms score 0 for this layer
    for (const a of atoms) out.set(a.id, 0);
    return out;
  }

  const byAtom = new Map<string, SignalRow>();
  for (const row of rows) byAtom.set(row.atom_id, row);

  const now = Date.now();
  for (const a of atoms) {
    const sig = byAtom.get(a.id);
    if (!sig || sig.error_pct == null || sig.n_seen == null) {
      out.set(a.id, 0);
      continue;
    }
    if (sig.n_seen < MIN_N_SEEN) {
      // Tiny signal — too noisy to act on; neutral.
      out.set(a.id, 0);
      continue;
    }

    // base: 1 - error_pct (so low error → high score)
    let base = Math.max(0, 1 - sig.error_pct);

    // staleness decay
    const ageDays = sig.computed_at
      ? (now - Date.parse(sig.computed_at)) / 86_400_000
      : 999;
    if (ageDays > STALE_DAYS) {
      out.set(a.id, 0);
      continue;
    }
    const freshness = Math.max(0, 1 - ageDays / STALE_DAYS);
    base *= freshness;

    if (sig.canonical) base = Math.min(1, base + CANONICAL_BOOST);

    out.set(a.id, base);
  }
  return out;
}
