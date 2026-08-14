---
id: gram-schmidt.retrieval_prompt
concept_id: gram-schmidt
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

# Gram-Schmidt Process: Retrieval Prompt

## Question

**State the Gram-Schmidt orthogonalization algorithm in one sentence:** given linearly independent vectors $v_1, v_2, \ldots, v_n$, how do you construct orthonormal vectors $e_1, e_2, \ldots, e_n$?

<details>
<summary>Answer</summary>

For each $i = 1, 2, \ldots, n$:
1. Subtract from $v_i$ all its projections onto the previously computed orthonormal vectors: $\tilde{u}_i = v_i - \sum_{j=1}^{i-1} \langle v_i, e_j \rangle e_j$.
2. Normalize the result: $e_i = \frac{\tilde{u}_i}{\|\tilde{u}_i\|}$.

This produces an orthonormal basis (unit length, pairwise orthogonal) spanning the same subspace as the original vectors.

</details>