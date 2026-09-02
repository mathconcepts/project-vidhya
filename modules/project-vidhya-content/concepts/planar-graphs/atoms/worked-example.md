---
id: planar-graphs.worked-example
concept_id: planar-graphs
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

## Problem (GATE Style): $K_4$ is Planar, $K_5$ is Not

**(Part A)** For the complete graph $K_4$ ($V = 4$, $E = 6$), verify Euler's formula and exhibit a planar drawing.

**(Part B)** Use the inequality $E \leq 3V - 6$ to prove that $K_5$ ($V = 5$, $E = 10$) is **non-planar**.

---

## Part A — $K_4$ is Planar

### Step 1: Draw $K_4$ without crossings

Place three vertices in a triangle and one vertex in the center connected to all three:

```
        1
       /|\
      / | \
     2--+--3
      \ | /
       \|/
        4   (center vertex)
```

Edges: 12, 13, 14, 23, 24, 34 — all 6 edges, no crossings.

### Step 2: Count $V$, $E$, $F$

- $V = 4$
- $E = 6$
- Faces: the 3 inner triangular regions (12-4, 13-4, 23-4 — wait, we need to recount systematically)

Reading the planar drawing: faces are bounded by cycles. The three inner triangles formed by the central vertex plus each side of the outer triangle, and the outer triangle itself as the boundary of the infinite face.

Faces: $\{124\}$, $\{134\}$, $\{234\}$, and the outer (infinite) face bounded by triangle $\{123\}$.

$$F = 4$$

### Step 3: Verify Euler's formula

$$V - E + F = 4 - 6 + 4 = \boxed{2} \checkmark$$

---

## Part B — $K_5$ is Non-Planar

### Step 1: Assume for contradiction that $K_5$ is planar

If $K_5$ were planar, Euler's formula would hold:

$$V - E + F = 2 \implies 5 - 10 + F = 2 \implies F = 7$$

### Step 2: Apply the face–edge inequality

In any simple planar graph, every face is bounded by at least 3 edges, and each edge is on the boundary of at most 2 faces:

$$3F \leq 2E$$

### Step 3: Check for contradiction

$$3 \times 7 = 21 \leq 2 \times 10 = 20 \quad \text{CONTRADICTION}$$

$21 \leq 20$ is false. The assumption that $K_5$ is planar leads to a contradiction.

$$\boxed{K_5 \text{ is non-planar.}}$$

---

## Summary Table

| Graph | $V$ | $E$ | $3V-6$ | $E \leq 3V-6$? | Planar? |
|---|---|---|---|---|---|
| $K_4$ | 4 | 6 | 6 | $6 \leq 6$ ✓ | Yes |
| $K_5$ | 5 | 10 | 9 | $10 \leq 9$ ✗ | No |

**Note:** The bound $E \leq 3V - 6$ is a **necessary** condition for planarity, not sufficient. A graph satisfying it may still be non-planar (use Kuratowski's theorem for a complete characterization). Here, $K_5$ fails the necessary condition outright, so we can conclude immediately.

---

## GATE Trap

> "I drew $K_5$ on paper and got only 9 crossings, so maybe rearranging could remove them."

The density argument above is an **algebraic proof** — no arrangement of $K_5$ on the plane exists without crossings. One crossing can always be found; the proof shows this is unavoidable regardless of the drawing.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Euler's formula for K₄ and non-planarity of K₅","steps":[{"prompt":"For K₄ (V=4, E=6), what is the number of faces F in a planar drawing? Use Euler's formula to compute F.","hint":"Euler's formula: V - E + F = 2. Substitute V=4 and E=6 and solve for F.","answer":"V - E + F = 2 → 4 - 6 + F = 2 → F = 4. There are 4 faces: three inner triangular regions and one outer (infinite) face."},{"prompt":"Show that K₅ is non-planar using the inequality 3F ≤ 2E. If K₅ were planar, what would F be, and why does this give a contradiction?","hint":"First use Euler's formula to find F if K₅ were planar (V=5, E=10). Then check whether 3F ≤ 2E holds.","answer":"If planar: 5 - 10 + F = 2 → F = 7. Check: 3F = 21 but 2E = 20. Since 21 > 20, the inequality 3F ≤ 2E is violated — contradiction. K₅ cannot be planar."}]}
```
