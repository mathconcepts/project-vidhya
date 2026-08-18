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
import type { JobRow } from './persistence';
import { getRun } from '../run-orchestrator';
import { dispatchPracticeItemJob } from '../practice-item-factory/batch-dispatch';
import { practiceItemBankPath, writePracticeItemBank } from '../practice-item-factory/writer';

/**
 * Minimal shape `handleJobProcessed` needs from a GenerationRunRow — kept
 * narrow (rather than importing the full row type) so the dependency is
 * easy to fake in tests.
 */
export interface RunLookupResult {
  exam_pack_id: string;
  config: { target?: { practice_item_specs?: unknown[] } };
}

export interface JobProcessedDeps {
  getRun: (run_id: string) => Promise<RunLookupResult | null>;
  dispatchPracticeItemJob: typeof dispatchPracticeItemJob;
  writePracticeItemBank: typeof writePracticeItemBank;
}

const defaultJobProcessedDeps: JobProcessedDeps = {
  getRun,
  dispatchPracticeItemJob,
  writePracticeItemBank,
};

/**
 * Run-type dispatch (T7/E9 — docs/designs/linear-algebra-realtime-and-
 * math-academy-plan.md). `AtomSpec` carries no output-kind discriminator,
 * so the decision is made at the RUN level: look up the run's config and
 * check for `target.practice_item_specs` — present ⇒ every job in this
 * run is a practice item, routed through parse → assemble → verify →
 * write (src/generation/practice-item-factory/batch-dispatch.ts). Absent
 * (or the run can't be resolved at all, e.g. DB-less) ⇒ unchanged atom
 * no-op — downstream atom ingestion is a separate, already-wired path.
 *
 * Exported + dependency-injectable so tests exercise the routing
 * decision and both outcome branches without a real DB, a real batch
 * orchestrator, or any network call.
 */
export async function handleJobProcessed(
  run_id: string,
  job: JobRow,
  deps: JobProcessedDeps = defaultJobProcessedDeps,
): Promise<void> {
  let examPackId: string | undefined;
  let practiceItemSpecs: unknown;
  try {
    const run = await deps.getRun(run_id);
    examPackId = run?.exam_pack_id;
    practiceItemSpecs = run?.config?.target?.practice_item_specs;
  } catch (err) {
    // Never let a run-lookup failure (DB hiccup, etc.) crash ingestion —
    // fall back to the safe default (atom no-op) and let the operator see
    // it in logs rather than losing the whole poll pass.
    console.warn(
      `[batch-poller] could not resolve run config for run=${run_id}, treating as atom (no-op): ${(err as Error).message}`,
    );
  }

  if (!Array.isArray(practiceItemSpecs) || practiceItemSpecs.length === 0) {
    // Atom-mode job: existing no-op. The per-row processed_at write
    // already happened via the orchestrator; downstream atom ingestion
    // (atom_versions etc.) is a separate, already-wired pipeline.
    return;
  }

  const result = await deps.dispatchPracticeItemJob(job.atom_spec, job.result);
  const logPrefix = `[batch-poller] practice-item run=${run_id} concept=${job.atom_spec.concept_id}`;

  switch (result.outcome) {
    case 'written': {
      if (!examPackId || !result.spec || !result.item) {
        // Should be unreachable (written implies both), but never write a
        // bank entry we can't correctly path — refuse loudly instead.
        console.error(`${logPrefix}: outcome=written but missing exam_pack_id/spec/item — dropping, not writing`);
        return;
      }
      const bankPath = practiceItemBankPath(examPackId, result.spec.topic);
      deps.writePracticeItemBank(bankPath, [result.item]);
      console.log(`${logPrefix}: wrote ${result.item.id} → ${bankPath} (${result.reason})`);
      return;
    }
    case 'refused':
      console.warn(`${logPrefix}: refused — ${result.reason}`);
      return;
    case 'parse_failed':
      console.warn(`${logPrefix}: parse failed — ${result.reason}`);
      return;
    case 'pending_retry':
      console.log(`${logPrefix}: pending retry — ${result.reason}`);
      return;
  }
}

// Single shared orchestrator per process — adapter + persistence are
// safe to share across calls.
let _orch: ReturnType<typeof createBatchOrchestrator> | null = null;

function getOrchestrator() {
  if (_orch) return _orch;
  _orch = createBatchOrchestrator({
    persistence: createPgPersistence(),
    adapter: createGeminiBatchAdapter(),
    onJobProcessed: async (run_id, job) => {
      try {
        await handleJobProcessed(run_id, job);
      } catch (err) {
        // Ingestion must never take down the poll loop — the per-row
        // processed_at write already happened; a failure here is logged
        // and the job is simply not written to a bank this pass.
        console.error(`[batch-poller] onJobProcessed failed for run=${run_id} custom_id=${job.custom_id}: ${(err as Error).message}`);
      }
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
