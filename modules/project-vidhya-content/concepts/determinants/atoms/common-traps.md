---
id: determinants.common-traps
concept_id: determinants
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: determinants.micro-exercise
---

**Trap 1 — Sign errors in cofactor expansion.** Cofactor expansion is one way to compute a determinant: you expand along a row or column, multiplying each entry by a smaller determinant and a sign. Expansions like $\det(A - \lambda I)$ carry alternating signs, $(-1)^{i+j}$, that flip as you move across the row or down the column. It's easy to lose track of one sign when a term "looks" positive — that's the single most common slip.

**Trap 2 — Misapplying scalar scaling.** For an $n\times n$ matrix, $\det(kA) = k^n\det(A)$ — the scaling factor gets raised to the power $n$, not just multiplied straight through. So doubling every entry of a $3\times3$ matrix multiplies its determinant by $8$ ($2^3$), not by $2$. Students forget the exponent is there at all.

**Trap 3 — Ignoring a free zero row or column.** If a matrix has a row or column made entirely of zeros, $\det(A) = 0$ immediately — no computation needed, you can write the answer down straight away. Students often start expanding the whole matrix anyway, missing the shortcut sitting right in front of them.

**Trap 4 — "Nearly zero" read as singular.** A matrix is called singular when its determinant is exactly $0$, meaning it can't be inverted. That's a hard yes/no test, not a measure of "how close to zero." $\det(A) = 10^{-6}$ still means the matrix is invertible — don't round a tiny nonzero number down to singular in your head.
