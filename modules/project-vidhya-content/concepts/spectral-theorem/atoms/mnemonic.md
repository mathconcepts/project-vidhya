---
id: spectral-theorem.mnemonic
concept_id: spectral-theorem
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
modality: mnemonic
exam_ids: ["*"]
---

**"Spectrum" is borrowed from optics.** A prism splits white light into pure colours; the spectral theorem splits a symmetric matrix into pure directions, each scaled by its own $\lambda$. The set of eigenvalues *is* the spectrum.

**Three guarantees — R.O.D.:** **R**eal eigenvalues (never complex), **O**rthogonal eigenvectors (for distinct eigenvalues), **D**iagonalizable, always (no symmetric matrix is defective). Say "Real, Orthogonal, Diagonalizable" and you've restated the theorem.

**The practical payoff: $Q^{-1} = Q^{T}$.** Every other diagonalization $A = PDP^{-1}$ makes you invert $P$. Here you transpose — free, no arithmetic to slip on.

**Two formulas worth carrying:**

$$A = \sum_i \lambda_i \, \mathbf{q}_i \mathbf{q}_i^{\mathrm{T}}, \qquad f(A) = \sum_i f(\lambda_i) \, \mathbf{q}_i \mathbf{q}_i^{\mathrm{T}}$$

One line covers $A^k$, $A^{-1}$, $\sqrt{A}$, $e^A$ — apply $f$ to the eigenvalues, leave the $\mathbf{q}_i$ untouched.

**Sanity-check reflex:** $\sum \lambda_i = \text{tr}(A)$ and $\prod \lambda_i = \det(A)$ as always — plus one more for symmetric matrices: every $\lambda$ must come out real. A complex root is proof of an arithmetic slip.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Rebuild A from its own eigenvalues — drag λ1, λ2",
  "why": "A = Σ λᵢ qᵢqᵢᵀ says the whole matrix is nothing but its eigenvalues, weighted by two fixed orthonormal directions. Drag the λ's and watch A itself change, while trace and det keep tracking them exactly.",
  "inputs": [
    {"id": "lam1", "label": "λ1", "min": -5, "max": 5, "step": 0.5, "initial": 4},
    {"id": "lam2", "label": "λ2", "min": -5, "max": 5, "step": 0.5, "initial": 1}
  ],
  "outputs": [
    {"label": "A11 = 0.75λ1 + 0.25λ2", "formula": "0.75*lam1 + 0.25*lam2", "digits": 2},
    {"label": "A12 = A21 = 0.433(λ1 − λ2)", "formula": "0.4330127*(lam1 - lam2)", "digits": 2},
    {"label": "A22 = 0.25λ1 + 0.75λ2", "formula": "0.25*lam1 + 0.75*lam2", "digits": 2},
    {"label": "tr(A) = λ1 + λ2", "formula": "lam1 + lam2", "digits": 2},
    {"label": "det(A) = λ1 · λ2", "formula": "lam1 * lam2", "digits": 2}
  ],
  "caption": "This A is built from two fixed orthonormal directions 30° apart, weighted only by λ1 and λ2. Whatever you drag them to, trace(A) still equals λ1+λ2 and det(A) still equals λ1·λ2 — the spectral decomposition never breaks that promise."
}
```
