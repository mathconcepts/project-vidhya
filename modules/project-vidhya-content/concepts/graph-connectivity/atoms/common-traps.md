---
id: graph-connectivity.common-traps
concept_id: graph-connectivity
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing cut vertices with bridges**: A cut vertex is a vertex whose removal disconnects the graph; a bridge is an edge whose removal disconnects it. Students often mix these up. Remember: cut vertex = node, bridge = edge.
- **Forgetting the $k$-connectivity bound**: Many students don't realize that $\kappa(G) \leq \lambda(G) \leq \delta(G)$. They'll try to construct a 3-connected graph with minimum degree 2, which is impossible.
- **Misidentifying components**: When removing vertices/edges, students often lose track of which vertices belong to which component. Draw the graph explicitly and track the connected regions.
