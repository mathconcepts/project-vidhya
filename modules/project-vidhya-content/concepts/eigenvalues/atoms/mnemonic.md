---
id: eigenvalues.mnemonic
concept_id: eigenvalues
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Eigen" = "own"** (German). An eigenvector is a direction the matrix treats as its *own* — it doesn't rotate it, only stretches or shrinks it. That's the whole idea in one word.

**The 2×2 shortcut, remembered as "SAD":**

- **S**um of eigenvalues $= \text{trace}(A)$ (add the diagonal)
- **A**nd
- **D**eterminant of eigenvalues' product $= \det(A)$

$$\lambda_1 + \lambda_2 = \text{tr}(A), \qquad \lambda_1 \lambda_2 = \det(A)$$

For a $2\times 2$, that's two equations for two unknowns — you rarely need the full characteristic polynomial. Solve the pair directly, or fall back to the quadratic formula on $\lambda^2 - \text{tr}(A)\lambda + \det(A) = 0$ only if the numbers don't factor cleanly.

**Sanity-check reflex:** after finding eigenvalues any way at all, add them and multiply them. If they don't match trace and det, you made an arithmetic slip — go back before you trust the answer.
