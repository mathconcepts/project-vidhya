/**
 * Tests for PgStudentModel.update()'s transaction shape (T6 / ENG-D4.2).
 *
 * Locks two fixes:
 *   1. The `attempt_dedup` INSERT now runs INSIDE the BEGIN/COMMIT
 *      transaction (via `client.query`, not the pool) — a ROLLBACK
 *      undoes the dedup row along with everything else, so a retry with
 *      the identical (studentId, objectId, ts) is not permanently blocked
 *      by a half-failed attempt.
 *   2. `attempt_error_tags` persistence moved to AFTER COMMIT as a
 *      best-effort, LOGGED write — it can no longer abort the primary
 *      transaction.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Attempt } from '../../core/interfaces';

const mockPoolQuery = vi.fn();
const mockConnect = vi.fn();

vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({ query: mockPoolQuery, connect: mockConnect })),
  },
}));

process.env.DATABASE_URL = 'postgres://test/test';

const { PgStudentModel } = await import('../student-model-pg');
const { onAttemptRecorded, __clearAttemptListeners } = await import('../../events/attempts-bus');

beforeEach(() => {
  mockPoolQuery.mockReset();
  mockConnect.mockReset();
  __clearAttemptListeners();
});

/** A scripted client: each entry is either a resolved value or an Error to reject with. */
function makeClient(steps: Array<unknown | Error>) {
  const query = vi.fn();
  for (const step of steps) {
    if (step instanceof Error) {
      query.mockImplementationOnce(() => Promise.reject(step));
    } else {
      query.mockImplementationOnce(() => Promise.resolve(step));
    }
  }
  return { query, release: vi.fn() };
}

const ATTEMPT: Attempt = {
  studentId: 's1',
  objectId: 'o1',
  skillId: 'k1',
  correct: true,
  latencyMs: 5_000,
  ts: 12345,
};

/** The 12-call happy-path sequence: BEGIN, dedup, sSelect, iSelect, sInsert,
 *  iInsert, cSelect, cInsert, attempt_facts SAVEPOINT/INSERT/RELEASE (plan
 *  E1, migration 051 — see attempt-facts.ts), COMMIT. Matches the code's
 *  actual query order. */
function happyPathSteps() {
  return [
    {},                                // BEGIN
    { rowCount: 1 },                   // dedup insert — not a duplicate
    { rows: [] },                      // student_skill_elo select
    { rows: [] },                      // item_difficulty_elo select
    {},                                // student_skill_elo upsert
    {},                                // item_difficulty_elo upsert
    { rows: [] },                      // fsrs_cards select
    {},                                // fsrs_cards upsert
    {},                                // SAVEPOINT attempt_fact
    {},                                // attempt_facts INSERT
    {},                                // RELEASE SAVEPOINT attempt_fact
    {},                                // COMMIT
  ];
}

