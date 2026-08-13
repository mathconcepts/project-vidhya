---
id: graph-connectivity-intuition
concept_id: graph-connectivity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Graph Connectivity — Core Intuition

## What is a Graph?

A **graph** $G = (V, E)$ consists of a set of **vertices** $V$ and a set of **edges** $E$ connecting pairs of vertices. The **degree** $\deg(v)$ of a vertex $v$ is the number of edges incident to it.

## Handshaking Lemma

Every edge contributes 1 to the degree of each of its two endpoints, so counting all degrees counts every edge twice:

$$\sum_{v \in V} \deg(v) = 2|E|$$

**Consequence:** The number of odd-degree vertices in any graph is always **even**.

## Connectivity

A graph is **connected** if there exists a path between every pair of vertices.

For **directed graphs**, distinguish two notions:

| Type | Meaning |
|---|---|
| **Strongly connected** | Path from $u$ to $v$ AND from $v$ to $u$ for every pair $(u,v)$ |
| **Weakly connected** | Connected when edge directions are ignored |

## Vertex and Edge Connectivity

- **Vertex connectivity** $\kappa(G)$: minimum number of vertices whose removal disconnects $G$ (or makes it trivial). The graph is called **$k$-connected** if $\kappa(G) \geq k$.
- **Edge connectivity** $\lambda(G)$: minimum number of edges whose removal disconnects $G$.

**Whitney's inequality:**

$$\kappa(G) \leq \lambda(G) \leq \delta(G)$$

where $\delta(G)$ is the minimum degree in $G$.

## Cut Vertices and Bridges

- A **cut vertex** (articulation point) is a vertex whose removal increases the number of connected components.
- A **bridge** is an edge whose removal increases the number of connected components.

A graph with no cut vertices is **biconnected**. Every bridge in a graph is a bridge in the biconnected-component sense.

## Complement Graph

The **complement** $\bar{G}$ of $G$ has the same vertex set, but an edge $\{u,v\}$ is in $\bar{G}$ if and only if it is **not** in $G$. If $G$ has $n$ vertices and $m$ edges, then $\bar{G}$ has $\binom{n}{2} - m$ edges.

## Key Facts for GATE

1. $\sum \deg(v) = 2|E|$ — always even.
2. A connected graph on $n$ vertices has at least $n-1$ edges.
3. A complete graph $K_n$ has $\kappa(K_n) = \lambda(K_n) = n-1$.
4. In a directed graph, a single strongly connected component (SCC) can be found by two DFS passes (Kosaraju's / Tarjan's).
5. Bridges and cut vertices are found in $O(V+E)$ using DFS back-edges.
