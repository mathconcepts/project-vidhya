/**
 * poller.ts's run-type dispatch (T7/E9): handleJobProcessed detects a
 * practice-item run from the RunRow's config and routes its jobs through
 * the practice-item factory instead of the atom no-op. Fully
 * dependency-injected — no DB, no real batch orchestrator, no network.
 */
import { describe, it, expect, vi } from 'vitest';
import { handleJobProcessed, flushPracticeItemBankAccumulator, type JobProcessedDeps, type RunLookupResult } from '../poller';
import type { JobRow } from '../persistence';
import type { AtomSpec } from '../types';
import type { PracticeItemDispatchResult } from '../../practice-item-factory/batch-dispatch';
import type { AuthoredItem } from '../../../scoring/learning-object-catalog-file';

function atomJob(overrides: Partial<AtomSpec> = {}): JobRow {
  const atom_spec: AtomSpec = {
    concept_id: 'eigenvalues',
    atom_type: 'worked_example',
    difficulty: 'medium',
    prompt_template_id: 'x',
    prompt_vars: {},
    ...overrides,
  };
  return {
    run_id: 'run-1',
    custom_id: 'job-abc',
    atom_spec,
    status: 'succeeded',
    result: 'some raw text',
    error: null,
    submitted_at: null,
    processed_at: null,
  };
}

function fakeDeps(overrides: Partial<JobProcessedDeps> = {}): JobProcessedDeps {
  return {
    getRun: vi.fn(async () => null),
    dispatchPracticeItemJob: vi.fn(async () => ({ outcome: 'refused', reason: 'unused' }) as PracticeItemDispatchResult),
    writePracticeItemBank: vi.fn(),
    ...overrides,
  };
}

describe('handleJobProcessed — run-type detection', () => {
  it('no-ops for an atom-mode run (no practice_item_specs in config)', async () => {
    const deps = fakeDeps({
      getRun: vi.fn(async (): Promise<RunLookupResult> => ({
        exam_pack_id: 'gate-ma',
        config: { target: { concept_ids: ['eigenvalues'] } },
      })),
    });
    await handleJobProcessed('run-1', atomJob(), deps);
    expect(deps.dispatchPracticeItemJob).not.toHaveBeenCalled();
    expect(deps.writePracticeItemBank).not.toHaveBeenCalled();
  });

  it('no-ops when the run cannot be resolved at all (DB-less / not found)', async () => {
    const deps = fakeDeps({ getRun: vi.fn(async () => null) });
    await handleJobProcessed('run-1', atomJob(), deps);
    expect(deps.dispatchPracticeItemJob).not.toHaveBeenCalled();
  });

  it('no-ops (never throws) when getRun itself throws — falls back to atom no-op', async () => {
    const deps = fakeDeps({ getRun: vi.fn(async () => { throw new Error('pg down'); }) });
    await expect(handleJobProcessed('run-1', atomJob(), deps)).resolves.toBeUndefined();
    expect(deps.dispatchPracticeItemJob).not.toHaveBeenCalled();
  });

  it('routes to the practice-item pipeline when practice_item_specs is present and non-empty', async () => {
    const deps = fakeDeps({
      getRun: vi.fn(async (): Promise<RunLookupResult> => ({
        exam_pack_id: 'gate-ma',
        config: { target: { practice_item_specs: [{ concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.3, topic: 'linear-algebra' }] } },
      })),
    });
    await handleJobProcessed('run-1', atomJob(), deps);
    expect(deps.dispatchPracticeItemJob).toHaveBeenCalledTimes(1);
  });

  it('does NOT route when practice_item_specs is present but empty', async () => {
    const deps = fakeDeps({
      getRun: vi.fn(async (): Promise<RunLookupResult> => ({
        exam_pack_id: 'gate-ma',
        config: { target: { practice_item_specs: [] } },
      })),
    });
    await handleJobProcessed('run-1', atomJob(), deps);
    expect(deps.dispatchPracticeItemJob).not.toHaveBeenCalled();
  });
});

