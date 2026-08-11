---
id: matrix-inverse.common-traps
concept_id: matrix-inverse
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting the determinant condition**: Students sometimes try to invert a singular matrix (one with $\det(A) = 0$). Always check $\det(A) \neq 0$ first.
- **Sign errors in the 2×2 formula**: In $A^{-1} = \frac{1}{ad - bc} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$, the signs on $b$ and $c$ are negated—students often get this wrong and compute $\begin{pmatrix} d & b \\ c & a \end{pmatrix}$ instead.
- **Order matters in $(AB)^{-1}$**: Students confuse $(AB)^{-1} = B^{-1}A^{-1}$ (order reversed) with $(AB)^{-1} = A^{-1}B^{-1}$ (order unchanged). The reversal is critical—matrix multiplication doesn't commute.
