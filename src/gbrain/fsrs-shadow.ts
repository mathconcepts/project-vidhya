/**
 * src/gbrain/fsrs-shadow.ts — Wave 12: FSRS shadow mode (A7 §4 step 1).
 *
 * The A7 mapping spec (docs/A7-fsrs-mapping-spec.md, signed off) requires
 * one release of SHADOW MODE before the live schedulers move off SM-2:
 * both SM-2 sites keep persisting SM-2 exactly as before, while this
 * module computes what FSRS WOULD have scheduled and logs the delta to
 * `fsrs_shadow_log` (migration 034). Exit criterion for the swap:
 * median |due delta| ≤ 1 day over ≥ 200 review events
 * (GET /api/admin/fsrs-shadow surfaces this).
 *
 * Everything here is read-only with respect to student-visible state.
 * Logging is fire-and-forget; DB-less deploys no-op silently. A shadow
 * failure must never break a lesson or retention write.
 */

import pg from 'pg';
import {
  initCard,
  reviewCard,
  intervalForRetention,
  type FsrsCard,
  type Rating,
} from './fsrs';

const { Pool } = pg;

// ────────────────────────────────────────────────────────────────────
// A7 §2 — quality → rating
// ────────────────────────────────────────────────────────────────────

export type ShadowSite = 'lessons' | 'retention';

/**
 * Map an SM-2 quality to an FSRS rating per the A7 §2 table.
 *   retention scale (0–5): 0–1→again, 2→hard, 3–4→good, 5→easy
 *   lessons scale (0–4):   0–1→again, 2→hard, 3–4→good  (no easy — the
 *     lessons scheduler caps at 4 because unspaced "perfect" isn't
 *     evidence of ease; A7 keeps that conservatism)
 */
export function ratingFromQuality(quality: number, scale: ShadowSite): Rating {
  const q = Math.round(quality);
  if (q <= 1) return 1;
  if (q === 2) return 2;
  if (scale === 'retention' && q >= 5) return 4;
  return 3;
}

// ────────────────────────────────────────────────────────────────────
// A7 §3 — (interval, ease) → (stability, difficulty)
// ────────────────────────────────────────────────────────────────────

/** stability ← interval days, floored at 0.5 (A7 §3). */
export function stabilityFromInterval(intervalDays: number): number {
  return Math.max(0.5, intervalDays);
}

/** difficulty ← clamp(11 − 2.8·ease, 1, 10) (A7 §3; ease 2.5 → ≈4). */
export function difficultyFromEase(easeFactor: number): number {
  return Math.min(10, Math.max(1, 11 - 2.8 * easeFactor));
}

export interface Sm2PriorState {
  intervalDays: number;
  easeFactor: number;
  lastReviewedAt: string;   // ISO
  reps: number;
}

/**
 * Build the FSRS card an existing SM-2 record migrates to (A7 §3).
 * Because stability ← interval and intervalForRetention(s, 0.9) ≡ s by
 * the FSRS_FACTOR normalization, the migrated card is due within ±1 day
 * of the SM-2 due date — the "no review-queue jump" acceptance property
 * (tested in fsrs-shadow.test.ts).
 */
export function cardFromSm2(prior: Sm2PriorState): FsrsCard {
  const stability = stabilityFromInterval(prior.intervalDays);
  const due = new Date(prior.lastReviewedAt);
  due.setDate(due.getDate() + Math.max(1, Math.round(intervalForRetention(stability))));
  return {
    stability,
    difficulty: difficultyFromEase(prior.easeFactor),
    lastReviewAt: prior.lastReviewedAt,
    reps: Math.max(0, prior.reps),
    lapses: 0,   // SM-2 kept no lapse history worth trusting (A7 §3)
    dueAt: due.toISOString(),
  };
}

/**
 * What FSRS would schedule for this review. New items (no prior SM-2
 * state) go through initCard; existing ones migrate per §3 then review.
 */
export function shadowNextDue(args: {
  prior: Sm2PriorState | null;
  quality: number;
  scale: ShadowSite;
  now?: Date;
}): { fsrsDueAt: string; rating: Rating } {
  const now = args.now ?? new Date();
  const rating = ratingFromQuality(args.quality, args.scale);
  if (!args.prior || args.prior.intervalDays <= 0) {
    return { fsrsDueAt: initCard(rating, now).dueAt, rating };
  }
  const { card } = reviewCard(cardFromSm2(args.prior), rating, now);
  return { fsrsDueAt: card.dueAt, rating };
}

// ────────────────────────────────────────────────────────────────────
// Shadow log (migration 034) — fire-and-forget, DB-less no-op
// ────────────────────────────────────────────────────────────────────

