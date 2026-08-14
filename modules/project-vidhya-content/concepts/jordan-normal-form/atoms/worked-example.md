---
id: jordan-normal-form.worked_example
concept_id: jordan-normal-form
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
---

Find the Jordan Normal Form of $A = \begin{pmatrix} 2 & 1 & 0 \\ 0 & 2 & 1 \\ 0 & 0 & 2 \end{pmatrix}$.

---

**Step 1:** Find the eigenvalues.

The characteristic polynomial is $\det(A - \lambda I) = (2 - \lambda)^3$, so $\lambda = 2$ is the only eigenvalue with algebraic multiplicity 3.

---

**Step 2:** Find the eigenspace and generalized eigenspace.

For $\lambda = 2$: $(A - 2I) = \begin{pmatrix} 0 & 1 & 0 \\ 0 & 0 & 1 \\ 0 & 0 & 0 \end{pmatrix}$ has rank 2, so $\dim(E_2) = 3 - 2 = 1$. There is only one independent eigenvector (e.g., $v_1 = (1, 0, 0)^T$), so the matrix is defective.

Since $(A - 2I)^2 = \begin{pmatrix} 0 & 0 & 1 \\ 0 & 0 & 0 \\ 0 & 0 & 0 \end{pmatrix}$ has rank 1, the generalized eigenspace has dimension $3 - 1 = 2$ — still short of 3. The largest Jordan block must have size 3.

---

**Step 3:** Assemble the Jordan form.

Since we have one eigenvalue $\lambda = 2$ with algebraic multiplicity 3 and only one independent eigenvector, there is one Jordan block of size 3:

$$J = \begin{pmatrix} 2 & 1 & 0 \\ 0 & 2 & 1 \\ 0 & 0 & 2 \end{pmatrix}$$

In fact, $A$ is already in Jordan form!

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