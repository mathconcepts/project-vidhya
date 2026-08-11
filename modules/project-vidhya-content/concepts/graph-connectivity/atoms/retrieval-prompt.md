---
id: graph-connectivity.retrieval-prompt
concept_id: graph-connectivity
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

In a connected graph $G$ with 10 vertices, vertex $v$ is a cut vertex (articulation point). After removing $v$, the graph splits into exactly 3 connected components. How many edges at minimum must be incident to $v$ (i.e., what is the minimum degree of $v$)?

- **(A)** 2
- **(B)** 3
- **(C)** 4
- **(D)** 5

<details>
<summary>Answer</summary>

**B**. When a cut vertex $v$ is removed from a connected graph and the result has $k$ connected components, $v$ must have at least $k$ incident edges—one to each component (to reconnect them through $v$).

Formal argument: After removing $v$, suppose components $C_1, C_2, \ldots, C_k$ remain. For $G$ to be connected through $v$, each component $C_i$ must be reachable from $v$. This requires at least one edge from $v$ to each $C_i$. Thus, $\deg(v) \geq k$.

In our case, $k = 3$ components are formed after removing $v$. Therefore, $\deg(v) \geq 3$.

To verify minimality: if $\deg(v) = 2$, then $v$ has at most 2 neighbors. Removing $v$ leaves these 2 neighbors in possibly separate components, but at most 2 components. So $\deg(v) = 2$ is insufficient.

Geometrically: $v$ is a "hub" connecting at least 3 branches (the 3 components). You need at least 3 spokes (edges) to be a hub of degree 3.

</details>
