/**
 * Prerequisite-DAG cycle detection (CEO plan Phase 0, §6 + the CI content
 * gate). The concept graph is supposed to be a DAG — every prerequisite
 * edge points toward something "earlier". A cycle (A requires B requires
 * A) breaks `topologicalSort()` silently (Kahn's algorithm just drops the
 * cyclic nodes from the result with no error) and would make
 * `traceWeakestPrerequisite()` loop forever without the visited-set guard
 * it happens to have. Rather than rely on downstream functions degrading
 * gracefully, this module names the failure class explicitly and is wired
 * into both `src/constants/concept-graph.ts` (load-time assertion) and
 * `scripts/content-ci-gate.ts` (a named, reportable CI check) so a bad
 * prerequisite edit is caught at the source, not by a symptom three layers
 * away.
 */

export interface CycleCheckNode {
  id: string;
  prerequisites: string[];
}

export class PrerequisiteCycleError extends Error {
  readonly cycle: string[];

  constructor(cycle: string[]) {
    super(
      `Prerequisite DAG has a cycle: ${cycle.join(' -> ')}. ` +
      `Every concept's prerequisites must resolve to strictly "earlier" concepts — ` +
      `break the cycle by removing or redirecting one of these edges.`,
    );
    this.name = 'PrerequisiteCycleError';
    this.cycle = cycle;
  }
}

/**
 * Finds one cycle in the prerequisite graph, if any exists. Returns the
 * cycle as an ordered list of ids (first id repeated at the end) or `null`
 * if the graph is a valid DAG. Deterministic: walks nodes in input order,
 * so the same broken data always reports the same cycle.
 *
 * Edges not present in `nodes` (a prerequisite id with no matching node)
 * are ignored here — that is a *different* failure class (an unknown
 * concept_id), already caught by the exam-loader / concept-graph loader's
 * own validation, and is not this function's job to report.
 */
export function findPrerequisiteCycle(nodes: CycleCheckNode[]): string[] | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const state = new Map<string, 'visiting' | 'done'>();

  for (const start of nodes) {
    if (state.get(start.id) === 'done') continue;

    const stack: string[] = [];
    const cycle = dfs(start.id);
    if (cycle) return cycle;

    function dfs(id: string): string[] | null {
      const s = state.get(id);
      if (s === 'done') return null;
      if (s === 'visiting') {
        // Found a back-edge — extract the cycle from the current stack.
        const idx = stack.indexOf(id);
        return [...stack.slice(idx), id];
      }
      state.set(id, 'visiting');
      stack.push(id);
      const node = byId.get(id);
      for (const prereqId of node?.prerequisites ?? []) {
        if (!byId.has(prereqId)) continue; // unknown id — not this function's concern
        const found = dfs(prereqId);
        if (found) return found;
      }
      stack.pop();
      state.set(id, 'done');
      return null;
    }
  }

  return null;
}

/** Throws {@link PrerequisiteCycleError} if the graph has a cycle. */
export function assertNoPrerequisiteCycles(nodes: CycleCheckNode[]): void {
  const cycle = findPrerequisiteCycle(nodes);
  if (cycle) throw new PrerequisiteCycleError(cycle);
}
