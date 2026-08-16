/**
 * Regression: a wrong answer must still come back with its explanation when
 * the database is unreachable.
 *
 * What happened: `logError` opened a Postgres pool and INSERTed into
 * `error_log` with no guard. On the DB-less demo deploy that threw
 * ECONNREFUSED 127.0.0.1:5432 from inside `handleAttempt`, so the whole
 * POST /api/gbrain/attempt returned 500 — and PracticePage caught it with a
 * bare `catch {}`. Every wrong answer silently lost its explanation.
 *
 * The cruelty of the ordering is the point: `classifyError` and
 * `generateMisconceptionExplanation` both run BEFORE the log write, so the
 * diagnosis was fully computed and then discarded because an analytics INSERT
 * failed. Storage is worth less than the answer in front of the student.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logError } from '../error-taxonomy';
import type { ErrorDiagnosis } from '../error-taxonomy';

const ORIGINAL = process.env.DATABASE_URL;

const diagnosis = {
  error_type: 'conceptual',
  concept_id: 'eigenvalues',
  misconception_id: 'm_eigenvalue_sign',
  diagnosis: 'Treated the characteristic polynomial roots as the trace.',
  why_tempting: 'The trace is the sum of the eigenvalues, so it feels adjacent.',
  why_wrong: 'The sum is not the value of either root.',
  corrective_hint: 'Solve the quadratic rather than reading off the trace.',
} as unknown as ErrorDiagnosis;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = ORIGINAL;
  vi.restoreAllMocks();
});

describe('logError without a database', () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('resolves instead of throwing', async () => {
    // The caller awaits this mid-request. A rejection here is a 500 for the
    // student, and the explanation it would have carried is already paid for.
    await expect(
      logError('session-1', diagnosis, { problemId: 'p1', studentAnswer: 'x', correctAnswer: 'y' }),
    ).resolves.toBeUndefined();
  });

  it('does not throw when called repeatedly', async () => {
    for (let i = 0; i < 3; i++) {
      await expect(logError(`session-${i}`, diagnosis, {})).resolves.toBeUndefined();
    }
  });

  it('resolves when the connection string points nowhere real', async () => {
    // Distinct from "unset": migrations not run, or a host that refuses. Same
    // contract — the analytics row is lost, the response is not.
    process.env.DATABASE_URL = 'postgresql://nobody@127.0.0.1:1/none';
    await expect(logError('session-x', diagnosis, {})).resolves.toBeUndefined();
  }, 20_000);
});
