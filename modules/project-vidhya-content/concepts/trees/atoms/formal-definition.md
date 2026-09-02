---
id: trees.formal-definition
concept_id: trees
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Tree**: A connected acyclic graph. Formally, a graph $T = (V, E)$ is a tree iff:
- $T$ is connected (one component), AND
- $T$ is acyclic (contains no cycles).

**Equivalent characterizations** (any one of these defines a tree):
1. A connected graph with $n$ vertices and exactly $n - 1$ edges.
2. A connected graph with no cycles.
3. A graph where there is a unique simple path between any two vertices.
4. A minimal connected graph (removing any edge disconnects it).

**Forest**: A graph with no cycles (not necessarily connected). A forest with $k$ connected components on $n$ vertices has exactly $n - k$ edges.

**Rooted tree**: A tree with a distinguished vertex $r$ called the root. Each non-root vertex has a unique parent, and is the parent to zero or more children. Height = longest path from root to a leaf.

**Spanning Tree of $G$**: A tree that includes all vertices of $G$ and is a subgraph of $G$. Any connected graph has at least one spanning tree.

**Method selector.** For a *minimum*-weight spanning tree, reach for Kruskal's (sort edges, add greedily while skipping cycles) when the edge list is sparse, or Prim's (grow one frontier from a start vertex) when the graph is dense — both are correct by the Cut Property and give the same total weight. Don't reach for generating every one of the $n^{n-2}$ labeled spanning trees (Cayley's formula) and comparing weights; that count explodes past single digits of $n$ and Cayley's formula answers a *counting* question, not a *minimum-weight* one — the two tools solve different problems even though both start from "spanning tree."
