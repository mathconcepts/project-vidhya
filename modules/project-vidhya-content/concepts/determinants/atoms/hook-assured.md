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
{"v":1,"kind":"simulation","title":"det([[2,1],[0,1.5]]) = 3: the unit square becomes a parallelogram 3× the area","duration_sec":9,"linear_map":{"matrix":[[2,1],[0,1.5]],"num_vectors":12,"unit_square":true,"area_label":true},"narration_steps":[{"at_progress":0,"text":"The dotted square is the unit square — area exactly 1. It is about to be pushed through the matrix $\\begin{pmatrix}2&1\\\\0&1.5\\end{pmatrix}$. Watch what happens to its area, not its shape.","text_shaken":"Start with the dotted square: corners at $(0,0)$, $(1,0)$, $(1,1)$, $(0,1)$. Its area is exactly 1. The matrix is about to move every corner at once.","text_assured":"The unit square, meeting an upper-triangular matrix — so before anything moves you already know the determinant is just the product of the diagonal: $2\\times1.5=3$.","emphasize":false},{"at_progress":0.22,"text":"Push! The square tilts and stretches into a green parallelogram. Straight sides stay straight — only the corners slide to new spots.","text_shaken":"Watch the green shape grow: each corner of the square is sliding to a new spot. The shape it traces is no longer a square — it leans over.","text_assured":"Linearity means every point moves by the same rule at once, so the edges stay straight — only their lengths and angles change.","emphasize":false},{"at_progress":0.55,"text":"The green parallelogram has settled. Its area is exactly 3 times the dotted square's — that number, 3, is the determinant.","text_shaken":"Count it: the green shape's area is three times the dotted square's area. That number — 3 — is the determinant. You just watched it happen.","text_assured":"Area ×3, read straight off the shape — and because $A$ is upper-triangular, that 3 is exactly $2\\times1.5$, the product of the diagonal entries.","emphasize":true},{"at_progress":0.8,"text":"The determinant is the area-multiplier: how many times bigger any region gets. Here $\\det(A)=(2)(1.5)-(1)(0)=3$, matching what you watched.","text_shaken":"One line to keep: the determinant is how many times bigger the area gets. Here it is 3. $\\det(A)=(2)(1.5)-(1)(0)=3$ — the same 3 you saw grow.","text_assured":"$\\det(A)=ad-bc=(2)(1.5)-(1)(0)=3$ — and because $A$ is triangular, that is also just the product of the diagonal entries, a shortcut worth checking against cofactor expansion.","emphasize":false,"trap":{"text":"Students who just watched area triple assume doubling every entry of the matrix would double the area too.","avoid":"Scale each axis separately: for an $n\\times n$ matrix, $\\det(cA)=c^n\\det(A)$ — here $n=2$, so a factor of $c$ becomes $c^2$, not $c$."}}]}
```
