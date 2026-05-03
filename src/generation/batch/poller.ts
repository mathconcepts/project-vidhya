/**
 * src/generation/batch/poller.ts
 *
 * The shared "drive every in-flight run forward" entry point. Used by:
 *   - server boot (resumeAllInFlightBatches): one pass after migrations,
 *     before accepting traffic
 *   - scheduler (cron): every 5 min while the server is alive
 *
 * Both paths use the SAME code. The only difference is when they run.
 *
 * DB-less safe: when DATABASE_URL is unset, the persistence layer's
 * listInFlightRuns returns empty and this becomes a clean no-op.
 */

import { createBatchOrchestrator, type StepResult } from './orchestrator';
import { createGeminiBatchAdapter } from './gemini-adapter';
import { createPgPersistence } from './pg-persistence';

// Single shared orchestrator per process — adapter + persistence are
// safe to share across calls.
let _orch: ReturnType<typeof createBatchOrchestrator> | null = null;

function getOrchestrator() {
  if (_orch) return _orch;
  _orch = createBatchOrchestrator({
    persistence: createPgPersistence(),
    adapter: createGeminiBatchAdapter(),
    onJobProcessed: async (run_id, job) => {
      // Downstream ingestion hook lives here. PR-A4 (or a follow-up) will
      // wire this into the existing canonical-flag + atom_versions pipeline.
      // For now we no-op so the per-row processed_at write happens
      // without requiring downstream behaviour to land first. The result
      // is durably persisted in batch_jobs.result either way.
      void run_id; void job;
    },
  });
  return _orch;
}

/**
 * One pass: drive every in-flight run forward by one step.
 * Returns a per-run summary.
 */
export async function pollAllInFlightBatches(): Promise<Array<{ run_id: string; result: StepResult }>> {
  return await getOrchestrator().pollAllInFlight();
}

/**
 * Boot-time entry point. Identical to pollAllInFlightBatches but with a
 * distinct name + log line so the boot pass is visible in server logs.
 */
export async function resumeAllInFlightBatches(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log('[batch-poller] resume skipped — DATABASE_URL unset');
    return;
  }
  try {
    const out = await pollAllInFlightBatches();
    if (out.length === 0) {
      console.log('[batch-poller] boot resume: no in-flight runs');
      return;
    }
    for (const r of out) {
      console.log(`[batch-poller] boot resume: run=${r.run_id} → ${JSON.stringify(r.result)}`);
    }
  } catch (err) {
    // Never block boot. The cron poller will try again in 5 min.
    console.error(`[batch-poller] boot resume errored: ${(err as Error).message}`);
  }
}

/**
 * Operator-driven abort, dispatched from admin UI.
 */
export async function abortBatchRun(run_id: string, reason?: string): Promise<void> {
  await getOrchestrator().abort(run_id, reason);
}
