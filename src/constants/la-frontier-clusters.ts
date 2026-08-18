/**
 * src/constants/la-frontier-clusters.ts — T13 (B4, DR-1, wireframe 3).
 *
 * "Never draw the graph. Topological vertical spine in 4 labeled clusters
 * (Matrix operations → Determinants & systems → Eigen-theory →
 * Decompositions); assign each of the 26 LA concepts to a cluster,
 * topological order within cluster from the prereq DAG."
 *
 * Cluster BOUNDARIES are an editorial/pedagogical judgment call (the plan
 * explicitly delegates "assign each of the 26 LA concepts to a cluster" to
 * implementation) — not every concept's prerequisites live in an earlier
 * or the same cluster (e.g. `least-squares` depends on `systems-of-
 * equations`, in cluster 2, while it lives in cluster 4 — a legitimate
 * cross-branch edge, per DR-1 rendered only in the per-concept bottom
 * sheet, never implied by cluster position). The one INVARIANT this file
 * enforces (validated by src/constants/__tests__/la-frontier-clusters.test.ts)
 * is narrower and locked: every concept appears in EXACTLY one cluster,
 * and within a cluster, a concept's prerequisites that are ALSO in that
 * SAME cluster appear earlier in its row list — so the spine never asks a
 * student to read a concept above something it directly depends on within
 * the same visual group.
 */

export interface FrontierCluster {
  id: string;
  label: string;
  /** Concept ids in display order — topological among same-cluster prereqs. */
  conceptIds: readonly string[];
}

export const LA_FRONTIER_CLUSTERS: readonly FrontierCluster[] = [
  {
    id: 'matrix-operations',
    label: 'Matrix operations',
    conceptIds: ['matrix-operations', 'matrix-inverse', 'trace', 'lu-factorization'],
  },
  {
    id: 'determinants-systems',
    label: 'Determinants & systems',
    conceptIds: [
      'determinants',
      'systems-of-equations',
      'rank-nullity',
      'vector-spaces',
      'linear-independence',
      'linear-transformations',
      'null-space-column-space',
      'change-of-basis',
      'inner-product-spaces',
    ],
  },
  {
    id: 'eigen-theory',
    label: 'Eigen-theory',
    conceptIds: [
      'eigenvalues',
      'orthogonality',
      'diagonalization',
      'cayley-hamilton',
      'symmetric-matrices',
      'gram-schmidt',
      'spectral-theorem',
    ],
  },
  {
    id: 'decompositions',
    label: 'Decompositions',
    conceptIds: [
      'quadratic-forms',
      'positive-definite-matrices',
      'svd',
      'matrix-norms',
      'jordan-normal-form',
      'least-squares',
    ],
  },
] as const;

/** Map concept id -> its cluster, for O(1) lookup by consumers. */
export const CLUSTER_BY_CONCEPT: ReadonlyMap<string, FrontierCluster> = new Map(
  LA_FRONTIER_CLUSTERS.flatMap((cluster) => cluster.conceptIds.map((id) => [id, cluster] as const)),
);
