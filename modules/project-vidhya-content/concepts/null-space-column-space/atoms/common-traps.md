---
id: null-space-column-space.common_traps
concept_id: null-space-column-space
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Confusing column space with the set of column vectors**

Many students think "the column space of $A$ is just the list of columns of $A$." Wrong—the column space is the *span* of the columns. If two columns are linearly dependent, the column space is lower-dimensional than the number of columns. Always row-reduce first to identify which columns are actually independent; those are your basis.

**Trap 2: Using free-variable columns for the null space basis**

When you find free variables in RREF, do NOT use the corresponding columns of $A$ as null space vectors. Instead, construct null space basis vectors by setting each free variable to 1 (one at a time) and solving for the pivot variables. The null space lives in $\mathbb{R}^n$ (the domain); the column space lives in $\mathbb{R}^m$ (the codomain).

**Trap 3: Forgetting to row-reduce before finding the null space**

Some students try to solve $Ax = \mathbf{0}$ directly without reducing to RREF, leading to messy algebra and wrong basis vectors. **Always** reduce to RREF first—it clearly shows which variables are pivots and which are free. This eliminates guesswork.

**Trap 4: Claiming the column space basis is the non-zero rows of RREF**

The RREF tells you *which* columns are pivots, but the actual basis vectors are the pivot *columns from the original matrix* $A$, not from RREF. RREF is a guide, not the answer. If you use RREF rows, you've computed row space (a different subspace).