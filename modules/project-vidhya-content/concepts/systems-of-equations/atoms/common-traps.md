---
id: systems-of-equations.common-traps
concept_id: systems-of-equations
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing rank conditions**: Students often forget to distinguish between $\text{rank}(A)$ and $\text{rank}(A|b)$. The augmented matrix rank must be checked to determine consistency. If $\text{rank}(A) = \text{rank}(A|b)$, the system is consistent; otherwise, it's inconsistent.
- **Misapplying Cramer's rule**: Cramer's rule only applies when the system is square ($m = n$) and the coefficient matrix is non-singular ($\det(A) \neq 0$). Students sometimes try to use it for rectangular systems.
- **Arithmetic errors in elimination**: Gaussian elimination requires careful row operations. A single sign error or computational mistake early on propagates to the final answer.
