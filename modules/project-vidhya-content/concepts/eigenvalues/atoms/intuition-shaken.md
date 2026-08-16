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

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: which vectors survive A = [[2,1],[1,2]]?",
  "steps": [
    {
      "prompt": "Is $v=(1,0)$ an eigenvector of $A$?",
      "hint": "Compute $Av$ and compare directions. $(1,0)$ points straight right — does the output still point right?",
      "answer": "$Av=(2,1)$ tilts upward, a different direction, so $(1,0)$ is not an eigenvector.",
      "eqn": "A(1,0) = (2,1)"
    },
    {
      "prompt": "Is $v=(1,1)$ an eigenvector?",
      "hint": "Compute $Av$ and check whether it is a scalar multiple of $v$.",
      "answer": "$Av=(3,3)=3(1,1)$ — same direction, three times as long. Eigenvector, $\\lambda=3$.",
      "eqn": "A(1,1) = (3,3)"
    },
    {
      "prompt": "Is $v=(1,-1)$ an eigenvector?",
      "hint": "Same check: is $Av$ a scalar multiple of $v$?",
      "answer": "$Av=(1,-1)=1\\cdot(1,-1)$ — unchanged. Eigenvector, $\\lambda=1$.",
      "eqn": "A(1,-1) = (1,-1)"
    },
    {
      "prompt": "What do these two eigenvectors tell you about A?",
      "hint": "Two directions survive with only their length changed; every other vector gets pulled somewhere between them, which is why most arrows change direction. You never need to picture a $4\\times4$ matrix to use this — two dimensions is enough to see the idea.",
      "answer": "Along $(1,1)$ the matrix stretches by 3; along $(1,-1)$ it does nothing. Finding these directions, for any matrix, is the rest of the topic."
    }
  ],
  "caption": "Say the equation out loud: matrix times vector equals number times vector. If you can say that sentence, you have the definition."
}
```
