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
 *
 * W1.3: every practice item this poller writes is stamped with its run and
 * gets its automated quality-gate verdicts recorded (see
 * `recordItemGatesDefault` below and src/generation/gate-ledger.ts). The
 * `mathematics` gate is opened as 'pending' — an operator closes it at
 * /admin/review-queue, and until they do, the item is neither promotable
 * nor servable from the DB.
 */

import { createBatchOrchestrator, type StepResult } from './orchestrator';
import { createGeminiBatchAdapter, DEFAULT_MODEL } from './gemini-adapter';
import { createPgPersistence } from './pg-persistence';
import type { JobRow } from './persistence';
import type { AtomSpec } from './types';
import { getRun, markRunStatus } from '../run-orchestrator';
import { dispatchPracticeItemJob, practiceItemSpecFromAtomSpec, type PracticeItemDispatchDeps } from '../practice-item-factory/batch-dispatch';
import { practiceItemBankPath, writePracticeItemBank } from '../practice-item-factory/writer';
import { buildSolveSecondaryFn } from '../practice-item-factory/answer-check';
import { assertPracticeItemLaunchReady } from '../practice-item-factory/launch-guard';
import { estimatePracticeItemCostUsd } from '../practice-item-factory/cost';
import { verifyProblemWithWolfram } from '../../services/wolfram-service';
import { computeFeatureFlags } from '../../api/feature-flags';
import type { AuthoredItem } from '../../scoring/learning-object-catalog-file';
import { evaluateAutomatedGates, recordGates } from '../gate-ledger';
import { resolveAssessmentContract } from '../../exams/assessment-contract-loader';

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
  /**
   * T4a: resolves the real verifier deps (solveSecondary / wolframCheck)
   * dispatchPracticeItemJob's third argument needs. A FUNCTION, not an
   * already-resolved value, so production wiring never constructs a
   * provider client at module load — only when a practice-item job is
   * actually being dispatched (see buildRealPracticeItemDispatchDeps
   * below). Tests inject a synchronous fake. Omitted entirely (legacy
   * callers, e.g. direct/older test callers) falls back to `{}` — the
   * pre-T4a default, still fail-closed exactly as before.
   */
  getPracticeItemDispatchDeps?: () => Promise<PracticeItemDispatchDeps>;
  /**
   * W1.3 — writes the automated quality-gate verdicts for a written item
   * into `content_gate_ledger` at batch-processing time (the four
   * mechanical gates decided, `mathematics` opened as 'pending' for the
   * operator). Best-effort and injectable: DB-less deploys resolve to a
   * no-op, and a ledger write failing never loses an item the pipeline
   * already verified. Omitted (legacy/test callers) → skipped entirely.
   */
  recordItemGates?: (input: RecordItemGatesInput) => Promise<void>;
}

export interface RecordItemGatesInput {
  generation_run_id: string;
  /** The item AFTER the run stamp — the ledger keys on its id. */
  item: AuthoredItem;
  /** The verification cascade's result, recorded as EVIDENCE on the mathematics gate, never as its verdict. */
  verification: { agreed: boolean; method?: string; detail?: string };
  requireFailureTags: boolean;
}

/**
 * Production wiring for `recordItemGates`. Resolves the run's assessment
 * contract (falling back to the compiled constant, whose version string
 * `…+compiled` says so honestly) so the `assessment_contract` gate has a
 * real version to name, evaluates the pure verdicts, and upserts them.
 * Swallows its own errors — a ledger write is not allowed to fail an
 * ingestion pass, and an unwritten row fails CLOSED at the enforcement
 * seams anyway (see src/generation/gate-ledger.ts).
 */
export async function recordItemGatesDefault(input: RecordItemGatesInput): Promise<void> {
  try {
    const contract = await resolveAssessmentContract();
    const verdicts = evaluateAutomatedGates({
      item: input.item,
      verification: input.verification,
      requireFailureTags: input.requireFailureTags,
      contractVersion: contract.version,
    });
    await recordGates({
      generation_run_id: input.generation_run_id,
      item_id: input.item.id,
      verdicts,
    });
  } catch (err) {
    console.error(
      `[batch-poller] gate-ledger write failed for item '${input.item.id}' in run '${input.generation_run_id}': ${(err as Error).message}`,
    );
  }
}

