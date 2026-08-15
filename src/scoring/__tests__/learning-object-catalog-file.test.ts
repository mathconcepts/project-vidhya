import { describe, it, expect } from 'vitest';
import { FileLearningObjectCatalog } from '../learning-object-catalog-file';

/**
 * These assert equivalence with the Postgres catalog, not just "it reads a
 * file". The point of the file catalog is that GateDeterministicScorer cannot
 * tell an authored item from a database row — if the marking payload keys drift
 * from markingPayloadFromRow's, a demo item silently becomes ungradable and the
 * rail's earned win stops being earned.
 */
describe('FileLearningObjectCatalog', () => {
  const catalog = new FileLearningObjectCatalog();

  it('resolves an authored item by id with no database', async () => {
    const item = await catalog.getById('la-eigen-trace-det-001');
    expect(item).not.toBeNull();
    expect(item!.nodeId).toBe('eigenvalues');
  });

  it('returns null for an unknown id rather than a stub', async () => {
    expect(await catalog.getById('no-such-item')).toBeNull();
  });

  it('emits the marking payload keys the scorer reads', async () => {
    const item = await catalog.getById('la-eigen-trace-det-001');
    const p = item!.payload as Record<string, unknown>;
    expect(p.questionType).toBe('mcq');
    expect(p.marks).toBe(1);
    expect(p.answerIndex).toBe(0);
    expect(Array.isArray(p.options)).toBe(true);
  });

  it('carries a numeric-answer range for nat items', async () => {
    const item = await catalog.getById('la-det-area-002');
    const p = item!.payload as Record<string, unknown>;
    expect(p.questionType).toBe('nat');
    expect(p.answerRange).toEqual([5.99, 6.01]);
  });

  it('queries by skill', async () => {
    const found = await catalog.query({ skillId: 'orthogonality' } as never);
    expect(found.map((o) => o.id)).toContain('la-orthogonal-dot-003');
  });

  it('returns nothing for a skill with no authored items', async () => {
    expect(await catalog.query({ skillId: 'no-such-concept' } as never)).toEqual([]);
  });

  it('reports authored items as human_verified, not cas_passed', async () => {
    // A hand-checked solution is a weaker claim than a CAS pass. The receipt
    // law means the difference must not be blurred just because both are
    // "verified" in casual speech.
    const item = await catalog.getById('la-eigen-trace-det-001');
    expect(item!.verification).toBe('human_verified');
  });

  it('every shipped item is actually gradable', async () => {
    // An authored item that is missing its answer key or its marks parses fine
    // and then refuses to grade at the route. That failure would surface in
    // front of a visitor, so it fails here instead.
    for (const id of ['la-eigen-trace-det-001', 'la-det-area-002', 'la-orthogonal-dot-003']) {
      const p = (await catalog.getById(id))!.payload as Record<string, unknown>;
      expect(p.questionType, id).toBeTruthy();
      expect(p.marks, id).toBeGreaterThan(0);
      const hasKey =
        p.answerIndex !== undefined || p.answerIndices !== undefined || p.answerRange !== undefined;
      expect(hasKey, `${id} has no answer key`).toBe(true);
    }
  });

  it('every shipped answer key points inside its own options list', async () => {
    // An off-by-one here marks a correct student wrong, which is the single
    // worst thing this demo could do in front of a nervous visitor.
    for (const id of ['la-eigen-trace-det-001', 'la-orthogonal-dot-003']) {
      const p = (await catalog.getById(id))!.payload as Record<string, unknown>;
      const options = p.options as string[];
      const idx = p.answerIndex as number;
      expect(idx, id).toBeLessThan(options.length);
      expect(options[idx], id).toBe((p.correctAnswer as string) ?? options[idx]);
    }
  });
});
