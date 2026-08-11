---
id: graph-coloring.common-traps
concept_id: graph-coloring
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing chromatic number with maximum degree**: $\chi(G) \leq \Delta(G) + 1$, but equality is rare. Students often assume they're equal. A cycle $C_5$ has $\Delta = 2$ but $\chi = 3$; a tree has $\Delta$ potentially large but $\chi = 2$ (bipartite).
- **Missing the bipartite shortcut**: If a graph is bipartite, $\chi(G) = 2$ (unless disconnected with isolated vertices). Students waste time trying to color a bipartite graph with 3+ colors instead of recognizing the structure.
- **Forgetting clique lower bounds**: If you see a $K_r$ subgraph, immediately know $\chi(G) \geq r$. Students sometimes color a graph containing $K_4$ with 3 colors, violating this bound.
