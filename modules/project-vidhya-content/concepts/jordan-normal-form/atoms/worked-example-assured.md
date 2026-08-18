---
# Alternative body for jordan-normal-form.worked_example, served when the learner stance is
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
id: jordan-normal-form.worked-example.assured
concept_id: jordan-normal-form
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: jordan-normal-form.worked_example
for_stance: assured
---

$A = \begin{pmatrix} 2 & 1 & 0 \\ 0 & 2 & 1 \\ 0 & 0 & 2 \end{pmatrix}$: upper triangular, so $\lambda = 2$ (multiplicity 3) is read off the diagonal for free — no characteristic polynomial to expand.

$\operatorname{rank}(A-2I) = 2$ caps the eigenspace at dimension $1$: one block, size $3$, and $A$ is already sitting in Jordan form.

**The general recipe when it isn't this obvious:** block count for $\lambda$ = $\dim\ker(A-\lambda I)$ = geometric multiplicity. Block sizes come from the rank sequence of $(A-\lambda I)^j$ — the number of blocks of size $\ge j$ is $\operatorname{rank}(A-\lambda I)^{j-1} - \operatorname{rank}(A-\lambda I)^{j}$. Here that sequence is $3 \to 2 \to 1 \to 0$, one drop per power, which is exactly the signature of a single size-3 block rather than three size-1s or a 2+1 split — those would show rank stabilizing before $j=3$.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: Jordan Form of defective matrix",
  "steps": [
    {
      "prompt": "What is the characteristic polynomial of $A$, and what are its roots?",
      "hint": "Compute $\\det(A - \\lambda I)$ for the upper-triangular matrix. The diagonal entries are all $(2-\\lambda)$.",
      "answer": "$\\det(A - \\lambda I) = (2-\\lambda)^3$, so $\\lambda = 2$ with algebraic multiplicity 3."
    },
    {
      "prompt": "Find the eigenspace for $\\lambda = 2$ by solving $(A - 2I)\\mathbf{v} = \\mathbf{0}$.",
      "hint": "$A - 2I$ is strictly upper-triangular with rank 2. Use row reduction or back-substitution. The null space is 1-dimensional.",
      "answer": "$E_2 = \\text{span}\\{(1, 0, 0)^T\\}$. There is only 1 independent eigenvector, so the matrix is defective."
    },
    {
      "prompt": "Compute $(A - 2I)^2$ and determine the size of the largest Jordan block.",
      "hint": "$(A - 2I)^2$ has rank 1. The geometric multiplicity is 1 (one Jordan block), and the algebraic multiplicity is 3, so the block has size 3.",
      "answer": "$(A - 2I)^2$ has rank 1, confirming one Jordan block of size 3 for $\\lambda = 2$."
    }
  ],
  "caption": "The Jordan form of a defective matrix records one large block for the repeated eigenvalue."
}
```
