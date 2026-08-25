/**
 * T4a — poller.ts wires REAL verifier deps into
 * dispatchPracticeItemJob's third argument, instead of leaving it `{}`
 * forever (see TODOS.md's "Practice-item batch runs need real verifier
 * deps wired at the poller call site").
 *
 * Two layers tested here, fully dependency-injected — no DB, no real
 * batch orchestrator, no network call:
 *
 *   1. handleJobProcessed threads deps.getPracticeItemDispatchDeps()'s
 *      resolved value through as dispatchPracticeItemJob's third arg
 *      (and still falls back to `{}` when that hook is omitted, so
 *      older/direct callers are unaffected).
 *   2. buildRealPracticeItemDispatchDeps (the production implementation
 *      of that hook) wires solveSecondary/wolframCheck as real functions
 *      when the underlying providers are configured, and to null when
 *      they aren't — mocked at the seam (answer-check.ts, wolfram-
 *      service.ts, feature-flags.ts), never a live call.
 */
import { describe, it, expect, vi } from 'vitest';
import { handleJobProcessed, type JobProcessedDeps, type RunLookupResult } from '../poller';
import type { JobRow } from '../persistence';
import type { AtomSpec } from '../types';
import type { PracticeItemDispatchResult } from '../../practice-item-factory/batch-dispatch';

