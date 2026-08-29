---
id: positive-definite-matrices.exam-pattern
concept_id: positive-definite-matrices
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT: "for what range of $k$ is $A$ positive definite?"** This is the single most common shape. Turn Sylvester's criterion into inequalities and solve.

  For $A = \begin{pmatrix} 2 & k \\ k & 3 \end{pmatrix}$: $D_1 = 2 > 0$ always, and $D_2 = 6 - k^2 > 0 \Rightarrow -\sqrt{6} < k < \sqrt{6}$ (so $|k| < 2.449$). Two determinants, one inequality — no eigenvalues anywhere.

- **Use Sylvester, not eigenvalues.** For a $3\times3$, that is three determinants versus factoring a cubic. Only reach for eigenvalues when the question explicitly asks for them or for a canonical form.

- **The trap: a positive diagonal does not make a matrix positive definite.**
  $A = \begin{pmatrix} 1 & 3 \\ 3 & 1 \end{pmatrix}$ has both diagonal entries positive, yet $D_2 = 1 - 9 = -8 < 0$. Its eigenvalues are $4$ and $-2$ (verified: $4 + (-2) = 2 = \text{tr}(A)$ ✓, $4 \cdot (-2) = -8 = \det(A)$ ✓) — **indefinite**. The diagonal test disqualifies; it never certifies.

- **The semi-definite trap.** Leading principal minors test *positive definiteness only*. For positive **semi**-definiteness you need *all* principal minors $\geq 0$, not just the leading ones. $A = \begin{pmatrix} 0 & 0 \\ 0 & -1 \end{pmatrix}$ has leading minors $D_1 = 0$ and $D_2 = 0$ — neither negative — yet $\mathbf{x} = (0,1)^T$ gives $\mathbf{x}^T A \mathbf{x} = -1$. Sylvester with $\geq$ instead of $>$ is not a theorem.

- **Symmetry is a precondition.** If the given $A$ is not symmetric, symmetrise before testing: $\mathbf{x}^T A \mathbf{x} = \mathbf{x}^T\!\left(\frac{A + A^T}{2}\right)\!\mathbf{x}$, and definiteness is a property of that symmetric part.

- **Time budget:** a $2\times2$ definiteness check is two determinants, under 60 seconds. A $3\times3$ should land under two minutes. If you are expanding a characteristic cubic, you took the long road.
