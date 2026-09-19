---
id: matrices-and-determinants.micro-exercise
concept_id: matrices-and-determinants
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
estimated_minutes: 3
---

For what value of $k$ does the system $x+y+z=6$, $x+2y+3z=10$, $x+2y+kz=12$ fail to have a unique solution?

- **(A)** $1$
- **(B)** $2$
- **(C)** $3$
- **(D)** $4$

<details>
<summary>Answer</summary>

**C**. The system fails to have a unique solution exactly when the coefficient determinant is zero. With

$$A=\begin{pmatrix}1&1&1\\1&2&3\\1&2&k\end{pmatrix}$$

expand along column 1 (it has two matching entries, which keeps the arithmetic light):

$$\det(A)=1\begin{vmatrix}2&3\\2&k\end{vmatrix}-1\begin{vmatrix}1&1\\2&k\end{vmatrix}+1\begin{vmatrix}1&1\\2&3\end{vmatrix}=(2k-6)-(k-2)+(3-2)=k-3$$

Setting $\det(A)=0$ gives $k=3$.

</details>
