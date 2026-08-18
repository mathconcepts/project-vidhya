import { describe, it, expect } from 'vitest';
import { groupByCluster, rollupLabel, pickYouAreHere, type FrontierNode, type FrontierClusterSummary } from './frontier-logic';

function node(overrides: Partial<FrontierNode> & { id: string }): FrontierNode {
  return {
    name: overrides.id,
    dot: 'later',
    why: '',
    cluster_id: 'c1',
    cluster_label: 'Cluster 1',
    builds_on: [],
    ...overrides,
  };
}

describe('groupByCluster', () => {
  it('groups nodes by cluster_id, preserving server order', () => {
    const nodes = [
      node({ id: 'a', cluster_id: 'c1', cluster_label: 'C1' }),
      node({ id: 'b', cluster_id: 'c2', cluster_label: 'C2' }),
      node({ id: 'c', cluster_id: 'c1', cluster_label: 'C1' }),
    ];
    const groups = groupByCluster(nodes, []);
    expect(groups.map((g) => g.id)).toEqual(['c1', 'c2']);
    expect(groups[0].nodes.map((n) => n.id)).toEqual(['a', 'c']);
  });

  it('marks a cluster collapsed only when EVERY member is mastered/placed', () => {
    const nodes = [
      node({ id: 'a', dot: 'mastered' }),
      node({ id: 'b', dot: 'placed' }),
    ];
    const summary: FrontierClusterSummary[] = [{ id: 'c1', label: 'Cluster 1', count: 2, done_count: 2 }];
    const groups = groupByCluster(nodes, summary);
    expect(groups[0].collapsed).toBe(true);
  });

  it('does not collapse a cluster with any frontier/later member', () => {
    const nodes = [
      node({ id: 'a', dot: 'mastered' }),
      node({ id: 'b', dot: 'frontier' }),
    ];
    const summary: FrontierClusterSummary[] = [{ id: 'c1', label: 'Cluster 1', count: 2, done_count: 1 }];
    const groups = groupByCluster(nodes, summary);
    expect(groups[0].collapsed).toBe(false);
  });

  it('nodes with no cluster_id are excluded (defensive — non-graph tracks)', () => {
    const nodes = [node({ id: 'a', cluster_id: null, cluster_label: null })];
    expect(groupByCluster(nodes, [])).toEqual([]);
  });
});

describe('rollupLabel', () => {
  it('formats "Label · done of total"', () => {
    const group = { id: 'c1', label: 'Matrix operations', count: 6, doneCount: 6, collapsed: true, nodes: [] };
    expect(rollupLabel(group)).toBe('Matrix operations · 6 of 6');
  });
});

describe('pickYouAreHere', () => {
  it('picks frontier-dot concepts from the first non-collapsed cluster', () => {
    const nodes = [
      node({ id: 'a', cluster_id: 'c1', dot: 'mastered' }),
      node({ id: 'b', cluster_id: 'c2', dot: 'frontier' }),
      node({ id: 'c', cluster_id: 'c2', dot: 'later' }),
    ];
    const summary: FrontierClusterSummary[] = [
      { id: 'c1', label: 'C1', count: 1, done_count: 1 },
      { id: 'c2', label: 'C2', count: 2, done_count: 0 },
    ];
    const groups = groupByCluster(nodes, summary);
    const here = pickYouAreHere(groups);
    expect(here.map((n) => n.id)).toEqual(['b']);
  });

  it('falls back to the first "later" concept when nothing is frontier yet (fresh account)', () => {
    const nodes = [node({ id: 'a', cluster_id: 'c1', dot: 'later' })];
    const summary: FrontierClusterSummary[] = [{ id: 'c1', label: 'C1', count: 1, done_count: 0 }];
    const groups = groupByCluster(nodes, summary);
    expect(pickYouAreHere(groups).map((n) => n.id)).toEqual(['a']);
  });

  it('returns an empty array when every cluster is collapsed (fully mastered track)', () => {
    const nodes = [node({ id: 'a', cluster_id: 'c1', dot: 'mastered' })];
    const summary: FrontierClusterSummary[] = [{ id: 'c1', label: 'C1', count: 1, done_count: 1 }];
    const groups = groupByCluster(nodes, summary);
    expect(pickYouAreHere(groups)).toEqual([]);
  });

  it('caps at 2 rows even with many frontier-dot concepts', () => {
    const nodes = [
      node({ id: 'a', cluster_id: 'c1', dot: 'frontier' }),
      node({ id: 'b', cluster_id: 'c1', dot: 'frontier' }),
      node({ id: 'c', cluster_id: 'c1', dot: 'frontier' }),
    ];
    const summary: FrontierClusterSummary[] = [{ id: 'c1', label: 'C1', count: 3, done_count: 0 }];
    const groups = groupByCluster(nodes, summary);
    expect(pickYouAreHere(groups).length).toBe(2);
  });
});