let _pool: pg.Pool | null | undefined;

function getPool(): pg.Pool | null {
  if (_pool !== undefined) return _pool;
  const cs = process.env.DATABASE_URL;
  _pool = cs ? new Pool({ connectionString: cs, max: 2 }) : null;
  return _pool;
}

/** Test hook. */
export function resetShadowPoolForTests(): void {
  _pool = undefined;
}

export interface ShadowEvent {
  site: ShadowSite;
  studentId: string;
  itemKey: string;
  quality: number;
  rating: Rating;
  sm2DueAt: string;    // ISO — what actually got scheduled
  fsrsDueAt: string;   // ISO — what FSRS would have scheduled
}

/**
 * Log one shadow comparison. NEVER throws; NEVER awaited by callers on
 * the hot path. Returns a promise only so tests can settle it.
 */
export async function logShadowEvent(ev: ShadowEvent): Promise<void> {
  const pool = getPool();
  if (!pool) return;   // DB-less: shadow mode simply collects nothing
  const deltaDays =
    (new Date(ev.fsrsDueAt).getTime() - new Date(ev.sm2DueAt).getTime()) / 86_400_000;
  try {
    await pool.query(
      `INSERT INTO fsrs_shadow_log
         (site, student_id, item_key, quality, rating, sm2_due, fsrs_due, delta_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ev.site, ev.studentId, ev.itemKey, Math.round(ev.quality), ev.rating,
       ev.sm2DueAt, ev.fsrsDueAt, deltaDays],
    );
  } catch (err) {
    console.error('[fsrs-shadow] log failed (non-fatal):', (err as Error).message);
  }
}

/** Convenience for the two call sites: compute shadow + log, one call. */
export function recordShadow(args: {
  site: ShadowSite;
  studentId: string;
  itemKey: string;
  prior: Sm2PriorState | null;
  quality: number;
  sm2DueAt: string;
  now?: Date;
}): void {
  try {
    const { fsrsDueAt, rating } = shadowNextDue({
      prior: args.prior, quality: args.quality, scale: args.site, now: args.now,
    });
    void logShadowEvent({
      site: args.site, studentId: args.studentId, itemKey: args.itemKey,
      quality: args.quality, rating, sm2DueAt: args.sm2DueAt, fsrsDueAt,
    });
  } catch (err) {
    console.error('[fsrs-shadow] shadow computation failed (non-fatal):', (err as Error).message);
  }
}

// ────────────────────────────────────────────────────────────────────
// A7 §4 exit-criterion readout
// ────────────────────────────────────────────────────────────────────

export interface ShadowSummary {
  events: number;
  median_abs_delta_days: number | null;
  p90_abs_delta_days: number | null;
  by_site: Record<string, { events: number; median_abs_delta_days: number | null }>;
  exit_criterion_met: boolean;   // median ≤ 1 day over ≥ 200 events
  reason?: string;
}

export async function shadowSummary(): Promise<ShadowSummary> {
  const empty: ShadowSummary = {
    events: 0, median_abs_delta_days: null, p90_abs_delta_days: null,
    by_site: {}, exit_criterion_met: false,
  };
  const pool = getPool();
  if (!pool) return { ...empty, reason: 'DB-less deploy — no shadow data collected' };
  try {
    const overall = await pool.query(
      `SELECT COUNT(*)::int AS events,
              percentile_cont(0.5) WITHIN GROUP (ORDER BY ABS(delta_days)) AS median,
              percentile_cont(0.9) WITHIN GROUP (ORDER BY ABS(delta_days)) AS p90
         FROM fsrs_shadow_log`,
    );
    const bySite = await pool.query(
      `SELECT site, COUNT(*)::int AS events,
              percentile_cont(0.5) WITHIN GROUP (ORDER BY ABS(delta_days)) AS median
         FROM fsrs_shadow_log GROUP BY site`,
    );
    const events = overall.rows[0]?.events ?? 0;
    const median = overall.rows[0]?.median !== null ? Number(overall.rows[0].median) : null;
    return {
      events,
      median_abs_delta_days: median,
      p90_abs_delta_days: overall.rows[0]?.p90 !== null ? Number(overall.rows[0].p90) : null,
      by_site: Object.fromEntries(bySite.rows.map((r: any) => [r.site, {
        events: r.events,
        median_abs_delta_days: r.median !== null ? Number(r.median) : null,
      }])),
      exit_criterion_met: events >= 200 && median !== null && median <= 1,
    };
  } catch (err) {
    return { ...empty, reason: `query failed: ${(err as Error).message}` };
  }
}
