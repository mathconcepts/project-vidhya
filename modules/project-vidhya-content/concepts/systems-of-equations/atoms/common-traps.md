---
id: systems-of-equations.common-traps
concept_id: systems-of-equations
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: systems-of-equations.micro-exercise
---

**Trap 1 — Checking rank of $A$, but forgetting rank of $A \mid b$.** To check if a system is consistent (has at least one solution), compare two ranks — $\text{rank}(A)$, just the coefficient matrix, and $\text{rank}(A \mid b)$, the "augmented matrix" (that's $A$ with the answer column $b$ stuck on the side). Students often check only $\text{rank}(A)$ and stop there. If $\text{rank}(A) = \text{rank}(A\mid b)$, the system is consistent; if the ranks differ, it isn't.

**Trap 2 — Misapplying Cramer's rule.** Cramer's rule is a shortcut formula for solving a system using the determinant — a single number computed from a square matrix, written $\det(A)$ — instead of row-reducing. It only works for square systems (same number of equations as unknowns, $m=n$) where $\det(A)\neq0$. Some students try to force it onto rectangular systems; it simply doesn't apply there.

**Trap 3 — Reading $\det(A)=0$ as "no solution."** It actually means "not unique." Many students jump straight to "no solution," but a zero determinant only says the system doesn't have exactly one solution. It could have zero solutions or infinitely many — which one depends on $b$, the right-hand side.

**Trap 4 — Arithmetic drift in elimination.** Gaussian elimination is the step-by-step process of adding and subtracting rows to zero out entries below the diagonal. One sign error early on carries through every row after it — a small slip becomes a big mess. Recompute the final pivot row (the row you use to solve for the last variable) independently, as a check.
