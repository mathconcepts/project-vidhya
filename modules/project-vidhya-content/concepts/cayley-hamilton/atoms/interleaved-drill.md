---
id: cayley-hamilton.interleaved-drill
concept_id: cayley-hamilton
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: cayley-hamilton.micro-exercise
---

**Cross-concept check: eigenvalues → Cayley-Hamilton.**

$A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$.

**Question 1 (eigenvalues):** Write the characteristic polynomial of $A$ without expanding a determinant, and give the eigenvalues.

*Answer:* For any $2\times2$, $p(\lambda) = \lambda^2 - \text{tr}(A)\lambda + \det(A)$. Here $\text{tr}(A) = 4$ and $\det(A) = 4 - 1 = 3$, so

$$p(\lambda) = \lambda^2 - 4\lambda + 3 = (\lambda - 3)(\lambda - 1)$$

Eigenvalues $3$ and $1$ (verified: $3 + 1 = 4 = \text{tr}(A)$ ✓, $3 \cdot 1 = 3 = \det(A)$ ✓).

**Question 2 (Cayley-Hamilton):** Use $p$ to compute $A^{-1}$ — without cofactors, and without using the eigenvalues you just found.

*Answer:* Substitute $A$ into its own characteristic polynomial: $A^2 - 4A + 3I = 0$. Factor an $A$ out of the first two terms:

$$A(A - 4I) = -3I \quad \Longrightarrow \quad A(4I - A) = 3I \quad \Longrightarrow \quad A^{-1} = \tfrac{1}{3}(4I - A)$$

$$A^{-1} = \tfrac{1}{3}\left(\begin{pmatrix} 4 & 0 \\ 0 & 4\end{pmatrix} - \begin{pmatrix} 2 & 1 \\ 1 & 2\end{pmatrix}\right) = \tfrac{1}{3}\begin{pmatrix} 2 & -1 \\ -1 & 2 \end{pmatrix}$$

Verified against the standard $2\times2$ formula $\frac{1}{\det A}\begin{pmatrix} d & -b \\ -c & a\end{pmatrix} = \frac{1}{3}\begin{pmatrix} 2 & -1 \\ -1 & 2\end{pmatrix}$ ✓.

**Why this drill exists:** students routinely believe Cayley-Hamilton requires *finding the eigenvalues first*, and stall on any matrix whose characteristic polynomial does not factor cleanly. It doesn't. The theorem consumes only the **coefficients** — trace and determinant for a $2\times2$ — and never the roots. Question 1 finds the roots; Question 2 shows they were never needed.
