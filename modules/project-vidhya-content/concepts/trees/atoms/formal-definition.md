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