describe('handleJobProcessed — per-pass run-lookup cache', () => {
  it('reuses a cached run row across jobs in the same pass instead of re-fetching', async () => {
    const cache = new Map<string, RunLookupResult | null>();
    const deps = fakeDeps({
      getRun: vi.fn(async (): Promise<RunLookupResult> => ({
        exam_pack_id: 'gate-ma',
        config: { target: { concept_ids: ['eigenvalues'] } },
      })),
    });
    await handleJobProcessed('run-1', atomJob({ concept_id: 'a' }), deps, cache);
    await handleJobProcessed('run-1', atomJob({ concept_id: 'b' }), deps, cache);
    await handleJobProcessed('run-1', atomJob({ concept_id: 'c' }), deps, cache);
    expect(deps.getRun).toHaveBeenCalledTimes(1);
  });

  it('fetches separately for a different run_id even with the same cache', async () => {
    const cache = new Map<string, RunLookupResult | null>();
    const deps = fakeDeps({
      getRun: vi.fn(async (): Promise<RunLookupResult> => ({
        exam_pack_id: 'gate-ma',
        config: { target: { concept_ids: ['eigenvalues'] } },
      })),
    });
    await handleJobProcessed('run-1', atomJob(), deps, cache);
    await handleJobProcessed('run-2', atomJob(), deps, cache);
    expect(deps.getRun).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failed lookup — a later job in the same pass retries it', async () => {
    const cache = new Map<string, RunLookupResult | null>();
    const getRun = vi.fn()
      .mockRejectedValueOnce(new Error('pg down'))
      .mockResolvedValueOnce({ exam_pack_id: 'gate-ma', config: { target: { concept_ids: ['eigenvalues'] } } });
    const deps = fakeDeps({ getRun });
    await handleJobProcessed('run-1', atomJob(), deps, cache);
    await handleJobProcessed('run-1', atomJob(), deps, cache);
    expect(getRun).toHaveBeenCalledTimes(2);
  });

  it('with no cache passed (legacy callers), behaves exactly as before — one fetch per call', async () => {
    const deps = fakeDeps({
      getRun: vi.fn(async (): Promise<RunLookupResult> => ({
        exam_pack_id: 'gate-ma',
        config: { target: { concept_ids: ['eigenvalues'] } },
      })),
    });
    await handleJobProcessed('run-1', atomJob(), deps);
    await handleJobProcessed('run-1', atomJob(), deps);
    expect(deps.getRun).toHaveBeenCalledTimes(2);
  });
});

describe('handleJobProcessed — bank-write batching (accumulator)', () => {
  const practiceItemRun: RunLookupResult = {
    exam_pack_id: 'gate-ma',
    config: { target: { practice_item_specs: [{ concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.3, topic: 'linear-algebra' }] } },
  };

  function writtenItem(id: string): AuthoredItem {
    return {
      id, concept_id: 'eigenvalues', topic: 'linear-algebra', difficulty: 0.3,
      question_type: 'mcq', marks: 1, question_text: 'q', options: ['a', 'b', 'c'],
      answer_index: 0, correct_answer: 'a', solution_steps: ['s'], verification_method: 'dual_model_consensus',
    };
  }

  it('queues the item into the accumulator instead of calling writePracticeItemBank when one is threaded in', async () => {
    const item = writtenItem('pi-eigenvalues-aaaaaaaa');
    const deps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({
        outcome: 'written', item,
        spec: { concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.3, topic: 'linear-algebra' },
        reason: 'ok',
      }) as PracticeItemDispatchResult),
    });
    const accumulator = new Map<string, AuthoredItem[]>();
    await handleJobProcessed('run-1', atomJob(), deps, undefined, accumulator);

    expect(deps.writePracticeItemBank).not.toHaveBeenCalled();
    expect(accumulator.size).toBe(1);
    const [[bankPath, items]] = [...accumulator.entries()];
    expect(bankPath).toContain('gate-ma-linear-algebra.json');
    expect(items).toEqual([item]);
  });

  it('accumulates multiple jobs writing to the SAME bank path into one array entry', async () => {
    const deps = fakeDeps({ getRun: vi.fn(async () => practiceItemRun) });
    const accumulator = new Map<string, AuthoredItem[]>();
    for (const id of ['pi-a-11111111', 'pi-b-22222222', 'pi-c-33333333']) {
      const itemDeps = { ...deps, dispatchPracticeItemJob: vi.fn(async () => ({
        outcome: 'written', item: writtenItem(id),
        spec: { concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.3, topic: 'linear-algebra' },
        reason: 'ok',
      }) as PracticeItemDispatchResult) };
      await handleJobProcessed('run-1', atomJob(), itemDeps, undefined, accumulator);
    }
    expect(accumulator.size).toBe(1); // one bank path
    const [items] = [...accumulator.values()];
    expect(items.map((i) => i.id)).toEqual(['pi-a-11111111', 'pi-b-22222222', 'pi-c-33333333']);
  });

  it('falls back to an immediate write when no accumulator is passed (legacy behavior unchanged)', async () => {
    const item = writtenItem('pi-eigenvalues-aaaaaaaa');
    const deps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({
        outcome: 'written', item,
        spec: { concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.3, topic: 'linear-algebra' },
        reason: 'ok',
      }) as PracticeItemDispatchResult),
    });
    await handleJobProcessed('run-1', atomJob(), deps); // no accumulator
    expect(deps.writePracticeItemBank).toHaveBeenCalledTimes(1);
    expect(deps.writePracticeItemBank).toHaveBeenCalledWith(expect.stringContaining('gate-ma-linear-algebra.json'), [item]);
  });
});

