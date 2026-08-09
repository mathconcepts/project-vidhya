---
id: surface-integrals.common-traps
concept_id: surface-integrals
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting the normal vector**: Students compute $\iint_S P \, dx \, dy$ and think they're done, but the flux integral $\iint_S \mathbf{F} \cdot \mathbf{n} \, dS$ requires the normal vector. The cross product $\frac{\partial \mathbf{r}}{\partial u} \times \frac{\partial \mathbf{r}}{\partial v}$ gives the correct normal *and* incorporates the surface-area scaling ($dS = |\text{cross product}| \, du \, dv$).

- **Wrong orientation of the normal**: Check the problem statement—outward vs. inward normal matters. For a closed surface like a sphere, "outward" means pointing away from the center. For an open surface like a paraboloid, the orientation is given or must be inferred from context.

- **Not using Gauss' theorem when it applies**: If you're asked for flux through a closed surface, compute $\iiint_V \nabla \cdot \mathbf{F} \, dV$ instead of parameterizing the surface—often 10x faster.
