---
id: matrix-norms.retrieval_prompt
concept_id: matrix-norms
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

**Recall Question:** Define the condition number $\kappa(A)$ and explain why a large condition number indicates an ill-conditioned matrix in the context of solving $Ax = b$.

<details>
<summary>Answer</summary>

**Definition:**
$$\kappa(A) = \|A\| \cdot \|A^{-1}\|$$

With the spectral norm (most common in GATE):
$$\kappa_2(A) = \frac{\sigma_{\max}(A)}{\sigma_{\min}(A)}$$

**Why large $\kappa$ indicates ill-conditioning:**

1. **Wide singular value spread:** Large $\kappa(A)$ means $A$ has widely separated singular values (some large, some tiny).

2. **Sensitivity to perturbations:** If the input $b$ is perturbed by $\delta b$, the solution $x$ changes by approximately $\delta x = A^{-1} \delta b$. The relative error satisfies:
$$\frac{\|\delta x\|}{\|x\|} \lesssim \kappa(A) \cdot \frac{\|\delta b\|}{\|b\|}$$
A large $\kappa$ magnifies relative errors.

3. **Numerical instability:** During computer arithmetic, rounding errors accumulate. A large condition number means these errors are amplified, potentially rendering the computed solution unreliable.

4. **Geometric intuition:** The matrix transformation is like a thin pancake — it stretches inputs in some directions far while leaving others nearly unchanged. Small perturbations in poorly-stretched directions explode upon inversion.

**Example:** If $\kappa(A) = 10^6$ and $\|b\|$ has a rounding error of $10^{-15}$, the solution error can be as large as $10^{-9}$ — loss of ~6 digits of accuracy.

</details>