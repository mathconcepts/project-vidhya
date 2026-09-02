---
id: surface-integrals.interleaved_drill
concept_id: surface-integrals
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: line-integrals → surface-integrals.**

**Question 1 (line-integrals):** Compute the circulation $\oint_C \mathbf F\cdot d\mathbf r$ for $\mathbf F=(-y,x)$ traced once counterclockwise around the unit circle.

*Answer:* Parametrize $\mathbf r(t)=(\cos t,\sin t)$, $t\in[0,2\pi]$. Then $\mathbf F(\mathbf r(t))=(-\sin t,\cos t)$ and $\mathbf r'(t)=(-\sin t,\cos t)$, so the dot product is $\sin^2t+\cos^2t=1$. Integrating: $\oint_C\mathbf F\cdot d\mathbf r = \int_0^{2\pi}1\,dt = 2\pi$.

**Question 2 (surface-integrals):** Let $S$ be the flat unit disk $x^2+y^2\le1$ in the plane $z=0$, capping the circle from Question 1, oriented with upward normal $\mathbf n=(0,0,1)$. The curl of $\mathbf F=(-y,x,0)$ is $\nabla\times\mathbf F=(0,0,2)$. Evaluate $\iint_S(\nabla\times\mathbf F)\cdot\mathbf n\,dS$.

*Answer:* $(\nabla\times\mathbf F)\cdot\mathbf n = 2$, constant over $S$, so the surface integral is $2$ times the disk's area: $2\cdot\pi(1)^2=2\pi$ — matching Question 1's circulation exactly.

**Why this drill exists:** the match between a curve's circulation (line-integrals) and the flux of its curl through *any* surface bounded by that curve (surface-integrals) is the exact relationship Stokes' theorem formalizes, and it's where students most often get the surface's orientation backward relative to the curve's traversal direction — flipping $\mathbf n$ here would silently flip the sign of a value that should have matched Question 1 on the nose.
