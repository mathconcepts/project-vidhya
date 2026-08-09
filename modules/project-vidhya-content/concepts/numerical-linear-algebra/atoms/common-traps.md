---
id: numerical-linear-algebra.common-traps
concept_id: numerical-linear-algebra
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **LU multiplier sign flip**: When forming the multiplier $m = a_{j1} / a_{11}$, the sign goes into the $L$ matrix as-is, NOT negated. A question asks "find $L$ such that $A = LU$"; many students write $L$ with flipped signs, getting the wrong result. Double-check: $L_{i,1} = m_{i,1}$ exactly, not $-m$.
- **Forgetting to update both sides**: In Gaussian elimination on an augmented matrix $[A | b]$, the right-hand side $b$ must be updated in lockstep with $A$. A student might correctly eliminate the left side but forget to subtract from $b$, leading to the wrong solution.
- **Matrix norm confusion**: There are many norms: $L_1$ (max column sum), $L_\infty$ (max row sum), $L_2$ (largest singular value), Frobenius. A question says "compute the matrix norm"; students may compute the wrong one. Read carefully: if it says $\|A\|_2$, that's the spectral norm; if it gives a formula like $\sqrt{\sum a_{ij}^2}$, that's Frobenius.
