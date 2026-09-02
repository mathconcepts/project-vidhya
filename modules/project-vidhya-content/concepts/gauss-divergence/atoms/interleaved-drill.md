---
id: gauss-divergence.interleaved_drill
concept_id: gauss-divergence
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: gauss-divergence → divergence-curl.**

Let $\mathbf F=(x^2,\ 0,\ 0)$.

**Question 1 (divergence-curl):** Compute $\operatorname{div}\mathbf F$.

*Answer:* $\operatorname{div}\mathbf F=\dfrac{\partial}{\partial x}(x^2)+\dfrac{\partial}{\partial y}(0)+\dfrac{\partial}{\partial z}(0)=2x$ — the divergence-curl skill of reading off three partials and summing them, nothing more.

**Question 2 (gauss-divergence):** Apply Gauss' Theorem to find the flux of $\mathbf F$ outward through the boundary of the unit cube $[0,1]^3$.

*Answer:* $\displaystyle\iiint_V 2x\,dV=\int_0^1\int_0^1\int_0^1 2x\,dx\,dy\,dz=2\cdot\dfrac12\cdot1\cdot1=1$ — a cube, not a sphere, and the theorem doesn't notice the difference.

**Why this drill exists:** students see Gauss' Theorem worked almost exclusively on spheres and quietly conclude the shortcut needs spherical symmetry to work. It doesn't — the only real prerequisite is the divergence-curl skill of computing $\operatorname{div}\mathbf F$ correctly; the solid it's integrated over can be a cube, a cylinder, or anything else closed, as this drill's non-spherical, non-symmetric example is built to show. A student who only ever practises on balls and shells has learned a narrower theorem than the one that actually got proved.
