// @ts-nocheck
/**
 * src/jobs/scheduler.ts
 *
 * Owning agent: task-manager (COO side).
 *
 * Minimal in-process scheduler for periodic hygiene tasks. Runs
 * inside the server process — single-instance deploys only (the
 * flat-file store has the same constraint anyway).
 *
 * For multi-instance deploys, replace with Render Cron Jobs or
 * equivalent out-of-process scheduling.
 *
 * Jobs registered here:
 *   - finaliseExpiredDeletions  hourly (PENDING.md §1.3)
 *   - healthScan                every 5 min (PENDING.md §13.3)
 *
 * Each job is:
 *   - isolated (a failure in one doesn't affect others)
 *   - logged (visible in server stdout)
 *   - skippable via VIDHYA_DISABLE_SCHEDULER=1 (useful in tests)
 */

import { finaliseExpiredDeletions } from '../data-rights/delete';
import { runCohortAggregator } from './cohort-aggregator';
import { runRegenScanner } from './regen-scanner';

const HOUR_MS = 60 * 60 * 1000;
const FIVE_MIN_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type JobHandle = {
  name: string;
  intervalMs: number;
  fn: () => Promise<any> | any;
  lastRun?: string;
  lastOk?: boolean;
  lastError?: string;
};

const jobs: JobHandle[] = [];
const handles: NodeJS.Timeout[] = [];
let _started = false;

function register(name: string, intervalMs: number, fn: () => Promise<any> | any): void {
  jobs.push({ name, intervalMs, fn });
}

// ─── Job definitions ─────────────────────────────────────────────────

register('finaliseExpiredDeletions', HOUR_MS, () => {
  // Finalises any soft-deleted users whose 24h cooling period elapsed.
  // Bounded-size work — iterates users.json once per tick.
  const r = finaliseExpiredDeletions();
  return r;
});

register('healthScan', FIVE_MIN_MS, async () => {
  // Runs the orchestrator health probes periodically so degraded
  // states surface in logs even when no admin is hitting the endpoint.
  // Lazy import so the scheduler doesn't create a hard dependency on
  // orchestrator module loading at boot.
  const { computeOrgHealth } = await import('../orchestrator/health');
  const r = await computeOrgHealth();
  if (!r.ok) {
    console.error(`[scheduler] health scan degraded: ${r.summary.unavailable} unavailable, ${r.summary.degraded} degraded`);
  }
  return r.summary;
});

register('cohortAggregator', DAY_MS, async () => {
  // Nightly: roll up atom_engagements into cohort_signals so common_traps
  // cards can render "X% miss this on the practice problem" callouts.
  // Idempotent — safe if it overlaps a prior run.
  const r = await runCohortAggregator();
  return r;
});

register('regenScanner', DAY_MS, async () => {
  // Nightly: read cohort_signals (populated by cohortAggregator above),
  // pick atoms with error_pct > 0.5, regenerate them with the misconception
  // baked into the prompt. Freshness-gates on cohort_signals to avoid
  // regenerating on stale data when cohortAggregator runs late or fails.
  // Gated behind VIDHYA_CONCEPT_ORCHESTRATOR — when off, skipped silently.
  if (process.env.VIDHYA_CONCEPT_ORCHESTRATOR !== 'on') {
    return { status: 'skipped', reason: 'concept orchestrator not enabled' };
  }
  const r = await runRegenScanner();
  return r;
});

// ─── Lifecycle ───────────────────────────────────────────────────────

export function startScheduler(opts?: { silent?: boolean }): void {
  if (_started) return;
  if (process.env.VIDHYA_DISABLE_SCHEDULER === '1') {
    if (!opts?.silent) console.log('[scheduler] disabled via VIDHYA_DISABLE_SCHEDULER=1');
    return;
  }
  for (const j of jobs) {
    const h = setInterval(() => runJob(j), j.intervalMs);
    // Let the node process exit cleanly even with scheduler running
    if (typeof (h as any).unref === 'function') (h as any).unref();
    handles.push(h);
    if (!opts?.silent) console.log(`[scheduler] registered ${j.name} (every ${j.intervalMs / 1000}s)`);
  }
  _started = true;
}

export function stopScheduler(): void {
  for (const h of handles) clearInterval(h);
  handles.length = 0;
  _started = false;
}

async function runJob(j: JobHandle): Promise<void> {
  try {
    const result = await j.fn();
    j.lastRun = new Date().toISOString();
    j.lastOk = true;
    j.lastError = undefined;
    if (result && typeof result === 'object' && 'finalised' in result && result.finalised > 0) {
      console.log(`[scheduler] ${j.name}: finalised ${result.finalised} expired deletion(s)`);
    }
  } catch (e: any) {
    j.lastRun = new Date().toISOString();
    j.lastOk = false;
    j.lastError = e?.message ?? String(e);
    console.error(`[scheduler] ${j.name} failed: ${j.lastError}`);
  }
}

/** Report on scheduler state for /api/orchestrator/jobs */
export function jobStatus(): Array<{
  name: string;
  intervalMs: number;
  lastRun?: string;
  lastOk?: boolean;
  lastError?: string;
}> {
  return jobs.map(j => ({
    name: j.name,
    intervalMs: j.intervalMs,
    lastRun: j.lastRun,
    lastOk: j.lastOk,
    lastError: j.lastError,
  }));
}

/** Exposed for tests — run a named job once, synchronously. */
export async function runJobOnce(name: string): Promise<void> {
  const j = jobs.find(x => x.name === name);
  if (!j) throw new Error(`job not found: ${name}`);
  await runJob(j);
}
