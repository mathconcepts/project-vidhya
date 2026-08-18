/**
 * frontend/src/lib/frontier-logic.ts — pure derivation helpers for
 * KnowledgeHomePage's frontier spine (T13, B4/A9, DR-1, wireframe 3).
 *
 * Server (GET /api/knowledge/tracks/:id/concept-tree) already computes
 * per-node `dot`/`cluster_id`/`cluster_label`/`builds_on` and a top-level
 * `clusters` rollup summary (src/api/knowledge-routes.ts) — this module
 * only arranges that data for rendering: which clusters collapse, which
 * concepts are "You are here", and what a cluster's rollup line reads.
 */

export type FrontierDot = 'mastered' | 'placed' | 'frontier' | 'later';

export interface FrontierNode {
  id: string;
  name: string;
  dot: FrontierDot;
  why: string;
  cluster_id: string | null;
  cluster_label: string | null;
  builds_on: Array<{ id: string; label: string; met: boolean }>;
}

export interface FrontierClusterSummary {
  id: string;
  label: string;
  count: number;
  done_count: number;
}

export interface ClusterGroup {
  id: string;
  label: string;
  count: number;
  doneCount: number;
  /** true when every member is mastered/placed — renders as a one-line
   *  rollup ("Matrix operations · 6 of 6") instead of expanded rows. */
  collapsed: boolean;
  nodes: FrontierNode[];
}

/**
 * Groups nodes by cluster (server order preserved), attaches the rollup
 * counts from `clusters`, and marks a group collapsed when EVERY member
 * is done (mastered or placed) — DR-1: "Mastered clusters collapse to
 * one-line rollups."
 */
export function groupByCluster(
  nodes: readonly FrontierNode[],
  clusters: readonly FrontierClusterSummary[],
): ClusterGroup[] {
  const summaryById = new Map(clusters.map((c) => [c.id, c]));
  const groups = new Map<string, FrontierNode[]>();
  const order: string[] = [];
  for (const n of nodes) {
    if (!n.cluster_id) continue;
    if (!groups.has(n.cluster_id)) {
      groups.set(n.cluster_id, []);
      order.push(n.cluster_id);
    }
    groups.get(n.cluster_id)!.push(n);
  }
  return order.map((id) => {
    const members = groups.get(id)!;
    const summary = summaryById.get(id);
    const count = summary?.count ?? members.length;
    const doneCount = summary?.done_count ?? members.filter((m) => m.dot === 'mastered' || m.dot === 'placed').length;
    return {
      id,
      label: summary?.label ?? members[0]?.cluster_label ?? id,
      count,
      doneCount,
      collapsed: count > 0 && doneCount === count,
      nodes: members,
    };
  });
}

/** "Matrix operations · 6 of 6" — the collapsed rollup line's text. */
export function rollupLabel(group: ClusterGroup): string {
  return `${group.label} · ${group.doneCount} of ${group.count}`;
}

/**
 * The "You are here" focal set: the FIRST cluster (in spine order) that
 * is not fully collapsed, and within it the concepts whose dot is
 * 'frontier' or the single next 'later' concept if nothing is frontier
 * yet (so the card is never empty on a totally-fresh account) — capped
 * at 2 rows to match the wireframe's "one shaky, one ready" shape without
 * hardcoding to exactly two.
 */
export function pickYouAreHere(groups: readonly ClusterGroup[]): FrontierNode[] {
  const activeGroup = groups.find((g) => !g.collapsed);
  if (!activeGroup) return [];
  const frontierNodes = activeGroup.nodes.filter((n) => n.dot === 'frontier');
  if (frontierNodes.length > 0) return frontierNodes.slice(0, 2);
  const firstLater = activeGroup.nodes.find((n) => n.dot === 'later');
  return firstLater ? [firstLater] : [];
}
