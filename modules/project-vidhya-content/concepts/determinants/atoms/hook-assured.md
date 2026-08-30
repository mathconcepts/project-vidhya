---
# Alternative body for determinants.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: determinants.hook.assured
concept_id: determinants
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: determinants.hook
for_stance: assured
---

$\det$ is the unique alternating multilinear function of the columns normalised by $\det(I) = 1$. Every property you use follows from that one sentence:

- **Row swap flips the sign** — alternating.
- **Repeated row gives $0$** — alternating.
- **Adding a multiple of one row to another changes nothing** — multilinearity plus the repeated-row case. This is why row reduction is a legal way to compute it.
- **$\det(AB) = \det(A)\det(B)$** — and therefore $\det(A^{-1}) = 1/\det(A)$, $\det(A^k) = (\det A)^k$.

Geometrically it is the signed volume scale factor, which is why $\det = 0$ and singular are the same statement.

Speed note: for anything $3\times3$ or larger, row-reduce to triangular and multiply the diagonal. Cofactor expansion is $O(n!)$ and exists mainly to prove things, not to compute them.

```interactive-spec
{"v":1,"kind":"simulation","title":"det([[3,0],[0,2]]) = 6: the unit circle's area grows 6x","x_expr":"3*cos(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-3.2,"x_max":3.2,"y_min":-3.2,"y_max":3.2},"narration_steps":[{"at_progress":0.0,"text":"This is the unit circle after the matrix has acted on every one of its points. Watch the shape it draws, not the dot.","text_shaken":"Watch the traced curve, not the moving dot: it's what happens to every point of the unit circle at once.","text_assured":"This is $A$ applied to the unit circle — for a diagonal matrix the eigen-directions are just the axes, so a circle becomes an axis-aligned ellipse."},{"at_progress":0.25,"text":"At the top of the sweep it reaches $y=2$. The vertical direction was stretched by a factor of 2.","text_shaken":"The dot is at $(0,2)$ right now. The circle only ever reached $y=1$ before — this axis got 2 times longer.","text_assured":"The 2 in the matrix scales the $y$-axis alone; a diagonal matrix never mixes the axes into each other."},{"at_progress":0.5,"text":"Half way round, out at $x=-3$. The horizontal direction was stretched by 3.","text_shaken":"Now the dot is at $(-3,0)$. The circle used to stop at $x=-1$ — this axis got 3 times longer.","text_assured":"3 and 2 are the two eigenvalues here; for a diagonal matrix the determinant is their product, not their sum."},{"at_progress":0.8,"text":"Three across, two up: the area enclosed is exactly 6 times the circle's — that product of the two stretch factors is the determinant.","text_shaken":"3 times 2 is 6: the ellipse's area is 6 times the circle's, and 6 is exactly $\\det(A)$.","text_assured":"$\\det(A)=6$ because the factors multiply, not add — and scaling the whole matrix by a constant $c$ scales the determinant by $c^2$, not $c$.","emphasize":true,"trap":{"text":"Students who have just seen 'det = product of the axis stretches' assume scaling the whole matrix by a constant $c$ scales the determinant by $c$ too.","avoid":"Scale each axis separately: for an $n\\times n$ matrix, $\\det(cA)=c^n\\det(A)$ — here $n=2$, so a factor of $c$ becomes $c^2$."}}]}
```
