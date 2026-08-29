---
id: diagonalization.interleaved-drill
concept_id: diagonalization
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: diagonalization.micro-exercise
---

**Cross-concept check: eigenvalues → diagonalization.**

$A = \begin{pmatrix} 3 & 1 & 0 \\ 0 & 3 & 0 \\ 0 & 0 & 2 \end{pmatrix}$

**Question 1 (eigenvalues):** Give the eigenvalues and their algebraic multiplicities — without expanding any determinant.

*Answer:* $A$ is upper triangular, so the eigenvalues are the diagonal entries: $\lambda = 3$ with algebraic multiplicity $2$, and $\lambda = 2$ with algebraic multiplicity $1$. Sanity check: $\text{tr}(A) = 8 = 3 + 3 + 2$ ✓ and $\det(A) = 18 = 3\cdot3\cdot2$ ✓.

**Question 2 (diagonalization):** Is $A$ diagonalizable? Compare against $B = \text{diag}(3,3,2)$.

*Answer:* Check the geometric multiplicity of $\lambda = 3$:

$$A - 3I = \begin{pmatrix} 0 & 1 & 0 \\ 0 & 0 & 0 \\ 0 & 0 & -1\end{pmatrix}, \quad \text{rank} = 2 \;\Rightarrow\; \text{GM} = 3 - 2 = 1$$

$\text{GM}(3) = 1 < 2 = \text{AM}(3)$, so $A$ is **not** diagonalizable — it supplies only two independent eigenvectors, $(1,0,0)^T$ and $(0,0,1)^T$, where three are needed (verified: the third direction is a *generalized* eigenvector, $(0,1,0)^T$, which is the Jordan-block signature).

Now $B = \text{diag}(3,3,2)$: identical eigenvalues, identical trace $8$, identical determinant $18$, identical characteristic polynomial $(\lambda-3)^2(\lambda-2)$ — and $B$ is already diagonal, so trivially diagonalizable. For $B$, $\text{rank}(B - 3I) = 1$, giving $\text{GM}(3) = 2 = \text{AM}(3)$ ✓.

**Why this drill exists:** the misconception is "the eigenvalues determine diagonalizability." $A$ and $B$ agree on every eigenvalue-derived quantity a student normally computes — spectrum, trace, determinant, characteristic polynomial — and disagree on the answer. Only $\text{rank}(A - \lambda I)$ separates them, and it is the *only* thing that ever does. Compute the rank; never infer from the spectrum.
