---
id: shortest-paths.common-traps
concept_id: shortest-paths
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting Dijkstra's non-negative requirement**: Students run Dijkstra on graphs with negative weights and get wrong answers. Always check: "Are all weights non-negative?" If not, use Bellman-Ford. Dijkstra's greedy choice (always expand nearest) breaks with negative weights.
- **Confusing algorithm efficiency with correctness**: Bellman-Ford is slower ($O(VE)$) but correct on negative weights (without negative cycles). Dijkstra is faster ($O(E \log V)$) but wrong on negative weights. They solve different problem classes, not just different trade-offs.
- **Misunderstanding negative cycles**: Students think "a negative cycle nearby" is just a nuisance. Actually, if a negative cycle is reachable from the source, shortest paths are *undefined*—there is no minimum cost (you can loop arbitrarily to decrease cost). Bellman-Ford detects this but can't compute distances.
