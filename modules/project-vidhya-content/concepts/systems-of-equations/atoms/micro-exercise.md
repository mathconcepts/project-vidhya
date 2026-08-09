---
id: systems-of-equations.micro-exercise
concept_id: systems-of-equations
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Solve the system: $x + 2y = 5$ and $2x + 4y = 10$. How many solutions exist?

- **(A)** No solution
- **(B)** Unique solution
- **(C)** Infinitely many solutions
- **(D)** Two distinct solutions

<details>
<summary>Answer</summary>

**C**. Write in matrix form: $\begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 5 \\ 10 \end{pmatrix}$.

Notice that row 2 is exactly 2 times row 1 (both on the left and on the right). This means the two equations are equivalent—they represent the same constraint.

From the first equation: $x + 2y = 5$, or $x = 5 - 2y$.

For any value of $y$, we can find a corresponding $x$. For example:
- If $y = 0$, then $x = 5$ → solution $(5, 0)$
- If $y = 1$, then $x = 3$ → solution $(3, 1)$
- If $y = 2$, then $x = 1$ → solution $(1, 2)$

There are infinitely many solutions. The system is consistent (both equations are the same) but underdetermined (one degree of freedom).

</details>
