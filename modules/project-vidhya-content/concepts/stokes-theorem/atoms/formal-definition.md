---
id: stokes-theorem.formal-definition
concept_id: stokes-theorem
atom_type: formal_definition
bloom_level: 2
difficulty: 0.56
exam_ids: ["*"]
---

**Stokes' Theorem**: For a surface $S$ with boundary curve $C$ (both oriented consistently via the right-hand rule), and a vector field $\mathbf{F}$ differentiable on $S$:
$$\oint_C \mathbf{F} \cdot d\mathbf{r} = \iint_S (\nabla \times \mathbf{F}) \cdot \mathbf{n} \, dS$$

The left side is the line integral around the boundary; the right side is the flux of curl through the surface. Orientation: if your right thumb points along $\mathbf{n}$ (normal to $S$), your fingers curl in the direction of $C$.

**Component Form**: If $\mathbf{F} = P\mathbf{i} + Q\mathbf{j} + R\mathbf{k}$ and $\mathbf{n} = (n_x, n_y, n_z)$:
$$\oint_C P \, dx + Q \, dy + R \, dz = \iint_S \begin{vmatrix} n_x & n_y & n_z \\ \frac{\partial}{\partial x} & \frac{\partial}{\partial y} & \frac{\partial}{\partial z} \\ P & Q & R \end{vmatrix} dS$$

**Method selector.** Reach for Stokes' Theorem the moment the boundary curve $C$ does not lie flat in a single plane, or the surface it naturally bounds is curved — Green's Theorem has no double integral to offer the instant $C$ leaves the $xy$-plane, since there is no flat region $D$ left for it to run over. The tempting shortcut is forcing $C$ into several planar pieces and patching Green's Theorem across each one; Stokes' Theorem instead lets you span $C$ with any single orientable surface — usually the flattest one available — and evaluate one flux integral instead of several stitched-together line integrals.
