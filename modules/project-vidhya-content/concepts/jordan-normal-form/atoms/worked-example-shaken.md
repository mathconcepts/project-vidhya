---
# Alternative body for jordan-normal-form.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The prose is held at or below the base atom's length — a screen visibly
# longer than the one that already defeated this reader signals difficulty
# no matter how kindly it is written. No praise, no reassurance, and no
# mention of how the reader might be feeling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: jordan-normal-form.worked-example.shaken
concept_id: jordan-normal-form
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: jordan-normal-form.worked_example
for_stance: shaken
---

**Matrix:** $A = \begin{pmatrix} 2 & 1 & 0 \\ 0 & 2 & 1 \\ 0 & 0 & 2 \end{pmatrix}$. Find its Jordan form.

---

**Step 1 — eigenvalue.**

Upper triangular, so eigenvalues sit on the diagonal: $\lambda = 2$, three times.

---

**Step 2 — how many eigenvectors?**

$(A-2I) = \begin{pmatrix} 0&1&0\\0&0&1\\0&0&0 \end{pmatrix}$ has rank $2$, so its null space is $3-2=1$-dimensional.

One eigenvector, e.g. $(1,0,0)^T$ — for three copies of $\lambda=2$. Not enough. This matrix is defective.

---

**Step 3 — block size.**

Square it: $(A-2I)^2 = \begin{pmatrix} 0&0&1\\0&0&0\\0&0&0 \end{pmatrix}$, rank $1$.

One eigenvector means one Jordan block. Algebraic multiplicity $3$, one block, so the block has size $3$ — the whole matrix is already the block.

$$\boxed{J = \begin{pmatrix} 2 & 1 & 0 \\ 0 & 2 & 1 \\ 0 & 0 & 2 \end{pmatrix}}$$

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
