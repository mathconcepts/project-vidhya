---
id: matrix-norms.common_traps
concept_id: matrix-norms
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Confusing the spectral norm with the Frobenius norm**

The spectral norm $\|A\|_2 = \sigma_{\max}(A)$ is the largest singular value alone. The Frobenius norm $\|A\|_F = \sqrt{\text{tr}(A^T A)} = \sqrt{\sum_i \sigma_i^2}$ is the square root of the sum of *all* squared singular values. For a diagonal matrix, $\|A\|_2$ picks the largest diagonal entry, while $\|A\|_F$ is the Euclidean norm of the diagonal vector. They are *not* equal unless the matrix has only one nonzero singular value.

**Trap 2: Computing condition number with the wrong norm**

When a GATE problem asks for $\kappa(A)$ without specifying the norm, **always default to the spectral norm** $\kappa_2(A) = \sigma_{\max} / \sigma_{\min}$. Do not use $\kappa_1(A) = \|A\|_1 \|A^{-1}\|_1$ or other norm-based definitions unless explicitly asked. The spectral condition number is far more common in GATE and has the elegant form: ratio of singular values.

**Trap 3: Forgetting the square root when computing spectral norm from eigenvalues**

The spectral norm is $\|A\|_2 = \sqrt{\lambda_{\max}(A^T A)}$ where $\lambda_{\max}$ is the largest eigenvalue of $A^T A$. Many students compute the eigenvalues of $A^T A$ and mistakenly claim $\|A\|_2 = \lambda_{\max}(A^T A)$, forgetting the square root. Remember: singular values are the square roots of the eigenvalues of $A^T A$.

**Trap 4: Assuming $\|A^{-1}\| = 1/\|A\|$**

This is **false**. The correct relationship is $\|A^{-1}\|_2 = 1/\sigma_{\min}(A)$. If $\sigma_{\min}$ is tiny (ill-conditioned matrix), then $\|A^{-1}\|$ blows up. There is no simple formula $\|A^{-1}\| = 1/\|A\|$ for general norms; such confusion leads to wildly incorrect condition number estimates.