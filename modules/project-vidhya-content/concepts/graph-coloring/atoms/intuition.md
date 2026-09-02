---
id: graph-coloring.intuition
concept_id: graph-coloring
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

## The Core Idea

A **proper coloring** of a graph assigns a color to each vertex so that no two adjacent (connected) vertices share the same color.

The **chromatic number** $\chi(G)$ is the *minimum* number of colors needed for a proper coloring of $G$.

---

## Key Facts (Memorize These)

| Graph | $\chi(G)$ | Why |
|---|---|---|
| Complete graph $K_n$ | $n$ | Every vertex is adjacent to every other |
| Even cycle $C_{2k}$ | $2$ | Bipartite — 2-colorable |
| Odd cycle $C_{2k+1}$ | $3$ | 3rd color required for the closing edge |
| Bipartite graph | $\leq 2$ | Partition into two independent sets |
| Planar graph | $\leq 4$ | Four Color Theorem |
| Tree | $2$ | Trees are bipartite |

---

## The Greedy Algorithm

Process vertices in any order. At each vertex, assign the **smallest color not used by any neighbor**.

- Greedy gives at most $\Delta(G) + 1$ colors, where $\Delta(G)$ is the maximum degree.
- **Brooks' theorem:** $\chi(G) \leq \Delta(G)$ unless $G$ is a complete graph or an odd cycle.

---

## Edge Coloring (Bonus Concept)

The **edge chromatic number** $\chi'(G)$ colors edges so no two edges sharing a vertex get the same color.

**Vizing's theorem:** $\Delta(G) \leq \chi'(G) \leq \Delta(G) + 1$

A graph is **Class 1** if $\chi'(G) = \Delta(G)$, **Class 2** if $\chi'(G) = \Delta(G) + 1$.

---

## Chromatic Polynomial

The **chromatic polynomial** $P(G, k)$ counts the number of proper colorings using exactly $k$ colors (colors are distinguishable).

For a path $P_n$: $P(P_n, k) = k(k-1)^{n-1}$

For a cycle $C_n$: $P(C_n, k) = (k-1)^n + (-1)^n (k-1)$ — for $C_4$ with $k=3$ this gives $2^4 + 2 = 18$ proper 3-colorings, matched by direct enumeration.
