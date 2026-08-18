/**
 * Tests for src/readiness/composite-content-checker.ts — T5 (A1): the
 * "content-backed" gate requires BOTH lesson atoms AND a gradable catalog
 * item; fails closed on either dependency erroring.
 */

import { describe, it, expect, vi } from 'vitest';
import { CompositeContentChecker, getCompositeContentChecker } from '../composite-content-checker';
import type { ContentExistenceChecker } from '../content-gate';
import type { LearningObjectCatalog, CatalogQuery } from '../../scoring/learning-object-catalog';
import type { LearningObject } from '../../core/interfaces';

const OBJ = (id: string, nodeId: string): LearningObject => ({
  id, nodeId, type: 'practice', difficulty: 1500, estMinutes: 3, prereqs: [],
  verification: 'cas_passed', payload: {},
});

function catalogWithItems(itemsBySkill: Record<string, LearningObject[]>): LearningObjectCatalog {
  return {
    async query(q: CatalogQuery) {
      return (itemsBySkill[q.skillId] ?? []).slice(0, q.limit ?? 50);
    },
  };
}

function fakeAtomChecker(ids: string[]): ContentExistenceChecker {
  return { async hasContent(id) { return ids.includes(id); } };
}

describe('CompositeContentChecker', () => {
  it('returns true only when atoms AND a catalog item both exist', async () => {
    const checker = new CompositeContentChecker({
      atoms: fakeAtomChecker(['determinants']),
      catalog: catalogWithItems({ determinants: [OBJ('d1', 'determinants')] }),
    });
    expect(await checker.hasContent('determinants')).toBe(true);
  });

  it('returns false when atoms exist but the catalog has nothing for the skill', async () => {
    const checker = new CompositeContentChecker({
      atoms: fakeAtomChecker(['determinants']),
      catalog: catalogWithItems({}), // no catalog items anywhere
    });
    expect(await checker.hasContent('determinants')).toBe(false);
  });

  it('returns false when the catalog has an item but there are no atoms', async () => {
    const checker = new CompositeContentChecker({
      atoms: fakeAtomChecker([]), // no atoms
      catalog: catalogWithItems({ determinants: [OBJ('d1', 'determinants')] }),
    });
    expect(await checker.hasContent('determinants')).toBe(false);
  });

  it('short-circuits on the atom check — never queries the catalog when atoms are missing', async () => {
    const query = vi.fn(async () => [OBJ('d1', 'determinants')]);
    const checker = new CompositeContentChecker({
      atoms: fakeAtomChecker([]),
      catalog: { query },
    });
    expect(await checker.hasContent('determinants')).toBe(false);
    expect(query).not.toHaveBeenCalled();
  });

  it('queries with a limit-1 existence probe', async () => {
    const query = vi.fn(async () => [OBJ('d1', 'determinants')]);
    const checker = new CompositeContentChecker({
      atoms: fakeAtomChecker(['determinants']),
      catalog: { query },
    });
    await checker.hasContent('determinants');
    expect(query).toHaveBeenCalledWith({ skillId: 'determinants', limit: 1 });
  });

  it('fails closed when the atom checker throws', async () => {
    const checker = new CompositeContentChecker({
      atoms: { async hasContent() { throw new Error('boom'); } },
      catalog: catalogWithItems({ determinants: [OBJ('d1', 'determinants')] }),
    });
    expect(await checker.hasContent('determinants')).toBe(false);
  });

  it('fails closed when the catalog query throws', async () => {
    const checker = new CompositeContentChecker({
      atoms: fakeAtomChecker(['determinants']),
      catalog: { async query() { throw new Error('db down'); } },
    });
    expect(await checker.hasContent('determinants')).toBe(false);
  });

  it('getCompositeContentChecker returns a stable singleton for the same catalog', () => {
    const catalog = catalogWithItems({});
    const a = getCompositeContentChecker(catalog);
    const b = getCompositeContentChecker(catalog);
    expect(a).toBe(b);
  });

  it('getCompositeContentChecker rebuilds when the catalog reference changes', () => {
    const catalogA = catalogWithItems({});
    const catalogB = catalogWithItems({});
    const a = getCompositeContentChecker(catalogA);
    const b = getCompositeContentChecker(catalogB);
    expect(a).not.toBe(b);
  });
});