describe('flushPracticeItemBankAccumulator — idempotency against the real writer', () => {
  it('one flush of several accumulated items == the equivalent sequence of immediate per-item writes', async () => {
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    const { writePracticeItemBank } = await import('../../practice-item-factory/writer');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bank-flush-idem-'));
    try {
      const item = (id: string) => ({
        id, concept_id: 'eigenvalues', topic: 'linear-algebra', difficulty: 0.3,
        question_type: 'mcq' as const, marks: 1, question_text: 'q', options: ['a', 'b', 'c'],
        answer_index: 0, correct_answer: 'a', solution_steps: ['s'], verification_method: 'dual_model_consensus' as const,
      });
      const items = [item('pi-a-11111111'), item('pi-b-22222222'), item('pi-c-33333333')];

      // Path A: the OLD behavior — one immediate write per item.
      const pathA = path.join(tmpDir, 'sequential.json');
      for (const it of items) writePracticeItemBank(pathA, [it]);

      // Path B: the NEW behavior — accumulate then flush once.
      const pathB = path.join(tmpDir, 'batched.json');
      const accumulator = new Map<string, AuthoredItem[]>([[pathB, items]]);
      flushPracticeItemBankAccumulator(accumulator, writePracticeItemBank);

      const onDiskA = JSON.parse(fs.readFileSync(pathA, 'utf-8'));
      const onDiskB = JSON.parse(fs.readFileSync(pathB, 'utf-8'));
      expect(onDiskB.items).toEqual(onDiskA.items);
      expect(onDiskB.items.map((i: AuthoredItem) => i.id)).toEqual(['pi-a-11111111', 'pi-b-22222222', 'pi-c-33333333']);

      // Re-flushing the SAME items is still idempotent (byte-identical).
      const before = fs.readFileSync(pathB, 'utf-8');
      flushPracticeItemBankAccumulator(new Map([[pathB, items]]), writePracticeItemBank);
      expect(fs.readFileSync(pathB, 'utf-8')).toBe(before);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('flushPracticeItemBankAccumulator', () => {
  it('writes each bank path exactly once with all its queued items', () => {
    const accumulator = new Map<string, AuthoredItem[]>([
      ['/tmp/bank-a.json', [{ id: 'i1' } as AuthoredItem, { id: 'i2' } as AuthoredItem]],
      ['/tmp/bank-b.json', [{ id: 'i3' } as AuthoredItem]],
    ]);
    const writeFn = vi.fn();
    flushPracticeItemBankAccumulator(accumulator, writeFn);
    expect(writeFn).toHaveBeenCalledTimes(2);
    expect(writeFn).toHaveBeenCalledWith('/tmp/bank-a.json', accumulator.get('/tmp/bank-a.json'));
    expect(writeFn).toHaveBeenCalledWith('/tmp/bank-b.json', accumulator.get('/tmp/bank-b.json'));
  });

  it('skips empty entries and does nothing for an empty accumulator', () => {
    const writeFn = vi.fn();
    flushPracticeItemBankAccumulator(new Map([['/tmp/empty.json', []]]), writeFn);
    expect(writeFn).not.toHaveBeenCalled();
    flushPracticeItemBankAccumulator(new Map(), writeFn);
    expect(writeFn).not.toHaveBeenCalled();
  });
});

describe('handleJobProcessed — practice-item outcome handling', () => {
  const practiceItemRun: RunLookupResult = {
    exam_pack_id: 'gate-ma',
    config: { target: { practice_item_specs: [{ concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.3, topic: 'linear-algebra' }] } },
  };

  it('writes the assembled item into the exam/topic bank on "written"', async () => {
    const item = {
      id: 'pi-eigenvalues-aaaaaaaa',
      concept_id: 'eigenvalues',
      topic: 'linear-algebra',
      difficulty: 0.3,
      question_type: 'mcq' as const,
      marks: 1,
      question_text: 'q',
      options: ['a', 'b', 'c'],
      answer_index: 0,
      correct_answer: 'a',
      solution_steps: ['s'],
      verification_method: 'dual_model_consensus',
    };
    const deps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({
        outcome: 'written',
        item,
        spec: { concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.3, topic: 'linear-algebra' },
        reason: 'answers match',
      }) as PracticeItemDispatchResult),
    });
    await handleJobProcessed('run-1', atomJob(), deps);
    expect(deps.writePracticeItemBank).toHaveBeenCalledTimes(1);
    const [bankPath, items] = (deps.writePracticeItemBank as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(bankPath).toContain('gate-ma-linear-algebra.json');
    expect(items).toEqual([item]);
  });

  it('does not write anything on "refused"', async () => {
    const deps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({ outcome: 'refused', reason: 'disagree' }) as PracticeItemDispatchResult),
    });
    await handleJobProcessed('run-1', atomJob(), deps);
    expect(deps.writePracticeItemBank).not.toHaveBeenCalled();
  });

  it('does not write anything on "parse_failed"', async () => {
    const deps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({ outcome: 'parse_failed', reason: 'bad json' }) as PracticeItemDispatchResult),
    });
    await handleJobProcessed('run-1', atomJob(), deps);
    expect(deps.writePracticeItemBank).not.toHaveBeenCalled();
  });

  it('does not write anything on "pending_retry" (T7 tri-state: held, not rejected)', async () => {
    const deps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({ outcome: 'pending_retry', reason: 'wolfram inconclusive' }) as PracticeItemDispatchResult),
    });
    await handleJobProcessed('run-1', atomJob(), deps);
    expect(deps.writePracticeItemBank).not.toHaveBeenCalled();
  });

  it('signals { retry: true } on "pending_retry" so the orchestrator does not stamp processed_at', async () => {
    const deps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({ outcome: 'pending_retry', reason: 'wolfram inconclusive' }) as PracticeItemDispatchResult),
    });
    const result = await handleJobProcessed('run-1', atomJob(), deps);
    expect(result).toEqual({ retry: true });
  });

  it('every non-retry outcome (written/refused/parse_failed) resolves void — the job IS marked processed', async () => {
    const writtenDeps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({
        outcome: 'written',
        item: { id: 'x' } as any,
        spec: { concept_id: 'eigenvalues', format: 'mcq', difficulty: 0.3, topic: 'linear-algebra' },
        reason: 'ok',
      }) as PracticeItemDispatchResult),
    });
    await expect(handleJobProcessed('run-1', atomJob(), writtenDeps)).resolves.toBeUndefined();

    const refusedDeps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({ outcome: 'refused', reason: 'nope' }) as PracticeItemDispatchResult),
    });
    await expect(handleJobProcessed('run-1', atomJob(), refusedDeps)).resolves.toBeUndefined();

    const parseFailedDeps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({ outcome: 'parse_failed', reason: 'bad json' }) as PracticeItemDispatchResult),
    });
    await expect(handleJobProcessed('run-1', atomJob(), parseFailedDeps)).resolves.toBeUndefined();
  });

  it('refuses to write (logs, does not throw) if "written" arrives without a spec/item — defensive', async () => {
    const deps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({ outcome: 'written', reason: 'huh' }) as PracticeItemDispatchResult),
    });
    await expect(handleJobProcessed('run-1', atomJob(), deps)).resolves.toBeUndefined();
    expect(deps.writePracticeItemBank).not.toHaveBeenCalled();
  });
});
