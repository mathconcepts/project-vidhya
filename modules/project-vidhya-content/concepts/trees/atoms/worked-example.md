---
id: trees-worked-example
concept_id: trees
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Trees — Worked Example (GATE Style)

## Problem

**Consider the weighted undirected graph $G$ with 5 vertices $\{A, B, C, D, E\}$ and the following edges:**

| Edge | Weight |
|---|---|
| $A$–$B$ | 4 |
| $A$–$C$ | 2 |
| $B$–$C$ | 5 |
| $B$–$D$ | 7 |
| $C$–$D$ | 3 |
| $C$–$E$ | 6 |
| $D$–$E$ | 1 |

**(a)** Find the Minimum Spanning Tree (MST) using Kruskal's algorithm. List every edge considered and whether it was accepted or rejected.

**(b)** What is the total weight of the MST?

**(c)** How many spanning trees does a complete graph $K_5$ have? Use Cayley's formula.

---

## Solution

### Part (a) — Kruskal's Algorithm

**Step 1: Sort all edges by weight.**

$$D\text{–}E\ (1),\quad A\text{–}C\ (2),\quad C\text{–}D\ (3),\quad A\text{–}B\ (4),\quad B\text{–}C\ (5),\quad C\text{–}E\ (6),\quad B\text{–}D\ (7)$$

**Step 2: Greedily add edges. Use Union-Find to detect cycles.**

Initially each vertex is its own component: $\{A\},\{B\},\{C\},\{D\},\{E\}$.

| Step | Edge considered | Weight | Action | Components after |
|---|---|---|---|---|
| 1 | $D$–$E$ | 1 | **Accept** — different components | $\{A\},\{B\},\{C\},\{D,E\}$ |
| 2 | $A$–$C$ | 2 | **Accept** — different components | $\{A,C\},\{B\},\{D,E\}$ |
| 3 | $C$–$D$ | 3 | **Accept** — $C \in \{A,C\}$, $D \in \{D,E\}$ | $\{A,C,D,E\},\{B\}$ |
| 4 | $A$–$B$ | 4 | **Accept** — $A \in \{A,C,D,E\}$, $B \in \{B\}$ | $\{A,B,C,D,E\}$ |
| 5 | $B$–$C$ | 5 | **Reject** — both in same component (would form cycle) | — |

We have added $4 = n - 1 = 5 - 1$ edges. **Algorithm terminates.**

**MST edges:** $\{D\text{–}E,\ A\text{–}C,\ C\text{–}D,\ A\text{–}B\}$

### Part (b) — Total MST Weight

$$w(\text{MST}) = 1 + 2 + 3 + 4 = \boxed{10}$$

**Verification:** 5 vertices, 4 edges, connected, no cycle — confirmed tree.

### Part (c) — Number of Spanning Trees of $K_5$

By **Cayley's formula**, the number of labeled trees on $n$ vertices is $n^{n-2}$.

For $K_5$ ($n = 5$):

$$\text{Number of spanning trees} = 5^{5-2} = 5^3 = \boxed{125}$$

---

## Key Insight

Kruskal's algorithm is correct because of the **Cut Property**: for any partition of the vertex set into two groups, the minimum-weight edge crossing the cut must be in the MST. Each time Kruskal accepts an edge, it is the cheapest edge crossing some cut — so no cheaper MST can exist.

**Pitfall:** Kruskal's never accepts an edge between two vertices already in the same component — doing so would create a cycle, which trees cannot have.

## GATE Tip

Exam problems often ask:
- How many edges in the MST of an $n$-vertex graph? Always $n-1$.
- What is Cayley's formula? $n^{n-2}$ labeled trees on $n$ vertices.
- What is the time complexity of Kruskal's? $O(E \log E)$ for sorting; Union-Find add nearly constant per edge.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Kruskal's MST and Cayley's formula for spanning trees","steps":[{"prompt":"In Kruskal's algorithm on the graph above, edge C–E (weight 6) was not even reached before the algorithm terminated. Why?","hint":"Kruskal's stops as soon as n−1 edges have been accepted. Count how many edges were accepted before C–E was considered.","answer":"The algorithm accepted 4 edges (D–E, A–C, C–D, A–B) before reaching C–E. Since n=5, we need n−1=4 edges for a spanning tree. The algorithm already terminated, so C–E was never needed."},{"prompt":"How many labeled spanning trees does K₄ (complete graph on 4 vertices) have? Apply Cayley's formula.","hint":"Cayley's formula: number of labeled trees on n vertices = n^(n−2). Substitute n=4.","answer":"4^(4−2) = 4² = 16. There are 16 distinct labeled spanning trees of K₄."}]}
```
