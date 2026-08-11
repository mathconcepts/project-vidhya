---
id: conformal-mapping.common-traps
concept_id: conformal-mapping
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing "analytic" with "conformal"**: A function is analytic if it's complex-differentiable (satisfies Cauchy-Riemann). It is **conformal** if it's analytic AND $f'(z) \neq 0$. Example: $f(z) = z^2$ is analytic everywhere but NOT conformal at $z = 0$ (where $f'(0) = 0$).
- **Forgetting that angle preservation is **local****: Conformal maps preserve angles only in a small neighborhood around a point. They may distort global shapes dramatically. Example: $e^z$ maps the entire complex plane conformally, but the image is only the right half-plane $\{w : \text{Re}(w) > 0\}$... wait, that's not right. Let me reconsider. Actually, $e^z$ maps the entire plane to $\mathbb{C} \setminus \{0\}$ conformally (the plane minus the origin). Students sometimes assume angles are preserved globally, which is false.
- **Missing the singularities**: When checking if a map is conformal, always verify that $f'(z) \neq 0$ at the point in question. A zero derivative means the map is NOT conformal there, even if the function is analytic.
