---
id: numerical-linear-algebra.common-traps
concept_id: numerical-linear-algebra
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

**Trap 1 — Multiplier sign.** $L_{i1}=m_{i1}=a_{i1}/a_{11}$ goes into $L$ as-is, never negated. Writing $-m$ into $L$ is a common reflex from remembering "subtract the multiple," but the *subtraction* already happened in forming $U$ — $L$ just records what was subtracted.

**Trap 2 — Forgetting to update $b$.** On an augmented matrix $[A\,|\,b]$, every row operation on $A$ must apply to $b$ too. Eliminating only the left side and forgetting the right gives a $U$ that's correct but a $y$ or $x$ that isn't.

**Trap 3 — Matrix norm confusion.** $\|A\|_1$ (max column sum), $\|A\|_\infty$ (max row sum), $\|A\|_2$ (largest singular value), and the Frobenius norm are all different numbers. A question that gives a formula like $\sqrt{\sum a_{ij}^2}$ means Frobenius, not $\|A\|_2$.
