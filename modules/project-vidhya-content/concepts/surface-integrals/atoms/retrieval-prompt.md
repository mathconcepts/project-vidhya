---
id: surface-integrals.retrieval-prompt
concept_id: surface-integrals
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Find the flux of $\mathbf{F}(x, y, z) = x\mathbf{i} + y\mathbf{j} + z\mathbf{k}$ through the unit sphere $x^2 + y^2 + z^2 = 1$ (outward normal).

- **(A)** $0$
- **(B)** $\frac{4\pi}{3}$
- **(C)** $4\pi$
- **(D)** $12\pi$

<details>
<summary>Answer</summary>

**C**. Use the divergence form. On the unit sphere, the outward normal is $\mathbf{n} = x\mathbf{i} + y\mathbf{j} + z\mathbf{k}$ (radius vector).

At the surface: $\mathbf{F} \cdot \mathbf{n} = (x, y, z) \cdot (x, y, z) = x^2 + y^2 + z^2 = 1$.

Therefore:
$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \iint_S 1 \, dS = \text{(surface area of unit sphere)} = 4\pi$$

Alternatively, use Gauss' theorem:
$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \iiint_V \nabla \cdot \mathbf{F} \, dV$$

$\nabla \cdot \mathbf{F} = \frac{\partial x}{\partial x} + \frac{\partial y}{\partial y} + \frac{\partial z}{\partial z} = 1 + 1 + 1 = 3$

$$\iiint_V 3 \, dV = 3 \cdot (\text{volume of unit sphere}) = 3 \cdot \frac{4\pi}{3} = 4\pi$$

</details>
