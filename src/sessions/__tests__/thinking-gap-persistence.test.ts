/**
 * Regression test for /investigate (2026-09-02): "generating insights is
 * not loading". attachThinkingGap successfully generated a real insight
 * even on a DB-less deploy, then threw it away — persistence was a raw
 * Postgres `pool.query` call that early-returned on `!pool`, with a comment
 * claiming "the text is still generated above so an in-memory/demo caller
 * can use the return value" even though attachThinkingGap's return value
 * (a fire-and-forget void Promise) is never read by its caller
 * (studymate-routes.ts's h_answer). The FlatFileStore backend
 * (session-store.ts) already had a `gap_text` field ready to receive it —
 * nothing ever wrote to it, so the client's poll loop in
 * StudymateSessionPage.tsx ran for six tries and found nothing, every time,
 * on every deploy without DATABASE_URL — which is what the demo instance is.
 *
 * Fixed by persisting through the SAME `SessionStore.updateGapText()`
 * abstraction both backends implement, instead of reaching around it.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

const ORIGINAL_DB_URL = process.env.DATABASE_URL;
let testDir: string;
let cwdSpy: ReturnType<typeof vi.spyOn>;

vi.mock('../../llm/runtime', () => ({
  getLlmForRole: async () => ({ generate: async () => 'Because you flipped the sign on the residue.' }),
}));

describe('attachThinkingGap — persists a generated insight without a database', () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thinking-gap-'));
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(testDir);
    vi.resetModules();
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(testDir, { recursive: true, force: true });
    if (ORIGINAL_DB_URL === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = ORIGINAL_DB_URL;
    vi.resetModules();
  });

  it('writes the generated gap_text into the flat-file session store, not just the return value', async () => {
    const { getSessionStore, _resetSessionStoreForTests } = await import('../session-store');
    _resetSessionStoreForTests();
    const store = getSessionStore();
    expect(store.constructor.name).toBe('FlatFileStore');

    const studymateId = await store.createSession('user-1', 'gate-ma', 'daily', [{
      problem_id: 'p1',
      concept_id: 'eigenvalues',
      topic: 'linear-algebra',
      difficulty: 0.3,
      question: 'Find the eigenvalues of [[2,0],[0,3]].',
      expected_answer: '2, 3',
      source: 'bundle',
    }]);

    const { attachThinkingGap } = await import('../thinking-gap-service');
    await attachThinkingGap(studymateId, 'p1', {
      concept_id: 'eigenvalues',
      question: 'Find the eigenvalues of [[2,0],[0,3]].',
      expected_answer: '2, 3',
      user_answer: '-2, -3',
      // Framing passed explicitly so the test doesn't also depend on the
      // student-model lookup path.
      framing: { band: 'building', stance: 'shaken', mode: 'geometric' },
    });

    const problems = await store.getSessionProblems(studymateId);
    expect(problems[0].gap_text).toBe('Because you flipped the sign on the residue.');
  });
});
