---
id: systems-of-equations.visual-analogy
concept_id: systems-of-equations
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: visual
---

Picture three flat sheets of glass floating in space — each linear equation in three unknowns, $ax+by+cz=d$, is one sheet. Solving a $3\times3$ system just asks: where do all three sheets meet?

There are exactly three ways this can go, and rank alone decides which:

- **One point.** The sheets meet at a single spot, like three walls meeting in the corner of a room — $\text{rank}(A)=\text{rank}([A\mid\mathbf{b}])=3$.
- **A whole line.** The sheets share one common edge, like three pages of a book sharing the spine — the ranks still agree, but fall short of $3$, so a free variable slides you along that shared line.
- **Nowhere.** The sheets sit so no single point touches all three — like the three side-faces of a triangular prism, where each pair of faces meets in a line, but the three lines run parallel and never cross — $\text{rank}(A)\neq\text{rank}([A\mid\mathbf{b}])$.

Drop to two dimensions and it's the same picture, one size down: each equation is a line instead of a plane. Two lines cross once, sit exactly on top of each other, or run parallel — the same three outcomes, easier to draw, and exactly what the animation above this card already showed you.

*No single flat picture can honestly show three planes crossing in 3D, so this stays a mental picture in words rather than reaching for a diagram it can't draw truthfully.*
