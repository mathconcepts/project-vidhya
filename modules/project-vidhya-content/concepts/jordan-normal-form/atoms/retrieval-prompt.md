---
id: jordan-normal-form.retrieval_prompt
concept_id: jordan-normal-form
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

Define a Jordan block $J_k(\lambda)$ and state the Jordan Normal Form theorem.

<details>
<summary>Answer</summary>

A **Jordan block** of size $k$ for eigenvalue $\lambda$ is the $k \times k$ matrix with $\lambda$ on the diagonal, 1's on the superdiagonal, and 0's elsewhere:
$$J_k(\lambda) = \begin{pmatrix} \lambda & 1 & & \\ & \lambda & \ddots & \\ & & \ddots & 1 \\ & & & \lambda \end{pmatrix}$$

The **Jordan Normal Form theorem** states: Every square matrix $A$ over $\mathbb{C}$ is similar to a block-diagonal matrix $J = \text{diag}(J_{k_1}(\lambda_1), \ldots, J_{k_r}(\lambda_r))$, and this form is unique up to the order of the blocks. In other words, $A = PJP^{-1}$ for some invertible $P$.

</details>