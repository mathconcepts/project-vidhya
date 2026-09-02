---
id: spectral-theorem.exam-pattern
concept_id: spectral-theorem
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
modality: text
exam_ids: ["*"]
---

**How GATE actually asks this.**

- **The dominant ask: compute $A^k$, $\sqrt{A}$, or $e^A$ for a small symmetric $A$.** Never multiply matrices repeatedly. Diagonalize once, apply the function to the eigenvalues, reassemble. For $A = \begin{pmatrix} 5 & 2 \\ 2 & 5 \end{pmatrix}$: $\lambda=3,7$ (verified: $3+7=10=\text{tr}(A)$ ✓, $3\cdot7=21=\det(A)$ ✓). Then $A^3 = 27\,\mathbf{q}_1\mathbf{q}_1^T+343\,\mathbf{q}_2\mathbf{q}_2^T = \begin{pmatrix}185&158\\158&185\end{pmatrix}$ (verified against direct cubing). For $A^{20}$ direct multiplication isn't an option at all — the spectral route costs the same as $A^3$.

- **NAT shortcut: if only $\text{tr}(A^k)$ or $\det(A^k)$ is wanted, skip $Q$ entirely.** $\text{tr}(A^k)=\sum\lambda_i^k$, $\det(A^k)=(\det A)^k$. Here $\text{tr}(A^3)=27+343=370$ ✓ — one line, no eigenvectors.

- **The "real" trap.** The theorem is for *real* symmetric matrices. A complex symmetric matrix gets none of the guarantees — the complex analogue needs $A^H=A$ (Hermitian). GATE options quietly swap "symmetric" for "Hermitian" and back.

- **The biggest trap: "diagonalizable" $\neq$ "orthogonally diagonalizable."** Any matrix with $n$ independent eigenvectors is diagonalizable. Only real symmetric matrices are *orthogonally* diagonalizable — and the converse holds too: "$A=Q\Lambda Q^T$ for orthogonal $Q$" forces $A$ symmetric.

- **Repeated eigenvalues are harmless here.** Geometric multiplicity always equals algebraic for a symmetric matrix, so the decomposition exists regardless — you still orthogonalize within a repeated eigenspace by hand.

- **Time budget:** a $2\times2$ spectral decomposition is a 90-second job; a trace/determinant-only question should cost under 30 seconds.
