---
id: trees-intuition
concept_id: trees
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Trees — Core Intuition

## Definition

A **tree** is a connected, acyclic (no cycles) undirected graph. The following statements are all equivalent for a graph $G$ with $n$ vertices:

1. $G$ is a tree.
2. $G$ is connected and has exactly $n-1$ edges.
3. $G$ is acyclic and has exactly $n-1$ edges.
4. There is a **unique path** between every pair of vertices.
5. $G$ is connected, and removing any single edge disconnects it (every edge is a bridge).

## Key Formula

$$\text{Tree on } n \text{ vertices} \implies |E| = n - 1$$

Adding any edge to a tree creates exactly one cycle. Removing any edge from a tree disconnects it.

## Spanning Trees

A **spanning tree** of a connected graph $G$ is a subgraph that:
- includes **all** $n$ vertices of $G$, and
- is itself a tree (connected, $n-1$ edges, no cycles).

Every connected graph has at least one spanning tree.

## Minimum Spanning Tree (MST)

For a **weighted** graph, the **minimum spanning tree** is a spanning tree with the smallest possible total edge weight.

### Kruskal's Algorithm

1. Sort all edges by weight (ascending).
2. Greedily add edges that do **not** form a cycle (use Union-Find to check).
3. Stop when $n-1$ edges have been added.

**Time complexity:** $O(E \log E)$ (dominated by sorting).

### Prim's Algorithm

1. Start from any vertex. Maintain a "frontier" of edges crossing the cut.
2. Repeatedly pick the **minimum-weight** frontier edge and add its new vertex.
3. Update the frontier.

**Time complexity:** $O(E \log V)$ with a binary heap; $O(E + V \log V)$ with a Fibonacci heap.

Both algorithms are **greedy** and correct by the **Cut Property**: the minimum-weight edge crossing any cut (partition of vertices) is safe to include in the MST.

## Cayley's Formula

The number of **labeled** trees on $n$ vertices is:

$$n^{n-2}$$

For example, there are $4^2 = 16$ labeled trees on 4 vertices.

## Rooted Trees

A **rooted tree** has one designated vertex as the **root**.

| Term | Definition |
|---|---|
| **Parent** of $v$ | The neighbor of $v$ on the unique path to the root |
| **Children** of $v$ | Neighbors of $v$ that are not its parent |
| **Leaf** | Vertex with no children (degree 1 in the unrooted tree, except if the root has degree 1) |
| **Depth** of $v$ | Length of path from root to $v$ |
| **Height** of $T$ | Maximum depth over all vertices |
| **Subtree** at $v$ | $v$ plus all its descendants |

## Key Facts for GATE

1. A tree on $n$ vertices has exactly $n-1$ edges.
2. Any connected graph has a spanning tree.
3. MST is unique when all edge weights are distinct.
4. If a graph has $n$ vertices and $n-1$ edges and is **acyclic**, it must be connected (hence a tree).
5. Cayley's formula: $n^{n-2}$ labeled trees on $n$ vertices.
6. Both Kruskal's and Prim's run in $O(E \log V)$ time.
