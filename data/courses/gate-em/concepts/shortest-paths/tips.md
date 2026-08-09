# Teaching Tips: Shortest Paths

## Common Student Errors
- **Forgetting Dijkstra's non-negative requirement**: Students run Dijkstra on graphs with negative weights and get wrong answers. Always check: "Are all weights non-negative?" If not, use Bellman-Ford. Dijkstra's greedy choice (always expand nearest) breaks with negative weights.
- **Confusing algorithm efficiency with correctness**: Bellman-Ford is slower ($O(VE)$) but correct on negative weights (without negative cycles). Dijkstra is faster ($O(E \log V)$) but wrong on negative weights. They solve different problem classes, not just different trade-offs.
- **Misunderstanding negative cycles**: Students think "a negative cycle nearby" is just a nuisance. Actually, if a negative cycle is reachable from the source, shortest paths are *undefined*—there is no minimum cost (you can loop arbitrarily to decrease cost). Bellman-Ford detects this but can't compute distances.

## GATE Question Pattern
GATE shortest-path questions split into three types:
1. **Algorithm application** (Dijkstra/Bellman-Ford on small graphs): Trace the algorithm and report final distances. Usually NAT (numerical output).
2. **Algorithm selection** ("Which algorithm for [this problem]?"): Requires understanding when each algorithm applies (positive vs. negative weights).
3. **Correctness / theoretical** ("Under what conditions does algorithm X work?"): Understand assumptions and failure modes.

## Speed Tricks for MCQs
- **Weight sign check**: Negative weight → Bellman-Ford or Floyd-Warshall (never Dijkstra). Positive only → Dijkstra is fastest.
- **Negative cycle detection**: If you see a cycle with total weight < 0 reachable from the source, shortest paths don't exist. Any algorithm will fail (except detecting the cycle, which Bellman-Ford can do).
- **Manual path enumeration (small graphs)**: For a graph with 4–6 vertices, manually list a few paths and compute their costs. Often faster than tracing the algorithm, especially if weights are small integers.

## Must-Memorize Formulas / Results

**Dijkstra's Algorithm:**
- **When to use:** All edge weights non-negative.
- **Time complexity:** $O((V + E) \log V)$ with a min-heap.
- **Correctness:** Produces shortest paths from source to all reachable vertices.
- **Greedy choice:** Always expand the nearest unvisited vertex next.

**Bellman-Ford Algorithm:**
- **When to use:** Handles non-negative and negative weights (except negative cycles).
- **Time complexity:** $O(VE)$.
- **Correctness:** Produces shortest paths (if no negative cycles); detects negative cycles.
- **Relaxation:** Relax all edges $|V| - 1$ times; if edges still relax on iteration $|V|$, a negative cycle exists.

**Floyd-Warshall Algorithm:**
- **When to use:** All-pairs shortest paths, handles negative weights (no negative cycles).
- **Time complexity:** $O(V^3)$.
- **Output:** Distance matrix $d[i][j]$ = shortest distance from $i$ to $j$.
- **Recurrence:** $d^{(k)}[i][j] = \min(d^{(k-1)}[i][j], d^{(k-1)}[i][k] + d^{(k-1)}[k][j])$ (intermediate vertex $k$).

**Negative Cycle Detection:**
If any edge $(u, v)$ still satisfies $d[u] + w(u, v) < d[v]$ after $|V| - 1$ iterations, a negative cycle exists reachable from the source.

**Shortest-path distance properties:**
- $d(s, s) = 0$ (distance to self).
- $d(s, v) \geq 0$ if all weights are non-negative.
- Triangle inequality: $d(s, v) \leq d(s, u) + w(u, v)$ for any edge $(u, v)$.

**Optimal substructure:** A subpath of a shortest path is itself a shortest path (used to prove algorithm correctness).
