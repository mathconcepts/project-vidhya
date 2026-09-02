---
id: svd.mnemonic
concept_id: svd
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
modality: mnemonic
exam_ids: ["*"]
---

**"Rotate — Stretch — Rotate."** Read $A = U\Sigma V^T$ right to left, the way it acts on a vector: $V^T$ rotates, $\Sigma$ stretches along the axes, $U$ rotates again. Every matrix on earth is exactly those three moves. That's why SVD exists for *any* $A$ — even non-square, even singular.

**Where the numbers come from, remembered as "square then square-root":**

$$\sigma_i = \sqrt{\lambda_i(A^T A)}$$

Singular values are the **square roots of the eigenvalues of $A^T A$**. $A^T A$ is symmetric and positive semi-definite, so those eigenvalues are always real and $\geq 0$ — no complex numbers ever sneak in, which is exactly why $\sigma$ exists when eigenvalues of $A$ misbehave.

**Three one-liners worth memorising cold:**

- $\text{rank}(A) = $ how many $\sigma_i \neq 0$ (count, don't row-reduce)
- $\|A\|_2 = \sigma_1$ (the largest one)
- $\|A\|_F = \sqrt{\sum \sigma_i^2}$

**Sanity-check reflex:** $\sum \sigma_i^2 = \text{tr}(A^T A) = $ sum of squares of *all* entries of $A$. Add up every entry squared; if it doesn't match your $\sigma$'s, you slipped.
