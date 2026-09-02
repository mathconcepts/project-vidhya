---
id: matrix-operations.common-traps
concept_id: matrix-operations
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: matrix-operations.micro-exercise
---

**Trap 1 — Assuming $AB = BA$.** Matrix multiplication is not commutative in general. Only special pairs commute (e.g. one is a scalar multiple of the identity) — never assume it without checking.

**Trap 2 — Multiplying incompatible shapes.** $AB$ needs columns of $A$ to equal rows of $B$. For $A_{2\times3}$ and $B_{3\times4}$, $AB$ exists ($2\times4$) but $BA$ does not exist at all — "does not exist" is a real exam answer.

**Trap 3 — Reversing the wrong identity.** $(AB)^T = B^TA^T$ (order reverses), not $A^TB^T$. Students who memorize "transpose distributes" without the reversal get the shape wrong for non-square factors.

**Trap 4 — Expanding $(A+B)^2$ like numbers.** $(A+B)^2 = A^2 + AB + BA + B^2$, **not** $A^2 + 2AB + B^2$, because $AB \neq BA$ in general — the cross terms don't collapse.
