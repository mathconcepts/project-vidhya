---
id: matrices-and-determinants.common-traps
concept_id: matrices-and-determinants
atom_type: common_traps
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
tested_by_atom: matrices-and-determinants.micro-exercise
---

**Trap 1 — Adjoint is the transpose of the cofactor matrix, not the cofactor matrix itself.** Build the cofactor matrix $C$, then TRANSPOSE it to get $\text{adj}(A)=C^T$. Skipping the transpose gives a matrix that looks plausible — same entries, wrong positions — and every inverse computed from it is wrong.

**Trap 2 — $\det(kA)=k^n\det(A)$, not $k\det(A)$.** For an $n\times n$ matrix, scaling EVERY entry by $k$ scales the determinant by $k^n$, not by $k$ once. Doubling every entry of a $3\times3$ matrix multiplies its determinant by $8$, not by $2$.

**Trap 3 — $\Delta=0$ does not by itself mean "no solution."** Cramer's rule only rules out a UNIQUE solution when $\Delta=0$. Deciding between "infinitely many solutions" and "no solution" needs $\Delta_x,\Delta_y,\Delta_z$ or a rank check on $[A\mid b]$ — stopping at "$\Delta=0$, so no solution" skips a real step and is often simply wrong.

**Trap 4 — Sign errors in cofactor expansion.** Each cofactor carries a sign $(-1)^{i+j}$ that alternates as you move across a row or down a column. Losing track of one sign flip is the single most common arithmetic slip in a $3\times3$ determinant or adjoint computation.

**Trap 5 — Confusing which row operations change the determinant.** Swapping two rows flips the SIGN of the determinant. Scaling a row by $k$ MULTIPLIES the determinant by $k$. Adding a multiple of one row to another leaves the determinant COMPLETELY UNCHANGED — this third operation is the only one safe to use repeatedly while simplifying a determinant, and confusing it with the other two leads to an extra factor sneaking into (or vanishing from) the final answer.
