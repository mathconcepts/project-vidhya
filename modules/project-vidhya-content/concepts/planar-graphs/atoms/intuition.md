---
id: planar-graphs-intuition
concept_id: planar-graphs
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Planar Graphs — What It Means

## The Core Idea

A graph is **planar** if it can be drawn in the plane (on paper) so that no two edges cross each other.

Such a drawing is called a **planar embedding** or **plane graph**.

---

## Euler's Formula — The Master Tool

For any **connected planar graph** drawn in the plane:

$$V - E + F = 2$$

where $V$ = vertices, $E$ = edges, $F$ = faces (including the unbounded outer face).

**This formula is always 2 for connected planar graphs — regardless of how you draw them.**

---

## Density Bound (The Non-planarity Test)

For a **simple connected planar graph** with $V \geq 3$:

$$E \leq 3V - 6$$

If a graph violates this, it is **immediately non-planar** (no drawing needed).

For **bipartite** planar graphs (no odd cycles, so no triangles):

$$E \leq 2V - 4$$

---

## The Two Forbidden Minors — Kuratowski's Theorem

A graph is planar **if and only if** it contains no **subdivision** of:
- $K_5$ — the complete graph on 5 vertices, or
- $K_{3,3}$ — the complete bipartite graph on $3+3$ vertices

A **subdivision** allows inserting extra vertices of degree 2 along edges. The core structure cannot be hidden.

---

## Key Non-Planar Graphs

| Graph | $V$ | $E$ | $3V-6$ | Verdict |
|---|---|---|---|---|
| $K_5$ | 5 | 10 | 9 | $10 > 9$ — **non-planar** |
| $K_{3,3}$ | 6 | 9 | 12 | $9 \leq 12$ — bound not violated, but non-planar by bipartite bound: $9 > 2(6)-4=8$ |
| $K_4$ | 4 | 6 | 6 | $6 \leq 6$ — planar |

---

## Faces in a Planar Drawing

Each face is bounded by a **closed walk**. For a simple planar graph:

- Every face is bounded by at least 3 edges.
- Summing over all faces: $2E \geq 3F$ (each edge borders at most 2 faces).
- Combined with Euler's formula, this gives $E \leq 3V - 6$.

---

## GATE Exam Signals

- Euler's formula $V-E+F=2$ appears in almost every GATE set on planar graphs.
- Quick non-planarity test: check if $E \leq 3V-6$ is violated.
- For bipartite graphs, use the tighter bound $E \leq 2V-4$.
- Memorize: $K_5$ and $K_{3,3}$ are the two smallest non-planar graphs.
- Euler characteristic of a sphere = 2; for a torus = 0 (GATE may occasionally ask this).
