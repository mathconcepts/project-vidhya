---
id: matrix-operations.common-traps
concept_id: matrix-operations
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: matrix-operations.micro-exercise
---

**Trap 1 — Assuming $AB = BA$.** Matrix multiplication is not commutative — meaning the order you multiply in generally changes the answer, unlike with plain numbers. Only special pairs of matrices commute (say, when one is a scalar multiple of the identity matrix). Never assume $AB=BA$ without checking first.

**Trap 2 — Multiplying incompatible shapes.** For $AB$ to exist, the number of columns in $A$ must match the number of rows in $B$. For $A_{2\times3}$ and $B_{3\times4}$, $AB$ exists and comes out $2\times4$ — but $BA$ does not exist at all, since the shapes don't line up the other way round. "Does not exist" is a real, correct exam answer.

**Trap 3 — Reversing the wrong identity.** $(AB)^T = B^TA^T$ — the order reverses when you take a transpose (flip rows and columns) of a product. It's not $A^TB^T$. Students who just memorise "transpose distributes" without the order-reversal get the shape wrong whenever $A$ and $B$ aren't square.

**Trap 4 — Expanding $(A+B)^2$ like numbers.** $(A+B)^2 = A^2 + AB + BA + B^2$ — **not** $A^2 + 2AB + B^2$ as you'd write for ordinary numbers. The two middle terms don't collapse into $2AB$ because $AB \neq BA$ in general, so you can't swap and combine them.
