---
id: matrix-inverse.common-traps
concept_id: matrix-inverse
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: matrix-inverse.micro-exercise
---

**Trap 1 — Skipping the determinant check.** Attempting to invert a singular matrix ($\det(A)=0$) wastes time on something that doesn't exist. Always check $\det(A)\neq0$ first.

**Trap 2 — Sign errors in the $2\times2$ formula.** In $A^{-1} = \frac{1}{ad-bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$, the signs on $b$ and $c$ are negated — students often compute $\begin{pmatrix} d & b \\ c & a \end{pmatrix}$ instead.

**Trap 3 — Order in $(AB)^{-1}$.** $(AB)^{-1} = B^{-1}A^{-1}$ (order reversed), not $A^{-1}B^{-1}$. The reversal matters because matrix multiplication doesn't commute.

**Trap 4 — Building $A^{-1}$ just to solve one system.** If the question only wants $x$ in $Ax=b$, Gaussian elimination on $[A\mid b]$ is faster and drops fewer signs than computing $A^{-1}$ first.
