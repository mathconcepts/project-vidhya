---
id: determinants.common-traps
concept_id: determinants
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: determinants.micro-exercise
---

**Trap 1 — Sign errors in cofactor expansion.** $\det(A - \lambda I)$-style expansions carry alternating signs $(-1)^{i+j}$. Forgetting the sign on an even-looking term is the single most common slip.

**Trap 2 — Misapplying scalar scaling.** $\det(kA) = k^n\det(A)$ for an $n\times n$ matrix — scaling by $2$ multiplies a $3\times3$ determinant by $8$, not $2$. The exponent is the trap.

**Trap 3 — Ignoring a free zero row or column.** If a matrix has a row or column of all zeros, $\det(A) = 0$ immediately — no computation needed. Students often start expanding anyway.

**Trap 4 — "Nearly zero" read as singular.** $\det = 0$ is a hard yes/no test, not a size measurement. $\det(A) = 10^{-6}$ still means invertible.
