---
id: graph-coloring.formal-definition
concept_id: graph-coloring
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Graph Coloring**: An assignment of colors (or integers) to vertices such that no two adjacent vertices share the same color. Formally, a proper coloring of $G = (V, E)$ is a function $c: V \to \{1, 2, \ldots, k\}$ such that for all edges $(u, v) \in E$, $c(u) \neq c(v)$.

**Chromatic Number** $\chi(G)$: The minimum number of colors needed for a proper coloring of $G$.

**Clique**: A complete subgraph $K_r$ of $G$. A clique of size $r$ requires at least $r$ colors (each vertex in $K_r$ is adjacent to all others).

**Independence Number** $\alpha(G)$: The maximum size of an independent set (a set of vertices with no edges between them). This is related to chromatic number: a proper coloring partitions vertices into independent sets.

**Chromatic Polynomial** $P(G, k)$: The number of proper $k$-colorings of $G$. For example, $P(K_n, k) = k(k-1)(k-2) \cdots (k-n+1) = k^{\underline{n}}$ (falling factorial).

**Greedy Coloring**: A heuristic that colors vertices one by one, assigning each vertex the smallest available color not used by its already-colored neighbors. Not always optimal, but fast.
