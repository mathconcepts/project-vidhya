import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createBatchOrchestrator } from '../orchestrator';
import type { BatchAdapter, BatchPollStatus } from '../types';
import { createInMemoryPersistence, newRun, spec } from './_in-memory-persistence';

// ----------------------------------------------------------------------------
// Stub adapter — controllable per test.
// ----------------------------------------------------------------------------

interface StubControls {
  pollStatuses?: BatchPollStatus[];      // consumed in order
  outputJsonl?: string;
  submitResult?: { batch_id: string; submitted_at: string };
  submitError?: Error;
  cancelled?: string[];
}

function makeAdapter(controls: StubControls = {}): BatchAdapter {
  const cancelled = controls.cancelled ?? [];
  let pollIdx = 0;
  return {
    provider: 'gemini',
    async submitBatch({ display_name }) {
      if (controls.submitError) throw controls.submitError;
      return controls.submitResult ?? { batch_id: `batch-${display_name}`, submitted_at: new Date().toISOString() };
    },
    async pollBatch() {
      const list = controls.pollStatuses ?? [{ kind: 'pending' }];
      const status = list[Math.min(pollIdx, list.length - 1)];
      pollIdx++;
      return status;
    },
    async downloadResults() {
      return controls.outputJsonl ?? '';
    },
    async cancelBatch(id) {
      cancelled.push(id);
    },
    parseResults(jsonl) {
      const out: Array<{ custom_id: string; status: 'succeeded' | 'failed'; result?: unknown; error?: string }> = [];
      for (const line of jsonl.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const p = JSON.parse(trimmed);
        if (p.error) out.push({ custom_id: p.custom_id, status: 'failed', error: p.error });
        else out.push({ custom_id: p.custom_id, status: 'succeeded', result: p.result });
      }
      return out;
    },
  };
}

// ----------------------------------------------------------------------------

