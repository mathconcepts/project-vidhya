---
id: svd.retrieval_prompt
concept_id: svd
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["singular-values", "rank-norm-theorem"]
---

Before checking: how do singular values relate to rank, spectral norm, Frobenius norm, and the eigenvalues of $A^TA$?

<details><summary>Answer</summary>

$\text{rank}(A)=$ number of nonzero $\sigma_i$. $\|A\|_2=\sigma_1$. $\|A\|_F=\sqrt{\sum\sigma_i^2}$. And $\sigma_i(A)=\sqrt{\lambda_i(A^TA)}$ — singular values are the square roots of $A^TA$'s eigenvalues, never $A$'s own.
</details>
