import { describe, it, expect } from 'vitest';
import { findPrerequisiteCycle, assertNoPrerequisiteCycles, PrerequisiteCycleError } from '../prereq-cycles';
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
