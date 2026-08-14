---
id: lu-factorization.formal_definition
concept_id: lu-factorization
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

# LU Factorization: Definition and Existence

**Definition:** An $m \times n$ matrix $A$ has an **LU factorization** if there exist a lower triangular matrix $L$ and an upper triangular matrix $U$ such that $A = LU$.

For a square matrix $A \in \mathbb{R}^{n \times n}$, the **Doolittle form** assumes $L$ has 1s on its diagonal, while $U$ is upper triangular with arbitrary diagonal entries. The **Crout form** swaps this convention: $U$ has 1s on the diagonal, and $L$ is arbitrary.

**Theorem (Existence without pivoting):** If all leading principal minors of $A$ are nonzero, then $A$ admits a unique LU factorization in Doolittle form. Equivalently, Gaussian elimination without row swaps completes successfully if and only if the factorization exists.

**Key property:** Once $A = LU$, solving $Ax = b$ reduces to two triangular solves:
- Forward substitution: solve $Ly = b$ for $y$
- Back substitution: solve $Ux = y$ for $x$
