---
id: systems-of-equations-visual-analogy
concept_id: systems-of-equations
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Intersection of Planes: A Geometric View

Every linear equation in three unknowns $ax + by + cz = d$ defines a **flat plane** in 3-D space. A $3 \times 3$ system is asking: where do three planes meet?

```gif-scene
{
  "type": "function-trace",
  "expression": "x - 0.5*x^2 + 1",
  "x_range": [-3, 3],
  "y_range": [-2, 4],
  "label": "Consistent system: intersection exists"
}
```

## Three Planes, Three Stories

**Story 1 — Unique solution:** The three planes meet at a single **point** $(x_0, y_0, z_0)$. Think of three walls of a room meeting at one corner. $\text{rank}(A) = \text{rank}([A\mid\mathbf{b}]) = 3$.

**Story 2 — Infinitely many solutions:** The planes share a common **line** (or the same plane). Like three pages of a book sharing the spine. $\text{rank}(A) = \text{rank}([A\mid\mathbf{b}]) < 3$, so there is at least one free variable.

**Story 3 — No solution (inconsistent):** The planes arrange themselves so no single point satisfies all three. Like a triangular prism — each pair of faces meets in a line, but the three lines are parallel and never share a common point. $\text{rank}(A) \neq \text{rank}([A\mid\mathbf{b}])$.

## The Augmented Matrix Is the Map

The augmented matrix $[A\mid\mathbf{b}]$ encodes all three planes at once. Row reduction is the act of **rotating and tilting** the coordinate frame until the planes' arrangement becomes obvious — one plane becomes horizontal, another becomes vertical, and the solution reads off directly.

## 2-D Warm-up

In 2-D, each equation is a **line**. Two lines can:
- Cross at one point (unique solution)
- Overlap entirely (infinitely many)
- Be parallel and distinct (no solution)

Exact same rank logic applies: rank 2 → unique point; rank 1 → coincident lines; rank(A)=1, rank([A|b])=2 → parallel lines with no intersection.

## Connecting to GATE Problems

When GATE asks "for what value of $k$ does the system have no solution / infinitely many solutions?", the answer always comes from setting $\text{rank}(A) \neq \text{rank}([A\mid\mathbf{b}])$ (for no solution) or both ranks equal and $< n$ (for infinite). Computing those ranks from the augmented matrix after row reduction is the only mechanical step needed.
