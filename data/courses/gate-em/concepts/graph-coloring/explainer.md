# Graph Coloring
> GATE Engineering Mathematics | Graph Theory | Medium frequency | difficulty: 0.5

## Intuition First
Color a map so that no two neighboring regions share a color—how many colors do you need? This is graph coloring. Vertices are regions, edges connect neighbors, and the challenge is to use the minimum number of colors. It's a classic hard problem (NP-complete), but simple bounds and heuristics work well in practice.

## Core Definition
**Graph Coloring**: An assignment of colors (or integers) to vertices such that no two adjacent vertices share the same color. Formally, a proper coloring of $G = (V, E)$ is a function $c: V \to \{1, 2, \ldots, k\}$ such that for all edges $(u, v) \in E$, $c(u) \neq c(v)$.

**Chromatic Number** $\chi(G)$: The minimum number of colors needed for a proper coloring of $G$.

**Clique**: A complete subgraph $K_r$ of $G$. A clique of size $r$ requires at least $r$ colors (each vertex in $K_r$ is adjacent to all others).

**Independence Number** $\alpha(G)$: The maximum size of an independent set (a set of vertices with no edges between them). This is related to chromatic number: a proper coloring partitions vertices into independent sets.

**Chromatic Polynomial** $P(G, k)$: The number of proper $k$-colorings of $G$. For example, $P(K_n, k) = k(k-1)(k-2) \cdots (k-n+1) = k^{\underline{n}}$ (falling factorial).

**Greedy Coloring**: A heuristic that colors vertices one by one, assigning each vertex the smallest available color not used by its already-colored neighbors. Not always optimal, but fast.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider a cycle $C_4 = (1, 2, 3, 4)$ with edges $(1,2), (2,3), (3,4), (4,1)$ (a square).

- Color vertex 1: color 1.
- Color vertex 2: color 2 (adjacent to 1).
- Color vertex 3: color 1 (adjacent to 2, not to 1; reuse color 1).
- Color vertex 4: color 2 (adjacent to 1 and 3, both already colored; can use color 2).

Chromatic number: $\chi(C_4) = 2$ (alternating colors: 1, 2, 1, 2).

For odd cycles like $C_5$, three colors are needed: try 1, 2, 1, 2, ? — the last vertex is adjacent to both vertices colored 1 and 2, so we need color 3. Thus, $\chi(C_5) = 3$.

Label: "**Why it works:**"

Even cycles can be 2-colored (bipartite: alternate colors along the cycle). Odd cycles cannot (the 5th vertex closes a loop back to a vertex of the same color). In general, a clique $K_r$ forces $\chi(G) \geq r$ (all $r$ vertices are neighbors). The degree bound $\chi(G) \leq \Delta(G) + 1$ (where $\Delta$ = max degree) comes from greedy coloring: each vertex has at most $\Delta$ neighbors, leaving at least 1 color available from $\Delta + 1$ colors.

## GATE MA Relevance
> **Why it matters in GATE MA:** Graph coloring appears in ~10% of graph theory problems. GATE asks: "Find the chromatic number of [specific graph]" (small cycles, complete graphs, bipartite graphs) or "Is this graph bipartite?" (NAT/MCQ). Problems often combine coloring with connectivity or cycle detection.
