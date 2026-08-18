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
import type { AuthoredItem } from '../../scoring/learning-object-catalog-file';

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
  runCache?: Map<string, RunLookupResult | null>,
  bankAccumulator?: Map<string, AuthoredItem[]>,
): Promise<{ retry?: boolean } | void> {
  let examPackId: string | undefined;
  let practiceItemSpecs: unknown;
  try {
    // T-poller-perf: a poll pass can carry many jobs for the SAME run
    // (every atom/item in one generation batch). Without a cache, each
    // job re-fetches an identical generation_runs row. `runCache` — when
    // threaded in by the caller (see `runOnJobProcessedWithCache` below,
    // scoped to one `pollAllInFlightBatches()` invocation) — makes every
    // job after the first for a given run a free in-memory hit. A failed
    // lookup is deliberately NOT cached, so a transient DB hiccup on job 1
    // doesn't poison every later job in the same pass.
    const run = runCache?.has(run_id) ? runCache.get(run_id)! : await deps.getRun(run_id);
    runCache?.set(run_id, run);
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
      if (bankAccumulator) {
        // T-poller-perf: a poll pass can write many items into the SAME
        // bank file (every item generated for one exam/topic). Queue this
        // item instead of doing a full read-merge-write per item — the
        // caller (`pollAllInFlightBatches`) flushes each accumulated bank
        // exactly once at the end of the pass, via the same atomic
        // write-then-rename `writePracticeItemBank` already uses.
        const list = bankAccumulator.get(bankPath) ?? [];
        list.push(result.item);
        bankAccumulator.set(bankPath, list);
        console.log(`${logPrefix}: queued ${result.item.id} → ${bankPath} (${result.reason}) [flushed at end of pass]`);
      } else {
        // No accumulator threaded in (e.g. a direct/legacy caller) — fall
        // back to the original immediate write, unchanged.
        deps.writePracticeItemBank(bankPath, [result.item]);
        console.log(`${logPrefix}: wrote ${result.item.id} → ${bankPath} (${result.reason})`);
      }
      return;
    }
    case 'refused':
      console.warn(`${logPrefix}: refused — ${result.reason}`);
      return;
    case 'parse_failed':
      console.warn(`${logPrefix}: parse failed — ${result.reason}`);
      return;
    case 'pending_retry':
      // Held for a later sweep, not finished — signal the orchestrator to
      // skip stamping processed_at so this exact job is retried on the
      // next poll pass instead of silently being treated as done forever.
      console.log(`${logPrefix}: pending retry — ${result.reason}`);
      return { retry: true };
  }
}

/**
 * Writes every accumulated bank's items exactly once, via the same
 * atomic write-then-rename `writePracticeItemBank` a per-item write
 * already used. Exported (rather than inlined into `pollAllInFlightBatches`)
 * so the flush step itself is independently testable.
 */
export function flushPracticeItemBankAccumulator(
  accumulator: ReadonlyMap<string, AuthoredItem[]>,
  writeFn: typeof writePracticeItemBank = writePracticeItemBank,
): void {
  for (const [bankPath, items] of accumulator) {
    if (items.length === 0) continue;
    writeFn(bankPath, items);
  }
}

// Single shared orchestrator per process — adapter + persistence are
// safe to share across calls. `_runCacheForCurrentPass` and
// `_bankAccumulatorForCurrentPass` are each scoped to a single
// `pollAllInFlightBatches()` call (set just before, cleared/flushed just
// after) so `handleJobProcessed` can dedupe `getRun` lookups and batch
// bank writes across the many jobs a single pass may process, without the
// orchestrator itself (constructed once, long-lived) needing to know
// about either.
let _orch: ReturnType<typeof createBatchOrchestrator> | null = null;
let _runCacheForCurrentPass: Map<string, RunLookupResult | null> | null = null;
let _bankAccumulatorForCurrentPass: Map<string, AuthoredItem[]> | null = null;

