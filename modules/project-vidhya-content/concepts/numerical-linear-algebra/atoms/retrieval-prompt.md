---
id: numerical-linear-algebra.retrieval-prompt
concept_id: numerical-linear-algebra
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Factor the matrix $A = \begin{pmatrix} 2 & 4 \\ 3 & 5 \end{pmatrix}$ into LU form (where $L$ has 1s on the diagonal).

- **(A)** $L = \begin{pmatrix} 1 & 0 \\ 1.5 & 1 \end{pmatrix}$, $U = \begin{pmatrix} 2 & 4 \\ 0 & -1 \end{pmatrix}$
- **(B)** $L = \begin{pmatrix} 1 & 0 \\ 1.5 & 1 \end{pmatrix}$, $U = \begin{pmatrix} 2 & 4 \\ 0 & 1 \end{pmatrix}$
- **(C)** $L = \begin{pmatrix} 1 & 0 \\ 0.67 & 1 \end{pmatrix}$, $U = \begin{pmatrix} 2 & 4 \\ 0 & -1 \end{pmatrix}$
- **(D)** $L = \begin{pmatrix} 1 & 0 \\ 1 & 1 \end{pmatrix}$, $U = \begin{pmatrix} 2 & 4 \\ 0 & 1 \end{pmatrix}$

<details>
<summary>Answer</summary>

**A**. Gaussian elimination to obtain $U$:

Multiplier for row 2: $m_{21} = \frac{a_{21}}{a_{11}} = \frac{3}{2} = 1.5$.

New Row 2 = Row 2 $- 1.5 \times$ Row 1 = $(3, 5) - 1.5(2, 4) = (3 - 3, 5 - 6) = (0, -1)$.

So $U = \begin{pmatrix} 2 & 4 \\ 0 & -1 \end{pmatrix}$ and $L = \begin{pmatrix} 1 & 0 \\ 1.5 & 1 \end{pmatrix}$ (multiplier in lower position).

Verification: $LU = \begin{pmatrix} 1 & 0 \\ 1.5 & 1 \end{pmatrix} \begin{pmatrix} 2 & 4 \\ 0 & -1 \end{pmatrix} = \begin{pmatrix} 2 & 4 \\ 3 & 5 \end{pmatrix} = A$ ✓

</details>
