---
id: spectral-theorem.exam-pattern
concept_id: spectral-theorem
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **The dominant ask: compute $A^k$, $\sqrt{A}$, or $e^A$ for a small symmetric $A$.** Never multiply matrices repeatedly. Diagonalize once, apply the function to the eigenvalues, reassemble.

  For $A = \begin{pmatrix} 5 & 2 \\ 2 & 5 \end{pmatrix}$: $\lambda = 3, 7$ (verified: $3+7 = 10 = \text{tr}(A)$ ✓, $3 \cdot 7 = 21 = \det(A)$ ✓). Then
  $$A^3 = 27\,\mathbf{q}_1\mathbf{q}_1^{\mathrm{T}} + 343\,\mathbf{q}_2\mathbf{q}_2^{\mathrm{T}} = \begin{pmatrix} 185 & 158 \\ 158 & 185 \end{pmatrix}$$
  (verified against direct cubing). For $A^{20}$ the direct route is not an option at all — the spectral route costs the same as $A^3$.

- **NAT shortcut: if the question wants only $\text{tr}(A^k)$ or $\det(A^k)$, skip $Q$ entirely.** $\text{tr}(A^k) = \sum \lambda_i^k$ and $\det(A^k) = (\det A)^k$. Here $\text{tr}(A^3) = 27 + 343 = 370$ ✓ — one line, no eigenvectors.

- **The "real" trap.** The theorem is for **real** symmetric matrices. A *complex* symmetric matrix ($A^{\mathrm{T}} = A$ with complex entries) gets none of the guarantees. The complex analogue needs $A^{H} = A$ — Hermitian, conjugate transpose. GATE options quietly swap "symmetric" for "Hermitian" and back.

- **The biggest trap: "diagonalizable" $\neq$ "orthogonally diagonalizable."** Any matrix with $n$ independent eigenvectors is diagonalizable. Only real symmetric matrices are *orthogonally* diagonalizable — and the converse holds too, so "$A = Q\Lambda Q^{\mathrm{T}}$ for orthogonal $Q$" forces $A$ to be symmetric. See the paired drill.

- **Repeated eigenvalues are harmless here.** For a general matrix a repeated eigenvalue raises a real question about defectiveness; for a symmetric matrix geometric multiplicity always equals algebraic, so the decomposition exists regardless. You still have to orthogonalise *within* a repeated eigenspace by hand — Gram-Schmidt does not come free.

- **Time budget:** a $2\times2$ spectral decomposition (eigenvalues, normalize two eigenvectors, assemble $Q$) is a 90-second job. If the question only wants a trace or determinant, it should cost under 30.