// Red-team fix 2 (INFORMATIONAL): `_runCacheForCurrentPass` and
// `_bankAccumulatorForCurrentPass` above are module-level mutable state,
// shared by every caller of `pollAllInFlightBatches()` — the boot-time
// `resumeAllInFlightBatches()` and the scheduler's 5-min cron tick both
// call it, and a slow pass can still be running when the next cron tick
// fires. Two overlapping passes would each stomp the other's cache/
// accumulator reference in the `finally` block (whichever pass finishes
// first nulls out the slot the other pass is still using), silently
// dropping or duplicating dedup/bank-write state. `_inFlightPollPromise`
// closes that: a second caller while a pass is already running gets the
// SAME promise (awaits the pass already in flight) instead of starting a
// concurrent one, so only one pass ever owns the cache/accumulator slots
// at a time.
let _inFlightPollPromise: Promise<Array<{ run_id: string; result: StepResult }>> | null = null;

function getOrchestrator() {
  if (_orch) return _orch;
  _orch = createBatchOrchestrator({
    persistence: createPgPersistence(),
    adapter: createGeminiBatchAdapter(),
    onJobProcessed: async (run_id, job) => {
      try {
        // Propagate handleJobProcessed's return value (in particular
        // `{ retry: true }` for a pending_retry outcome) so the
        // orchestrator knows to skip the processed_at stamp — see
        // process_()'s doc comment. An unrelated exception below is
        // swallowed exactly as before (never turns into a retry signal;
        // the orchestrator's own catch marks the row's `error` instead).
        return await handleJobProcessed(
          run_id,
          job,
          defaultJobProcessedDeps,
          _runCacheForCurrentPass ?? undefined,
          _bankAccumulatorForCurrentPass ?? undefined,
        );
      } catch (err) {
        // Ingestion must never take down the poll loop — a failure here
        // is logged and the job is simply not written to a bank this
        // pass; it still gets marked processed (unchanged pre-existing
        // behavior for genuine hook failures, distinct from pending_retry).
        console.error(`[batch-poller] onJobProcessed failed for run=${run_id} custom_id=${job.custom_id}: ${(err as Error).message}`);
      }
    },
  });
  return _orch;
}

/**
 * One pass: drive every in-flight run forward by one step.
 * Returns a per-run summary.
 *
 * Bank-write batching note: items queued via the accumulator are flushed
 * to disk once at the END of the pass (in `finally`, so a mid-pass error
 * in one run doesn't lose items already queued for other runs) rather
 * than after each individual job, trading a narrow window — a crash
 * between a job's `processed_at` stamp and the end-of-pass flush would
 * lose that item — for far fewer read-merge-write cycles on hot bank
 * files during a large batch. The next poll pass's `resumeQueuedRuns`-
 * style resilience does not cover this narrow window; it is an accepted
 * trade-off, not an oversight.
 *
 * Reentrancy (red-team fix 2): boot resume and the 5-min cron tick call
 * this same function, and a slow pass can still be running when the next
 * one is triggered. Rather than let two passes each own a `_runCache...`/
 * `_bankAccumulator...` slot and clobber each other, a second call while
 * one is already in flight AWAITS the SAME promise instead of starting a
 * concurrent pass — logged so it's visible in server logs, not silent.
 */
export async function pollAllInFlightBatches(): Promise<Array<{ run_id: string; result: StepResult }>> {
  if (_inFlightPollPromise) {
    console.log('[batch-poller] a poll pass is already in flight — awaiting it instead of starting a concurrent pass');
    return _inFlightPollPromise;
  }

  const cache = new Map<string, RunLookupResult | null>();
  const bankAccumulator = new Map<string, AuthoredItem[]>();
  _runCacheForCurrentPass = cache;
  _bankAccumulatorForCurrentPass = bankAccumulator;

  const pass = (async () => {
    try {
      return await getOrchestrator().pollAllInFlight();
    } finally {
      // This pass is the sole owner of these slots for its whole
      // lifetime now (the reentrancy guard above prevents a second pass
      // from ever starting while this one holds them), so the identity
      // check is just defense-in-depth, not load-bearing.
      if (_runCacheForCurrentPass === cache) _runCacheForCurrentPass = null;
      if (_bankAccumulatorForCurrentPass === bankAccumulator) _bankAccumulatorForCurrentPass = null;
      flushPracticeItemBankAccumulator(bankAccumulator);
    }
  })();

  _inFlightPollPromise = pass;
  try {
    return await pass;
  } finally {
    if (_inFlightPollPromise === pass) _inFlightPollPromise = null;
  }
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
