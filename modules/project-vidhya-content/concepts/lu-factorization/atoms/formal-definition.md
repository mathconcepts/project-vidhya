---
id: lu-factorization.formal_definition
concept_id: lu-factorization
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

A square matrix $A \in \mathbb{R}^{n\times n}$ has an **LU factorization** if there exist a lower triangular $L$ and upper triangular $U$ with $A = LU$. In **Doolittle form**, $L$ has 1s on its diagonal; in **Crout form**, $U$ does instead — the two give different numeric factors for the same $A$.

**Theorem (existence without pivoting).** If every leading principal minor of $A$ is nonzero, $A$ has a unique Doolittle factorization, and Gaussian elimination with no row swaps completes successfully.

Once $A=LU$, solving $Ax=b$ reduces to forward substitution ($Ly=b$) then back substitution ($Ux=y$).

**Method selector.** Reach for LU whenever the same $A$ meets *several* right-hand sides — factor once, then each solve costs two cheap triangular passes instead of a fresh elimination. The tempting-but-wrong alternative is computing $A^{-1}$ once and multiplying it by each $b$: it looks equally reusable, but forming $A^{-1}$ explicitly costs the same $O(n^3)$ as LU *and* amplifies rounding error that triangular solves avoid.
