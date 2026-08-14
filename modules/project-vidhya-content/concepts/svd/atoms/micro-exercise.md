---
id: svd.micro_exercise
concept_id: svd
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

## Quick Exercise: Singular Values and Norms

**Question:** Let $A = \begin{pmatrix} 3 & 0 \\ 0 & 2 \end{pmatrix}$. Without computing the full SVD, find the spectral norm $\|A\|_2$ and the Frobenius norm $\|A\|_F$.

<details>
<summary>Answer</summary>

For a diagonal matrix, singular values equal the absolute values of the diagonal entries: $\sigma_1 = 3$, $\sigma_2 = 2$.

**Spectral norm:** $\|A\|_2 = \sigma_1 = 3$ (the largest singular value).

**Frobenius norm:** $\|A\|_F = \sqrt{\sigma_1^2 + \sigma_2^2} = \sqrt{9 + 4} = \sqrt{13}$.

</details>