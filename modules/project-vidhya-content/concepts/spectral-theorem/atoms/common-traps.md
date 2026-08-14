---
id: spectral-theorem.common-traps
concept_id: spectral-theorem
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Forgetting to normalize eigenvectors**

You find eigenvectors $\mathbf{v}_1, \mathbf{v}_2$ correctly (they are orthogonal by the theorem), but forget the final step: normalize them to unit length. If you form $Q$ from unnormalized vectors, then $Q$ is **not orthogonal**, and $Q^{\mathrm{T}}Q \neq I$. The formula $A = Q\Lambda Q^{\mathrm{T}}$ will fail. Always check: $\|\mathbf{q}_i\| = 1$ for each column of $Q$.

**Trap 2: Confusing the formulas $Q\Lambda Q^{\mathrm{T}}$ and $Q\Lambda Q^{-1}$**

For a general diagonalizable matrix, we write $A = PDP^{-1}$ with $P$ invertible. For symmetric matrices, $Q$ is orthogonal, so $Q^{-1} = Q^{\mathrm{T}}$. The formula becomes $A = Q\Lambda Q^{\mathrm{T}}$ — which *looks different* but is the same theorem. Do not mix these formulas. A non-symmetric matrix cannot be decomposed as $Q\Lambda Q^{\mathrm{T}}$ with $Q$ orthogonal, even if it is diagonalizable.

**Trap 3: Losing uniqueness when eigenvalues repeat**

If $A$ has a repeated eigenvalue (e.g., $\lambda = 3$ with multiplicity 2), the eigenspace is 2-dimensional, and infinitely many orthonormal bases span it. You can use any of them to form $Q$. Students often assume there is a unique $Q$ and make errors comparing their answer to a solution that used a different valid basis. The diagonal matrix $\Lambda$ is unique (up to row/column reordering), but $Q$ is not. Always say "a possible $Q$" not "the $Q$."

**Trap 4: Applying the Spectral Theorem to non-symmetric matrices**

The Spectral Theorem guarantees real eigenvalues and orthonormal eigenvectors **only for symmetric matrices**. A non-symmetric matrix (e.g., $\begin{pmatrix} 0 & 1 \\ -1 & 0 \end{pmatrix}$) can have complex eigenvalues and cannot be written as $Q\Lambda Q^{\mathrm{T}}$ with $Q$ real orthogonal. Always verify $A^{\mathrm{T}} = A$ first. This is the most common error: treating a non-symmetric matrix as if the theorem applies.

**Trap 5: Misinterpreting matrix function formulas**

When computing $f(A) = Qf(\Lambda)Q^{\mathrm{T}}$, students sometimes forget to apply $f$ *only to the eigenvalues*, not to the entire matrix. For example, $\sqrt{A} = Q\sqrt{\Lambda}Q^{\mathrm{T}} = Q\,\mathrm{diag}(\sqrt{\lambda_1}, \sqrt{\lambda_2}, \ldots)Q^{\mathrm{T}}$, not $\sqrt{Q}\sqrt{\Lambda}\sqrt{Q^{\mathrm{T}}}$ or other incorrect manipulations. The function is applied element-wise to the diagonal of $\Lambda$, nowhere else.