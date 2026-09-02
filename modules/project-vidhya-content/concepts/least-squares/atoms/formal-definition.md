---
id: least-squares.formal_definition
concept_id: least-squares
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Overdetermined system.** $Ax=b$ where $A \in \mathbb{R}^{m\times n}$, $m>n$. No $x$ exactly solves every equation; a residual $r=b-Ax$ remains for any choice of $x$.

**Least squares solution.** The vector $\hat x$ minimizing $\|r\|^2=\|b-Ax\|^2$. Geometrically, $\hat x$ is the orthogonal projection of $b$ onto $\text{col}(A)$.

**Normal equations.** $\hat x$ satisfies $A^TA\hat x = A^Tb$. If $A$ has full column rank, $A^TA$ is invertible and $\hat x = (A^TA)^{-1}A^Tb$ uniquely. The residual $\hat r=b-A\hat x$ is orthogonal to every column of $A$.

**Method selector.** Reach for the normal equations exactly when $Ax=b$ is overdetermined — solving $Ax=b$ directly isn't an option, since $A$ isn't square and has no ordinary inverse. The tempting-but-wrong alternative students reach for anyway is writing $x=A^{-1}b$; it's undefined here. Even after correctly forming $A^TA\hat x=A^Tb$, forgetting to check full column rank first leaves a singular system that looks solvable on paper but isn't.
