/**
 * personalized-regen tests — DB-less mode + threshold contract.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockQuery })),
  },
}));

// Real production call site: generatePersonalVariant() calls generateConcept
// from ./orchestrator (not exported itself — reached only via
// maybeQueueRegenForStudent's fire-and-forget dispatch). Mocked the same way
// other src/content tests mock modules (e.g. atom-versions-by-run.test.ts's
// `vi.mock('pg', ...)` pattern) so we can assert on the exact call shape
// without exercising the real LLM cascade.
const mockGenerateConcept = vi.fn();
vi.mock('../orchestrator', () => ({
  generateConcept: (...args: unknown[]) => mockGenerateConcept(...args),
}));

// buildStudentContext also touches 'pg' internally (its own queries); stub it
// out so the mocked mockQuery sequence below only has to answer
// personalized-regen.ts's own three queries plus the override upsert.
vi.mock('../../personalization/student-context', () => ({
  buildStudentContext: vi.fn().mockResolvedValue({}),
}));

import {
  maybeQueueRegenForStudent,
  readStudentOverrides,
  PERSONAL_FAILURE_THRESHOLD,
  PERSONAL_FAILURE_WINDOW_DAYS,
  PERSONAL_OVERRIDE_TTL_DAYS,
} from '../personalized-regen';

describe('personalized-regen (DB unavailable)', () => {
  const original = process.env.DATABASE_URL;
  beforeEach(() => { delete process.env.DATABASE_URL; });
  afterEach(() => { if (original) process.env.DATABASE_URL = original; });

  it('maybeQueueRegenForStudent returns no_db when DATABASE_URL unset', async () => {
    const r = await maybeQueueRegenForStudent('student-1', 'derivatives-basic.intuition');
    expect(r.queued).toBe(false);
    expect(r.reason).toBe('no_db');
  });

  it('returns unknown_concept for unknown concept ids', async () => {
    process.env.DATABASE_URL = 'postgres://invalid-host:1/x';
    const r = await maybeQueueRegenForStudent('s', 'no-such-concept.intuition');
    expect(r.queued).toBe(false);
    expect(r.reason).toBe('unknown_concept');
  });

  it('readStudentOverrides returns empty map without DB', async () => {
    const m = await readStudentOverrides('student-1', ['a.b', 'c.d']);
    expect(m.size).toBe(0);
  });

  it('readStudentOverrides returns empty map for empty input', async () => {
    const m = await readStudentOverrides('student-1', []);
    expect(m.size).toBe(0);
  });

  it('exposes threshold + window + TTL constants', () => {
    expect(PERSONAL_FAILURE_THRESHOLD).toBe(3);
    expect(PERSONAL_FAILURE_WINDOW_DAYS).toBe(7);
    expect(PERSONAL_OVERRIDE_TTL_DAYS).toBe(14);
  });
});

describe('personalized-regen (DB available) — real production call site', () => {
  const originalDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    mockQuery.mockReset();
    mockGenerateConcept.mockReset();
    process.env.DATABASE_URL = 'postgres://test/test';
  });

  afterEach(() => {
    if (originalDbUrl) process.env.DATABASE_URL = originalDbUrl;
    else delete process.env.DATABASE_URL;
  });

  it('generatePersonalVariant (reached via maybeQueueRegenForStudent) calls generateConcept with generation_context: "personalized" — the P0 safety flag', async () => {
    // 1. failure-count query: at/above threshold → trigger fires.
    mockQuery.mockResolvedValueOnce({ rows: [{ cnt: PERSONAL_FAILURE_THRESHOLD }] });
    // 2. per-concept-per-week cap check: no active override → not blocked.
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // 3. recent error-pattern lookup, feeds trigger_reason.
    mockQuery.mockResolvedValueOnce({ rows: [{ error_text: 'sign error on the derivative' }] });
    // 4. the student_atom_overrides upsert generatePersonalVariant fires
    //    once generateConcept resolves.
    mockQuery.mockResolvedValueOnce({ rows: [] });

    mockGenerateConcept.mockResolvedValue({
      atoms: [{ content: 'a personalized variant body' }],
      rejected_atoms: [],
    });

    // Fresh module instance so this test's mocked 'pg' Pool is the one
    // actually constructed by getPool() — the module-scope `_pool` cache
    // would otherwise carry over a Pool built under a different mock/env
    // state from an earlier test in this file.
    vi.resetModules();
    const { maybeQueueRegenForStudent: freshMaybeQueue } = await import('../personalized-regen');

    const result = await freshMaybeQueue('student-1', 'derivatives-basic.intuition');
    expect(result.queued).toBe(true);
    expect(result.reason).toBe('queued');

    // maybeQueueRegenForStudent fires generatePersonalVariant without
    // awaiting it (Eng-review decision A: async fire-and-forget) — poll
    // until the mocked generateConcept has actually been invoked instead of
    // racing a fixed sleep.
    await vi.waitFor(() => expect(mockGenerateConcept).toHaveBeenCalled());

    expect(mockGenerateConcept).toHaveBeenCalledTimes(1);
    const call = mockGenerateConcept.mock.calls[0][0];
    // The P0 safety flag this test exists to lock: a refactor that drops or
    // mis-threads generation_context must fail this assertion.
    expect(call.generation_context).toBe('personalized');
    expect(call.concept_id).toBe('derivatives-basic');
    expect(call.dry_run).toBe(true);
  });
});
