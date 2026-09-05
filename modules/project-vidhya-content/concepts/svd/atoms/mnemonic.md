---
id: svd.mnemonic
concept_id: svd
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
modality: mnemonic
exam_ids: ["*"]
---

**"Rotate — Stretch — Rotate."** Read $A = U\Sigma V^T$ right to left, the way it acts on a vector: $V^T$ rotates, $\Sigma$ stretches along the axes, $U$ rotates again. Every matrix on earth is exactly those three moves. That's why SVD exists for *any* $A$ — even non-square, even singular.

**Where the numbers come from, remembered as "square then square-root":**

$$\sigma_i = \sqrt{\lambda_i(A^T A)}$$

Singular values are the **square roots of the eigenvalues of $A^T A$**. $A^T A$ is symmetric and positive semi-definite, so those eigenvalues are always real and $\geq 0$ — no complex numbers ever sneak in, which is exactly why $\sigma$ exists when eigenvalues of $A$ misbehave.

**Three one-liners worth memorising cold:**

- $\text{rank}(A) = $ how many $\sigma_i \neq 0$ (count, don't row-reduce)
- $\|A\|_2 = \sigma_1$ (the largest one)
- $\|A\|_F = \sqrt{\sum \sigma_i^2}$

**Sanity-check reflex:** $\sum \sigma_i^2 = \text{tr}(A^T A) = $ sum of squares of *all* entries of $A$. Add up every entry squared; if it doesn't match your $\sigma$'s, you slipped.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag σ1 and σ2 — watch the two norms and the condition number",
  "why": "The three one-liners read off the singular values with no matrix in sight. Drag σ1, σ2: the spectral norm locks onto the larger one, the Frobenius norm blends both, and the ratio blows up as σ2 shrinks toward zero.",
  "inputs": [
    {"id": "s1", "label": "σ1", "min": 0, "max": 5, "step": 0.5, "initial": 3},
    {"id": "s2", "label": "σ2", "min": 0.2, "max": 5, "step": 0.2, "initial": 1}
  ],
  "outputs": [
    {"label": "‖A‖₂ = max(σ1, σ2)", "formula": "max(s1, s2)", "digits": 2},
    {"label": "‖A‖_F = √(σ1² + σ2²)", "formula": "sqrt(s1^2 + s2^2)", "digits": 2},
    {"label": "σ1 / σ2 (condition number)", "formula": "s1 / s2", "digits": 2}
  ],
  "caption": "‖A‖₂ only ever cares about the bigger singular value — dragging the smaller one down does nothing to it. But push σ2 toward zero and the ratio σ1/σ2 shoots up: that's a matrix getting closer to singular, in one number."
}
```
