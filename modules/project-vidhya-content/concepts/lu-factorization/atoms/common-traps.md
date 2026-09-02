---
id: lu-factorization.common_traps
concept_id: lu-factorization
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
tested_by_atom: lu-factorization.micro-exercise
---

**Trap 1 — Filling in L's diagonal.** In Doolittle form $\text{diag}(L)=(1,1,\dots,1)$ always. The multipliers $\ell_{ij}$ live strictly below the diagonal; putting anything else on $L$'s diagonal changes the contract and produces a wrong $U$.

**Trap 2 — Mixing Doolittle and Crout.** Doolittle fixes $L$'s diagonal to 1; Crout fixes $U$'s. They yield genuinely different numeric factors for the same $A$. State your convention, or match the one the question specifies.

**Trap 3 — Sign slip on $u_{22}$.** $u_{22}=a_{22}-\ell_{21}u_{12}$, a *subtraction*, not addition. One dropped sign cascades through every entry that depends on it.

**Trap 4 — Assuming LU always exists.** Without pivoting, LU exists iff every leading principal minor is nonzero. A zero pivot mid-elimination means $A=LU$ has no solution in that form — only $PA=LU$ does.
