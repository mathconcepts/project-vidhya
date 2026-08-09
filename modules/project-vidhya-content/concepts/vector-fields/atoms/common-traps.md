---
id: vector-fields.common-traps
concept_id: vector-fields
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing vector and scalar fields**: Students often treat vector fields as scalar functions. Remember: $\mathbf{F}: \mathbb{R}^3 \to \mathbb{R}^3$ (input: point, output: vector). A scalar field $f: \mathbb{R}^3 \to \mathbb{R}$ (input: point, output: number).

- **Forgetting the constant of integration**: When reconstructing a potential function $f$ from $\nabla f = \mathbf{F}$, always add $+ C$ at the end. Different integration steps may produce different intermediate constants that must be reconciled carefully.

- **Misapplying the conservative test**: Students check $\frac{\partial P}{\partial y} = \frac{\partial Q}{\partial x}$ in 2D but forget to extend it to 3D (all three mixed-partial conditions must hold). A field that passes the 2D test on a subset is not necessarily conservative in 3D.
