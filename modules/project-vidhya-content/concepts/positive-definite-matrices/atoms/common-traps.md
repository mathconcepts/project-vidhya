---
id: positive-definite-matrices.common-traps
concept_id: positive-definite-matrices
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — "Positive diagonal entries imply positive definiteness."** WRONG. $\begin{pmatrix} 1 & 3 \\ 3 & 1 \end{pmatrix}$ has positive diagonal but eigenvalues $4,-2$ (indefinite). Only leading principal minors (or the full spectrum) determine positive definiteness.

**Trap 2 — "All positive entries means positive definite."** WRONG. $\begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$ has every entry positive but eigenvalues $3,-1$ — indefinite. Entry-wise positivity is unrelated to matrix positive definiteness.

**Trap 3 — "Eigenvalues are always simpler than Sylvester's criterion."** MISLEADING. For $n\ge3$, leading principal minors (determinant arithmetic) are usually cheaper than a full eigen-decomposition.

**Trap 4 — "Positive semidefinite is just slightly less positive definite."** WRONG. $A=\begin{pmatrix}1&0\\0&0\end{pmatrix}$ is positive semidefinite but not positive definite — the difference is categorical (strict vs. non-strict), not a matter of degree.

**Trap 5 — "Cholesky always works on a symmetric matrix."** WRONG. $A=LL^T$ succeeds without pivoting only when $A$ is positive definite; a positive semidefinite matrix needs a modified (rank-revealing) Cholesky.
