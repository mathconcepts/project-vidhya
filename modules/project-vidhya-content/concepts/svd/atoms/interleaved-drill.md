---
id: svd.interleaved-drill
concept_id: svd
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
modality: drill
exam_ids: ["*"]
tested_by_atom: svd.micro_exercise
---

**Cross-concept check: SVD → spectral theorem.**

The spectral theorem only speaks about **symmetric** matrices: $A = Q\Lambda Q^T$. SVD speaks about **every** matrix: $A = U\Sigma V^T$. So what happens when you point SVD at a matrix the spectral theorem already handles?

Take $A = \begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$, which is symmetric. Its eigenvalues are $\lambda = 3, -1$ (verified: $\text{tr}(A) = 2 = 3 + (-1)$ ✓, $\det(A) = -3 = 3 \cdot (-1)$ ✓).

**Question 1 (spectral theorem → SVD):** The spectral theorem hands you $\Lambda = \text{diag}(3, -1)$. Can you just set $\Sigma = \Lambda$ and call it an SVD?

*Answer:* No. $\Sigma$ must have **non-negative** entries by definition — $-1$ is not a legal singular value. Compute them properly: $A^T A = \begin{pmatrix} 5 & 4 \\ 4 & 5 \end{pmatrix}$, whose eigenvalues are $9$ and $1$, so $\sigma_1 = 3$, $\sigma_2 = 1$. The general rule for symmetric $A$: $\sigma_i = |\lambda_i|$.

**Question 2 (repairing the decomposition):** If $\Sigma = \text{diag}(3,1)$ but the eigenvalue was $-1$, where did the minus sign go?

*Answer:* Into $U$. With $Q = \frac{1}{\sqrt2}\begin{pmatrix} 1 & 1 \\ 1 & -1\end{pmatrix}$ (orthonormal eigenvectors for $3$ and $-1$), take $V = Q$ and $U = Q\,\text{diag}(1,-1)$ — absorbing the sign flips the second column of $U$. Then $U\Sigma V^T = A$ exactly (verified by multiplication), and $U^T U = I$ still holds, so $U$ is legitimately orthogonal. The sign lives in a *rotation/reflection*, never in the stretch.

**Why this drill exists:** students who meet the spectral theorem first assume "SVD is just eigendecomposition with different letters" and read singular values straight off $\Lambda$, sign and all. The sign is the tell — $\Sigma \geq 0$ is a definition, not a convention, and a negative eigenvalue is absorbed by $U$, not carried into $\Sigma$.
