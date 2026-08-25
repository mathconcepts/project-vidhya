/**
 * Coverage for src/db/seed-la-practice-items.ts — the boot-time seed that
 * closes the gap between "content exists as JSON" and "content exists as a
 * generated_problems row" (see docs/demo/buyer-qa-demo-prep.md: the buyer's
 * "ensure Linear Algebra is fully in the database" ask). Uses the REAL
 * data/practice-items/*.json fixtures against a fake pg.Pool, the same
 * pattern as seed-static-pyqs-concept-id.test.ts.
 */
import { ALL_CONCEPTS } from '../../constants/concept-graph';
import { describe, it, expect } from 'vitest';
import { seedPracticeItemsFromDisk, deterministicItemId } from '../seed-la-practice-items';
import { CONCEPT_MAP } from '../../constants/concept-graph';

interface Call { sql: string; params: any[] }

function makeFakePool() {
  const calls: Call[] = [];
  const pool = {
    query: async (sql: string, params: any[] = []) => {
      calls.push({ sql, params });
      return { rows: [] };
    },
  };
  return { pool, calls };
}

const LA_CONCEPT_IDS = [...CONCEPT_MAP.values()]
  .filter((c) => c.topic === 'linear-algebra')
  .map((c) => c.id);

describe('deterministicItemId', () => {
  it('is stable for the same seed', () => {
    expect(deterministicItemId('la-eigen-trace-det-001')).toBe(deterministicItemId('la-eigen-trace-det-001'));
  });

  it('differs for different seeds', () => {
    expect(deterministicItemId('item-a')).not.toBe(deterministicItemId('item-b'));
  });

  it('looks like a UUID (8-4-4-4-12 hex)', () => {
    expect(deterministicItemId('anything')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe('seedPracticeItemsFromDisk — Linear Algebra content floor', () => {
  it('upserts every item in data/practice-items/*.json', async () => {
    const { pool, calls } = makeFakePool();
    const seeded = await seedPracticeItemsFromDisk(pool as any);

    const inserts = calls.filter((c) => c.sql.includes('INSERT INTO generated_problems'));
    expect(inserts.length).toBe(seeded);
    // 5 LA files (130 items) + 2 calculus banks (95) + 1 DE bank (35)
    // = 260. Update this count deliberately if content is added — it is
    // the floor this test locks, not an incidental number.
    expect(seeded).toBe(260);
  });

  it('every one of the 26 canonical linear-algebra concepts has at least one seeded row', async () => {
    const { pool, calls } = makeFakePool();
    await seedPracticeItemsFromDisk(pool as any);

    expect(LA_CONCEPT_IDS.length).toBe(26);

    const inserts = calls.filter((c) => c.sql.includes('INSERT INTO generated_problems'));
    const seededConceptIds = new Set(inserts.map((c) => c.params[1])); // concept_id is param index 1

    const missing = LA_CONCEPT_IDS.filter((id) => !seededConceptIds.has(id));
    expect(missing).toEqual([]);
  });

  it('every row is stamped with the real topic slug from the concept graph, not the item file\'s display label', async () => {
    const { pool, calls } = makeFakePool();
    await seedPracticeItemsFromDisk(pool as any);

    const inserts = calls.filter((c) => c.sql.includes('INSERT INTO generated_problems'));
    const topicByConcept = new Map(ALL_CONCEPTS.map((cc) => [cc.id, cc.topic]));
    for (const call of inserts) {
      // topic is param index 2 — must be the concept graph's slug for the
      // row's concept_id ('linear-algebra', 'calculus', ...), never the
      // item JSON's own display-cased topic field.
      expect(call.params[2]).toBe(topicByConcept.get(call.params[1] as string));
    }
  });

  it('every row is marked verified and carries a deterministic (not random) id', async () => {
    const { pool, calls } = makeFakePool();
    await seedPracticeItemsFromDisk(pool as any);

    const inserts = calls.filter((c) => c.sql.includes('INSERT INTO generated_problems'));
    expect(inserts.length).toBeGreaterThan(0);
    for (const call of inserts) {
      expect(call.sql).toContain('true'); // verified = true is a literal, not a param, in the INSERT
      expect(call.params[0]).toMatch(/^[0-9a-f-]{36}$/);
    }
  });

  it('the insert is an upsert keyed on id (ON CONFLICT DO UPDATE), not a bare INSERT', async () => {
    const { pool, calls } = makeFakePool();
    await seedPracticeItemsFromDisk(pool as any);
    const inserts = calls.filter((c) => c.sql.includes('INSERT INTO generated_problems'));
    for (const call of inserts) {
      expect(call.sql).toContain('ON CONFLICT (id) DO UPDATE SET');
    }
  });

  it('is idempotent: running it twice produces the exact same set of ids', async () => {
    const first = makeFakePool();
    await seedPracticeItemsFromDisk(first.pool as any);
    const firstIds = first.calls.filter((c) => c.sql.includes('INSERT INTO generated_problems')).map((c) => c.params[0]).sort();

    const second = makeFakePool();
    await seedPracticeItemsFromDisk(second.pool as any);
    const secondIds = second.calls.filter((c) => c.sql.includes('INSERT INTO generated_problems')).map((c) => c.params[0]).sort();

    expect(secondIds).toEqual(firstIds);
  });
});