describe('orchestrator state machine', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-orch-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('happy path: queued → prepared → submitted → downloading → processing → complete', async () => {
    const persistence = createInMemoryPersistence({ runs: [newRun('run-1')] });
    const onJobProcessed = vi.fn(async () => {});
    const orch = createBatchOrchestrator({
      persistence,
      adapter: makeAdapter({
        pollStatuses: [{ kind: 'complete', output_url: 'https://x/output' }, { kind: 'complete', output_url: 'https://x/output' }],
        outputJsonl: '',  // filled per-test below
      }),
      jsonlDir: tmp,
      onJobProcessed,
    });
    const specs = [spec('limits-jee', 'a'), spec('derivatives-basic', 'b')];

    // queued → prepared
    let r = await orch.step('run-1', specs);
    expect(r).toMatchObject({ kind: 'transitioned', from: 'queued', to: 'prepared' });

    // prepared → submitted
    r = await orch.step('run-1');
    expect(r).toMatchObject({ kind: 'transitioned', from: 'prepared', to: 'submitted' });

    // submitted → downloading (poll says complete)
    r = await orch.step('run-1');
    expect(r).toMatchObject({ kind: 'transitioned', from: 'submitted', to: 'downloading' });

    // For download we need output JSONL with our custom_ids:
    const jobs = await persistence.listJobs('run-1');
    const outputJsonl = jobs
      .map((j) => JSON.stringify({ custom_id: j.custom_id, result: { atom_id: j.custom_id } }))
      .join('\n');
    // Re-create orch with that output:
    const orch2 = createBatchOrchestrator({
      persistence,
      adapter: makeAdapter({
        pollStatuses: [{ kind: 'complete', output_url: 'https://x/output' }],
        outputJsonl,
      }),
      jsonlDir: tmp,
      onJobProcessed,
    });

    // downloading → processing
    r = await orch2.step('run-1');
    expect(r).toMatchObject({ kind: 'transitioned', from: 'downloading', to: 'processing' });

    // processing → complete
    r = await orch2.step('run-1');
    expect(r).toMatchObject({ kind: 'transitioned', from: 'processing', to: 'complete' });

    // Subsequent step is terminal
    r = await orch2.step('run-1');
    expect(r).toMatchObject({ kind: 'terminal', state: 'complete' });

    // onJobProcessed called once per job
    expect(onJobProcessed).toHaveBeenCalledTimes(2);
  });

  it('budget cap: prepare flips to failed BEFORE any provider call', async () => {
    const persistence = createInMemoryPersistence({
      runs: [newRun('run-broke', { budget_remaining_usd: 0.0001 })],
    });
    const submitSpy = vi.fn();
    const orch = createBatchOrchestrator({
      persistence,
      adapter: { ...makeAdapter(), submitBatch: submitSpy as any },
      jsonlDir: tmp,
      estimatePerJobUsd: () => 0.10,
    });
    const r = await orch.step('run-broke', [spec('limits-jee')]);
    expect(r).toMatchObject({ kind: 'transitioned', to: 'failed' });
    expect(submitSpy).not.toHaveBeenCalled();
    const run = await persistence.getRun('run-broke');
    expect(run!.error).toMatch(/budget_exceeded/);
  });

  it('resume from prepared: submit re-uses on-disk JSONL', async () => {
    const persistence = createInMemoryPersistence({ runs: [newRun('run-r1')] });
    const orch = createBatchOrchestrator({
      persistence,
      adapter: makeAdapter(),
      jsonlDir: tmp,
    });
    await orch.step('run-r1', [spec('limits-jee')]); // → prepared
    const before = await persistence.getRun('run-r1');
    expect(before!.batch_state).toBe('prepared');
    expect(before!.jsonl_path).toBeTruthy();
    expect(fs.existsSync(before!.jsonl_path!)).toBe(true);

    // Simulate process restart: orchestrator forgets state, re-enters.
    const orch2 = createBatchOrchestrator({ persistence, adapter: makeAdapter(), jsonlDir: tmp });
    const r = await orch2.step('run-r1');
    expect(r).toMatchObject({ kind: 'transitioned', from: 'prepared', to: 'submitted' });
  });

  it('resume from prepared with MISSING JSONL: rebuilds deterministically from batch_jobs', async () => {
    const persistence = createInMemoryPersistence({ runs: [newRun('run-r2')] });
    const orch = createBatchOrchestrator({ persistence, adapter: makeAdapter(), jsonlDir: tmp });
    await orch.step('run-r2', [spec('limits-jee'), spec('derivatives-basic')]);
    const r1 = await persistence.getRun('run-r2');
    fs.unlinkSync(r1!.jsonl_path!); // simulate ephemeral disk wipe

    const r = await orch.step('run-r2'); // submit
    expect(r).toMatchObject({ kind: 'transitioned', from: 'prepared', to: 'submitted' });

    // The JSONL was rebuilt + re-persisted
    const r2 = await persistence.getRun('run-r2');
    expect(fs.existsSync(r2!.jsonl_path!)).toBe(true);
  });

  it('resume from submitted: poll picks up exactly where left off', async () => {
    const persistence = createInMemoryPersistence({
      runs: [newRun('run-r3', { batch_state: 'submitted', batch_id: 'batches/x', batch_provider: 'gemini' })],
    });
    const orch = createBatchOrchestrator({
      persistence,
      adapter: makeAdapter({ pollStatuses: [{ kind: 'running', progress: 0.5 }] }),
      jsonlDir: tmp,
    });
    const r = await orch.step('run-r3');
    expect(r).toMatchObject({ kind: 'still_pending' });
    const after = await persistence.getRun('run-r3');
    expect(after!.batch_state).toBe('submitted');
    expect(after!.last_polled_at).toBeTruthy();
  });

  it('resume from processing with HALF the rows already processed: only reprocesses unprocessed', async () => {
    const specs = [spec('limits-jee', 'a'), spec('limits-jee', 'b'), spec('limits-jee', 'c')];
    const { customIdFor } = await import('../jsonl-builder');
    const ids = specs.map((s) => customIdFor('run-r4', s));
    const persistence = createInMemoryPersistence({
      runs: [newRun('run-r4', { batch_state: 'processing', batch_id: 'batches/x', batch_provider: 'gemini' })],
      jobs: [
        // First job already processed; other two pending downstream ingestion.
        { run_id: 'run-r4', custom_id: ids[0], atom_spec: specs[0], status: 'succeeded', result: { id: 'a' }, error: null, submitted_at: null, processed_at: '2026-05-03T00:00:00Z' },
        { run_id: 'run-r4', custom_id: ids[1], atom_spec: specs[1], status: 'succeeded', result: { id: 'b' }, error: null, submitted_at: null, processed_at: null },
        { run_id: 'run-r4', custom_id: ids[2], atom_spec: specs[2], status: 'succeeded', result: { id: 'c' }, error: null, submitted_at: null, processed_at: null },
      ],
    });
    const onJobProcessed = vi.fn(async () => {});
    const orch = createBatchOrchestrator({
      persistence,
      adapter: makeAdapter(),
      jsonlDir: tmp,
      onJobProcessed,
    });

    const r = await orch.step('run-r4');
    expect(r).toMatchObject({ kind: 'transitioned', from: 'processing', to: 'complete' });
    expect(onJobProcessed).toHaveBeenCalledTimes(2); // not 3 — first was already processed
  });

  it('processing hook failure on one job marks the job + continues with the rest', async () => {
    const specs = [spec('limits-jee', 'a'), spec('limits-jee', 'b')];
    const { customIdFor } = await import('../jsonl-builder');
    const ids = specs.map((s) => customIdFor('run-r5', s));
    const persistence = createInMemoryPersistence({
      runs: [newRun('run-r5', { batch_state: 'processing', batch_id: 'b', batch_provider: 'gemini' })],
      jobs: specs.map((s, i) => ({
        run_id: 'run-r5', custom_id: ids[i], atom_spec: s, status: 'succeeded' as const,
        result: { i }, error: null, submitted_at: null, processed_at: null,
      })),
    });
    const onJobProcessed = vi.fn(async (_run_id: string, job) => {
      if (job.custom_id === ids[0]) throw new Error('downstream-broke');
    });
    const orch = createBatchOrchestrator({ persistence, adapter: makeAdapter(), jsonlDir: tmp, onJobProcessed });
    const r = await orch.step('run-r5');
    // One job failed processing → still_pending (not complete).
    expect(r.kind).toBe('still_pending');
    const jobs = await persistence.listJobs('run-r5');
    const failed = jobs.find((j) => j.custom_id === ids[0])!;
    expect(failed.error).toMatch(/processing_hook_failed/);
    expect(failed.processed_at).toBeNull();
    const ok = jobs.find((j) => j.custom_id === ids[1])!;
    expect(ok.processed_at).toBeTruthy();
  });

  it('poll → expired flips to failed with provider_timeout', async () => {
    const persistence = createInMemoryPersistence({
      runs: [newRun('run-x', { batch_state: 'submitted', batch_id: 'b', batch_provider: 'gemini' })],
    });
    const orch = createBatchOrchestrator({
      persistence,
      adapter: makeAdapter({ pollStatuses: [{ kind: 'expired' }] }),
      jsonlDir: tmp,
    });
    const r = await orch.step('run-x');
    expect(r).toMatchObject({ kind: 'transitioned', to: 'failed' });
    expect((await persistence.getRun('run-x'))!.error).toBe('provider_timeout');
  });

  it('abort cancels at provider + flips state from any in-flight state', async () => {
    const cancelled: string[] = [];
    const persistence = createInMemoryPersistence({
      runs: [newRun('run-ab', { batch_state: 'submitted', batch_id: 'batches/abort-me', batch_provider: 'gemini' })],
    });
    const orch = createBatchOrchestrator({
      persistence,
      adapter: makeAdapter({ cancelled }),
      jsonlDir: tmp,
    });
    await orch.abort('run-ab', 'op-pulled-the-plug');
    expect(cancelled).toContain('batches/abort-me');
    const after = await persistence.getRun('run-ab');
    expect(after!.batch_state).toBe('aborted');
    expect(after!.error).toBe('op-pulled-the-plug');
  });

  it('lock contention: second step on the same run while first holds is a noop', async () => {
    const persistence = createInMemoryPersistence({ runs: [newRun('run-lock')] });
    // Manually grab the lock to simulate contention.
    expect(await persistence.acquireLock('run-lock')).toBe(true);
    const orch = createBatchOrchestrator({ persistence, adapter: makeAdapter(), jsonlDir: tmp });
    const r = await orch.step('run-lock', [spec('limits-jee')]);
    expect(r).toMatchObject({ kind: 'noop', reason: 'lock_held' });
    await persistence.releaseLock('run-lock');
  });

  it('terminal states are no-ops; pollAllInFlight skips them', async () => {
    const persistence = createInMemoryPersistence({
      runs: [newRun('done', { batch_state: 'complete' }), newRun('live', { batch_state: 'submitted', batch_id: 'b', batch_provider: 'gemini' })],
    });
    const orch = createBatchOrchestrator({
      persistence,
      adapter: makeAdapter({ pollStatuses: [{ kind: 'pending' }] }),
      jsonlDir: tmp,
    });
    const out = await orch.pollAllInFlight();
    expect(out.length).toBe(1);
    expect(out[0].run_id).toBe('live');
  });
});
