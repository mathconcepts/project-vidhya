---
id: matrix-inverse.interleaved-drill
concept_id: matrix-inverse
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: matrix-inverse.micro-exercise
---

**Cross-concept check: matrix inverse → systems of equations.**

$A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$, with $\det(A) = -2$ and $A^{-1} = \begin{pmatrix} -2 & 1 \\ 3/2 & -1/2 \end{pmatrix}$. Consider the system

$$x_1 + 2x_2 = 5, \qquad 3x_1 + 4x_2 = 11$$

**Question 1 (inverse → systems):** Before solving anything, how many solutions does this system have — and how many would it have if the right-hand side were $(0,0)$, or $(7,-3)$?

*Answer:* Exactly one, in all three cases. $\det A = -2 \neq 0$, so $A^{-1}$ exists, so $x = A^{-1}b$ is defined and unique **for every $b$**. Invertibility is a property of $A$ alone — it settles the solution count before you have even looked at $b$.

**Question 2 (systems → inverse):** Solve it via $x = A^{-1}b$, then say what would have changed had $\det A$ been $0$.

*Answer:*

$$x = A^{-1}b = \begin{pmatrix} -2 & 1 \\ 3/2 & -1/2 \end{pmatrix}\begin{pmatrix} 5 \\ 11 \end{pmatrix} = \begin{pmatrix} -10 + 11 \\ 7.5 - 5.5 \end{pmatrix} = \begin{pmatrix} 1 \\ 2 \end{pmatrix}$$

Check: $1 + 4 = 5$ ✓ and $3 + 8 = 11$ ✓.

If $\det A = 0$, the count is no longer determined by $A$ alone: the system has **either** no solution **or** infinitely many, depending entirely on whether $b$ lies in the column space of $A$. "Singular" never means "no solution"; it means "uniqueness is gone."

**Why this drill exists:** the misconception is that a singular matrix implies an inconsistent system. It doesn't — $\det A = 0$ kills *uniqueness*, not *existence*. Students carrying the wrong version confidently mark "no solution" on systems that in fact have infinitely many.
