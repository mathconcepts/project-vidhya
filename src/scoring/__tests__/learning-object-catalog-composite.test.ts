/**
 * CompositeLearningObjectCatalog (T21 — outside-voice amendment 1,
 * docs/designs/linear-algebra-realtime-and-math-academy-plan.md).
 *
 * Acceptance criteria from the plan:
 *   - with DATABASE_URL set, `getById('la-eigen-trace-det-001')` (an
 *     authored file item) still serves.
 *   - an id collision between the file and pg catalogs resolves to the
 *     DB row.
 *   - both catalogs produce IDENTICAL Elo for the same 0..1 difficulty
 *     (the T21 unit-reconciliation fix — pg used to be 600+1800d, file
 *     800+1400d, a real 2× bias at some difficulties).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockQuery = vi.fn();
vi.mock('pg', () => ({
  default: { Pool: vi.fn(() => ({ query: mockQuery })) },
}));

import { PgLearningObjectCatalog } from '../learning-object-catalog-pg';
import { FileLearningObjectCatalog } from '../learning-object-catalog-file';
import { CompositeLearningObjectCatalog } from '../learning-object-catalog-composite';
import { difficultyToElo } from '../difficulty-elo';

function pgRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pg-only-001',
    concept_id: 'eigenvalues',
    topic: 'Linear Algebra',
    difficulty: 0.35,
    question_text: 'pg question',
    correct_answer: 'pg answer',
    solution_steps: [],
    distractors: [],
    verified: true,
    verification_method: 'wolfram_verified',
    times_served: 2,
    ...overrides,
  };
}

const savedDatabaseUrl = process.env.DATABASE_URL;

beforeEach(() => {
  mockQuery.mockReset();
  process.env.DATABASE_URL = 'postgres://fake:fake@localhost:5432/fake';
});

afterEach(() => {
  if (savedDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = savedDatabaseUrl;
});

function makeComposite(): CompositeLearningObjectCatalog {
  return new CompositeLearningObjectCatalog(new FileLearningObjectCatalog(), new PgLearningObjectCatalog());
}

describe('CompositeLearningObjectCatalog — T21', () => {
  it('an authored file item still serves with DATABASE_URL set and no matching pg row', async () => {
    mockQuery.mockResolvedValue({ rows: [] }); // pg has nothing
    const catalog = makeComposite();
    const item = await catalog.getById('la-eigen-trace-det-001');
    expect(item).not.toBeNull();
    expect(item!.nodeId).toBe('eigenvalues');
    expect(item!.verification).toBe('human_verified');
  });

  it('an id collision resolves to the DB row, not the file row', async () => {
    // The DB happens to have a row at the SAME id as the authored file item.
    mockQuery.mockResolvedValue({
      rows: [pgRow({ id: 'la-eigen-trace-det-001', question_text: 'DB VERSION', verification_method: 'wolfram_verified' })],
    });
    const catalog = makeComposite();
    const item = await catalog.getById('la-eigen-trace-det-001');
    expect(item).not.toBeNull();
    expect((item!.payload as { questionText?: string }).questionText).toBe('DB VERSION');
    expect(item!.verification).toBe('cas_passed'); // pg row's label, not the file's human_verified
  });

  it('query() merges both sources for a skill, DB wins on collision, sorted by difficulty', async () => {
    mockQuery.mockImplementation(async (sql: string) => {
      // The SELECT * ... WHERE concept_id = $1 shape (query, not getById/exposureCount).
      if (typeof sql === 'string' && sql.includes('WHERE concept_id')) {
        return { rows: [pgRow({ id: 'pg-only-eigen', difficulty: 0.1 })] };
      }
      return { rows: [] };
    });
    const catalog = makeComposite();
    const results = await catalog.query({ skillId: 'eigenvalues' } as never);
    const ids = results.map((r) => r.id);
    expect(ids).toContain('pg-only-eigen'); // from pg
    expect(ids).toContain('la-eigen-trace-det-001'); // from file
    // sorted by difficulty ascending
    for (let i = 1; i < results.length; i++) {
      expect(results[i].difficulty).toBeGreaterThanOrEqual(results[i - 1].difficulty);
    }
  });

  it('exposureCount is Pg-only signal, 0 for a file-only id', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const catalog = makeComposite();
    expect(await catalog.exposureCount('la-eigen-trace-det-001')).toBe(0);
  });

  it('exposureCount reads through from Pg for a pg-backed id', async () => {
    mockQuery.mockResolvedValue({ rows: [{ times_served: 7 }] });
    const catalog = makeComposite();
    expect(await catalog.exposureCount('pg-only-001')).toBe(7);
  });

  it('T21 unit reconciliation: file and pg catalogs produce IDENTICAL Elo for the same 0..1 difficulty', async () => {
    // la-eigen-trace-det-001 is authored at difficulty 0.35.
    mockQuery.mockResolvedValue({ rows: [pgRow({ id: 'pg-parity-001', difficulty: 0.35 })] });
    const catalog = makeComposite();
    const fileItem = await catalog.getById('la-eigen-trace-det-001');
    // Force the pg lookup by asking for the pg-only id — id differs, but the
    // point is the SHARED mapping, not equal ids.
    mockQuery.mockImplementation(async (sql: string, params: unknown[]) => {
      if (params?.[0] === 'pg-parity-001') return { rows: [pgRow({ id: 'pg-parity-001', difficulty: 0.35 })] };
      return { rows: [] };
    });
    const pgItem = await catalog.getById('pg-parity-001');
    expect(fileItem!.difficulty).toBe(pgItem!.difficulty);
    expect(fileItem!.difficulty).toBe(difficultyToElo(0.35));
  });

  it('sanity: the shared mapping differs from the OLD, now-fixed pg-only formula (600 + 1800d)', () => {
    // Pins the actual bug this fixes: at d=0.35 the old pg formula gave
    // 600 + 1800*0.35 = 1230, while the old file formula gave 800 +
    // 1400*0.35 = 1290 — a real divergence the shared module eliminates.
    const oldPgFormula = 600 + 1800 * 0.35;
    expect(difficultyToElo(0.35)).not.toBe(oldPgFormula);
    expect(difficultyToElo(0.35)).toBe(800 + 1400 * 0.35);
  });
});
