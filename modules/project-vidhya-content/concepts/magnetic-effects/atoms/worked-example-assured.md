---
id: magnetic-effects.worked-example-assured
concept_id: magnetic-effects
atom_type: worked_example
variant_of: magnetic-effects.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A proton, $v=2\times10^6\ \text{m/s}$ along $+x$, in $B=0.5\ \text{T}$ along $+y$. Find $F$ and its direction; compare with $\vec B$ along $+x$.

---

**Step 1 — $\theta=90°$ gives the magnitude, the right-hand rule gives the direction.** $F=qvB\sin90°=(1.6\times10^{-19})(2\times10^6)(0.5)$.

$$\boxed{F=1.6\times10^{-13}\ \text{N, along } +z}$$

With $\vec B$ along $+x$ instead, $\theta=0°$ and $\boxed{F=0}$.

---

**The condition this "no force" case needs, made explicit.** $F=0$ here specifically because $\vec v \parallel \vec B$, not because the charge stopped moving or the field vanished. This is easy to over-generalise into "a charge moving *inside* a magnetic-field region feels no force" — false; it is a statement about the *angle*, not the region.

Counterexample: send the same proton along a *helical* path through this same field region — its velocity has a component always perpendicular to $\vec B$ (which is what curves it into a circle in that plane) and a component always parallel to $\vec B$ (unaffected, contributing to steady drift along $\vec B$). The perpendicular component feels the full force every instant; only the parallel component ever sees zero force. A charge can be inside the field, moving, and still feel a real magnetic force — as long as $\theta\ne0°,180°$ for at least part of its velocity.

