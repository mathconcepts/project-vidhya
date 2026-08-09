---
id: shortest-paths.formal-definition
concept_id: shortest-paths
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Shortest Path**: In a weighted graph $G = (V, E, w)$ where $w: E \to \mathbb{R}$ (edge weights), a shortest path from $s$ to $t$ is a path minimizing the sum of edge weights. The **shortest-path distance** $d(s, t)$ is that sum.

**Single-Source Shortest Paths**: Algorithms that compute distances from one source $s$ to all other vertices.
- **Dijkstra's Algorithm**: Efficient for non-negative weights. Time: $O(|E| \log |V|)$ with a min-heap. Greedy: always expand the nearest unvisited vertex.
- **Bellman-Ford**: Handles negative weights (but not negative cycles). Time: $O(|V| \cdot |E|)$. Relaxes all edges repeatedly.

**All-Pairs Shortest Paths**:
- **Floyd-Warshall**: $O(|V|^3)$ dynamic programming. Works with negative weights (no negative cycles).

**Negative Cycles**: A cycle with total weight $< 0$. Shortest paths are undefined if a negative cycle is reachable from the source (distance can become arbitrarily negative).

**Relaxation**: A core technique. For an edge $(u, v)$ with weight $w(u, v)$, if $d[u] + w(u, v) < d[v]$, update $d[v] := d[u] + w(u, v)$. Dijkstra and Bellman-Ford repeatedly relax edges.
