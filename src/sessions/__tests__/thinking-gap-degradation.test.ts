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
 * These tests pin the honest degradation: no database is not an error.
 *
 * Follow-up (/investigate, live-QA: "insight not available"): the SAME "no
 * LLM provider configured" condition this file already exercises (the
 * `getLlmForRole` mock below) used to degrade all the way to
 * `{ text: null, source: 'unavailable' }` — showing "No extra insight
 * available" on every wrong answer platform-wide, not one item. It now
 * degrades to `deterministicGapFallback()`'s real, content-free explanation
 * instead — see thinking-gap-service.ts's updated `getThinkingGap` doc
 * comment.
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

  it('resolves instead of throwing when there is no database and no model, with a real fallback explanation', async () => {
    const { getThinkingGap } = await import('../thinking-gap-service');
    const result = await getThinkingGap({
      concept_id: 'eigenvalues',
      question: 'Find the dominant eigenvalue of [[3,0],[0,1]].',
      expected_answer: '3',
      user_answer: '-3',
    });
    // -3 is the exact negative of 3 — classified as a sign error.
    expect(result.text).toMatch(/sign flipped/);
    expect(result.source).toBe('fallback');
  });

  it('reports the fallback as generic, never personalised, regardless of framing', async () => {
    // Content maturity has to be honest or the admin hint is worse than none —
    // a deterministic template is not personalised no matter who asked for it.
    const { getThinkingGap } = await import('../thinking-gap-service');
    const cold = await getThinkingGap({
      concept_id: 'eigenvalues',
      question: 'q',
      expected_answer: '1',
      user_answer: '2',
    });
    expect(cold.personalized).toBe(false);
    expect(cold.framing).toBe('cold/steady/balanced');

    const framed = await getThinkingGap({
      concept_id: 'eigenvalues',
      question: 'q',
      expected_answer: '1',
      user_answer: '2',
      framing: { band: 'building', stance: 'shaken', mode: 'geometric' },
    });
    expect(framed.personalized).toBe(false);
    expect(framed.framing).toBe('building/shaken/geometric');
    expect(framed.source).toBe('fallback');
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
