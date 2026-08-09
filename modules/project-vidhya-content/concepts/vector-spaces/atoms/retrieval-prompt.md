---
id: vector-spaces.retrieval-prompt
concept_id: vector-spaces
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Check linear independence: Are the vectors $(1, 2, 3)$, $(2, 4, 6)$, and $(1, 1, 1)$ linearly independent?

- **(A)** Yes, they are independent
- **(B)** No, they are dependent
- **(C)** Cannot determine
- **(D)** Dependent only in some subspaces

<details>
<summary>Answer</summary>

**B**. Vectors are linearly dependent if $c_1\mathbf{v}_1 + c_2\mathbf{v}_2 + c_3\mathbf{v}_3 = \mathbf{0}$ for some non-zero $(c_1, c_2, c_3)$.

Notice that $(2, 4, 6) = 2(1, 2, 3)$. So the second vector is a scalar multiple of the first. This means:
$2(1, 2, 3) - 1(2, 4, 6) = (2, 4, 6) - (2, 4, 6) = (0, 0, 0)$.

With $c_1 = 1, c_2 = -1, c_3 = 0$, we get $c_1\mathbf{v}_1 + c_2\mathbf{v}_2 + c_3\mathbf{v}_3 = (1, 2, 3) - (2, 4, 6) + 0 = (-1, -2, -3) \neq \mathbf{0}$.

Actually, the correct dependence is $(2, 4, 6) = 2(1, 2, 3)$, so we can write $1(1, 2, 3) + (-1/2)(2, 4, 6) = 0$ or more simply $2(1, 2, 3) - (2, 4, 6) = 0$. The vectors are linearly dependent.

</details>
