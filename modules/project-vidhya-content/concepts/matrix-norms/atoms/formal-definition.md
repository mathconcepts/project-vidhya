---
id: matrix-norms.formal_definition
concept_id: matrix-norms
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

A **matrix norm** $\|\cdot\|$ on $\mathbb{R}^{m \times n}$ satisfies:
1. $\|A\| \geq 0$, with equality iff $A = 0$
2. $\|cA\| = |c| \cdot \|A\|$ for all scalars $c$
3. $\|A + B\| \leq \|A\| + \|B\|$ (triangle inequality)
4. $\|AB\| \leq \|A\| \cdot \|B\|$ (submultiplicativity, for square matrices)

**Four standard norms:**

$$\|A\|_F = \sqrt{\sum_{i,j} a_{ij}^2} \quad \text{(Frobenius norm)}$$

$$\|A\|_2 = \sigma_{\max}(A) \quad \text{(spectral norm / largest singular value)}$$

$$\|A\|_1 = \max_j \sum_i |a_{ij}| \quad \text{(1-norm: max column sum)}$$

$$\|A\|_\infty = \max_i \sum_j |a_{ij}| \quad \text{(∞-norm: max row sum)}$$

**Condition number:** For invertible $A$,
$$\kappa(A) = \|A\| \cdot \|A^{-1}\| \geq 1$$

With the spectral norm, $\kappa_2(A) = \frac{\sigma_{\max}(A)}{\sigma_{\min}(A)}$ — the ratio of largest to smallest singular value. An ill-conditioned matrix ($\kappa \gg 1$) has widely separated singular values and is sensitive to perturbations; a well-conditioned matrix ($\kappa \approx 1$) has nearly equal singular values and is numerically stable.