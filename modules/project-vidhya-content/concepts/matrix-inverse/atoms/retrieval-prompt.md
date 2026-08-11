---
id: matrix-inverse.retrieval-prompt
concept_id: matrix-inverse
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

If $A = \begin{pmatrix} 3 & 1 \\ 2 & 1 \end{pmatrix}$, find the (2,1) entry of $A^{-1}$.

- **(A)** 2
- **(B)** -2
- **(C)** 1
- **(D)** -1

<details>
<summary>Answer</summary>

**B**. First, compute $\det(A) = 3(1) - 1(2) = 3 - 2 = 1$.

Then, $A^{-1} = \frac{1}{1} \begin{pmatrix} 1 & -1 \\ -2 & 3 \end{pmatrix} = \begin{pmatrix} 1 & -1 \\ -2 & 3 \end{pmatrix}$.

The (2,1) entry of $A^{-1}$ is $-2$.

</details>
