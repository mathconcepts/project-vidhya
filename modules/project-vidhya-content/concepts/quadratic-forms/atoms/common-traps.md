---
id: quadratic-forms.common_traps
concept_id: quadratic-forms
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Forgetting to halve the cross-term.** For $x^2+4xy+y^2$, the off-diagonal entry is $4/2=2$, not $4$. The coefficient of $x_ix_j$ is shared equally between $a_{ij}$ and $a_{ji}$.

**Trap 2 — Confusing eigenvalue signs with diagonal signs.** $\begin{pmatrix}1&2\\2&1\end{pmatrix}$ has both diagonal entries positive yet eigenvalues $3,-1$ — indefinite. Large positive diagonal entries don't guarantee positive definiteness.

**Trap 3 — Assuming the matrix isn't unique.** There is exactly one **symmetric** matrix per quadratic form. A non-symmetric $B$ with $\mathbf{x}^TB\mathbf{x}=f$ may exist, but only $(B+B^T)/2$'s spectrum classifies the form.

**Trap 4 — Checking only $\det A$ for Sylvester's criterion.** A positive determinant is necessary but not sufficient. $A=\begin{pmatrix}-1&0\\0&-1\end{pmatrix}$ has $\det A=1>0$ but is negative definite — $D_1=-1<0$ fails Sylvester immediately.
