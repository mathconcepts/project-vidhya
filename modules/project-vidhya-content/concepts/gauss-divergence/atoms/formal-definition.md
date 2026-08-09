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
