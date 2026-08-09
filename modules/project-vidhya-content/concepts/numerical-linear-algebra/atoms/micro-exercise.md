---
id: numerical-linear-algebra.micro-exercise
concept_id: numerical-linear-algebra
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Perform one step of Gaussian elimination on the system $\begin{pmatrix} 2 & 1 & | & 5 \\ 4 & 3 & | & 11 \end{pmatrix}$ using the first row as the pivot row. What is the resulting augmented matrix?

- **(A)** $\begin{pmatrix} 2 & 1 & | & 5 \\ 0 & 1 & | & 1 \end{pmatrix}$
- **(B)** $\begin{pmatrix} 2 & 1 & | & 5 \\ 0 & 2 & | & 2 \end{pmatrix}$
- **(C)** $\begin{pmatrix} 2 & 1 & | & 5 \\ 0 & 1 & | & 2 \end{pmatrix}$
- **(D)** $\begin{pmatrix} 2 & 1 & | & 5 \\ 0 & 0 & | & 1 \end{pmatrix}$

<details>
<summary>Answer</summary>

**A**. Gaussian elimination: eliminate the first column in row 2.

Multiplier: $m = \frac{a_{21}}{a_{11}} = \frac{4}{2} = 2$.

New Row 2 = Row 2 $- 2 \times$ Row 1 = $(4, 3 | 11) - 2(2, 1 | 5) = (4-4, 3-2, 11-10) = (0, 1 | 1)$.

Result: $\begin{pmatrix} 2 & 1 & | & 5 \\ 0 & 1 & | & 1 \end{pmatrix}$.

</details>
