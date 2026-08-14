---
id: least-squares.common_traps
concept_id: least-squares
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Solving $Ax = b$ directly instead of normal equations.**
In an overdetermined system, you cannot solve $Ax = b$ for an exact $x$. Always form and solve $A^T A \hat{x} = A^T b$ instead. Direct solvers will either fail or give a spurious result.

**Trap 2: Forgetting that $A^T A$ must be invertible.**
If the columns of $A$ are linearly dependent (rank-deficient), then $A^T A$ is singular and has no unique inverse. The normal equations have infinitely many solutions—you need regularization or to remove redundant columns.

**Trap 3: Confusing residual minimization with perfect fit.**
Least squares minimizes squared error, not absolute error. Also, minimizing $\|r\|^2$ is not the same as making $r = 0$; in overdetermined systems, $r \neq 0$ by design. Always interpret results as "best fit given the constraints," not "exact solution."

**Trap 4: Not checking orthogonality in the residual.**
If you compute a candidate $x$ and the residual $r = b - Ax$ is not orthogonal to $\text{col}(A)$ (i.e., $A^T r \neq 0$), then $x$ is not the least squares solution. Use this as a sanity check after solving the normal equations.