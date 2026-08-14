---
id: least-squares.formal_definition
concept_id: least-squares
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Overdetermined System.** A system $Ax = b$ where $A \in \mathbb{R}^{m \times n}$, $m > n$ (more equations than unknowns). No $x$ exactly solves all equations; a residual $r = b - Ax$ remains.

**Least Squares Solution.** The vector $\hat{x}$ that minimizes $\|r\|^2 = \|b - Ax\|^2$. Geometrically, $\hat{x}$ is the orthogonal projection of $b$ onto $\text{col}(A)$.

**Normal Equations.** The least squares solution satisfies:
$$A^T A \hat{x} = A^T b$$

**Key Theorem.** If $A$ has full column rank (columns are linearly independent), then $A^T A$ is invertible and:
$$\hat{x} = (A^T A)^{-1} A^T b$$

The residual $\hat{r} = b - A\hat{x}$ is orthogonal to all columns of $A$.