---
id: symmetric-matrices.interleaved-drill
concept_id: symmetric-matrices
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: symmetric-matrices.micro_exercise
---

**Cross-concept check: symmetric matrices → spectral theorem.**

$$A = \begin{pmatrix} 4 & 1 & 1 \\ 1 & 4 & 1 \\ 1 & 1 & 4 \end{pmatrix}$$

**Question 1 (symmetry):** Verify $A = A^T$, then — *before computing anything else* — state what you already know about its diagonalizability.

*Answer:* Fold along the diagonal: $a_{12} = a_{21} = 1$, $a_{13} = a_{31} = 1$, $a_{23} = a_{32} = 1$. So $A = A^T$. ✓

That single check is enough to conclude, by the spectral theorem, that $A$ has three real eigenvalues, an orthonormal basis of eigenvectors, and $A = Q\Lambda Q^T$ for some orthogonal $Q$. **No eigenvalue has been computed yet.** Diagonalizability was decided by the mirror test alone.

**Question 2 (does a repeated eigenvalue change the answer?):** $A$ has eigenvalues $6, 3, 3$ (verified: $6+3+3 = 12 = \text{tr}(A)$ ✓, $6 \cdot 3 \cdot 3 = 54 = \det(A)$ ✓). $\lambda = 3$ is repeated. Does that threaten the conclusion from Question 1?

*Answer:* No — and this is the point. Check it directly: $A - 3I = \begin{pmatrix} 1&1&1\\1&1&1\\1&1&1\end{pmatrix}$ has rank $1$, so $\dim\ker(A-3I) = 3 - 1 = 2$, matching the algebraic multiplicity. For a general matrix that agreement would have to be *checked*; for a symmetric matrix it is **guaranteed in advance** — geometric multiplicity always equals algebraic multiplicity. The eigenspaces are orthogonal too: $\lambda = 6$ gives $(1,1,1)$, and every vector in the $\lambda=3$ plane (spanned by $(-1,0,1)$ and $(-1,1,0)$) is perpendicular to it.

**Why this drill exists:** students carry the correct habit "repeated eigenvalue $\Rightarrow$ must check geometric multiplicity" from the general case and keep spending time on it here, where the answer is already settled. Symmetry is a *stronger* hypothesis than diagonalizability — once $A = A^T$ is confirmed, the multiplicity check is redundant, and the mark is in reading the guarantee, not re-earning it.
