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

## Try three vectors, see what happens

Take $A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$.

$v=(1,0)$: $Av=(2,1)$ — different direction.

$v=(1,1)$: $Av=(3,3)$ — same direction, just $3\times$ longer. Eigenvector, $\lambda=3$.

$v=(1,-1)$: $Av=(1,-1)$ — unchanged. Also an eigenvector, $\lambda=1$.

$$Av = \lambda v$$

Most vectors change direction. These two don't — only their length does.

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
