import { describe, it, expect } from 'vitest';
import {
  findPrerequisiteCycle,
  assertNoPrerequisiteCycles,
  PrerequisiteCycleError,
  findGraphCycle,
  assertNoGraphCycles,
  GraphCycleError,
} from '../prereq-cycles';
import { ALL_CONCEPTS } from '../../constants/concept-graph';

describe('findPrerequisiteCycle', () => {
  it('returns null for an empty graph', () => {
    expect(findPrerequisiteCycle([])).toBeNull();
  });

  it('returns null for a valid DAG', () => {
    const nodes = [
      { id: 'a', prerequisites: [] },
      { id: 'b', prerequisites: ['a'] },
      { id: 'c', prerequisites: ['a', 'b'] },
    ];
    expect(findPrerequisiteCycle(nodes)).toBeNull();
  });

  it('detects a direct two-node cycle', () => {
    const nodes = [
      { id: 'a', prerequisites: ['b'] },
      { id: 'b', prerequisites: ['a'] },
    ];
    expect(findPrerequisiteCycle(nodes)).toEqual(['a', 'b', 'a']);
  });

  it('detects a self-cycle', () => {
    const nodes = [{ id: 'a', prerequisites: ['a'] }];
    expect(findPrerequisiteCycle(nodes)).toEqual(['a', 'a']);
  });

  it('detects a longer indirect cycle', () => {
    const nodes = [
      { id: 'a', prerequisites: ['b'] },
      { id: 'b', prerequisites: ['c'] },
      { id: 'c', prerequisites: ['a'] },
    ];
    const cycle = findPrerequisiteCycle(nodes);
    expect(cycle).not.toBeNull();
    expect(cycle![0]).toBe(cycle![cycle!.length - 1]);
  });

  it('ignores prerequisite ids that do not resolve to a node (a different failure class)', () => {
    const nodes = [{ id: 'a', prerequisites: ['does-not-exist'] }];
    expect(findPrerequisiteCycle(nodes)).toBeNull();
  });

  it('the real GATE-MA concept graph (82 nodes, loaded from YAML) has no cycles', () => {
    expect(findPrerequisiteCycle(ALL_CONCEPTS)).toBeNull();
  });
});

describe('assertNoPrerequisiteCycles', () => {
  it('does not throw on a valid DAG', () => {
    expect(() => assertNoPrerequisiteCycles([{ id: 'a', prerequisites: [] }])).not.toThrow();
  });

  it('throws PrerequisiteCycleError naming the cycle', () => {
    const nodes = [
      { id: 'a', prerequisites: ['b'] },
      { id: 'b', prerequisites: ['a'] },
    ];
    try {
      assertNoPrerequisiteCycles(nodes);
      expect.fail('expected a throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PrerequisiteCycleError);
      expect((err as PrerequisiteCycleError).cycle).toEqual(['a', 'b', 'a']);
      expect((err as Error).message).toContain('a -> b -> a');
    }
  });
});

// ── T11: parameterized cycle check (generalizes over any edge field) ──────

describe('findGraphCycle (parameterized edge accessor)', () => {
  it('agrees with findPrerequisiteCycle when given the prerequisites accessor', () => {
    const nodes = [
      { id: 'a', prerequisites: ['b'] },
      { id: 'b', prerequisites: ['a'] },
    ];
    expect(findGraphCycle(nodes, (n) => n.prerequisites)).toEqual(
      findPrerequisiteCycle(nodes),
    );
  });

  it('detects a cycle over a DIFFERENT edge field (encompasses-shaped)', () => {
    const nodes = [
      { id: 'x', encompasses: [{ id: 'y', weight: 0.5 }] },
      { id: 'y', encompasses: [{ id: 'x', weight: 0.3 }] },
    ];
    const cycle = findGraphCycle(nodes, (n) => n.encompasses.map((e) => e.id));
    expect(cycle).toEqual(['x', 'y', 'x']);
  });

  it('returns null for an acyclic weighted-edge graph', () => {
    const nodes = [
      { id: 'a', encompasses: [] as { id: string; weight: number }[] },
      { id: 'b', encompasses: [{ id: 'a', weight: 0.7 }] },
      { id: 'c', encompasses: [{ id: 'a', weight: 0.5 }, { id: 'b', weight: 0.6 }] },
    ];
    expect(findGraphCycle(nodes, (n) => n.encompasses.map((e) => e.id))).toBeNull();
  });

  it('ignores edges to unknown ids (a different failure class)', () => {
    const nodes = [{ id: 'a', encompasses: [{ id: 'ghost', weight: 0.5 }] }];
    expect(findGraphCycle(nodes, (n) => n.encompasses.map((e) => e.id))).toBeNull();
  });
});

describe('assertNoGraphCycles', () => {
  it('does not throw on an acyclic graph', () => {
    expect(() =>
      assertNoGraphCycles([{ id: 'a', tags: [] as string[] }], (n) => n.tags, 'tags'),
    ).not.toThrow();
  });

  it('throws GraphCycleError naming the edge field and cycle', () => {
    const nodes = [
      { id: 'x', encompasses: [{ id: 'y' }] },
      { id: 'y', encompasses: [{ id: 'x' }] },
    ];
    try {
      assertNoGraphCycles(nodes, (n) => n.encompasses.map((e) => e.id), 'encompasses');
      expect.fail('expected a throw');
    } catch (err) {
      expect(err).toBeInstanceOf(GraphCycleError);
      expect((err as GraphCycleError).cycle).toEqual(['x', 'y', 'x']);
      expect((err as GraphCycleError).edgeLabel).toBe('encompasses');
      expect((err as Error).message).toContain('"encompasses"');
      expect((err as Error).message).toContain('x -> y -> x');
    }
  });
});

describe('the real GATE-MA encompassing graph (T11/B1, loaded from gate-ma.yml)', () => {
  it('is acyclic', () => {
    expect(
      findGraphCycle(ALL_CONCEPTS, (n) => (n.encompasses ?? []).map((e) => e.id)),
    ).toBeNull();
  });

  it('every weight is in (0,1]', () => {
    for (const c of ALL_CONCEPTS) {
      for (const e of c.encompasses ?? []) {
        expect(e.weight).toBeGreaterThan(0);
        expect(e.weight).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is scoped to linear-algebra: only LA concepts declare encompassing edges', () => {
    const withEdges = ALL_CONCEPTS.filter((c) => (c.encompasses ?? []).length > 0);
    expect(withEdges.length).toBeGreaterThan(0);
    for (const c of withEdges) {
      expect(c.topic).toBe('linear-algebra');
    }
  });

  it('declares between 40 and 80 total edges (plan target)', () => {
    const total = ALL_CONCEPTS.reduce((sum, c) => sum + (c.encompasses?.length ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(40);
    expect(total).toBeLessThanOrEqual(80);
  });
});
