/**
 * src/generation/batch/orchestrator.ts
 *
 * Drives a generation run through the batch state machine. Five
 * idempotent state handlers; the orchestrator dispatches based on the
 * run's persisted batch_state. Every transition writes to DB BEFORE the
 * next side-effect, so a crash mid-step is recoverable on the next
 * poll/boot.
 *
 * State machine:
 *
 *   queued → prepared → submitted → downloading → processing → complete
 *                                           │
 *                       any state ──────────┴──── failed | aborted
 *
 * Cost cap: prepareBatch checks remaining budget against the dry-run
 * estimate. Over-budget runs flip to 'failed' with error='budget_exceeded'
 * BEFORE any provider call. Multi-batch runs handle this naturally —
 * each batch self-checks at its own submit time.
 */

import fs from 'fs';
import path from 'path';
import type { BatchAdapter, BatchState, AtomSpec } from './types';
import { TERMINAL_STATES } from './types';
import { buildJobs, buildJsonl, customIdFor } from './jsonl-builder';
import type { BatchPersistence, RunRow, JobRow } from './persistence';

export interface OrchestratorOpts {
  persistence: BatchPersistence;
  adapter: BatchAdapter;
  /** Where to write JSONL files. Default: <cwd>/.data/batch/<run_id>.jsonl */
  jsonlDir?: string;
  /** Per-job cost estimate (USD). Used by prepareBatch. */
  estimatePerJobUsd?: (spec: AtomSpec) => number;
  /** Hook called after each successful processing of a single result row. */
  onJobProcessed?: (run_id: string, job: JobRow) => Promise<void>;
}

export type StepResult =
  | { kind: 'transitioned'; from: BatchState | null; to: BatchState }
  | { kind: 'noop'; reason: string }
  | { kind: 'still_pending' }
  | { kind: 'terminal'; state: BatchState };

const DEFAULT_PER_JOB_USD = 0.0008; // crude default; caller usually overrides

