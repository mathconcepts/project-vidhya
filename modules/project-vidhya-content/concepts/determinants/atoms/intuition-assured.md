---
# Alternative body for determinants.intuition, served when the learner stance is
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
id: determinants.intuition.assured
concept_id: determinants
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: determinants.intuition
for_stance: assured
---

Cofactor expansion is $O(n!)$; row reduction is $O(n^3)$. Past $3\times3$, reduce to upper triangular and multiply the diagonal, tracking two rules: a **row swap** flips the sign, a **row scaling by $k$** multiplies the result by $k$. Adding a multiple of one row to another is free — use it to manufacture zeros.

Identities worth having automatic:

$$\det(AB) = \det(A)\det(B), \qquad \det(A^{T}) = \det(A), \qquad \det(A^{-1}) = \frac{1}{\det(A)}, \qquad \det(kA) = k^n \det(A)$$

The $k^n$ scaling is the most-missed of the group — it scales **per dimension**, not once. And $\det(A) = \prod_i \lambda_i$ is the bridge to eigenvalues: a zero eigenvalue and a zero determinant are the same fact.

Traps that actually appear: $\det(A+B) \neq \det(A)+\det(B)$, there's no useful expansion for a sum. For block-triangular $\begin{pmatrix} A & B \\ 0 & D\end{pmatrix}$, $\det = \det(A)\det(D)$ — papers use this to make a large determinant look worse than it is.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the entries of A and watch the area scaling change",
  "inputs": [
    {"id": "a", "label": "a (top-left)", "min": -3, "max": 3, "step": 0.5, "initial": 3},
    {"id": "b", "label": "b (top-right)", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "c", "label": "c (bottom-left)", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "d", "label": "d (bottom-right)", "min": -3, "max": 3, "step": 0.5, "initial": 2}
  ],
  "outputs": [
    {"label": "det(A) = ad - bc", "formula": "a*d - b*c", "digits": 2},
    {"label": "area scaling factor |det(A)|", "formula": "abs(a*d - b*c)", "digits": 2}
  ],
  "caption": "Watch det(A) cross zero — that's where the transform flattens a shape down to zero area. |det(A)| is how much any region's area gets multiplied by."
}
```
