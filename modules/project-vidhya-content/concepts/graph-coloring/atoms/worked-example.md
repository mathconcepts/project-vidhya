---
id: graph-coloring-worked-example
concept_id: graph-coloring
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Chromatic Number of $C_5$

## Problem (GATE Style)

Let $C_5$ denote the cycle graph on 5 vertices $\{1, 2, 3, 4, 5\}$ with edges $\{12, 23, 34, 45, 51\}$. Determine the chromatic number $\chi(C_5)$ and exhibit an optimal proper coloring.

---

## Solution

### Step 1 — Establish a lower bound: $\chi(C_5) \geq 2$

$C_5$ has at least one edge (vertex 1 is adjacent to vertex 2), so it cannot be colored with a single color. Hence:

$$\chi(C_5) \geq 2$$

### Step 2 — Try 2 colors — is $C_5$ bipartite?

A graph is 2-colorable if and only if it is **bipartite** (contains no odd cycle).

$C_5$ is an **odd cycle** (length 5). Therefore it is not bipartite, and 2 colors are insufficient.

$$\chi(C_5) \geq 3$$

**Explicit failure of 2 colors.** Try to 2-color starting at vertex 1:

| Vertex | Forced color |
|---|---|
| 1 | Red |
| 2 | Blue (adjacent to 1) |
| 3 | Red (adjacent to 2) |
| 4 | Blue (adjacent to 3) |
| 5 | Red (adjacent to 4) |

Now vertex 5 is Red, and vertex 1 is also Red — but edge $51$ exists. **Conflict.** 2 colors fail.

### Step 3 — Construct a valid 3-coloring

Assign colors using three colors $\{R, B, G\}$:

$$1 \to R,\quad 2 \to B,\quad 3 \to R,\quad 4 \to B,\quad 5 \to G$$

**Verification of all edges:**

| Edge | Colors | Conflict? |
|---|---|---|
| $12$ | R, B | No |
| $23$ | B, R | No |
| $34$ | R, B | No |
| $45$ | B, G | No |
| $51$ | G, R | No |

All edges are properly colored. Three colors suffice.

### Step 4 — Conclude

$$\boxed{\chi(C_5) = 3}$$

The lower bound (Step 2) and the construction (Step 3) together prove optimality.

---

## General Rule

For any cycle $C_n$:

$$\chi(C_n) = \begin{cases} 2 & \text{if } n \text{ is even} \\ 3 & \text{if } n \text{ is odd} \end{cases}$$

Even cycles are bipartite; odd cycles are not, but three colors always suffice (alternate R/B until the last vertex, give it G).

---

## GATE Trap

> "The maximum degree of $C_5$ is 2. Brooks' theorem says $\chi \leq \Delta = 2$."

Brooks' theorem has **two exceptions**: complete graphs and **odd cycles**. $C_5$ is an odd cycle, so the bound $\chi \leq \Delta$ does not apply here. The correct answer is 3, not 2.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: chromatic number of the cycle graph C5","steps":[{"prompt":"Why can C₅ not be 2-colored? State the bipartiteness condition.","hint":"A graph is 2-colorable iff it has no odd cycle. C₅ is a cycle of length 5 — odd.","answer":"C₅ is an odd cycle (length 5), so it is not bipartite. Bipartite ↔ 2-colorable, so 2 colors are insufficient and χ(C₅) ≥ 3."},{"prompt":"Assign a valid 3-coloring to the vertices 1–5 of C₅ (edges: 12,23,34,45,51) and verify every edge.","hint":"Alternate Red and Blue as far as possible, then use Green only for the last vertex that would otherwise conflict.","answer":"Color: 1→R, 2→B, 3→R, 4→B, 5→G. Check edges: 12(R,B)✓ 23(B,R)✓ 34(R,B)✓ 45(B,G)✓ 51(G,R)✓. All distinct — valid coloring."}]}
```
