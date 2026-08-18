/**
 * content-flywheel.ts's tri-state consumption of the verification orchestrator
 * (T7 precondition — see TODOS.md / docs/designs/linear-algebra-realtime-and-
 * math-academy-plan.md "second outside voice", ENG-D4 item 8).
 *
 * Before this fix, `overallStatus === 'inconclusive'` (the arbiter — Wolfram
 * or whichever tier was reached — is unavailable) was indistinguishable from
 * `'failed'` (a genuine content disagreement): both hit the same
 * `result.overallStatus !== 'verified'` branch and were logged/counted as
 * "rejected". These tests pin the split via the `outcome` field
 * `verifyAndPublish` now returns.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../storage/repositories/content-flywheel-repo', () => ({
  getContentFlywheelRepo: vi.fn(() => null),
}));

import { setFlywheelOrchestrator, __testing } from '../content-flywheel';

const { verifyAndPublish } = __testing;

function makeProblem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    question_text: 'What is 2+2?',
    options: { A: '3', B: '4', C: '5', D: '6' },
    correct_answer: 'B',
    explanation: 'basic arithmetic',
    difficulty: 'easy' as const,
    topic: 'sequences',
    ...overrides,
  };
}

beforeEach(() => {
  setFlywheelOrchestrator(null as unknown as never);
});

describe('verifyAndPublish — tri-state', () => {
  it('is inconclusive (never counted as a rejection) when the orchestrator cannot reach a verdict', async () => {
    setFlywheelOrchestrator({
      verify: vi.fn().mockResolvedValue({ overallStatus: 'inconclusive', overallConfidence: 0, tierUsed: 'tier3_wolfram' }),
    });
    const result = await verifyAndPublish(makeProblem());
    expect(result.verified).toBe(false);
    expect(result.outcome).toBe('inconclusive');
  });

  it('is failed — a genuine rejection — when the orchestrator disagrees with sufficient confidence', async () => {
    setFlywheelOrchestrator({
      verify: vi.fn().mockResolvedValue({ overallStatus: 'failed', overallConfidence: 0.95, tierUsed: 'tier2_llm' }),
    });
    const result = await verifyAndPublish(makeProblem());
    expect(result.verified).toBe(false);
    expect(result.outcome).toBe('failed');
  });

  it('is failed when status is verified but confidence is below the publish threshold', async () => {
    setFlywheelOrchestrator({
      verify: vi.fn().mockResolvedValue({ overallStatus: 'verified', overallConfidence: 0.1, tierUsed: 'tier1_rag' }),
    });
    const result = await verifyAndPublish(makeProblem());
    expect(result.verified).toBe(false);
    expect(result.outcome).toBe('failed');
  });

  it('is failed (not inconclusive) when no orchestrator is configured at all', async () => {
    setFlywheelOrchestrator(null as unknown as never);
    const result = await verifyAndPublish(makeProblem());
    expect(result.verified).toBe(false);
    expect(result.outcome).toBe('failed');
  });

  it('a thrown verify() error is reported as failed, not inconclusive — the orchestrator itself already owns that distinction', async () => {
    setFlywheelOrchestrator({
      verify: vi.fn().mockRejectedValue(new Error('unexpected crash')),
    });
    const result = await verifyAndPublish(makeProblem());
    expect(result.verified).toBe(false);
    expect(result.outcome).toBe('failed');
  });
});
