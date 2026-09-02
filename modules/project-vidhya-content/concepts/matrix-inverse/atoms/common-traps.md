---
id: matrix-inverse.common-traps
concept_id: matrix-inverse
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: matrix-inverse.micro-exercise
---

**Trap 1 — Skipping the determinant check.** Before you try to invert a matrix, check whether it even has an inverse. A matrix is called **singular** — meaning it has no inverse at all — when $\det(A)=0$. Trying to invert a singular matrix wastes precious exam minutes chasing something that doesn't exist. Always check $\det(A)\neq0$ first, before you touch any of the sums that follow.

**Trap 2 — Sign errors in the $2\times2$ formula.** In $A^{-1} = \frac{1}{ad-bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$, the off-diagonal entries $b$ and $c$ flip sign. Under exam pressure it's easy to write $\begin{pmatrix} d & b \\ c & a \end{pmatrix}$ instead — swapping the diagonal but forgetting the minus signs. Double-check the signs on $b$ and $c$ every single time.

**Trap 3 — Order in $(AB)^{-1}$.** $(AB)^{-1} = B^{-1}A^{-1}$ — the order reverses, not $A^{-1}B^{-1}$. This one trips students up because with plain numbers, order never matters. But matrix multiplication doesn't commute (meaning $AB$ and $BA$ are usually different), so the order has to flip when you undo the product.

**Trap 4 — Building $A^{-1}$ just to solve one system.** If a question only asks for $x$ in $Ax=b$, don't waste time computing the full $A^{-1}$ first. Gaussian elimination directly on $[A\mid b]$ gets you to $x$ faster, with fewer sign slips along the way.
