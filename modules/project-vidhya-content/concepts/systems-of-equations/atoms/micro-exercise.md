---
id: systems-of-equations.micro-exercise
concept_id: systems-of-equations
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Solve the system $x + 2y = 5$ and $2x + 4y = 10$. How many solutions exist?

- **(A)** No solution
- **(B)** Unique solution
- **(C)** Infinitely many solutions
- **(D)** Two distinct solutions

<details>
<summary>Answer</summary>

**C**. In matrix form, $\begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 5 \\ 10 \end{pmatrix}$. Row 2 is exactly $2\times$ row 1, on both sides — the two equations are equivalent. $\text{rank}(A) = \text{rank}(A\mid b) = 1 < n = 2$: consistent, but underdetermined. Every point on the line $x = 5-2y$ is a solution.

</details>
