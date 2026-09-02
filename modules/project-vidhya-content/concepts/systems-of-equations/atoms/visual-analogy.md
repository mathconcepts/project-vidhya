---
id: systems-of-equations.visual-analogy
concept_id: systems-of-equations
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: visual
---

Every linear equation in three unknowns, $ax+by+cz=d$, is a flat plane. A $3\times3$ system asks: where do three planes meet?

Three stories, decided entirely by rank. **Unique solution:** the three planes meet at a single point, like three walls of a room meeting at one corner — $\text{rank}(A)=\text{rank}([A\mid\mathbf{b}])=3$. **Infinitely many:** the planes share a common line, like three pages of a book sharing the spine — ranks agree but fall short of $3$, leaving free variables. **No solution:** the planes arrange so no single point satisfies all three — like a triangular prism, where each pair of faces meets in a line but the three lines are parallel and never share a point — $\text{rank}(A)\neq\text{rank}([A\mid\mathbf{b}])$.

In 2D the same logic drops a dimension: each equation is a line. Two lines cross at one point (unique), overlap entirely (infinitely many), or run parallel without meeting (no solution) — the identical rank arithmetic, one dimension down.

No single plot captures three planes intersecting at once, so this analogy stays verbal rather than reaching for a fenced 2D scene that couldn't show the real geometry honestly.
