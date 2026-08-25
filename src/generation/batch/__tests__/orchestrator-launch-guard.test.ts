/**
 * T4a — OrchestratorOpts.assertLaunchReady wiring inside prepare()'s
 * fresh-launch branch: a rejecting guard fails the run loudly (batch_state
 * → 'failed', clear error, no provider call); a passing guard leaves the
 * normal queued → prepared transition untouched; and — the resume
 * guarantee the task asks to lock down — the guard is never even called
 * on a resume pass (jobs already persisted, atom_specs omitted).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createBatchOrchestrator } from '../orchestrator';
import type { BatchAdapter } from '../types';
import { createInMemoryPersistence, newRun, spec } from './_in-memory-persistence';

function makeAdapter(): BatchAdapter {
  return {
    provider: 'gemini',
    async submitBatch({ display_name }) {
      return { batch_id: `batch-${display_name}`, submitted_at: new Date().toISOString() };
    },
    async pollBatch() {
      return { kind: 'pending' };
    },
    async downloadResults() {
      return '';
    },
    async cancelBatch() {},
    parseResults() {
      return [];
    },
  };
}

describe('orchestrator prepare() — T4a launch guard', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-orch-guard-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('rejects a fresh launch loudly: batch_state -> failed with the guard\'s error, no submit call', async () => {
    const persistence = createInMemoryPersistence({ runs: [newRun('run-guarded')] });
    const submitSpy = vi.fn();
    const assertLaunchReady = vi.fn(async () => {
      throw new Error('practice-item run refused at launch: WOLFRAM_APP_ID is not set.');
    });
    const orch = createBatchOrchestrator({
      persistence,
      adapter: { ...makeAdapter(), submitBatch: submitSpy as never },
      jsonlDir: tmp,
      assertLaunchReady,
    });

    const r = await orch.step('run-guarded', [spec('determinants')]);

    expect(assertLaunchReady).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({ kind: 'transitioned', from: 'queued', to: 'failed' });
    expect(submitSpy).not.toHaveBeenCalled();
    const run = await persistence.getRun('run-guarded');
    expect(run!.batch_state).toBe('failed');
    expect(run!.error).toMatch(/WOLFRAM_APP_ID/);
  });

  it('a passing guard does not block the normal queued -> prepared transition', async () => {
    const persistence = createInMemoryPersistence({ runs: [newRun('run-ok')] });
    const assertLaunchReady = vi.fn(async () => {});
    const orch = createBatchOrchestrator({
      persistence,
      adapter: makeAdapter(),
      jsonlDir: tmp,
      assertLaunchReady,
    });

    const r = await orch.step('run-ok', [spec('eigenvalues')]);

    expect(assertLaunchReady).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({ kind: 'transitioned', from: 'queued', to: 'prepared' });
    const run = await persistence.getRun('run-ok');
    expect(run!.batch_state).toBe('prepared');
    expect(run!.error).toBeNull();
  });

  it('a run with no assertLaunchReady configured behaves exactly as before (no guard at all)', async () => {
    const persistence = createInMemoryPersistence({ runs: [newRun('run-unguarded')] });
    const orch = createBatchOrchestrator({ persistence, adapter: makeAdapter(), jsonlDir: tmp });

    const r = await orch.step('run-unguarded', [spec('eigenvalues')]);
    expect(r).toMatchObject({ kind: 'transitioned', from: 'queued', to: 'prepared' });
  });

  it('resume never calls the guard, and does not throw even if the guard WOULD reject (deps unavailable)', async () => {
    // Simulate a run that already got past launch: batch_jobs rows exist,
    // batch_state is 'queued' (crashed before the prepared transition
    // landed — the exact mid-flight-crash scenario prepare() is built to
    // resume from). A resume call omits atom_specs entirely.
    const persistence = createInMemoryPersistence({
      runs: [newRun('run-resumed')],
      jobs: [
        {
          run_id: 'run-resumed',
          custom_id: 'job-1',
          atom_spec: spec('determinants'),
          status: 'pending',
          result: null,
          error: null,
          submitted_at: null,
          processed_at: null,
        },
      ],
    });
    const assertLaunchReady = vi.fn(async () => {
      throw new Error('deps unavailable — should never be reached on resume');
    });
    const orch = createBatchOrchestrator({
      persistence,
      adapter: makeAdapter(),
      jsonlDir: tmp,
      assertLaunchReady,
    });

    // No atom_specs — this is the resume shape (pollAllInFlightBatches
    // always calls step(run_id) with no second argument).
    const r = await orch.step('run-resumed');

    expect(assertLaunchReady).not.toHaveBeenCalled();
    expect(r).toMatchObject({ kind: 'transitioned', from: 'queued', to: 'prepared' });
    const run = await persistence.getRun('run-resumed');
    expect(run!.batch_state).toBe('prepared');
  });
});
