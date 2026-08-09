# Connectivity
> GATE Engineering Mathematics | Graph Theory | High frequency | difficulty: 0.4

## Intuition First
A connected graph is one where you can travel from any city to any other city by following highways—no isolated pockets. Connectivity measures how "glued together" a graph is. If you remove a few highways and the graph breaks into pieces, those highways are critical bridges; if it stays connected, it's more resilient.

## Core Definition
**Connected Graph**: An undirected graph $G = (V, E)$ is connected if there exists a path between every pair of vertices. Formally, for all $u, v \in V$, there is a sequence of edges $(u, v_1), (v_1, v_2), \ldots, (v_k, v)$ connecting them.

**Connected Component**: A maximal connected subgraph of $G$. If $G$ is disconnected, it partitions into $c$ disjoint connected components where $c > 1$.

**Vertex Connectivity (Algebraic)**: The minimum number of vertices whose removal disconnects the graph (or reduces it to a single vertex). Denoted $\kappa(G)$. For a complete graph $K_n$, $\kappa(K_n) = n - 1$ (remove all but one vertex to disconnect).

**Edge Connectivity**: The minimum number of edges whose removal disconnects the graph. Denoted $\lambda(G)$. For $K_n$, $\lambda(K_n) = n - 1$.

**Cut Vertex (Articulation Point)**: A vertex whose removal increases the number of connected components. Its vertex connectivity is $\kappa = 1$.

**Bridge**: An edge whose removal increases the number of connected components. A bridge exists iff it is not part of any cycle.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider a graph with 6 vertices arranged as: vertices $\{1, 2, 3, 4, 5, 6\}$ and edges forming a "bowtie": $(1,2), (2,3), (2,4), (4,5), (4,6)$.

- Component 1: $\{1, 2, 3, 4, 5, 6\}$ forms one connected structure through vertex 2 and vertex 4.
- Vertex 2 is a cut vertex: removing it disconnects $\{1\}$ from $\{3\}$ and the rest.
- Vertex 4 is also a cut vertex: removing it disconnects $\{5\}$ and $\{6\}$ from the others.
- Edge $(2, 4)$ is a bridge: removing it creates two components: $\{1, 2, 3\}$ and $\{4, 5, 6\}$.
- Vertex connectivity $\kappa(G) = 1$ (remove any cut vertex to disconnect).
- Edge connectivity $\lambda(G) = 1$ (remove the bridge).

Label: "**Why it works:**"

A cut vertex creates a "bottleneck"—it is the only path between parts of the graph. In the bowtie example, vertex 2 is the only route from $\{1, 3\}$ to $\{4, 5, 6\}$. Removing it partitions the graph. A bridge is an edge lying on no cycle; it is the only path for its endpoints' neighborhoods to meet. Thus, both characterize points of fragility in the graph's structure.

## GATE MA Relevance
> **Why it matters in GATE MA:** Connectivity questions appear in ~20% of graph theory problems. GATE typically asks for identifying cut vertices/bridges (often in NAT format: "count the bridges") or determining if a graph is $k$-connected. Questions often combine connectivity with other concepts like cycle detection.
