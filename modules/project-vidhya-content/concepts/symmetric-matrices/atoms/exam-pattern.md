---
id: symmetric-matrices.exam-pattern
concept_id: symmetric-matrices
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **"Symmetric" in the stem is a gift, not decoration.** It silently supplies: eigenvalues are real, eigenvectors for distinct eigenvalues are orthogonal, and $A$ is diagonalizable. Questions are built so that a student who *uses* that finishes in one line and a student who ignores it grinds through a characteristic polynomial.

- **NAT dimension questions.** "The dimension of the space of $3\times3$ real symmetric matrices is ___" $\to \frac{n(n+1)}{2} = 6$. Skew-symmetric $\to \frac{n(n-1)}{2} = 3$. These are pure recall; do not derive them under time pressure.

- **Positive-definiteness by leading minors is the fast lane.** For $A = \begin{pmatrix} 4 & 1 & 1 \\ 1 & 4 & 1 \\ 1 & 1 & 4 \end{pmatrix}$, the leading principal minors are $4$, $15$, $54$ — all positive, so $A$ is positive definite, so *every* eigenvalue is positive. Confirmed against the actual spectrum $6, 3, 3$ (verified: $6+3+3 = 12 = \text{tr}(A)$ ✓, $6\cdot3\cdot3 = 54 = \det(A)$ ✓). Three determinants beat one cubic.

- **The trap GATE likes: converse-flipping.** "Real eigenvalues $\Rightarrow$ symmetric" is **false** — $\begin{pmatrix} 1 & 5 \\ 0 & 2 \end{pmatrix}$ is triangular with eigenvalues $1, 2$, both real, and is not symmetric. Likewise "diagonalizable $\Rightarrow$ symmetric" is false. The implication runs one way only.

- **The other trap: complex entries.** $A = A^T$ over $\mathbb{C}$ buys you nothing — the real-eigenvalue guarantee needs $A = \bar{A}^T$ (Hermitian). MSQ options mixing $\begin{pmatrix} 0 & i \\ -i & 0\end{pmatrix}$ into a list of "symmetric" matrices are testing exactly this.

- **Time budget:** verifying symmetry is a 5-second glance. If a symmetric-matrix question has cost you more than two minutes, check whether you skipped a free guarantee the word "symmetric" already gave you.
