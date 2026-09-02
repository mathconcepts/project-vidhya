---
# Alternative body for determinants.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: determinants.intuition.shaken
concept_id: determinants
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: determinants.intuition
for_stance: shaken
---

For $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$: $\det(A) = ad - bc$. Multiply the diagonal, multiply the anti-diagonal, subtract.

$$\begin{pmatrix} 3 & 1 \\ 2 & 4 \end{pmatrix} \Rightarrow (3)(4) - (1)(2) = 12 - 2 = 10$$

This matrix makes areas ten times bigger.

Three questions the number answers: can I invert this matrix? Yes, exactly when $\det \neq 0$ — a zero determinant means the matrix squashed space flat, and nothing can unsquash it. What happened to areas? They scaled by $|\det|$. Did it flip? Yes, if $\det$ is negative — the transformation turned the plane over.

The property that saves the most time: $\det(AB) = \det(A)\det(B)$. So a question asking for $\det(A^3)$ does **not** require multiplying $A$ by itself three times — compute $\det(A)$ once and cube it.

What GATE asks: compute a determinant (usually by row reduction, not cofactors), spot a singular matrix, use $\det(AB)=\det(A)\det(B)$ to avoid work, connect $\det$ to whether a system has a unique solution.

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
