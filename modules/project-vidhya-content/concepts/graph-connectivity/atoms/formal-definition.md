---
id: graph-connectivity.formal-definition
concept_id: graph-connectivity
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Connected Graph**: An undirected graph $G = (V, E)$ is connected if there exists a path between every pair of vertices. Formally, for all $u, v \in V$, there is a sequence of edges $(u, v_1), (v_1, v_2), \ldots, (v_k, v)$ connecting them.

**Connected Component**: A maximal connected subgraph of $G$. If $G$ is disconnected, it partitions into $c$ disjoint connected components where $c > 1$.

**Vertex Connectivity (Algebraic)**: The minimum number of vertices whose removal disconnects the graph (or reduces it to a single vertex). Denoted $\kappa(G)$. For a complete graph $K_n$, $\kappa(K_n) = n - 1$ (remove all but one vertex to disconnect).

**Edge Connectivity**: The minimum number of edges whose removal disconnects the graph. Denoted $\lambda(G)$. For $K_n$, $\lambda(K_n) = n - 1$.

**Cut Vertex (Articulation Point)**: A vertex whose removal increases the number of connected components. Its vertex connectivity is $\kappa = 1$.

**Bridge**: An edge whose removal increases the number of connected components. A bridge exists iff it is not part of any cycle.
