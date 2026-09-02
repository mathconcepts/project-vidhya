---
id: quadratic-forms.common_traps
concept_id: quadratic-forms
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Forgetting to halve the cross-term.** A cross-term is a term with two different variables multiplied together, like $4xy$. When you write $x^2+4xy+y^2$ as a matrix, the off-diagonal entry (the position away from the matrix's main diagonal) is $4/2=2$, not $4$ — split the coefficient equally between $a_{ij}$ and $a_{ji}$, since both entries add up to give back the same cross-term.

**Trap 2 — Confusing eigenvalue signs with diagonal signs.** Eigenvalues are the special numbers that tell you how a matrix stretches space along its own natural directions — for a quadratic form, their signs tell you whether the form stays positive, stays negative, or goes both ways (called indefinite). $\begin{pmatrix}1&2\\2&1\end{pmatrix}$ has both diagonal entries positive, but its eigenvalues are $3,-1$ — one of each sign, so the form is indefinite. Don't judge positive definiteness (all eigenvalues positive) just by glancing at the diagonal.

**Trap 3 — Assuming the matrix isn't unique.** For every quadratic form there is exactly one **symmetric** matrix (one where $A=A^T$, meaning it looks the same after you flip it across its diagonal) that represents it. A non-symmetric matrix $B$ with $\mathbf{x}^TB\mathbf{x}=f$ can exist too, but only the symmetric average $(B+B^T)/2$'s eigenvalues actually tell you whether the form is positive, negative, or indefinite.

**Trap 4 — Checking only $\det A$ for Sylvester's criterion.** Sylvester's criterion is a quick check for positive definiteness: every leading principal minor (the determinant of the top-left $k\times k$ block, for each $k$ in turn) must be positive. A positive overall determinant alone is necessary but not sufficient — $A=\begin{pmatrix}-1&0\\0&-1\end{pmatrix}$ has $\det A=1>0$ but is negative definite, because the very first minor $D_1=-1<0$ already fails the test.
