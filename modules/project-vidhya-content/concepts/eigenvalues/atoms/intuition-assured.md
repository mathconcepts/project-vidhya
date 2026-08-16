---
# Alternative body for eigenvalues.intuition, served when the learner stance is
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
id: eigenvalues.intuition.assured
concept_id: eigenvalues
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: eigenvalues.intuition
for_stance: assured
---

$Av = \lambda v$ says $v$ spans a one-dimensional $A$-invariant subspace. That framing generalises where the arrow picture stops: eigenvectors are the $1$-dimensional case of invariant subspaces, which is what makes the spectral theorem and Jordan form the same story at different resolutions.

## What actually costs marks

**Trace and determinant give you both eigenvalues for free in $2\times2$.** $\lambda_1 + \lambda_2 = \operatorname{tr}(A)$, $\lambda_1\lambda_2 = \det(A)$. Solve the pair by inspection rather than expanding the characteristic polynomial — faster, and it doubles as your check.

**Algebraic vs geometric multiplicity.** $\lambda$ repeated twice does not guarantee two independent eigenvectors. $\begin{pmatrix}2&1\\0&2\end{pmatrix}$ has $\lambda=2$ twice and a one-dimensional eigenspace. Not diagonalisable. This is the single most common trap in the topic.

**Symmetric matrices are the safe case.** Real eigenvalues, orthogonal eigenvectors, always diagonalisable. If a question hands you a symmetric matrix, that is usually the fact being tested.

**Real matrices can have complex eigenvalues.** A rotation has no real invariant direction. If your discriminant goes negative, that is a geometric statement, not an arithmetic slip.

**Where it pays off.** $A = PDP^{-1}$ turns $A^k$ into $PD^kP^{-1}$, which is why eigen-decomposition surfaces in Markov chains, difference equations, and stability — the eigenvalue moduli decide whether the system decays, holds, or blows up.

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
