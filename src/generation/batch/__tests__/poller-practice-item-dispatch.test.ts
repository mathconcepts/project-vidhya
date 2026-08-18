/**
 * poller.ts's run-type dispatch (T7/E9): handleJobProcessed detects a
 * practice-item run from the RunRow's config and routes its jobs through
 * the practice-item factory instead of the atom no-op. Fully
 * dependency-injected — no DB, no real batch orchestrator, no network.
 */
import { describe, it, expect, vi } from 'vitest';
import { handleJobProcessed, type JobProcessedDeps, type RunLookupResult } from '../poller';
import type { JobRow } from '../persistence';
import type { AtomSpec } from '../types';
import type { PracticeItemDispatchResult } from '../../practice-item-factory/batch-dispatch';

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

  it('refuses to write (logs, does not throw) if "written" arrives without a spec/item — defensive', async () => {
    const deps = fakeDeps({
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob: vi.fn(async () => ({ outcome: 'written', reason: 'huh' }) as PracticeItemDispatchResult),
    });
    await expect(handleJobProcessed('run-1', atomJob(), deps)).resolves.toBeUndefined();
    expect(deps.writePracticeItemBank).not.toHaveBeenCalled();
  });
});
