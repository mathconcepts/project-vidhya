---
id: numerical-linear-algebra.formal-definition
concept_id: numerical-linear-algebra
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**LU Decomposition**: Every square matrix $A$ (with nonzero pivots) can be factored as:

$$A = LU$$

where $L$ is lower triangular (1s on diagonal) and $U$ is upper triangular. Once computed, solving $Ax = b$ becomes two triangular solves:
1. **Forward substitution**: Solve $Ly = b$ for $y$
2. **Backward substitution**: Solve $Ux = y$ for $x$

Each triangular solve costs $O(n^2)$ operations instead of the original $O(n^3)$ for Gaussian elimination. If you solve multiple systems with the same $A$ but different $b$, you factor once ($O(n^3)$) then solve cheaply ($O(n^2)$ each).

The factorization is equivalent to Gaussian elimination: $U$ is the reduced form after all pivots, and $L$ records the multipliers used.
