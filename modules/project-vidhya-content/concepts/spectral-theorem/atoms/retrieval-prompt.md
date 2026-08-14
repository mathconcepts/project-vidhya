---
id: spectral-theorem.retrieval-prompt
concept_id: spectral-theorem
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

**Recall Question:**

State the Spectral Theorem for symmetric matrices. Include the decomposition formula, the conditions on $Q$ and $\Lambda$, and one consequence for computing matrix functions.

<details><summary>Answer</summary>

**The Spectral Theorem:**

If $A$ is a symmetric matrix (i.e., $A^{\mathrm{T}} = A$), then $A$ can be written as:
$$A = Q\Lambda Q^{\mathrm{T}}$$

where:
- $\Lambda = \mathrm{diag}(\lambda_1, \lambda_2, \ldots, \lambda_n)$ is a diagonal matrix of the real eigenvalues of $A$.
- $Q$ is an orthogonal matrix whose columns are orthonormal eigenvectors of $A$ (i.e., $Q^{\mathrm{T}}Q = I$ and $\|Q\mathbf{e}_i\| = 1$).

**Properties guaranteed by the theorem:**
1. All eigenvalues are real.
2. Eigenvectors corresponding to distinct eigenvalues are orthogonal.
3. An orthonormal eigenbasis exists for $\mathbb{R}^n$.

**Consequence for matrix functions:**

For any scalar function $f$,
$$f(A) = Q \, f(\Lambda) \, Q^{\mathrm{T}} = Q \, \mathrm{diag}(f(\lambda_1), \ldots, f(\lambda_n)) \, Q^{\mathrm{T}}$$

This allows efficient computation of $\sqrt{A}$, $A^{-1}$, $e^A$, $\sin(A)$, and other matrix functions.

</details>