---
# Alternative body for eigenvalues.intuition, served when the learner stance is
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
id: eigenvalues.intuition.shaken
concept_id: eigenvalues
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: eigenvalues.intuition
for_stance: shaken
---

## One vector at a time

Take $A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$ and feed it three vectors.

**Try $v = (1, 0)$.** $Av = (2, 1)$. The input pointed straight right; the output tilts upward. Different direction. Not an eigenvector.

**Try $v = (1, 1)$.** $Av = (3, 3)$. Same direction — straight out along the diagonal — just three times as long. This one **is** an eigenvector, and $\lambda = 3$.

**Try $v = (1, -1)$.** $Av = (1, -1)$. Unchanged. Also an eigenvector, with $\lambda = 1$.

## What you just found

Two directions this matrix leaves alone. Along one it stretches by 3, along the other it does nothing. Every other vector gets pulled somewhere in between — which is why most arrows change direction.

The equation for "output points the same way as input, only scaled" is:

$$Av = \lambda v$$

Read it out loud: *matrix times vector equals number times vector.* If you can say that sentence, you have the definition.

## The one thing to hold onto

You do not have to picture what a $4\times 4$ matrix does. Two dimensions is enough. Eigenvectors are the directions that survive the transformation with only their length changed — and the eigenvalue is by how much.

Everything else in this topic is a method for finding them. Not a new idea.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the entries of A and watch the eigenvalues move",
  "inputs": [
    {"id": "a", "label": "a (top-left)", "min": 0, "max": 6, "step": 0.5, "initial": 4},
    {"id": "b", "label": "b (top-right)", "min": 0, "max": 3, "step": 0.25, "initial": 1},
    {"id": "c", "label": "c (bottom-left)", "min": 0, "max": 3, "step": 0.25, "initial": 2},
    {"id": "d", "label": "d (bottom-right)", "min": 0, "max": 6, "step": 0.5, "initial": 3}
  ],
  "outputs": [
    {"label": "trace = a + d", "formula": "a + d", "digits": 2},
    {"label": "det = ad - bc", "formula": "a*d - b*c", "digits": 2},
    {"label": "discriminant = (a-d)^2 + 4bc", "formula": "(a-d)^2 + 4*b*c", "digits": 2},
    {"label": "eigenvalue 1 (larger)", "formula": "(a + d + sqrt((a-d)^2 + 4*b*c)) / 2", "digits": 2},
    {"label": "eigenvalue 2 (smaller)", "formula": "(a + d - sqrt((a-d)^2 + 4*b*c)) / 2", "digits": 2}
  ],
  "caption": "b and c are both kept at 0 or above, so (a-d)^2 + 4bc can never go negative on these sliders — the eigenvalues stay real everywhere you drag. Watch the two eigenvalues move as trace and determinant change."
}
```
