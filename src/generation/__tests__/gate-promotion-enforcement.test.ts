/**
 * Plan E8 enforcement, at both seams — with the scope boundary pinned.
 *
 * The boundary is the whole point of E8: an item carrying
 * `generation_run_id` provenance needs its five gates; an item without one
 * is untouched. If that ever inverts, the 505 committed items and the
 * DB-less demo go dark, which is the failure mode E8 was written to
 * prevent.
 */

import { describe, it, expect, vi } from 'vitest';
import type pg from 'pg';
import { filterByGateLedger } from '../../scoring/learning-object-catalog-pg';
import { PgLearningsLedgerRepo } from '../../storage/repositories/learnings-ledger-repo';

type Row = Parameters<typeof filterByGateLedger>[0][number];

function row(id: string, generation_run_id: string | null): Row {
  return {
    id,
    concept_id: 'eigenvalues',
    topic: 'linear-algebra',
    difficulty: 0.5,
    question_text: 'q',
    correct_answer: 'a',
    solution_steps: [],
    distractors: [],
    verified: true,
    verification_method: 'hand_authored',
    times_served: 0,
    generation_run_id,
  } as Row;
}

describe('serving seam — filterByGateLedger', () => {
  it('returns rows untouched, with NO ledger read, when none carry provenance', async () => {
    const gateCheck = vi.fn();
    const rows = [row('a', null), row('b', null)];
    const out = await filterByGateLedger(rows, null, gateCheck);
    expect(out).toEqual(rows);
    expect(gateCheck).not.toHaveBeenCalled();
  });

  it('drops a provenance-carrying row whose gates are not satisfied', async () => {
    const gateCheck = vi.fn().mockResolvedValue(new Set<string>());
    const out = await filterByGateLedger([row('gen-1', 'run-1')], null, gateCheck);
    expect(out).toEqual([]);
  });

  it('keeps a provenance-carrying row once its gates are satisfied', async () => {
    const gateCheck = vi.fn().mockResolvedValue(new Set(['gen-1']));
    const out = await filterByGateLedger([row('gen-1', 'run-1')], null, gateCheck);
    expect(out.map((r) => r.id)).toEqual(['gen-1']);
  });

  it('a blocked generated row never takes a file-seeded row down with it', async () => {
    const gateCheck = vi.fn().mockResolvedValue(new Set<string>());
    const out = await filterByGateLedger([row('authored', null), row('gen-1', 'run-1')], null, gateCheck);
    expect(out.map((r) => r.id)).toEqual(['authored']);
    // Only the provenance-carrying id is even asked about.
    expect(gateCheck).toHaveBeenCalledWith(['gen-1'], null);
  });
});

/** Minimal pg.Pool stand-in routed by SQL text. */
function promotionPool(opts: {
  provenanced: string[];
  satisfied: string[];
  provenanceLookupThrows?: boolean;
}): { pool: pg.Pool; updates: Array<{ sql: string; params: unknown[] }> } {
  const updates: Array<{ sql: string; params: unknown[] }> = [];
  const pool = {
    query: async (sql: string, params: unknown[] = []) => {
      if (/generation_run_id IS NOT NULL/.test(sql)) {
        if (opts.provenanceLookupThrows) throw new Error('column does not exist');
        return { rows: opts.provenanced.map((id) => ({ id })) };
      }
      if (/FROM content_gate_ledger/.test(sql)) {
        return { rows: opts.satisfied.map((id) => ({ item_id: id, satisfied: '5' })) };
      }
      if (/^\s*UPDATE/.test(sql)) updates.push({ sql, params });
      return { rows: [] };
    },
  } as unknown as pg.Pool;
  return { pool, updates };
}

function generatedProblemsUpdate(updates: Array<{ sql: string; params: unknown[] }>) {
  return updates.find((u) => /UPDATE generated_problems/.test(u.sql));
}

describe('promotion seam — applyPromotion', () => {
  it('promotes non-provenance targets exactly as before', async () => {
    const { pool, updates } = promotionPool({ provenanced: [], satisfied: [] });
    await new PgLearningsLedgerRepo(pool).applyPromotion(['authored-1', 'authored-2'], 'won');
    expect(generatedProblemsUpdate(updates)?.params[0]).toEqual(['authored-1', 'authored-2']);
  });

  it('refuses to promote a provenance-carrying target whose gates are not satisfied', async () => {
    const { pool, updates } = promotionPool({ provenanced: ['gen-1'], satisfied: [] });
    await new PgLearningsLedgerRepo(pool).applyPromotion(['gen-1'], 'won');
    // Nothing left to promote → the generated_problems UPDATE never runs.
    expect(generatedProblemsUpdate(updates)).toBeUndefined();
  });

  it('promotes a provenance-carrying target once its five gates are satisfied', async () => {
    const { pool, updates } = promotionPool({ provenanced: ['gen-1'], satisfied: ['gen-1'] });
    await new PgLearningsLedgerRepo(pool).applyPromotion(['gen-1'], 'won');
    expect(generatedProblemsUpdate(updates)?.params[0]).toEqual(['gen-1']);
  });

  it('a blocked generated target does not block an authored one in the same batch', async () => {
    const { pool, updates } = promotionPool({ provenanced: ['gen-1'], satisfied: [] });
    await new PgLearningsLedgerRepo(pool).applyPromotion(['authored-1', 'gen-1'], 'won');
    expect(generatedProblemsUpdate(updates)?.params[0]).toEqual(['authored-1']);
  });

  it('fails CLOSED: a failed provenance lookup skips the generated_problems promotion entirely', async () => {
    const { pool, updates } = promotionPool({ provenanced: [], satisfied: [], provenanceLookupThrows: true });
    await new PgLearningsLedgerRepo(pool).applyPromotion(['gen-1'], 'won');
    expect(generatedProblemsUpdate(updates)).toBeUndefined();
    // The atom_versions / media_artifacts promotions still ran — one
    // subsystem's uncertainty must not silently cancel the others.
    expect(updates.some((u) => /UPDATE atom_versions/.test(u.sql))).toBe(true);
  });
});
