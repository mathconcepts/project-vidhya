---
id: analytic-functions.interleaved-drill
concept_id: analytic-functions
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: analytic-functions.micro-exercise
---

**Cross-concept check: analytic-functions → complex-integration.**

**Question 1 (analytic-functions):** Is $f(z)=z^2$ analytic on and inside $|z|=1$? What does that let you conclude about $\oint_{|z|=1}z^2\,dz$ without computing it?

*Answer:* $u=x^2-y^2,\ v=2xy$ satisfy CR everywhere (this concept's own worked example), so $f$ is entire — analytic on and inside every contour. By Cauchy's theorem, $\oint_{|z|=1}z^2\,dz=0$ immediately, with no integration needed.

**Question 2 (complex-integration):** Now try $g(z)=\bar z$ on the same contour. Is $g$ analytic? Compute $\oint_{|z|=1}\bar z\,dz$ directly and compare.

*Answer:* $u=x,\ v=-y$: $u_x=1$ but $v_y=-1$ — CR fails everywhere, so $g$ is analytic nowhere. Parametrizing $z=e^{it}$: $\oint\bar z\,dz=\int_0^{2\pi}e^{-it}\cdot ie^{it}\,dt=\int_0^{2\pi}i\,dt=2\pi i\neq0$.

**Why this drill exists:** the vanishing of a closed contour integral is a *consequence* of analyticity, not a property closed loops have automatically. $z^2$ and $\bar z$ are both "smooth-looking" functions on the circle, and only one of them gives zero — the CR check from this concept is what tells you which one, before you touch a single integral.