/**
 * T4a real wiring. `solveSecondary` reuses answer-check.ts's provider
 * routing (resolveDistinctSecondaryModel) against the batch pipeline's
 * fixed primary model (gemini-adapter.ts's DEFAULT_MODEL — the only model
 * createGeminiBatchAdapter() ever submits under); resolves to null (not a
 * throw) when no distinct-provider secondary is configured, which
 * dispatchPracticeItemJob already treats as "not wired" (fail-closed
 * refusal). `wolframCheck` is verifyProblemWithWolfram itself, gated by
 * the same WOLFRAM_APP_ID feature flag the rest of the app checks
 * (src/api/feature-flags.ts) — omitted (null) rather than wired-but-
 * doomed-to-fail when the key isn't set, so an unconfigured deploy still
 * gets the honest structural "refused" outcome, not a wired call that
 * would just error every time.
 *
 * Called lazily (per job, from handleJobProcessed below) — nothing here
 * runs, and no LLM/Wolfram client is built, until a practice-item job is
 * actually being dispatched. resolveDistinctSecondaryModel's own registry
 * lookup is in-process cached (src/llm/registry.ts), so calling this once
 * per job costs no meaningful work beyond the first.
 */
export async function buildRealPracticeItemDispatchDeps(): Promise<PracticeItemDispatchDeps> {
  const solveSecondary = await buildSolveSecondaryFn(DEFAULT_MODEL);
  const wolframCheck = computeFeatureFlags().wolfram ? verifyProblemWithWolfram : null;
  return { solveSecondary, wolframCheck };
}

