---
id: surface-integrals.micro-exercise
concept_id: surface-integrals
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Evaluate the surface integral $\iint_S x \, dS$ where $S$ is the sphere $x^2 + y^2 + z^2 = 1$.

- **(A)** 0
- **(B)** $4\pi$
- **(C)** $2\pi$
- **(D)** $\pi$

<details>
<summary>Answer</summary>

**A**. By symmetry, the integral of any odd function over a symmetric surface is zero. The function $f(x, y, z) = x$ is odd in $x$ (i.e., $f(-x, y, z) = -f(x, y, z)$), and the sphere is symmetric about the $yz$-plane. Therefore:

$$\iint_S x \, dS = 0$$

Alternatively, parameterize the sphere as $\mathbf{r}(\theta, \phi) = \sin\phi\cos\theta \, \mathbf{i} + \sin\phi\sin\theta \, \mathbf{j} + \cos\phi \, \mathbf{k}$ where $\theta \in [0, 2\pi]$, $\phi \in [0, \pi]$.

$dS = \sin\phi \, d\theta \, d\phi$ (surface element on unit sphere).

$x = \sin\phi\cos\theta$.

$$\iint_S x \, dS = \int_0^{2\pi} \int_0^\pi \sin\phi\cos\theta \cdot \sin\phi \, d\phi \, d\theta = \int_0^{2\pi} \cos\theta \, d\theta \int_0^\pi \sin^2\phi \, d\phi = [\sin\theta]_0^{2\pi} \cdot \text{const} = 0$$

since $\sin(2\pi) - \sin(0) = 0$.

</details>
