---
id: lu-factorization.common_traps
concept_id: lu-factorization
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

# Common Traps in LU Factorization

**Trap 1: Forgetting that $L$ has 1s on the diagonal (Doolittle form)**
Students sometimes fill the entire $L$ matrix with multipliers, including the diagonal. Remember: in Doolittle form, $\text{diag}(L) = (1, 1, \ldots, 1)$. The multipliers $\ell_{ij}$ appear **below** the diagonal only. If you accidentally make $L$ fully nonsingular on the diagonal, you've changed the factorization contract and your $U$ will be wrong.

**Trap 2: Confusing Doolittle and Crout conventions**
Doolittle: $L$ has 1s on the diagonal, $U$ is arbitrary. Crout: $U$ has 1s on the diagonal, $L$ is arbitrary. GATE problems may not specify which form is expected. **Always state your assumption** or check the context. Mixing them will produce incorrect factors and mark loss.

**Trap 3: Arithmetic errors during elimination**
When computing $\ell_{ij} = a_{ij}^{(i-1)} / u_{jj}$, one sign error or typo cascades through all subsequent entries. Write out each step: $u_{22} = a_{22} - \ell_{21} u_{12}$ (not $+ \ell_{21}$). Use exact fractions, not decimals, to avoid rounding errors on exams.

**Trap 4: Assuming LU exists without checking pivots**
LU factorization (without row pivoting) exists if and only if **all leading principal minors are nonzero**. A singular or near-singular matrix will cause division by zero. Always check: if a pivot becomes zero, you need partial pivoting ($PA = LU$), which is outside Doolittle but essential in practice.

**Trap 5: Reversing the order in back-substitution**
To solve $Ax = b$ given $A = LU$:
1. Solve $Ly = b$ **forward** (row 1 to $n$, since $L$ is lower triangular).
2. Solve $Ux = y$ **backward** (row $n$ to 1, since $U$ is upper triangular).

Reversing the order will give the wrong answer. Keep the mnemonic: **L**ower = **forward**, **U**pper = **backward**.
