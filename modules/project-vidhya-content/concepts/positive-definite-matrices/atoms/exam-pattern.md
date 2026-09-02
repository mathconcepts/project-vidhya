---
id: positive-definite-matrices.exam-pattern
concept_id: positive-definite-matrices
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
modality: text
exam_ids: ["*"]
---

**How GATE actually asks this.**

- **NAT: "for what range of $k$ is $A$ positive definite?"** The single most common shape. Turn Sylvester's criterion into inequalities and solve. For $A=\begin{pmatrix}2&k\\k&3\end{pmatrix}$: $D_1=2>0$ always, $D_2=6-k^2>0 \Rightarrow -\sqrt6<k<\sqrt6$. Two determinants, one inequality — no eigenvalues anywhere.

- **Use Sylvester, not eigenvalues.** For a $3\times3$, that's three determinants versus factoring a cubic. Only reach for eigenvalues when the question explicitly asks for them or a canonical form.

- **The trap: a positive diagonal does not make a matrix positive definite.** $A=\begin{pmatrix}1&3\\3&1\end{pmatrix}$ has both diagonal entries positive, yet $D_2=1-9=-8<0$. Eigenvalues $4,-2$ (verified: $4-2=2=\text{tr}(A)$ ✓, $4\cdot(-2)=-8=\det(A)$ ✓) — indefinite. The diagonal test disqualifies; it never certifies.

- **The semi-definite trap.** Leading principal minors test positive definiteness *only*. For semi-definiteness you need *all* principal minors $\geq0$, not just the leading ones. $A=\begin{pmatrix}0&0\\0&-1\end{pmatrix}$ has $D_1=0,D_2=0$ — neither negative — yet $(0,1)^TA(0,1)=-1$.

- **Symmetry is a precondition.** If $A$ isn't symmetric, symmetrize first: $\mathbf{x}^TA\mathbf{x}=\mathbf{x}^T\!\left(\frac{A+A^T}{2}\right)\!\mathbf{x}$.

- **Time budget:** a $2\times2$ check is two determinants, under 60 seconds; a $3\times3$ under two minutes.
