/**
 * Tests for PgStudentModel.update()'s FIRe-lite wiring (T11/B2 §4).
 *
 * Locks:
 *   - VIDHYA_FIRE unset (default) → zero extra queries beyond the normal
 *     9-call happy path (byte-identical behavior for every deploy that
 *     hasn't opted in).
 *   - VIDHYA_FIRE=on but the attempted concept has no encompassing edges
 *     → still zero extra queries (fire.ts's empty-closure no-op, checked
 *     BEFORE issuing any SQL).
 *   - VIDHYA_FIRE=on with a real closure → the propagation SELECT uses a
 *     deterministic `ORDER BY object_id` lock order and `FOR UPDATE`,
 *     excludes the attempted card's own object_id, and (when rows come
 *     back) writes them in ONE batched UPDATE ... FROM unnest(...).
 *   - VIDHYA_FIRE=on with a closure but NO existing cards → no UPDATE
 *     issued at all (nothing due = no-op, not an empty write).
 *   - All FIRe queries run on the CLIENT (inside the tx), never the pool.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

beforeEach(() => {
  mockPoolQuery.mockReset();
  mockConnect.mockReset();
  delete process.env.VIDHYA_FIRE;
});

afterEach(() => {
  delete process.env.VIDHYA_FIRE;
});

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

/** The 9-call happy path up to and including COMMIT, with no FIRe steps. */
function happyPathSteps() {
  return [
    {},                 // BEGIN
    { rowCount: 1 },    // dedup insert
    { rows: [] },       // student_skill_elo select
    { rows: [] },       // item_difficulty_elo select
    {},                 // student_skill_elo upsert
    {},                 // item_difficulty_elo upsert
    { rows: [] },       // fsrs_cards select
    {},                 // fsrs_cards upsert
    {},                 // COMMIT
  ];
}

const NON_LA_ATTEMPT: Attempt = {
  studentId: 's1', objectId: 'o1', skillId: 'sequences', // no encompassing edges
  correct: true, latencyMs: 3_000, ts: 1,
};

const LA_ATTEMPT: Attempt = {
  studentId: 's1', objectId: 'o-eigen-1', skillId: 'eigenvalues', // has a real closure
  correct: true, latencyMs: 3_000, ts: new Date('2026-06-15T00:00:00.000Z').getTime(),
};

describe('PgStudentModel.update() — VIDHYA_FIRE unset (default)', () => {
  it('issues exactly the 9-call happy path, no FIRe queries, for an LA concept with a real closure', async () => {
    const model = new PgStudentModel();
    const client = makeClient(happyPathSteps());
    mockConnect.mockResolvedValueOnce(client);

    await model.update(LA_ATTEMPT);

    expect(client.query).toHaveBeenCalledTimes(9);
    expect(client.query).toHaveBeenNthCalledWith(9, 'COMMIT');
  });
});

describe('PgStudentModel.update() — VIDHYA_FIRE=on, empty closure', () => {
  it('a concept with no encompassing edges issues zero extra queries', async () => {
    process.env.VIDHYA_FIRE = 'on';
    const model = new PgStudentModel();
    const client = makeClient(happyPathSteps());
    mockConnect.mockResolvedValueOnce(client);

    await model.update(NON_LA_ATTEMPT);

    expect(client.query).toHaveBeenCalledTimes(9); // fire.ts's closure.size===0 short-circuit
    expect(client.query).toHaveBeenNthCalledWith(9, 'COMMIT');
  });
});

describe('PgStudentModel.update() — VIDHYA_FIRE=on, real closure, no existing cards', () => {
  it('issues the closure SELECT but no UPDATE, then COMMITs', async () => {
    process.env.VIDHYA_FIRE = 'on';
    const model = new PgStudentModel();
    const client = makeClient([
      ...happyPathSteps().slice(0, 8), // BEGIN..fsrs_cards upsert (8 calls, no COMMIT yet)
      { rows: [] },                    // FIRe closure SELECT — nothing to nudge
      {},                              // COMMIT
    ]);
    mockConnect.mockResolvedValueOnce(client);

    await model.update(LA_ATTEMPT);

    expect(client.query).toHaveBeenCalledTimes(10);
    const [selectSql, selectParams] = client.query.mock.calls[8];
    expect(String(selectSql)).toContain('FOR UPDATE');
    expect(String(selectSql)).toContain('ORDER BY object_id');
    expect(String(selectSql)).toContain('fsrs_cards');
    expect(selectParams[0]).toBe('s1');
    // eigenvalues' full depth-<=2 down-closure (determinants + systems-of-equations
    // at depth 1, matrix-operations + matrix-inverse reachable at depth 2).
    expect(new Set(selectParams[1])).toEqual(
      new Set(['determinants', 'systems-of-equations', 'matrix-operations', 'matrix-inverse']),
    );
    expect(selectParams[2]).toBe('o-eigen-1'); // the attempted card's own object_id, excluded
    expect(client.query).toHaveBeenNthCalledWith(10, 'COMMIT');
  });
});

describe('PgStudentModel.update() — VIDHYA_FIRE=on, real closure with existing cards', () => {
  it('writes the propagated cards in ONE batched UPDATE ... unnest(...)', async () => {
    process.env.VIDHYA_FIRE = 'on';
    const model = new PgStudentModel();
    const client = makeClient([
      ...happyPathSteps().slice(0, 8),
      {
        rows: [
          {
            object_id: 'o-det-1', skill_id: 'determinants',
            stability: 5, difficulty: 5,
            last_review_at: '2026-06-01T00:00:00.000Z', reps: 3, lapses: 0,
            due_at: '2026-06-10T00:00:00.000Z',
          },
        ],
      }, // FIRe closure SELECT — one existing card
      {}, // the batched UPDATE
      {}, // COMMIT
    ]);
    mockConnect.mockResolvedValueOnce(client);

    await model.update(LA_ATTEMPT);

    expect(client.query).toHaveBeenCalledTimes(11);
    const [updateSql, updateParams] = client.query.mock.calls[9];
    expect(String(updateSql)).toContain('UPDATE fsrs_cards');
    expect(String(updateSql)).toContain('unnest(');
    expect(updateParams[0]).toBe('s1');
    expect(updateParams[1]).toEqual(['o-det-1']);
    expect(updateParams[2][0]).toBeGreaterThan(5); // correct attempt -> stability increases
    expect(client.query).toHaveBeenNthCalledWith(11, 'COMMIT');
  });

  it('never issues FIRe queries on the bare pool — everything runs on the client inside the tx', async () => {
    process.env.VIDHYA_FIRE = 'on';
    const model = new PgStudentModel();
    const client = makeClient([
      ...happyPathSteps().slice(0, 8),
      { rows: [] },
      {},
    ]);
    mockConnect.mockResolvedValueOnce(client);

    await model.update(LA_ATTEMPT);

    expect(mockPoolQuery).not.toHaveBeenCalled();
  });
});
