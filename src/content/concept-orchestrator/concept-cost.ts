// @ts-nocheck
/**
 * concept-cost.ts — per-concept LLM/Wolfram spend tracking + cap (E8).
 *
 * Extends the existing per-user budget (lib/llm-budget.ts) with concept-scoped
 * tracking. Admin sees "calculus-derivatives: $0.84/$10 this month" before
 * clicking regen; the orchestrator soft-warns at 80% of cap and hard-stops
 * at 100%.
 *
 * Graceful degradation when DB is unavailable: returns "ok, $0 spent" so
 * dev/free-tier deploys can still run the orchestrator. Cap enforcement
 * is a no-op without persistence.
 */

import pg from 'pg';

const { Pool } = pg;
let _pool: any = null;
function getPool() {
  if (_pool) return _pool;
  if (!process.env.DATABASE_URL) return null;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  return _pool;
}

export const DEFAULT_MONTHLY_CAP_USD = Number(
  process.env.VIDHYA_CONCEPT_MONTHLY_CAP_USD || '10',
);

export interface CostState {
  concept_id: string;
  month_start: string; // YYYY-MM-01
  spent_usd: number;
  cap_usd: number;
  /** 0..1 of cap consumed. */
  utilization: number;
  /** True when spent >= cap. */
  exhausted: boolean;
  /** True when spent >= 0.8 * cap. */
  near_limit: boolean;
}

function monthStart(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/**
 * Read current spend for a concept this month. Always returns a state —
 * when DB unavailable, returns zeros (caller treats as not-exhausted).
 */
export async function readState(
  concept_id: string,
  cap_usd: number = DEFAULT_MONTHLY_CAP_USD,
): Promise<CostState> {
  const month = monthStart();
  const pool = getPool();
  let spent = 0;
  if (pool) {
    try {
      const r = await pool.query(
        'SELECT usd_estimate FROM concept_cost_log WHERE concept_id = $1 AND month_start = $2',
        [concept_id, month],
      );
      if (r.rows[0]) spent = Number(r.rows[0].usd_estimate);
    } catch (err) {
      console.warn(`[concept-cost] read failed for ${concept_id}: ${(err as Error).message}`);
    }
  }
  const utilization = cap_usd > 0 ? spent / cap_usd : 0;
  return {
    concept_id,
    month_start: month,
    spent_usd: spent,
    cap_usd,
    utilization,
    exhausted: spent >= cap_usd,
    near_limit: utilization >= 0.8,
  };
}

/**
 * Atomically add spend to the concept's monthly bucket. Returns the
 * new state. No-op when DB unavailable.
 */
export async function recordSpend(
  concept_id: string,
  delta_usd: number,
  meta?: { llm_tokens?: number; wolfram_calls?: number },
): Promise<CostState> {
  if (delta_usd <= 0) return readState(concept_id);
  const month = monthStart();
  const pool = getPool();
  if (!pool) {
    return readState(concept_id);
  }
  try {
    await pool.query(
      `INSERT INTO concept_cost_log (concept_id, month_start, llm_tokens, wolfram_calls, usd_estimate, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (concept_id, month_start) DO UPDATE
           SET llm_tokens = concept_cost_log.llm_tokens + EXCLUDED.llm_tokens,
               wolfram_calls = concept_cost_log.wolfram_calls + EXCLUDED.wolfram_calls,
               usd_estimate = concept_cost_log.usd_estimate + EXCLUDED.usd_estimate,
               updated_at = NOW()`,
      [concept_id, month, meta?.llm_tokens ?? 0, meta?.wolfram_calls ?? 0, delta_usd],
    );
  } catch (err) {
    console.warn(`[concept-cost] record failed for ${concept_id}: ${(err as Error).message}`);
  }
  return readState(concept_id);
}

/**
 * Check whether a generation should proceed. Returns `false` when the
 * concept's spend has hit the cap.
 */
export async function canSpend(
  concept_id: string,
  cap_usd: number = DEFAULT_MONTHLY_CAP_USD,
): Promise<{ allowed: boolean; state: CostState }> {
  const state = await readState(concept_id, cap_usd);
  return { allowed: !state.exhausted, state };
}
