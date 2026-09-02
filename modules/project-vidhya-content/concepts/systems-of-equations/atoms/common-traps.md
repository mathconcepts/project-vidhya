---
id: systems-of-equations.common-traps
concept_id: systems-of-equations
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: systems-of-equations.micro-exercise
---

**Trap 1 — Checking $\text{rank}(A)$ but not $\text{rank}(A\mid b)$.** Consistency needs both ranks compared, not just $\text{rank}(A)$ examined alone. If $\text{rank}(A) = \text{rank}(A\mid b)$, the system is consistent; otherwise it is not.

**Trap 2 — Misapplying Cramer's rule.** It only applies to square systems ($m=n$) with $\det(A)\neq0$. Students sometimes try to force it onto rectangular systems.

**Trap 3 — Reading $\det(A)=0$ as "no solution."** It means "not unique" — the system could still have infinitely many solutions. Whether it's zero or infinite depends on $b$.

**Trap 4 — Arithmetic drift in elimination.** A single sign error early in Gaussian elimination propagates to every later row. Recompute the final pivot row independently as a check.
