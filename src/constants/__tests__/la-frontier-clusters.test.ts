import { describe, it, expect } from 'vitest';
import { LA_FRONTIER_CLUSTERS, CLUSTER_BY_CONCEPT } from '../la-frontier-clusters';
import { getConceptsForTopic, getPrerequisites } from '../concept-graph';

describe('LA_FRONTIER_CLUSTERS (T13)', () => {
  it('covers all 26 linear-algebra concepts exactly once', () => {
    const laConcepts = getConceptsForTopic('linear-algebra').map((c) => c.id);
    const flat = LA_FRONTIER_CLUSTERS.flatMap((c) => c.conceptIds);

    expect(flat.length).toBe(laConcepts.length);
    expect(new Set(flat).size).toBe(flat.length); // no duplicates
    expect(new Set(flat)).toEqual(new Set(laConcepts)); // exact coverage
  });

  it('is exactly 4 clusters, matching the locked names in order', () => {
    expect(LA_FRONTIER_CLUSTERS.map((c) => c.label)).toEqual([
      'Matrix operations',
      'Determinants & systems',
      'Eigen-theory',
      'Decompositions',
    ]);
  });

  it('every cluster has at least one concept', () => {
    for (const cluster of LA_FRONTIER_CLUSTERS) {
      expect(cluster.conceptIds.length).toBeGreaterThan(0);
    }
  });

  it('within each cluster, a concept never appears before a SAME-cluster prerequisite', () => {
    for (const cluster of LA_FRONTIER_CLUSTERS) {
      const positionOf = new Map(cluster.conceptIds.map((id, i) => [id, i]));
      for (const id of cluster.conceptIds) {
        const prereqs = getPrerequisites(id).map((p) => p.id);
        for (const prereq of prereqs) {
          if (positionOf.has(prereq)) {
            expect(
              positionOf.get(prereq)!,
              `${prereq} (prereq of ${id}) must appear before ${id} within cluster "${cluster.label}"`,
            ).toBeLessThan(positionOf.get(id)!);
          }
        }
      }
    }
  });

  it('CLUSTER_BY_CONCEPT resolves every LA concept to its containing cluster', () => {
    const laConcepts = getConceptsForTopic('linear-algebra').map((c) => c.id);
    for (const id of laConcepts) {
      expect(CLUSTER_BY_CONCEPT.get(id)).toBeDefined();
    }
  });
});
