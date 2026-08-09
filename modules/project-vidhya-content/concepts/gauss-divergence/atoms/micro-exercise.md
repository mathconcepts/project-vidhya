---
id: gauss-divergence.micro-exercise
concept_id: gauss-divergence
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Use the Gauss Divergence Theorem to find the flux of $\mathbf{F}(x, y, z) = 2x\mathbf{i} + 3y\mathbf{j} + z\mathbf{k}$ through the closed cube $0 \leq x, y, z \leq 1$ (outward normal).

- **(A)** 3
- **(B)** 4
- **(C)** 5
- **(D)** 6

<details>
<summary>Answer</summary>

**D**. Apply Gauss Divergence Theorem:
$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \iiint_V \nabla \cdot \mathbf{F} \, dV$$

Compute divergence:
$$\nabla \cdot \mathbf{F} = \frac{\partial(2x)}{\partial x} + \frac{\partial(3y)}{\partial y} + \frac{\partial(z)}{\partial z} = 2 + 3 + 1 = 6$$

Integrate over the unit cube $[0, 1]^3$:
$$\iiint_V 6 \, dV = 6 \times (\text{volume of cube}) = 6 \times 1 = 6$$

</details>
