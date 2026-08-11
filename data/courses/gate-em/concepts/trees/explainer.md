# Trees
> GATE Engineering Mathematics | Graph Theory | High frequency | difficulty: 0.4

## Intuition First
A tree is the "most efficient" way to connect a group of cities with highways: use the minimum number of roads so that every city is reachable from every other, but add no redundant loops. Remove one road and a city becomes isolated; add one road and you create a cycle. Trees are the backbone of data structures and network design.

## Core Definition
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

## What Happens (Worked Example)
Label: "**What happens:**"

Consider 5 cities with the tree structure:
```
    A
   / \
  B   C
     / \
    D   E
```

Vertices: $V = \{A, B, C, D, E\}$  
Edges: $E = \{(A,B), (A,C), (C,D), (C,E)\}$  
Count: $|V| = 5$, $|E| = 4 = 5 - 1$ ✓

Degrees: $\deg(A) = 2$, $\deg(B) = 1$, $\deg(C) = 3$, $\deg(D) = 1$, $\deg(E) = 1$.  
Leaves (degree 1): $B, D, E$ (3 leaves).

Path from $B$ to $D$: $B - A - C - D$ (unique path).  
If we remove edge $(A, C)$, the tree splits into two components: $\{A, B\}$ and $\{C, D, E\}$. Every edge is a bridge.

Label: "**Why it works:**"

The formula $|E| = |V| - 1$ follows from the Handshaking Lemma and acyclicity. An acyclic graph on $n$ vertices has at most $n - 1$ edges (equality holds when connected). For connectivity + acyclicity, exactly $n - 1$ edges are needed—no more, no fewer. Geometrically, each edge "ties together" a separate component; $n - 1$ edges tie $n$ isolated vertices into one connected mass.

## GATE MA Relevance
> **Why it matters in GATE MA:** Trees appear in 15–20% of graph theory problems. GATE asks about spanning trees (especially minimum spanning tree algorithms like Kruskal's or Prim's), tree properties (leaf count, height, degree sequences), and rooted trees (often in data structure contexts). Questions combine tree structure with algorithms.
