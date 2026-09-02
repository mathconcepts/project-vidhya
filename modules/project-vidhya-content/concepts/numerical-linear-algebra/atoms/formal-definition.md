---
id: numerical-linear-algebra.formal-definition
concept_id: numerical-linear-algebra
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**LU decomposition.** Every square $A$ with nonzero leading principal minors factors as $A=LU$, $L$ unit lower-triangular, $U$ upper-triangular. Solving $Ax=b$ becomes forward substitution ($Ly=b$) then back substitution ($Ux=y$), each $O(n^2)$ once the $O(n^3)$ factorization is paid for once.

**Method Selector.** Reach for LU decomposition (a direct method) when the SAME $A$ must be solved for multiple right-hand sides — not an iterative method like Jacobi or Gauss-Seidel, which a student reaches for on a large system but which restarts its full iteration from scratch for every new $b$, and isn't guaranteed to converge at all unless $A$ is diagonally dominant.