const defaultJobProcessedDeps: JobProcessedDeps = {
  getRun,
  dispatchPracticeItemJob,
  writePracticeItemBank,
  getPracticeItemDispatchDeps: buildRealPracticeItemDispatchDeps,
  recordItemGates: recordItemGatesDefault,
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

  // T4a: resolve real verifier deps lazily, right before dispatch — never
  // at module load. Omitted getPracticeItemDispatchDeps (legacy/older
  // test callers) falls back to `{}`, the exact pre-T4a default.
  const practiceItemDeps = deps.getPracticeItemDispatchDeps
    ? await deps.getPracticeItemDispatchDeps()
    : {};
  const result = await deps.dispatchPracticeItemJob(job.atom_spec, job.result, practiceItemDeps);
  const logPrefix = `[batch-poller] practice-item run=${run_id} concept=${job.atom_spec.concept_id}`;

  switch (result.outcome) {
    case 'written': {
      if (!examPackId || !result.spec || !result.item) {
        // Should be unreachable (written implies both), but never write a
        // bank entry we can't correctly path — refuse loudly instead.
        console.error(`${logPrefix}: outcome=written but missing exam_pack_id/spec/item — dropping, not writing`);
        return;
      }
      // Stamp the run that produced it. Without this the item carries no
      // provenance, and plan E8's whole gate scope — which keys on exactly
      // this field — would have nothing to bite on. `assemble.ts` cannot
      // set it: it never sees a run id.
      const written: AuthoredItem = { ...result.item, generation_run_id: run_id };

      // W1.3: the automated gate verdicts, at batch-processing time.
      // Fire-and-forget by contract (see the dep's doc comment) — an
      // unwritten ledger row fails CLOSED downstream, never open.
      if (deps.recordItemGates) {
        await deps.recordItemGates({
          generation_run_id: run_id,
          item: written,
          verification: { agreed: true, method: written.verification_method, detail: result.reason },
          requireFailureTags: result.spec.require_failure_tags === true,
        });
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
        list.push(written);
        bankAccumulator.set(bankPath, list);
        console.log(`${logPrefix}: queued ${written.id} → ${bankPath} (${result.reason}) [flushed at end of pass]`);
      } else {
        // No accumulator threaded in (e.g. a direct/legacy caller) — fall
        // back to the original immediate write, unchanged.
        deps.writePracticeItemBank(bankPath, [written]);
        console.log(`${logPrefix}: wrote ${written.id} → ${bankPath} (${result.reason})`);
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
    try {
      writeFn(bankPath, items);
    } catch (err) {
      // D5: the writer now refuses (throws) rather than clobber a verified
      // item by id. One bank's refusal must not lose every OTHER bank
      // queued in this pass — log it loudly and keep flushing the rest;
      // the refused item stays un-written (recorded on disk exactly as it
      // was before this pass) and the operator sees the precise reason.
      console.error(`[batch-poller] refused to write bank ${bankPath}: ${(err as Error).message}`);
    }
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

/**
 * Per-job cost estimate for prepare()'s pre-submit budget check. A
 * practice-item job (recognized via practiceItemSpecFromAtomSpec — the
 * same reconstruction batch-dispatch.ts uses) prices by its actual format
 * (mcq/msq dual-model consensus vs nat's Wolfram leg); anything else
 * (plain atom-mode jobs) falls back to the orchestrator's own crude
 * default. Reuses practice-item-factory/cost.ts so this number can never
 * drift from src/generation/dry-run.ts's pre-launch estimate for the same
 * spec (CLAUDE.md's v4.25.0 "parallel truths" warning).
 */
function estimateJobCostUsd(atomSpec: AtomSpec): number {
  const spec = practiceItemSpecFromAtomSpec(atomSpec);
  return spec ? estimatePracticeItemCostUsd(spec.format, DEFAULT_MODEL) : DEFAULT_PER_JOB_USD_FALLBACK;
}
// Mirrors orchestrator.ts's own DEFAULT_PER_JOB_USD — kept local (not
// imported) since that constant isn't exported and this fallback only
// needs to be "the same crude order of magnitude", not byte-identical.
const DEFAULT_PER_JOB_USD_FALLBACK = 0.0008;

function getOrchestrator() {
  if (_orch) return _orch;
  _orch = createBatchOrchestrator({
    persistence: createPgPersistence(),
    adapter: createGeminiBatchAdapter(),
    estimatePerJobUsd: estimateJobCostUsd,
    // T4a launch guard: fails a fresh practice-item run loudly (batch_state
    // → 'failed', clear error) if its specs need a verifier that isn't
    // configured, BEFORE any provider call. No-op for non-practice-item
    // (plain atom-mode) batches — see assertPracticeItemLaunchReady's doc
    // comment. Never fires on resume (orchestrator.ts's prepare() only
    // reaches this on a genuinely fresh launch).
    assertLaunchReady: (atom_specs) =>
      assertPracticeItemLaunchReady(atom_specs, { primaryModelId: DEFAULT_MODEL }),
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
      const results = await getOrchestrator().pollAllInFlight();
      await reconcileRunStatuses(results);
      return results;
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

/**
 * Seeds a practice-item batch run into the shared batch lane: drives the
 * orchestrator's ONE queued -> prepared transition (persists atom_specs as
 * batch_jobs rows, runs the T4a launch guard, checks the run's budget,
 * writes the JSONL to disk). Deliberately does NOT loop the state machine
 * any further — prepare() sets batch_state, which is all
 * `listInFlightRuns()` (pg-persistence.ts) needs to pick the run up on the
 * next pass of the SAME periodic pollAllInFlightBatches() sweep that
 * already advances every other in-flight batch run (boot resume + the
 * 5-min cron tick, jobs/scheduler.ts). Submit/poll/download/process are
 * that existing lane, unchanged.
 *
 * Exported for src/generation/run-dispatcher.ts's practice-item dispatch
 * mode — reusing THIS module's singleton orchestrator (rather than
 * constructing a second one with its own adapter/launch-guard/cost-estimator
 * wiring) is what keeps that wiring in exactly one place instead of two
 * copies that could drift (CLAUDE.md's v4.25.0 "parallel truths" note).
 */
export async function prepareBatchRun(run_id: string, atom_specs: AtomSpec[]): Promise<StepResult> {
  return getOrchestrator().step(run_id, atom_specs);
}

/**
 * Reconciles generation_runs.status whenever this pass drove a run's
 * batch_state to a terminal outcome. See run-orchestrator.ts's
 * markRunStatus doc comment for why this never touches `error`/`cost_usd`.
 * Best-effort per run — one reconciliation failing (DB hiccup) is logged
 * and never blocks the rest of the pass or the caller.
 */
async function reconcileRunStatuses(
  results: Array<{ run_id: string; result: StepResult }>,
): Promise<void> {
  for (const { run_id, result } of results) {
    if (result.kind !== 'transitioned') continue;
    if (result.to !== 'complete' && result.to !== 'failed') continue;
    try {
      await markRunStatus(run_id, result.to);
    } catch (err) {
      console.error(`[batch-poller] status reconciliation failed for run=${run_id}: ${(err as Error).message}`);
    }
  }
}
