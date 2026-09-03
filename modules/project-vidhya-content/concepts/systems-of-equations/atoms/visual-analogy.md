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

Three planes can't be honestly drawn crossing in 3D on a flat image — but the same rank story shows up one dimension down, where it *can* be drawn. Here it is, side by side, so you can compare all three at a glance instead of picturing them one at a time:

```gif-scene
{"type":"line-panels","title":"Same rank story, one dimension down","panels":[{"label":"One point","lines":[[[-1.3,-0.5],[1.3,0.9]],[[-1.3,0.9],[1.3,-0.5]]]},{"label":"A shared line","lines":[[[-1.3,-0.6],[1.3,0.6]],[[-1.3,-0.6],[1.3,0.6]]]},{"label":"No crossing","lines":[[[-1.3,-0.4],[1.3,-0.4]],[[-1.3,0.4],[1.3,0.4]]]}]}
```

*Same three cases, one dimension up: a point becomes a corner, a shared line becomes a shared edge, and two parallel lines become three faces that never all meet.*
