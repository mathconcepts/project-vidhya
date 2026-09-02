---
id: graph-coloring.retrieval-prompt
concept_id: graph-coloring
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["bipartite", "chromatic-number"]
---

A bipartite graph with vertex sets $V_1$ and $V_2$ can be properly colored with at least how many colors?

- **(A)** 1
- **(B)** 2
- **(C)** Cannot be determined.
- **(D)** Depends on the maximum degree.

<details>
<summary>Answer</summary>

**B**. A graph is bipartite iff it can be partitioned into two disjoint vertex sets $V_1$ and $V_2$ such that every edge has one endpoint in $V_1$ and one in $V_2$ (no edges within $V_1$ or within $V_2$).

To properly color a bipartite graph:
- Color all vertices in $V_1$ with color 1.
- Color all vertices in $V_2$ with color 2.

Since no edges exist within $V_1$ or $V_2$, no two vertices of the same color are adjacent. Thus, 2 colors suffice.

Conversely, a graph with chromatic number $\chi(G) \leq 2$ must be bipartite (by definition).

Therefore, a bipartite graph requires at least 2 colors (unless it has isolated vertices, which need just 1 color, but a minimal bipartite graph with edges requires 2). For connected bipartite graphs, exactly 2 colors are both necessary and sufficient.

Answer: **At least 2 colors.**

</details>
