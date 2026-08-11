---
id: planar-graphs.common-traps
concept_id: planar-graphs
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Misusing Euler's formula**: Students apply $|V| - |E| + |F| = 2$ to disconnected graphs (it only holds for connected graphs). If a graph has $c$ components, the formula is $|V| - |E| + |F| = 1 + c$.
- **Confusing the edge bound direction**: $m \leq 3n - 6$ is an *upper bound* for planar graphs (sparse). Students sometimes think dense graphs automatically satisfy this. A non-planar graph like $K_5$ violates this bound, but a planar graph satisfying the bound is still not guaranteed to be planar (necessary but not sufficient).
- **Forgetting $K_{3,3}$ as non-planar**: Students remember $K_5$ is non-planar but forget $K_{3,3}$ (complete bipartite graph with parts of size 3 each) is also a fundamental non-planar graph. Both are Kuratowski's forbidden minors.
