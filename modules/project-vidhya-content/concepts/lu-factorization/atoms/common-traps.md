---
id: lu-factorization.common_traps
concept_id: lu-factorization
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
tested_by_atom: lu-factorization.micro-exercise
---

**Trap 1 — Filling in L's diagonal.** In the standard ("Doolittle") way of writing $A=LU$, $L$'s diagonal is always filled with 1s — $\text{diag}(L)=(1,1,\dots,1)$, no exceptions. The actual numbers you compute during elimination, called multipliers ($\ell_{ij}$), only ever go strictly below that diagonal. Put anything else on $L$'s diagonal and you've broken the convention — your $U$ comes out wrong too, since the two are computed together.

**Trap 2 — Mixing Doolittle and Crout.** There are two common conventions for splitting $A=LU$: Doolittle fixes $L$'s diagonal to 1s (Trap 1); Crout instead fixes $U$'s diagonal to 1s. These give genuinely different numbers for $L$ and $U$, even for the same $A$ — not just a relabeling. State which convention you're using, or match the one the question specifies.

**Trap 3 — Sign slip on $u_{22}$.** Watch the sign here: $u_{22}=a_{22}-\ell_{21}u_{12}$ is a *subtraction*, not an addition — a very easy slip when you're moving fast. Drop that minus sign once, and the error cascades: every entry computed later that depends on $u_{22}$ comes out wrong too.

**Trap 4 — Assuming LU always exists.** Without pivoting (swapping rows during elimination to avoid a zero), a plain $A=LU$ factorization exists only if every leading principal minor of $A$ is nonzero — that's the determinant of every top-left $k\times k$ block, for every $k$. Hit a zero pivot partway through elimination, and $A=LU$ simply doesn't exist in that form. You'd need row swaps instead, giving $PA=LU$, where $P$ records which rows got swapped.
