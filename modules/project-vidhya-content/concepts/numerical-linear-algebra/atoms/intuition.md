---
id: numerical-linear-algebra.intuition
concept_id: numerical-linear-algebra
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

## Factor once, solve many times

Gaussian elimination turns $Ax=b$ into an upper-triangular system by row operations, then back-substitutes — $O(n^3)$ work. Recording the elimination's multipliers in a unit-lower-triangular matrix $L$, and the result in an upper-triangular $U$, gives $A=LU$: any new right-hand side is then solved by forward substitution ($Ly=b$) then back substitution ($Ux=y$), each only $O(n^2)$.

**Iterative methods** trade that one-shot factorization for a sequence of cheap updates, useful once $A$ is too large or too sparse to factor directly. **Jacobi** updates every unknown simultaneously from the previous round's values; **Gauss-Seidel** uses the freshest values already computed within the same sweep, converging faster in practice. Both are only guaranteed to converge when $A$ is strictly diagonally dominant — each diagonal entry's magnitude exceeds the sum of the rest of its row.

**Condition number** $\kappa(A)=\|A\|\cdot\|A^{-1}\|$ measures how much a small perturbation in $b$ or $A$ can be amplified in the solution $x$. A well-conditioned system ($\kappa$ near $1$) is forgiving of rounding; an ill-conditioned one ($\kappa\gg1$) can lose several digits of accuracy even with perfect arithmetic technique.
