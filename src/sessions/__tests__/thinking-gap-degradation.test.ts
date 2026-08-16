/**
 * The 15-minute session's "Generating insight…" spinner used to run for six
 * polls and then vanish leaving nothing, on every deploy without a database —
 * which is what the demo instance is.
 *
 * Cause: `getPool()` constructed a Pool unconditionally, so the first cache
 * query threw and the whole path aborted before it ever reached the model.
 * Nothing surfaced the failure; the student just saw an empty space where the
 * explanation should have been.
 *
 * These tests pin the honest degradation: no database is not an error, and a
 * missing model is reported as unavailable rather than thrown.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIGINAL_DB_URL = process.env.DATABASE_URL;

// No LLM configured either — the harshest case, and the one that used to
// throw first at the pool rather than reaching this decision at all.
vi.mock('../../llm/runtime', () => ({
  getLlmForRole: async () => null,
}));

describe('thinking-gap degradation without a database', () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  afterEach(() => {
    if (ORIGINAL_DB_URL === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = ORIGINAL_DB_URL;
  });

  it('resolves instead of throwing when there is no database and no model', async () => {
    const { getThinkingGap } = await import('../thinking-gap-service');
    const result = await getThinkingGap({
      concept_id: 'eigenvalues',
      question: 'Find the eigenvalues of [[2,0],[0,3]].',
      expected_answer: '2, 3',
      user_answer: '-2, -3',
    });
    expect(result.text).toBeNull();
    expect(result.source).toBe('unavailable');
  });

  it('reports a cold anonymous session as generic, not as personalised', async () => {
    // Content maturity has to be honest or the admin hint is worse than none.
    const { getThinkingGap } = await import('../thinking-gap-service');
    const result = await getThinkingGap({
      concept_id: 'eigenvalues',
      question: 'q',
      expected_answer: '1',
      user_answer: '2',
    });
    expect(result.personalized).toBe(false);
    expect(result.framing).toBe('cold/steady/balanced');
  });

  it('reports a framed request as personalised even when the text is unavailable', async () => {
    const { getThinkingGap } = await import('../thinking-gap-service');
    const result = await getThinkingGap({
      concept_id: 'eigenvalues',
      question: 'q',
      expected_answer: '1',
      user_answer: '2',
      framing: { band: 'building', stance: 'shaken', mode: 'geometric' },
    });
    expect(result.personalized).toBe(true);
    expect(result.framing).toBe('building/shaken/geometric');
  });

  it('attachThinkingGap does not throw without a database', async () => {
    const { attachThinkingGap } = await import('../thinking-gap-service');
    await expect(
      attachThinkingGap('studymate-1', 'problem-1', {
        concept_id: 'eigenvalues',
        question: 'q',
        expected_answer: '1',
        user_answer: '2',
        session_id: 'anon-session',
      }),
    ).resolves.toBeUndefined();
  });
});
