---
id: vector-fields.interleaved-drill
concept_id: vector-fields
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: vector-fields → divergence-curl.**

Let $\phi(x,y,z)=x^2+y^2+z^2$.

**Question 1 (vector-fields):** Find the gradient field $\mathbf F=\nabla\phi$.

*Answer:* $\mathbf F=(2x,2y,2z)$ — a radial field pointing away from the origin, growing linearly with distance from it.

**Question 2 (divergence-curl):** Compute $\operatorname{div}\mathbf F$ and $\operatorname{curl}\mathbf F$ for this field.

*Answer:* $\operatorname{div}\mathbf F = \dfrac{\partial}{\partial x}(2x)+\dfrac{\partial}{\partial y}(2y)+\dfrac{\partial}{\partial z}(2z)=6$ (verified: constant, matches the Laplacian of $\phi$). $\operatorname{curl}\mathbf F=(0,0,0)$ — every gradient field is irrotational, a fixed identity, not a coincidence of this particular $\phi$.

**Why this drill exists:** students meet $\operatorname{curl}(\nabla\phi)=0$ as an abstract identity in divergence-curl and forget it is exactly the same object — a gradient field — they built by hand in vector-fields. Computing both sides on a field you constructed yourself, rather than one handed to you already-labelled "gradient," is what makes the identity stick.
