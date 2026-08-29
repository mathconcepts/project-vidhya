---
id: spectral-theorem.mnemonic
concept_id: spectral-theorem
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Spectrum" is borrowed from optics.** A prism splits white light into pure colours; the spectral theorem splits a symmetric matrix into pure directions, each scaled by its own $\lambda$. The set of eigenvalues *is* the spectrum.

**Three guarantees — R.O.D.:**

- **R**eal eigenvalues (never complex)
- **O**rthogonal eigenvectors (for distinct eigenvalues)
- **D**iagonalizable, always (no symmetric matrix is defective)

Say "Real, Orthogonal, Diagonalizable" and you have restated the theorem.

**The practical payoff: $Q^{-1} = Q^{T}$.** Every other diagonalization $A = PDP^{-1}$ makes you invert $P$. Here you transpose — free, and no arithmetic to slip on. That is the entire reason symmetry is worth spotting on sight.

**Two formulas worth carrying:**

$$A = \sum_i \lambda_i \, \mathbf{q}_i \mathbf{q}_i^{\mathrm{T}}, \qquad f(A) = \sum_i f(\lambda_i) \, \mathbf{q}_i \mathbf{q}_i^{\mathrm{T}}$$

One line covers $A^k$, $A^{-1}$, $\sqrt{A}$, $e^A$ — apply $f$ to the eigenvalues and leave the $\mathbf{q}_i$ untouched.

**Sanity-check reflex:** $\sum \lambda_i = \text{tr}(A)$ and $\prod \lambda_i = \det(A)$, as always — but for a symmetric matrix add one more: **every $\lambda$ must come out real.** A complex root from a real symmetric matrix is proof of an arithmetic slip, not an interesting matrix.