function practiceItemJob(): JobRow {
  const atom_spec: AtomSpec = {
    concept_id: 'eigenvalues',
    atom_type: 'practice_item',
    difficulty: 'medium',
    prompt_template_id: 'practice-item-v1',
    prompt_vars: { format: 'nat', topic: 'linear-algebra', difficulty_frac: 0.3 },
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

const practiceItemRun: RunLookupResult = {
  exam_pack_id: 'gate-ma',
  config: { target: { practice_item_specs: [{ concept_id: 'eigenvalues', format: 'nat', difficulty: 0.3, topic: 'linear-algebra' }] } },
};

describe('handleJobProcessed — real verifier deps threaded to dispatchPracticeItemJob', () => {
  it('awaits getPracticeItemDispatchDeps() and passes its resolved value as the third argument', async () => {
    const solveSecondary = vi.fn();
    const wolframCheck = vi.fn();
    const dispatchPracticeItemJob = vi.fn(
      async () => ({ outcome: 'refused', reason: 'unused' }) as PracticeItemDispatchResult,
    );
    const deps: JobProcessedDeps = {
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob,
      writePracticeItemBank: vi.fn(),
      getPracticeItemDispatchDeps: vi.fn(async () => ({ solveSecondary, wolframCheck })),
    };

    await handleJobProcessed('run-1', practiceItemJob(), deps);

    expect(deps.getPracticeItemDispatchDeps).toHaveBeenCalledTimes(1);
    expect(dispatchPracticeItemJob).toHaveBeenCalledTimes(1);
    const [, , thirdArg] = dispatchPracticeItemJob.mock.calls[0];
    expect(thirdArg).toEqual({ solveSecondary, wolframCheck });
    expect(typeof thirdArg.solveSecondary).toBe('function');
    expect(typeof thirdArg.wolframCheck).toBe('function');
  });

  it('falls back to {} (pre-T4a default) when getPracticeItemDispatchDeps is omitted', async () => {
    const dispatchPracticeItemJob = vi.fn(
      async () => ({ outcome: 'refused', reason: 'unused' }) as PracticeItemDispatchResult,
    );
    const deps: JobProcessedDeps = {
      getRun: vi.fn(async () => practiceItemRun),
      dispatchPracticeItemJob,
      writePracticeItemBank: vi.fn(),
    };

    await handleJobProcessed('run-1', practiceItemJob(), deps);

    expect(dispatchPracticeItemJob).toHaveBeenCalledTimes(1);
    const [, , thirdArg] = dispatchPracticeItemJob.mock.calls[0];
    expect(thirdArg).toEqual({});
  });

  it('does not resolve practice-item deps at all for an atom-mode job (no wasted work)', async () => {
    const getPracticeItemDispatchDeps = vi.fn();
    const atomJob: JobRow = {
      run_id: 'run-1',
      custom_id: 'job-atom',
      atom_spec: {
        concept_id: 'eigenvalues',
        atom_type: 'worked_example',
        difficulty: 'medium',
        prompt_template_id: 'x',
        prompt_vars: {},
      },
      status: 'succeeded',
      result: 'text',
      error: null,
      submitted_at: null,
      processed_at: null,
    };
    const deps: JobProcessedDeps = {
      getRun: vi.fn(async (): Promise<RunLookupResult> => ({ exam_pack_id: 'gate-ma', config: { target: { concept_ids: ['eigenvalues'] } } })),
      dispatchPracticeItemJob: vi.fn(),
      writePracticeItemBank: vi.fn(),
      getPracticeItemDispatchDeps,
    };
    await handleJobProcessed('run-1', atomJob, deps);
    expect(getPracticeItemDispatchDeps).not.toHaveBeenCalled();
  });
});

describe('buildRealPracticeItemDispatchDeps — production wiring', () => {
  it('wires solveSecondary and wolframCheck as real functions when both providers are configured', async () => {
    vi.doMock('../../practice-item-factory/answer-check', () => ({
      buildSolveSecondaryFn: vi.fn().mockResolvedValue(async (_prompt: string) => 'answer'),
    }));
    vi.doMock('../../../services/wolfram-service', () => ({
      verifyProblemWithWolfram: vi.fn(),
    }));
    vi.doMock('../../../api/feature-flags', () => ({
      computeFeatureFlags: vi.fn(() => ({ wolfram: true })),
    }));
    vi.resetModules();
    try {
      const { buildRealPracticeItemDispatchDeps } = await import('../poller');
      const deps = await buildRealPracticeItemDispatchDeps();
      expect(typeof deps.solveSecondary).toBe('function');
      expect(typeof deps.wolframCheck).toBe('function');
    } finally {
      vi.doUnmock('../../practice-item-factory/answer-check');
      vi.doUnmock('../../../services/wolfram-service');
      vi.doUnmock('../../../api/feature-flags');
      vi.resetModules();
    }
  });

  it('resolves solveSecondary to null when no distinct-provider secondary is configured', async () => {
    vi.doMock('../../practice-item-factory/answer-check', () => ({
      buildSolveSecondaryFn: vi.fn().mockResolvedValue(null),
    }));
    vi.doMock('../../../services/wolfram-service', () => ({
      verifyProblemWithWolfram: vi.fn(),
    }));
    vi.doMock('../../../api/feature-flags', () => ({
      computeFeatureFlags: vi.fn(() => ({ wolfram: false })),
    }));
    vi.resetModules();
    try {
      const { buildRealPracticeItemDispatchDeps } = await import('../poller');
      const deps = await buildRealPracticeItemDispatchDeps();
      expect(deps.solveSecondary).toBeNull();
      expect(deps.wolframCheck).toBeNull();
    } finally {
      vi.doUnmock('../../practice-item-factory/answer-check');
      vi.doUnmock('../../../services/wolfram-service');
      vi.doUnmock('../../../api/feature-flags');
      vi.resetModules();
    }
  });

  it('leaves wolframCheck null when WOLFRAM_APP_ID is unconfigured, even if solveSecondary IS wired', async () => {
    vi.doMock('../../practice-item-factory/answer-check', () => ({
      buildSolveSecondaryFn: vi.fn().mockResolvedValue(async (_prompt: string) => 'x'),
    }));
    vi.doMock('../../../services/wolfram-service', () => ({
      verifyProblemWithWolfram: vi.fn(),
    }));
    vi.doMock('../../../api/feature-flags', () => ({
      computeFeatureFlags: vi.fn(() => ({ wolfram: false })),
    }));
    vi.resetModules();
    try {
      const { buildRealPracticeItemDispatchDeps } = await import('../poller');
      const deps = await buildRealPracticeItemDispatchDeps();
      expect(typeof deps.solveSecondary).toBe('function');
      expect(deps.wolframCheck).toBeNull();
    } finally {
      vi.doUnmock('../../practice-item-factory/answer-check');
      vi.doUnmock('../../../services/wolfram-service');
      vi.doUnmock('../../../api/feature-flags');
      vi.resetModules();
    }
  });
});
