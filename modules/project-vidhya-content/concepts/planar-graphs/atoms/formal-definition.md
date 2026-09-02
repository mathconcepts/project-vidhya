---
id: planar-graphs.formal-definition
concept_id: planar-graphs
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Planar Graph**: A graph $G$ that can be drawn in the plane without edge crossings. More formally, a graph is planar iff it can be embedded in $\mathbb{R}^2$ such that edges are simple curves and the only intersections occur at vertices.

**Euler's Formula for Planar Graphs**: For a connected planar graph $G = (V, E)$ drawn in the plane with $F$ faces (regions including the outer unbounded face):
$$|V| - |E| + |F| = 2$$

**Corollary 1**: If $G$ is connected and planar with $n \geq 3$ vertices and $m$ edges:
$$m \leq 3n - 6$$

**Corollary 2**: A planar graph always has a vertex of degree $\leq 5$ (i.e., $\delta(G) \leq 5$ where $\delta$ = minimum degree).

**Complete Graph Planarity**: $K_5$ and $K_{3,3}$ are non-planar. These are the minimal non-planar graphs (Kuratowski's Theorem: a graph is planar iff it contains no subdivision of $K_5$ or $K_{3,3}$).

**Dual Graph**: For a planar embedding, the dual graph has one vertex per face and edges connecting adjacent faces.

**Choosing a test.** Use the density bound $E\leq 3V-6$ (or $E\leq 2V-4$ if the graph is bipartite) first — it is one multiplication and a subtraction, and a violation proves non-planarity outright. Reach for Kuratowski's theorem only when the density bound is satisfied but a subdivision of $K_5$ or $K_{3,3}$ is still suspected — the tempting-but-wrong shortcut is stopping at "the bound is satisfied" and calling the graph planar, when the bound is necessary, never sufficient, on its own.
