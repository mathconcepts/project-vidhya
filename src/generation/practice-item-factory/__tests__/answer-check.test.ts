import { describe, it, expect, vi } from 'vitest';
import { checkAnswerAgreement, runDualLegAnswerCheck, resolveDistinctSecondaryModel } from '../answer-check';

describe('checkAnswerAgreement — mcq/nat (single-string)', () => {
  it('agrees when the secondary answer matches after normalization', () => {
    const r = checkAnswerAgreement('mcq', '5 and 2', '5 AND 2');
    expect(r.agreed).toBe(true);
  });

  it('agrees despite bracket/brace formatting differences (normaliseAnswer strips them)', () => {
    const r = checkAnswerAgreement('mcq', '{5, 2}', '5, 2');
    expect(r.agreed).toBe(true);
  });

  it('disagrees on a genuinely different answer', () => {
    const r = checkAnswerAgreement('nat', '6', '7');
    expect(r.agreed).toBe(false);
    expect(r.reason).toMatch(/differ/);
  });

  it('handles an array primaryAnswer by using its first element for mcq/nat', () => {
    const r = checkAnswerAgreement('mcq', ['5 and 2'], '5 and 2');
    expect(r.agreed).toBe(true);
  });
});

describe('checkAnswerAgreement — msq (set comparison)', () => {
  it('agrees when the secondary lists the same set, comma-separated', () => {
    const r = checkAnswerAgreement('msq', ['(1,1)', '(1,-1)'], '(1,1), (1,-1)');
    expect(r.agreed).toBe(true);
  });

  it('agrees when the secondary lists the same set with "and"', () => {
    const r = checkAnswerAgreement('msq', ['(1,1)', '(1,-1)'], '(1,1) and (1,-1)');
    expect(r.agreed).toBe(true);
  });

  it('agrees regardless of order', () => {
    const r = checkAnswerAgreement('msq', ['(1,1)', '(1,-1)'], '(1,-1), (1,1)');
    expect(r.agreed).toBe(true);
  });

  it('disagrees when the secondary is missing an element', () => {
    const r = checkAnswerAgreement('msq', ['(1,1)', '(1,-1)'], '(1,1)');
    expect(r.agreed).toBe(false);
  });

  it('disagrees when the secondary has an extra element', () => {
    const r = checkAnswerAgreement('msq', ['(1,1)', '(1,-1)'], '(1,1), (1,-1), (0,1)');
    expect(r.agreed).toBe(false);
  });
});

describe('runDualLegAnswerCheck — fail-closed orchestration', () => {
  it('refuses when no second leg is available', async () => {
    const result = await runDualLegAnswerCheck({
      format: 'mcq',
      primaryAnswer: '5 and 2',
      verificationPrompt: 'solve this',
      solveSecondary: null,
    });
    expect(result.refused).toBe(true);
    expect(result.reason).toMatch(/no second distinct-provider leg/);
  });

  it('refuses when the second leg throws', async () => {
    const solveSecondary = vi.fn().mockRejectedValue(new Error('provider 500'));
    const result = await runDualLegAnswerCheck({
      format: 'mcq',
      primaryAnswer: '5 and 2',
      verificationPrompt: 'solve this',
      solveSecondary,
    });
    expect(result.refused).toBe(true);
    expect(result.reason).toMatch(/secondary leg failed/);
    expect(result.reason).toMatch(/provider 500/);
  });

  it('refuses when the two legs disagree', async () => {
    const solveSecondary = vi.fn().mockResolvedValue('4 and 3');
    const result = await runDualLegAnswerCheck({
      format: 'mcq',
      primaryAnswer: '5 and 2',
      verificationPrompt: 'solve this',
      solveSecondary,
    });
    expect(result.refused).toBe(true);
    expect(result.agreement?.agreed).toBe(false);
  });

  it('accepts when the two legs agree', async () => {
    const solveSecondary = vi.fn().mockResolvedValue('5 and 2');
    const result = await runDualLegAnswerCheck({
      format: 'mcq',
      primaryAnswer: '5 and 2',
      verificationPrompt: 'solve this',
      solveSecondary,
    });
    expect(result.refused).toBe(false);
    expect(result.agreement?.agreed).toBe(true);
  });

  it('passes the verification prompt through to the injected solver', async () => {
    const solveSecondary = vi.fn().mockResolvedValue('6');
    await runDualLegAnswerCheck({
      format: 'nat',
      primaryAnswer: '6',
      verificationPrompt: 'what is det([[3,0],[0,2]])?',
      solveSecondary,
    });
    expect(solveSecondary).toHaveBeenCalledWith('what is det([[3,0],[0,2]])?');
  });
});

describe('resolveDistinctSecondaryModel', () => {
  it('reuses the orchestrator provider-routing functions and returns null when they refuse', async () => {
    vi.doMock('../../../content/concept-orchestrator/orchestrator', () => ({
      pickConsensusSecondary: vi.fn().mockResolvedValue('gemini-2.5-flash'),
      consensusProvidersAreDistinct: vi.fn().mockResolvedValue(false),
    }));
    vi.resetModules();
    const { resolveDistinctSecondaryModel: fn } = await import('../answer-check');
    expect(await fn('gemini-2.5-flash')).toBeNull();
    vi.doUnmock('../../../content/concept-orchestrator/orchestrator');
    vi.resetModules();
  });

  it('returns the secondary model id when the two legs resolve to distinct providers', async () => {
    vi.doMock('../../../content/concept-orchestrator/orchestrator', () => ({
      pickConsensusSecondary: vi.fn().mockResolvedValue('gemini-2.5-flash'),
      consensusProvidersAreDistinct: vi.fn().mockResolvedValue(true),
    }));
    vi.resetModules();
    const { resolveDistinctSecondaryModel: fn } = await import('../answer-check');
    expect(await fn('claude-sonnet-4-5')).toBe('gemini-2.5-flash');
    vi.doUnmock('../../../content/concept-orchestrator/orchestrator');
    vi.resetModules();
  });

  it('returns null when no secondary model is available at all', async () => {
    vi.doMock('../../../content/concept-orchestrator/orchestrator', () => ({
      pickConsensusSecondary: vi.fn().mockResolvedValue(null),
      consensusProvidersAreDistinct: vi.fn(),
    }));
    vi.resetModules();
    const { resolveDistinctSecondaryModel: fn } = await import('../answer-check');
    expect(await fn('claude-sonnet-4-5')).toBeNull();
    vi.doUnmock('../../../content/concept-orchestrator/orchestrator');
    vi.resetModules();
  });
});
