---
id: jordan-normal-form.micro_exercise
concept_id: jordan-normal-form
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

Consider $A = \begin{pmatrix} 3 & 0 & 0 \\ 0 & 3 & 1 \\ 0 & 0 & 3 \end{pmatrix}$. Write the Jordan Normal Form and find the minimal polynomial.

<details>
<summary>Answer</summary>

**Jordan form:** The matrix is already in Jordan form: $J = \begin{pmatrix} 3 & 0 & 0 \\ 0 & 3 & 1 \\ 0 & 0 & 3 \end{pmatrix}$.

There are two Jordan blocks: one $1 \times 1$ block $J_1(3)$ and one $2 \times 2$ block $J_2(3)$.

**Minimal polynomial:** The largest Jordan block for eigenvalue $\lambda = 3$ has size 2, so $m_A(x) = (x - 3)^2$.

</details>