describe('PgStudentModel.update() — dedup-inside-tx rollback semantics', () => {
  it('a rolled-back attempt is retryable with the same ts (dedup insert undone by ROLLBACK)', async () => {
    const model = new PgStudentModel();

    // First attempt: dedup insert succeeds, then the Elo select blows up.
    const client1 = makeClient([
      {},                              // BEGIN
      { rowCount: 1 },                 // dedup insert
      new Error('elo backend unreachable'), // student_skill_elo select throws
      {},                              // ROLLBACK (issued by the catch block)
    ]);
    mockConnect.mockResolvedValueOnce(client1);

    await expect(model.update(ATTEMPT)).rejects.toThrow('elo backend unreachable');

    // Dedup insert ran on the CLIENT (inside the tx), never on the bare pool.
    expect(client1.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('attempt_dedup'),
      [ATTEMPT.studentId, ATTEMPT.objectId, ATTEMPT.ts],
    );
    // The catch block issued a real ROLLBACK.
    expect(client1.query).toHaveBeenNthCalledWith(4, 'ROLLBACK');
    expect(mockPoolQuery).not.toHaveBeenCalledWith(
      expect.stringContaining('attempt_dedup'),
      expect.anything(),
    );

    // Retry with the IDENTICAL attempt (same studentId/objectId/ts). If the
    // dedup insert had landed outside the tx, Postgres's ON CONFLICT DO
    // NOTHING would return rowCount 0 forever here. Because it lived inside
    // the rolled-back tx, the row never persisted — the retry's dedup
    // insert succeeds again (rowCount: 1), and the full sequence completes.
    const client2 = makeClient(happyPathSteps());
    mockConnect.mockResolvedValueOnce(client2);

    await expect(model.update(ATTEMPT)).resolves.toBeUndefined();
    expect(client2.query).toHaveBeenNthCalledWith(12, 'COMMIT');
  });

  it('a duplicate (already-committed) attempt is a no-op: COMMIT, no further writes, no bus event', async () => {
    const model = new PgStudentModel();
    const client = makeClient([
      {},                 // BEGIN
      { rowCount: 0 },    // dedup insert — ON CONFLICT DO NOTHING, already seen
      {},                 // COMMIT (short-circuit path)
    ]);
    mockConnect.mockResolvedValueOnce(client);

    const seen: Attempt[] = [];
    onAttemptRecorded(a => seen.push(a));

    await model.update(ATTEMPT);

    expect(client.query).toHaveBeenCalledTimes(3);
    expect(client.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(seen).toHaveLength(0); // dup never publishes attempt.recorded
  });
});

describe('PgStudentModel.update() — error-tag persistence moved after COMMIT', () => {
  it('error tags are written on the POOL after commit, not inside the client transaction', async () => {
    const model = new PgStudentModel();
    const client = makeClient(happyPathSteps());
    mockConnect.mockResolvedValueOnce(client);
    mockPoolQuery.mockResolvedValueOnce({}); // the post-commit error-tag insert

    const attemptWithTags: Attempt = { ...ATTEMPT, errorTags: ['sign'] };
    await model.update(attemptWithTags);

    // Exactly the 12 happy-path calls on the client — no error-tag insert in there.
    expect(client.query).toHaveBeenCalledTimes(12);
    for (const call of client.query.mock.calls) {
      expect(String(call[0])).not.toContain('attempt_error_tags');
    }
    // The error-tag insert happened on the pool, post-commit.
    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining('attempt_error_tags'),
      [ATTEMPT.studentId, ATTEMPT.objectId, ATTEMPT.ts, attemptWithTags.errorTags],
    );
  });

  it('a failed best-effort error-tag write is LOGGED and does not throw or block the bus event', async () => {
    const model = new PgStudentModel();
    const client = makeClient(happyPathSteps());
    mockConnect.mockResolvedValueOnce(client);
    mockPoolQuery.mockRejectedValueOnce(new Error('attempt_error_tags table missing'));

    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const seen: Attempt[] = [];
    onAttemptRecorded(a => seen.push(a));

    const attemptWithTags: Attempt = { ...ATTEMPT, errorTags: ['careless'] };
    await expect(model.update(attemptWithTags)).resolves.toBeUndefined();

    expect(consoleErr).toHaveBeenCalledWith(
      expect.stringContaining('best-effort error-tag persist failed'),
      expect.any(Error),
    );
    expect(seen).toHaveLength(1); // bus event still fires despite the tag-write failure
    consoleErr.mockRestore();
  });
});

describe('PgStudentModel.update() — integration: Elo + FSRS + bus event', () => {
  it('one attempt writes Elo + FSRS and publishes attempt.recorded', async () => {
    const model = new PgStudentModel();
    const client = makeClient(happyPathSteps());
    mockConnect.mockResolvedValueOnce(client);

    const seen: Attempt[] = [];
    onAttemptRecorded(a => seen.push(a));

    await model.update(ATTEMPT);

    // Elo writes for both student and item legs.
    const sql = client.query.mock.calls.map(c => String(c[0]));
    expect(sql.some(s => s.includes('student_skill_elo') && s.includes('INSERT'))).toBe(true);
    expect(sql.some(s => s.includes('item_difficulty_elo') && s.includes('INSERT'))).toBe(true);
    // FSRS card write.
    expect(sql.some(s => s.includes('fsrs_cards') && s.includes('INSERT'))).toBe(true);

    // Bus event fired post-commit with the same attempt.
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual(ATTEMPT);
  });
});
