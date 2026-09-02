---
id: gauss-divergence.formal-definition
concept_id: gauss-divergence
atom_type: formal_definition
bloom_level: 2
difficulty: 0.56
exam_ids: ["*"]
---

**Gauss Divergence Theorem**: For a closed surface $S$ (with outward-pointing normal $\mathbf{n}$) bounding a volume $V$, and a vector field $\mathbf{F}$ differentiable on $V$:
$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \iiint_V \nabla \cdot \mathbf{F} \, dV$$

The left side is the flux (flow) through the closed surface; the right side is the integral of divergence (source density) inside the volume. The theorem converts a surface integral into a volume integral (often simpler).

**Divergence Recap**: $\nabla \cdot \mathbf{F} = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y} + \frac{\partial R}{\partial z}$ (scalar field indicating local expansion/contraction).

**Method selector.** Reach for Gauss' Theorem the moment the surface $S$ is closed — trading $\iint_S\mathbf F\cdot\mathbf n\,dS$ for $\iiint_V(\nabla\cdot\mathbf F)\,dV$ turns a surface parametrization into a volume integral, which is often the easier of the two, especially when $\operatorname{div}\mathbf F$ is a constant. Computing the flux directly, face by face or patch by patch, is the tempting alternative for a surface that looks simple (a cube, a cylinder's three pieces) — but it repeats work the theorem already collapses into one integral, and it is the *only* option left the instant $S$ is open (a hemisphere with no cap, say), since an open surface bounds no volume for Gauss' Theorem to convert to at all.
