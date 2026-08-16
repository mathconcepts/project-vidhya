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

## Compute it the fast way

Cofactor expansion is $O(n!)$. Row reduction is $O(n^3)$. For anything past $3\times3$, reduce to upper triangular and multiply the diagonal, tracking two things:

- each **row swap** multiplies the result by $-1$
- each **row scaling** by $k$ multiplies it by $k$ (so divide it back out)
- **adding a multiple of one row to another does nothing** — this is the free operation, use it for everything

## The identities worth memorising

$$\det(AB) = \det(A)\det(B), \qquad \det(A^{\mathsf T}) = \det(A), \qquad \det(A^{-1}) = \frac{1}{\det(A)}$$

$$\det(kA) = k^n \det(A) \ \text{ for } A \in \mathbb{R}^{n\times n}, \qquad \det(A) = \prod_i \lambda_i$$

The $k^n$ one is the most-missed of the group: scaling a matrix scales the determinant by $k$ **per dimension**, not once. And $\det = \prod \lambda_i$ is what links this topic to eigenvalues — a zero eigenvalue and a zero determinant are the same fact.

## Traps that actually appear

- $\det(A + B) \neq \det(A) + \det(B)$. There is no useful expansion for a sum.
- A singular matrix is not "almost invertible" — the solution set is either empty or infinite, never unique.
- For block-triangular $\begin{pmatrix} A & B \\ 0 & D\end{pmatrix}$, $\det = \det(A)\det(D)$. Papers use this to make a large determinant look worse than it is.
- Cramer's rule is examinable but almost never the fast route; it is there to be recognised, not used.

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
