---
id: least-squares.common_traps
concept_id: least-squares
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Solving $Ax=b$ directly instead of normal equations.** When there are more equations than unknowns — an "overdetermined" system — there's usually no $x$ that solves $Ax=b$ exactly. Don't try solving $Ax=b$ directly with a rectangular $A$; most solvers either fail or return nonsense. Instead, form and solve the normal equations, $A^TA\hat x=A^Tb$, which give the closest possible $\hat x$ instead.

**Trap 2 — Forgetting $A^TA$ must be invertible.** If $A$'s columns are linearly dependent — one column is just a combination of the others, adding no new direction — then $A^TA$ becomes singular (not invertible). The normal equations then have infinitely many solutions, not one unique $\hat x$.

**Trap 3 — Confusing minimum error with perfect fit.** Minimizing the residual $r = b - A\hat x$ (the leftover error) doesn't mean forcing $r=0$. In a genuine overdetermined system, $r\neq0$ is expected — "least squares" means smallest possible error, not zero error.

**Trap 4 — Skipping the orthogonality check.** The least squares solution is the one where the residual $r$ is orthogonal (at a right angle — dot product zero) to every column of $A$, i.e. $A^Tr=0$. If your candidate $\hat x$ gives $A^Tr\neq0$, it just isn't the least squares solution — no partial credit for "close."
