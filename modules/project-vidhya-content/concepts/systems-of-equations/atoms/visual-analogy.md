---
id: systems-of-equations.visual-analogy
concept_id: systems-of-equations
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: visual
---

The diagram on this card is the 2D version of this concept — three planes crossing in 3D can't be honestly drawn on a flat image, but the same rank story shows up one dimension down, where it can.

Picture three flat sheets of glass floating in space instead — each linear equation in three unknowns, $ax+by+cz=d$, is one sheet. Solving a $3\times3$ system just asks: where do all three sheets meet? Rank alone decides which of the diagram's three outcomes you're in:

- **One point.** The sheets meet at a single spot, like three walls meeting in the corner of a room — $\text{rank}(A)=\text{rank}([A\mid\mathbf{b}])=3$.
- **A whole line.** The sheets share one common edge, like three pages of a book sharing the spine — the ranks still agree, but fall short of $3$, so a free variable slides you along that shared line.
- **Nowhere.** The sheets sit so no single point touches all three — like the three side-faces of a triangular prism, where each pair of faces meets in a line, but the three lines run parallel and never cross — $\text{rank}(A)\neq\text{rank}([A\mid\mathbf{b}])$.

```gif-scene
{"type":"line-panels","title":"Three ways a linear system can resolve","panels":[{"label":"One point","lines":[[[-1.3,-0.5],[1.3,0.9]],[[-1.3,0.9],[1.3,-0.5]]]},{"label":"A whole line","lines":[[[-1.3,-0.6],[1.3,0.6]],[[-1.3,-0.6],[1.3,0.6]]]},{"label":"Nowhere","lines":[[[-1.3,-0.4],[1.3,-0.4]],[[-1.3,0.4],[1.3,0.4]]]}]}
```

*A point becomes a corner, a shared line becomes a shared edge, and two parallel lines become three faces that never all meet.*
