---
id: matrix-norms.retrieval-prompt
concept_id: matrix-norms
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["singular values", "condition number"]
---

From memory: for a diagonal matrix, how do $\|A\|_2$, $\|A\|_F$, and $\kappa_2(A)$ relate to its diagonal entries?

<details>
<summary>Answer</summary>

$\|A\|_2=\max_i|d_i|$, $\|A\|_F=\sqrt{\sum_i d_i^2}$, $\kappa_2(A)=\max_i|d_i|/\min_i|d_i|$ — the diagonal entries ARE the singular values (up to sign) when $A$ is diagonal.
</details>
