---
id: surface-integrals.formal-definition
concept_id: surface-integrals
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Surface Integral of a Vector Field (Flux)**: For a surface $S$ parameterized by $\mathbf{r}(u, v)$, the flux of $\mathbf{F}$ through $S$ is:
$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \iint_D \mathbf{F}(\mathbf{r}(u, v)) \cdot \left(\frac{\partial \mathbf{r}}{\partial u} \times \frac{\partial \mathbf{r}}{\partial v}\right) du \, dv$$

where $\mathbf{n} = \frac{\partial \mathbf{r}}{\partial u} \times \frac{\partial \mathbf{r}}{\partial v}$ is the normal vector to the surface (cross product of tangent vectors).

**Alternative Form (Projection)**: If $S$ is given by $z = g(x, y)$, then:
$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \iint_D \left(-P \frac{\partial g}{\partial x} - Q \frac{\partial g}{\partial y} + R\right) dx \, dy$$

where $\mathbf{F} = P\mathbf{i} + Q\mathbf{j} + R\mathbf{k}$.
