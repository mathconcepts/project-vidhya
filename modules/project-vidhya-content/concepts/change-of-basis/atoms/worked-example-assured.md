---
# Alternative body for change-of-basis.worked-example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: change-of-basis.worked-example.assured
concept_id: change-of-basis
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
variant_of: change-of-basis.worked-example
for_stance: assured
---

**By inspection**, $P$'s columns are $v_1, v_2$ in standard coordinates:

$$P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}, \qquad [x]_E = P[x]_B = \begin{pmatrix}1&1\\1&-1\end{pmatrix}\begin{pmatrix}2\\1\end{pmatrix} = \begin{pmatrix}3\\1\end{pmatrix}$$

Cross-check without $P$: $2v_1+v_2 = \begin{pmatrix}3\\1\end{pmatrix}$ — matches, so no sign error crept in.

$$\boxed{P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}, \quad [x]_E = \begin{pmatrix} 3 \\ 1 \end{pmatrix}}$$

**Where this generalizes.** For an orthonormal $B$, $P^{-1}=P^T$, so you skip the inverse entirely — recognizing an orthonormal basis is the fast path here. The reverse conversion $[x]_B = P^{-1}[x]_E$ is the more common exam framing; know both directions without re-deriving.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: Converting coordinates from basis B to standard basis E",
  "steps": [
    {
      "prompt": "What are the columns of the change-of-basis matrix P?",
      "hint": "The columns of P are the basis vectors v₁ and v₂, written in standard coordinates.",
      "answer": "P = [v₁ | v₂] = [[1, 1], [1, -1]]"
    },
    {
      "prompt": "Now compute P × [x]_B. Multiply [[1,1],[1,-1]] by [[2],[1]].",
      "hint": "Row 1: (1)(2) + (1)(1) = 3. Row 2: (1)(2) + (-1)(1) = 1.",
      "answer": "[x]_E = [[3], [1]]"
    },
    {
      "prompt": "Verify: compute 2v₁ + 1v₂ directly and check you get [[3],[1]].",
      "hint": "2[[1],[1]] + 1[[1],[-1]] = [[2],[2]] + [[1],[-1]] = [[3],[1]]",
      "answer": "Verification complete: 2v₁ + 1v₂ = [[3],[1]] ✓"
    }
  ],
  "caption": "Converting a vector's coordinates when you switch from basis B to the standard basis E"
}
```
