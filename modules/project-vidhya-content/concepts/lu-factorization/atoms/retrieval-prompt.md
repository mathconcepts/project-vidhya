---
id: lu-factorization.retrieval_prompt
concept_id: lu-factorization
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

# Recall: Why Use LU Factorization?

**Question:** When solving $Ax = b$ with multiple different right-hand sides $b_1, b_2, \ldots, b_k$ but the same matrix $A$, why is LU factorization more efficient than computing $A^{-1}$ or using Gaussian elimination each time?

<details><summary>Answer</summary>

**Answer:** LU factorization decouples the cost:

1. **One-time cost (amortized over all $k$ systems):** Factor $A = LU$ in $O(n^3)$ operations.
2. **Per-system cost:** For each new right-hand side $b_i$, solve $Ly = b_i$ (forward substitution, $O(n^2)$) then $Ux = y$ (back substitution, $O(n^2)$) for $O(n^2)$ total.

**Why it beats inverses:** Computing $A^{-1}$ costs $O(n^3)$, then each solve via $A^{-1}b$ is $O(n^2)$ multiply. Total: $O(n^3) + k \cdot O(n^2)$—same as LU alone for large $k$.

**The key advantage:** LU avoids computing $A^{-1}$ explicitly, which amplifies rounding errors. Forward/backward substitution is **numerically more stable** and requires only the factors $L$ and $U$, not the inverse.

**GATE insight:** For $k$ systems, LU costs $O(n^3 + kn^2)$. If $k \geq n$, this beats the $O(n^3)$ per-system cost of Gaussian elimination on each $b_i$ separately.

</details>
