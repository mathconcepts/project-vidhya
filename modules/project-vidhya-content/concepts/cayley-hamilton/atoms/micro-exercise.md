---
id: cayley-hamilton.micro-exercise
concept_id: cayley-hamilton
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

For $A = \begin{pmatrix} 1 & 0 \\ 0 & 2 \end{pmatrix}$, write the characteristic polynomial and verify Cayley-Hamilton.

- **(A)** $p(\lambda) = \lambda^2 - 3\lambda + 2$ and $A^2 - 3A + 2I = 0$
- **(B)** $p(\lambda) = \lambda^2 + 3\lambda - 2$ and $A^2 + 3A - 2I = 0$
- **(C)** $p(\lambda) = \lambda^2 - 2\lambda + 1$ and $A^2 - 2A + I = 0$
- **(D)** $p(\lambda) = \lambda - 1$ and $A - I = 0$

<details>
<summary>Answer</summary>

**A**. The characteristic polynomial is:
$p(\lambda) = \det(\lambda I - A) = \det \begin{pmatrix} \lambda - 1 & 0 \\ 0 & \lambda - 2 \end{pmatrix} = (\lambda - 1)(\lambda - 2) = \lambda^2 - 3\lambda + 2$.

By Cayley-Hamilton, $A^2 - 3A + 2I = 0$.

Verify:
$A^2 = \begin{pmatrix} 1 & 0 \\ 0 & 4 \end{pmatrix}$

$A^2 - 3A + 2I = \begin{pmatrix} 1 & 0 \\ 0 & 4 \end{pmatrix} - 3\begin{pmatrix} 1 & 0 \\ 0 & 2 \end{pmatrix} + 2\begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 1-3+2 & 0 \\ 0 & 4-6+2 \end{pmatrix} = \begin{pmatrix} 0 & 0 \\ 0 & 0 \end{pmatrix}$ ✓

</details>
