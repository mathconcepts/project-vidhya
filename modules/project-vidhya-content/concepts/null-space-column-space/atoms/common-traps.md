---
id: null-space-column-space.common_traps
concept_id: null-space-column-space
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Confusing column space with the set of column vectors**

Many students think "the column space of $A$ is just the list of columns of $A$." That's wrong. The column space is the **span** of the columns — every combination you can build by scaling and adding those columns together, not just the columns themselves. If two columns are linearly dependent (one is really just a combination of the others, adding no new direction), the column space ends up lower-dimensional than the number of columns you started with. Always row-reduce first to see which columns are truly independent — those are your basis.

**Trap 2: Using free-variable columns for the null space basis**

When you reduce $A$ to **RREF** (row-reduced echelon form — the simplest form you reach using row operations), you'll spot some free variables. Do NOT use the matching columns of $A$ as your null space vectors — that shortcut gives the wrong answer. Instead, build each null space basis vector by setting one free variable to 1 at a time (and the rest to 0), then solving for the pivot variables. Remember: the null space lives in $\mathbb{R}^n$, the domain (where inputs $x$ come from); the column space lives in $\mathbb{R}^m$, the codomain (where outputs $Ax$ land). They're not interchangeable.

**Trap 3: Forgetting to row-reduce before finding the null space**

Some students try to solve $Ax = \mathbf{0}$ directly, without first reducing to RREF. This leads to messy algebra and wrong basis vectors, because it's easy to lose track of which variables are free along the way. **Always** reduce to RREF first — it clearly shows which variables are pivots (tied down) and which are free (yours to choose). This removes the guesswork.

**Trap 4: Claiming the column space basis is the non-zero rows of RREF**

RREF tells you *which* columns are pivots — but the actual basis vectors come from those pivot *columns in the original matrix* $A$, not from RREF itself. Think of RREF as a guide pointing you to the right columns, not as the answer. If you instead use the non-zero rows of RREF, you've computed something different: the row space, not the column space.