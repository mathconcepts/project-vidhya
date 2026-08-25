/**
 * T4a launch guard — assertPracticeItemLaunchReady fails a fresh
 * practice-item batch run LOUDLY (throws, naming the missing dep) when
 * its atom_specs need a verifier that isn't configured, and is a no-op
 * both for plain atom-mode batches and for a fully-configured run.
 */
import { describe, it, expect, vi } from 'vitest';
import { assertPracticeItemLaunchReady, PracticeItemLaunchGuardError } from '../launch-guard';
import type { AtomSpec } from '../../batch/types';

function natSpec(): AtomSpec {
  return {
    concept_id: 'determinants',
    atom_type: 'practice_item',
    difficulty: 'easy',
    prompt_template_id: 'practice-item-v1',
    prompt_vars: { format: 'nat', topic: 'linear-algebra', difficulty_frac: 0.25 },
  };
}

function mcqSpec(): AtomSpec {
  return {
    concept_id: 'eigenvalues',
    atom_type: 'practice_item',
    difficulty: 'medium',
    prompt_template_id: 'practice-item-v1',
    prompt_vars: { format: 'mcq', topic: 'linear-algebra', difficulty_frac: 0.35 },
  };
}

function plainAtomSpec(): AtomSpec {
  return {
    concept_id: 'eigenvalues',
    atom_type: 'worked_example',
    difficulty: 'medium',
    prompt_template_id: 'x',
    prompt_vars: {},
  };
}

describe('assertPracticeItemLaunchReady', () => {
  it('rejects a run containing nat specs when wolfram is unconfigured, with a clear error naming the dep', async () => {
    await expect(
      assertPracticeItemLaunchReady([natSpec()], {
        primaryModelId: 'gemini-2.5-flash',
        resolveSecondary: vi.fn(async () => 'claude-sonnet-4-5'),
        wolframConfigured: () => false,
      }),
    ).rejects.toThrow(PracticeItemLaunchGuardError);

    await expect(
      assertPracticeItemLaunchReady([natSpec()], {
        primaryModelId: 'gemini-2.5-flash',
        resolveSecondary: vi.fn(async () => 'claude-sonnet-4-5'),
        wolframConfigured: () => false,
      }),
    ).rejects.toThrow(/wolfram/i);
  });

  it('rejects a run containing mcq/msq specs when no distinct-provider secondary is configured', async () => {
    await expect(
      assertPracticeItemLaunchReady([mcqSpec()], {
        primaryModelId: 'gemini-2.5-flash',
        resolveSecondary: vi.fn(async () => null),
        wolframConfigured: () => true,
      }),
    ).rejects.toThrow(/second distinct-provider model/);
  });

  it('allows the run when every needed verifier is configured (mocked)', async () => {
    const resolveSecondary = vi.fn(async () => 'claude-sonnet-4-5');
    await expect(
      assertPracticeItemLaunchReady([natSpec(), mcqSpec()], {
        primaryModelId: 'gemini-2.5-flash',
        resolveSecondary,
        wolframConfigured: () => true,
      }),
    ).resolves.toBeUndefined();
    expect(resolveSecondary).toHaveBeenCalledWith('gemini-2.5-flash');
  });

  it('is a no-op for a plain atom-mode batch (no practice-item specs at all)', async () => {
    const resolveSecondary = vi.fn();
    const wolframConfigured = vi.fn();
    await expect(
      assertPracticeItemLaunchReady([plainAtomSpec()], {
        primaryModelId: 'gemini-2.5-flash',
        resolveSecondary,
        wolframConfigured,
      }),
    ).resolves.toBeUndefined();
    expect(resolveSecondary).not.toHaveBeenCalled();
    expect(wolframConfigured).not.toHaveBeenCalled();
  });

  it('does not check wolfram at all when the batch has no nat specs', async () => {
    const wolframConfigured = vi.fn(() => false);
    await expect(
      assertPracticeItemLaunchReady([mcqSpec()], {
        primaryModelId: 'gemini-2.5-flash',
        resolveSecondary: vi.fn(async () => 'claude-sonnet-4-5'),
        wolframConfigured,
      }),
    ).resolves.toBeUndefined();
    expect(wolframConfigured).not.toHaveBeenCalled();
  });

  it('uses the real env-based wolfram check by default when wolframConfigured is not injected', async () => {
    const prev = process.env.WOLFRAM_APP_ID;
    delete process.env.WOLFRAM_APP_ID;
    try {
      await expect(
        assertPracticeItemLaunchReady([natSpec()], {
          primaryModelId: 'gemini-2.5-flash',
          resolveSecondary: vi.fn(async () => 'claude-sonnet-4-5'),
        }),
      ).rejects.toThrow(PracticeItemLaunchGuardError);
    } finally {
      if (prev === undefined) delete process.env.WOLFRAM_APP_ID;
      else process.env.WOLFRAM_APP_ID = prev;
    }
  });
});