export function createBatchOrchestrator(opts: OrchestratorOpts) {
  const { persistence, adapter } = opts;
  const jsonlDir = opts.jsonlDir ?? path.join(process.cwd(), '.data', 'batch');
  const perJobUsd = opts.estimatePerJobUsd ?? (() => DEFAULT_PER_JOB_USD);

  /**
   * Drive a single run forward by ONE step. Caller (boot resume or
   * periodic poller) loops until step() returns 'still_pending',
   * 'terminal', or 'noop'.
   */
  async function step(run_id: string, atom_specs?: AtomSpec[]): Promise<StepResult> {
    const acquired = await persistence.acquireLock(run_id);
    if (!acquired) return { kind: 'noop', reason: 'lock_held' };
    try {
      const run = await persistence.getRun(run_id);
      if (!run) return { kind: 'noop', reason: 'run_not_found' };
      if (run.batch_state && TERMINAL_STATES.has(run.batch_state)) {
        return { kind: 'terminal', state: run.batch_state };
      }
      const state = run.batch_state ?? 'queued';
      switch (state) {
        case 'queued':       return await prepare(run, atom_specs);
        case 'prepared':     return await submit(run);
        case 'submitted':    return await poll(run);
        case 'downloading':  return await download(run);
        case 'processing':   return await process_(run);
        default:             return { kind: 'noop', reason: `unknown_state:${state}` };
      }
    } finally {
      await persistence.releaseLock(run_id);
    }
  }

  // --------------------------------------------------------------------------
  // STATE HANDLERS — each is idempotent, writes DB before side-effect
  // --------------------------------------------------------------------------

  /**
   * queued → prepared
   * Persists atom_specs as batch_jobs rows + writes JSONL to disk +
   * records jsonl_path. Budget check happens HERE, before submit, so we
   * never spend on an over-budget batch.
   */
  async function prepare(run: RunRow, atom_specs?: AtomSpec[]): Promise<StepResult> {
    let jobs = await loadJobs(run.id);
    if (jobs.length === 0) {
      // First entry: caller must supply atom_specs. On resume jobs already exist.
      if (!atom_specs || atom_specs.length === 0) {
        await persistence.updateRun(run.id, {
          batch_state: 'failed',
          error: 'prepare: no atom_specs supplied for fresh run',
        });
        return { kind: 'transitioned', from: 'queued', to: 'failed' };
      }
      const built = buildJobs(run.id, atom_specs);
      await persistence.insertJobs(run.id, built);
      jobs = built.map((b) => ({
        run_id: run.id,
        custom_id: b.custom_id,
        atom_spec: b.atom_spec,
        status: 'pending',
        result: null,
        error: null,
        submitted_at: null,
        processed_at: null,
      }));
    }

    // Cost check. Over-budget → failed, no provider call.
    const estimate = jobs.reduce((sum, j) => sum + perJobUsd(j.atom_spec), 0);
    if (estimate > run.budget_remaining_usd) {
      await persistence.updateRun(run.id, {
        batch_state: 'failed',
        error: `budget_exceeded: estimate $${estimate.toFixed(4)} > remaining $${run.budget_remaining_usd.toFixed(4)}`,
      });
      return { kind: 'transitioned', from: 'queued', to: 'failed' };
    }

    // Build JSONL deterministically + persist on disk.
    const jsonl = buildJsonl(adapter.provider, jobs.map((j) => ({ custom_id: j.custom_id, atom_spec: j.atom_spec })));
    fs.mkdirSync(jsonlDir, { recursive: true });
    const jsonl_path = path.join(jsonlDir, `${run.id}.jsonl`);
    fs.writeFileSync(jsonl_path, jsonl);

    await persistence.updateRun(run.id, {
      batch_state: 'prepared',
      batch_provider: adapter.provider,
      jsonl_path,
      budget_locked_usd: estimate,
    });
    return { kind: 'transitioned', from: 'queued', to: 'prepared' };
  }

  /**
   * prepared → submitted
   * Reads JSONL from disk (rebuilds from batch_jobs if missing — JSONL is
   * a cache, not source of truth), uploads to provider, records batch_id.
   * Provider de-dupes by display_name=run_id, so re-call after crash is safe.
   */
  async function submit(run: RunRow): Promise<StepResult> {
    let jsonl: string;
    if (run.jsonl_path && fs.existsSync(run.jsonl_path)) {
      jsonl = fs.readFileSync(run.jsonl_path, 'utf8');
    } else {
      // JSONL lost (ephemeral disk on Render free tier, container restart).
      // Rebuild from batch_jobs — this is why the rows are durable.
      const jobs = await loadJobs(run.id);
      jsonl = buildJsonl(adapter.provider, jobs.map((j) => ({ custom_id: j.custom_id, atom_spec: j.atom_spec })));
      const jsonl_path = path.join(jsonlDir, `${run.id}.jsonl`);
      fs.mkdirSync(jsonlDir, { recursive: true });
      fs.writeFileSync(jsonl_path, jsonl);
      await persistence.updateRun(run.id, { jsonl_path });
    }

    const result = await adapter.submitBatch({ display_name: run.id, jsonl });
    await persistence.updateRun(run.id, {
      batch_state: 'submitted',
      batch_id: result.batch_id,
      submitted_at: result.submitted_at,
    });
    return { kind: 'transitioned', from: 'prepared', to: 'submitted' };
  }

  /**
   * submitted → downloading | submitted (still pending) | failed
   * Polls the provider. Stays in 'submitted' while pending/running;
   * advances to 'downloading' on completion; flips to failed on hard
   * provider failures (expired, errored).
   */
  async function poll(run: RunRow): Promise<StepResult> {
    if (!run.batch_id) {
      await persistence.updateRun(run.id, { batch_state: 'failed', error: 'poll: missing batch_id' });
      return { kind: 'transitioned', from: 'submitted', to: 'failed' };
    }
    const status = await adapter.pollBatch(run.batch_id);
    await persistence.updateRun(run.id, { last_polled_at: new Date().toISOString() });

    switch (status.kind) {
      case 'pending':
      case 'running':
        return { kind: 'still_pending' };
      case 'complete':
        // Stash output_url in error column? No — use a dedicated dance:
        // store URL in jsonl_path's sibling. For simplicity, we re-poll
        // in the download step (provider returns the URL again; cheap).
        await persistence.updateRun(run.id, { batch_state: 'downloading' });
        return { kind: 'transitioned', from: 'submitted', to: 'downloading' };
      case 'failed':
        await persistence.updateRun(run.id, { batch_state: 'failed', error: `provider_failed: ${status.reason}` });
        return { kind: 'transitioned', from: 'submitted', to: 'failed' };
      case 'expired':
        await persistence.updateRun(run.id, { batch_state: 'failed', error: 'provider_timeout' });
        return { kind: 'transitioned', from: 'submitted', to: 'failed' };
    }
  }

  /**
   * downloading → processing
   * Re-polls to get the output URL (provider keeps it stable for
   * succeeded batches), downloads JSONL, parses results, writes them
   * into batch_jobs. Does NOT mark processed_at — that happens in
   * process_() per-row, gated on the downstream ingestion hook.
   */
  async function download(run: RunRow): Promise<StepResult> {
    if (!run.batch_id) {
      await persistence.updateRun(run.id, { batch_state: 'failed', error: 'download: missing batch_id' });
      return { kind: 'transitioned', from: 'downloading', to: 'failed' };
    }
    const status = await adapter.pollBatch(run.batch_id);
    if (status.kind !== 'complete') {
      // Race: someone changed our state. Bounce back.
      await persistence.updateRun(run.id, { batch_state: 'submitted' });
      return { kind: 'noop', reason: 'download: batch no longer complete' };
    }
    const jsonl = await adapter.downloadResults(status.output_url);
    const rows = adapter.parseResults(jsonl);

    // Persist each row's result. Idempotent: ON CONFLICT DO UPDATE on
    // the underlying setJobResult call.
    for (const row of rows) {
      await persistence.setJobResult(run.id, row.custom_id, {
        status: row.status,
        result: row.result ?? null,
        error: row.error ?? null,
      });
    }
    await persistence.updateRun(run.id, { batch_state: 'processing' });
    return { kind: 'transitioned', from: 'downloading', to: 'processing' };
  }

  /**
   * processing → complete
   * Walks every batch_job row that has status set but processed_at NULL
   * and runs the downstream ingestion hook (canonical-flag, atom_versions
   * row, etc.). Per-row idempotency: setJobResult with processed_at=NOW
   * after the hook completes. Crash mid-loop is safe — next call resumes
   * from the first row without processed_at.
   */
  async function process_(run: RunRow): Promise<StepResult> {
    const jobs = await loadJobs(run.id);
    const unprocessed = jobs.filter((j) => j.processed_at === null && j.status !== 'pending');
    for (const job of unprocessed) {
      try {
        if (opts.onJobProcessed) await opts.onJobProcessed(run.id, job);
      } catch (err) {
        // Per-job failure shouldn't kill the whole batch. Mark the job's
        // error and move on; operator can retry just this job later.
        await persistence.setJobResult(run.id, job.custom_id, {
          error: `processing_hook_failed: ${(err as Error).message}`,
        });
        continue;
      }
      await persistence.setJobResult(run.id, job.custom_id, {
        processed_at: new Date().toISOString(),
      });
    }

    // Done? All jobs either processed or pending (the latter shouldn't
    // happen at this state, but we don't trust it).
    const fresh = await loadJobs(run.id);
    const stillUnprocessed = fresh.filter((j) => j.processed_at === null && j.status !== 'pending');
    if (stillUnprocessed.length === 0) {
      await persistence.updateRun(run.id, { batch_state: 'complete' });
      return { kind: 'transitioned', from: 'processing', to: 'complete' };
    }
    return { kind: 'still_pending' };
  }

  // --------------------------------------------------------------------------

  async function loadJobs(run_id: string): Promise<JobRow[]> {
    return await persistence.listJobs(run_id);
  }

  /**
   * Operator-driven abort. Best-effort: cancels at the provider, marks
   * state aborted. Safe to call from any state.
   */
  async function abort(run_id: string, reason = 'operator_aborted'): Promise<void> {
    const run = await persistence.getRun(run_id);
    if (!run) return;
    if (run.batch_id) {
      await adapter.cancelBatch(run.batch_id);
    }
    await persistence.updateRun(run_id, { batch_state: 'aborted', error: reason });
  }

  /**
   * Drive every in-flight run forward by one step. Used by boot resume
   * and the periodic poller (same code, two callers).
   */
  async function pollAllInFlight(): Promise<Array<{ run_id: string; result: StepResult }>> {
    const runs = await persistence.listInFlightRuns();
    const out: Array<{ run_id: string; result: StepResult }> = [];
    for (const r of runs) {
      try {
        const result = await step(r.id);
        out.push({ run_id: r.id, result });
      } catch (err) {
        out.push({
          run_id: r.id,
          result: { kind: 'noop', reason: `error: ${(err as Error).message}` },
        });
      }
    }
    return out;
  }

  // Expose helpers as named exports (callers compose them differently).
  return {
    step,
    abort,
    pollAllInFlight,
    /** For tests + diagnostics. */
    _internal: { prepare, submit, poll, download, process: process_ },
  };
}

export { customIdFor };
