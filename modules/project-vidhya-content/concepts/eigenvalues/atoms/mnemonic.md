---
id: eigenvalues.mnemonic
concept_id: eigenvalues
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Eigen" means "own" in German.** An eigenvector is a direction the matrix treats as its own — the matrix doesn't turn it to face a new way, it only makes it longer or shorter. That's the whole idea packed into one word.

**For any $2\times2$ matrix, remember "SAD":**

- **S**um of the two eigenvalues $=$ trace of $A$ (just add the two numbers on the diagonal, top-left plus bottom-right)
- **A**nd
- **D**eterminant $=$ product of the two eigenvalues

$$\lambda_1 + \lambda_2 = \text{tr}(A), \qquad \lambda_1 \lambda_2 = \det(A)$$

That's two simple equations for two unknown numbers ($\lambda_1$ and $\lambda_2$). Try small whole numbers first and check them against both equations — only reach for the quadratic formula on $\lambda^2 - \text{tr}(A)\lambda + \det(A) = 0$ when nothing clean fits.

**Always double-check:** once you've found both eigenvalues, add them and multiply them. If the sum doesn't match the trace, or the product doesn't match the determinant, you've made an arithmetic slip somewhere — go fix it before trusting the answer.
