# Planar Graphs
> GATE Engineering Mathematics | Graph Theory | Medium frequency | difficulty: 0.5

## Intuition First
A planar graph can be drawn on a piece of paper (or the plane) without any edges crossing. Maps are planar graphs—regions are vertices, borders are edges, and you want to avoid crossing lines. Non-planar graphs force crossings no matter how you draw them. This property connects to coloring (4-color theorem) and has deep algorithmic consequences.

## Core Definition
**Planar Graph**: A graph $G$ that can be drawn in the plane without edge crossings. More formally, a graph is planar iff it can be embedded in $\mathbb{R}^2$ such that edges are simple curves and the only intersections occur at vertices.

**Euler's Formula for Planar Graphs**: For a connected planar graph $G = (V, E)$ drawn in the plane with $F$ faces (regions including the outer unbounded face):
$$|V| - |E| + |F| = 2$$

**Corollary 1**: If $G$ is connected and planar with $n \geq 3$ vertices and $m$ edges:
$$m \leq 3n - 6$$

**Corollary 2**: A planar graph always has a vertex of degree $\leq 5$ (i.e., $\delta(G) \leq 5$ where $\delta$ = minimum degree).

**Complete Graph Planarity**: $K_5$ and $K_{3,3}$ are non-planar. These are the minimal non-planar graphs (Kuratowski's Theorem: a graph is planar iff it contains no subdivision of $K_5$ or $K_{3,3}$).

**Dual Graph**: For a planar embedding, the dual graph has one vertex per face and edges connecting adjacent faces.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider the complete bipartite graph $K_4 = (V_1, V_2, E)$ with $V_1 = \{A, B\}$, $V_2 = \{C, D\}$, and edges connecting every vertex in $V_1$ to every vertex in $V_2$.

- $|V| = 4$, $|E| = 2 \times 2 = 4$.
- Draw: $A$ and $B$ on one side, $C$ and $D$ on the other. Draw 4 edges without crossings:
  ```
  A ---- C
  |  X  |
  B ---- D
  ```
  (edges: (A,C), (A,D), (B,C), (B,D))

- For a planar drawing, we can arrange this as:
  ```
  A --- C
   \   /
    \ /
    / \
   /   \
  B --- D
  ```

- Faces: outer face + inner regions formed by the edges. For $K_4$: $F = 4$ (the outer face + 3 interior faces if drawn correctly).
- Verify Euler: $|V| - |E| + |F| = 4 - 4 + 2 = 2$ ✓ (but we need to count faces carefully).

Actually, let me recalculate. $K_{2,2}$ (which is $C_4$, a 4-cycle):
- $|V| = 4$, $|E| = 4$, $F = 2$ (outer + 1 inner).
- Euler: $4 - 4 + 2 = 2$ ✓

Label: "**Why it works:**"

Euler's formula counts how edges, vertices, and faces interrelate in a planar embedding. Each edge bounds two faces (one on each side). If you count face-incidences by degree (number of edges bounding a face), each edge contributes 2. The formula ensures that any connected planar graph satisfies $|E| \leq 3|V| - 6$: this prevents $K_5$ (which would need $|E| = 10$ but the bound is $3(5) - 6 = 9$) and many other dense graphs from being planar.

## GATE MA Relevance
> **Why it matters in GATE MA:** Planar graphs appear in ~8–12% of GATE graph theory questions. GATE typically asks: "Is [this graph] planar?" (check against $K_5$/$K_{3,3}$ or use the edge bound), or "Apply Euler's formula to find the number of faces." Questions often pair planarity with coloring (4-color theorem reference) or connectivity.
