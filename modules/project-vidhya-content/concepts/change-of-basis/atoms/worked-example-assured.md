---
# Alternative body for change-of-basis.worked-example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: change-of-basis.worked-example.assured
concept_id: change-of-basis
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
scaffold_fade: true
exam_ids: ["*"]
variant_of: change-of-basis.worked-example
for_stance: assured
---

$B=\{(1,1),(1,-1)\}$, $[x]_B=(2,1)$. Find $[x]_E$.

$$P=\begin{pmatrix}1&1\\1&-1\end{pmatrix}, \qquad [x]_E = P[x]_B = \begin{pmatrix}2+1\\2-1\end{pmatrix} = \boxed{(3,1)}$$

**Going the other way is just as fast here.** Since $\det P = -2 \ne 0$, $P^{-1}=\tfrac{1}{-2}\begin{pmatrix}-1&-1\\-1&1\end{pmatrix}$ — given a vector in *standard* coordinates, $P^{-1}$ recovers its $B$-coordinates without resolving a system from scratch. For this particular $B$ (orthogonal columns), there's a shortcut: $[x]_B = \left(\tfrac{x\cdot v_1}{\|v_1\|^2}, \tfrac{x\cdot v_2}{\|v_2\|^2}\right)$ — the projection formula, since an orthogonal basis makes $P^{-1}=D^{-1}P^T$ for a diagonal $D$ of squared norms. That shortcut fails the moment $B$ isn't orthogonal; matrix inversion is the general tool.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: converting coordinates from basis B to standard basis E",
  "steps": [
    {
      "prompt": "What are the columns of the change-of-basis matrix P?",
      "hint": "The columns of P are the basis vectors v1 and v2, written in standard coordinates.",
      "answer": "P = [v1 | v2] = [[1, 1], [1, -1]]"
    },
    {
      "prompt": "Now compute P times [x]_B. Multiply [[1,1],[1,-1]] by [[2],[1]].",
      "hint": "Row 1: (1)(2) + (1)(1) = 3. Row 2: (1)(2) + (-1)(1) = 1.",
      "answer": "[x]_E = [[3], [1]]"
    },
    {
      "prompt": "Verify: compute 2v1 + 1v2 directly and check you get [[3],[1]].",
      "hint": "2[[1],[1]] + 1[[1],[-1]] = [[2],[2]] + [[1],[-1]] = [[3],[1]]",
      "answer": "Verification complete: 2v1 + 1v2 = [[3],[1]]"
    }
  ],
  "caption": "Converting a vector's coordinates when you switch from basis B to the standard basis E"
}
```
