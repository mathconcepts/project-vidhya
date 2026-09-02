---
id: least-squares.common_traps
concept_id: least-squares
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Solving $Ax=b$ directly instead of normal equations.** In an overdetermined system there is no exact $x$. Always form and solve $A^TA\hat x=A^Tb$ instead — direct solvers on the rectangular $A$ either fail or give nonsense.

**Trap 2 — Forgetting $A^TA$ must be invertible.** If $A$'s columns are linearly dependent, $A^TA$ is singular; the normal equations then have infinitely many solutions, not a unique $\hat x$.

**Trap 3 — Confusing minimum error with perfect fit.** Minimizing $\|r\|^2$ is not the same as forcing $r=0$. In a genuine overdetermined system $r\neq0$ by design — that's the whole premise.

**Trap 4 — Skipping the orthogonality check.** If a candidate $\hat x$ gives $A^Tr\neq0$, it is not the least squares solution, full stop — no partial credit for "close."
