---
id: linear-algebra-eigenvalues.common-traps
concept_id: linear-algebra-eigenvalues
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
tested_by_atom: linear-algebra-eigenvalues.micro-exercise.trace
---

**Trap 1 — Sign on the characteristic polynomial.** $\det(A - \lambda I)$ expands with alternating signs. For a $2\times 2$, the constant term is $\det(A)$, not $-\det(A)$.

**Trap 2 — Forgetting $v \neq 0$.** $Av = \lambda v$ holds trivially for $v = 0$. The zero vector is **never** an eigenvector by definition.

**Trap 3 — Repeated eigenvalues.** A repeated eigenvalue may have only one eigenvector (defective matrix). Check the geometric multiplicity before concluding diagonalizability.

**Trap 4 — Complex eigenvalues on real matrices.** A real matrix can have complex eigenvalues (rotation matrices do). Don't assume eigenvalues are real just because $A$ is real.
