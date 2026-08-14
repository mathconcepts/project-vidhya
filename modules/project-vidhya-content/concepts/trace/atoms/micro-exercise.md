---
id: trace.micro_exercise
concept_id: trace
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

Given $A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$ and $B = \begin{pmatrix} 0 & 1 \\ -1 & 0 \end{pmatrix}$, compute $\text{tr}(AB)$ and $\text{tr}(BA)$ and verify that they are equal.

<details>
<summary>Answer</summary>

**Computing $AB$:**
$$AB = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} \begin{pmatrix} 0 & 1 \\ -1 & 0 \end{pmatrix} = \begin{pmatrix} 0 - 2 & 1 + 0 \\ 0 - 4 & 3 + 0 \end{pmatrix} = \begin{pmatrix} -2 & 1 \\ -4 & 3 \end{pmatrix}$$

$$\text{tr}(AB) = -2 + 3 = 1$$

**Computing $BA$:**
$$BA = \begin{pmatrix} 0 & 1 \\ -1 & 0 \end{pmatrix} \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} = \begin{pmatrix} 0 + 3 & 0 + 4 \\ -1 + 0 & -2 + 0 \end{pmatrix} = \begin{pmatrix} 3 & 4 \\ -1 & -2 \end{pmatrix}$$

$$\text{tr}(BA) = 3 + (-2) = 1$$

**Verification:** $\text{tr}(AB) = \text{tr}(BA) = 1$ ✓

The cyclic property holds: order doesn't affect the trace of the product.

</details>
