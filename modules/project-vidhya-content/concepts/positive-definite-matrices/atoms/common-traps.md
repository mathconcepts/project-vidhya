---
id: positive-definite-matrices.common-traps
concept_id: positive-definite-matrices
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — "Positive diagonal entries imply positive definiteness."** This is WRONG. Take $\begin{pmatrix} 1 & 3 \\ 3 & 1 \end{pmatrix}$: every diagonal entry is positive, but its eigenvalues (the special numbers $\lambda$ solving $Av=\lambda v$) come out to $4$ and $-2$ — one negative, so the matrix is indefinite, not positive definite. Only the leading principal minors (a set of nested sub-determinants) or the full set of eigenvalues can actually tell you whether a matrix is positive definite.

**Trap 2 — "All positive entries means positive definite."** Also WRONG. $\begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$ has every single entry positive, yet its eigenvalues are $3$ and $-1$ — indefinite again. Whether every entry happens to be a positive number has nothing to do with whether the matrix as a whole is positive definite.

**Trap 3 — "Eigenvalues are always simpler than Sylvester's criterion."** This is MISLEADING. Sylvester's criterion checks positive definiteness using leading principal minors instead of eigenvalues. For $n\ge3$, working out these determinants is usually cheaper than a full eigen-decomposition (finding every eigenvalue) — so don't automatically reach for eigenvalues on a bigger matrix.

**Trap 4 — "Positive semidefinite is just slightly less positive definite."** WRONG. $A=\begin{pmatrix}1&0\\0&0\end{pmatrix}$ is positive semidefinite (all eigenvalues $\geq 0$) but not positive definite (which needs every eigenvalue strictly $>0$). This isn't a matter of degree, like "almost there" — it's a hard, categorical difference between strict and non-strict.

**Trap 5 — "Cholesky always works on a symmetric matrix."** WRONG. The Cholesky decomposition writes $A=LL^T$ for some lower-triangular matrix $L$. It succeeds without any pivoting only when $A$ is genuinely positive definite. A merely positive semidefinite matrix needs a modified, rank-revealing version of Cholesky instead — the plain version can fail.
