---
id: divergence-curl.interleaved-drill
concept_id: divergence-curl
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: divergence-curl → line-integrals.**

Let $\mathbf F(x,y)=\left(\dfrac{-y}{x^2+y^2},\ \dfrac{x}{x^2+y^2}\right)$, defined everywhere except the origin.

**Question 1 (divergence-curl):** Compute the 2D curl of $\mathbf F$ away from the origin.

*Answer:* $\partial Q/\partial x-\partial P/\partial y=0$ everywhere $\mathbf F$ is defined (verified by direct differentiation) — this field is irrotational at every point it exists.

**Question 2 (line-integrals):** Compute the circulation of $\mathbf F$ around the unit circle, traversed counterclockwise.

*Answer:* On the unit circle, $x^2+y^2=1$, so $\mathbf F=(-y,x)$ exactly there. Parametrizing $x=\cos t,\,y=\sin t$ gives $\mathbf F\cdot\mathbf r'(t)=\sin^2t+\cos^2t=1$, so the circulation is $\int_0^{2\pi}1\,dt=2\pi$ — nonzero, despite curl being zero everywhere along the path.

**Why this drill exists:** curl-zero alone is not sufficient for zero circulation — it only guarantees path-independence on a simply connected domain, and the unit circle here encloses the one point, the origin, where $\mathbf F$ is undefined. This is the standard counterexample GATE uses to test whether "curl $=0$ $\Rightarrow$ conservative" was memorised as an unconditional rule or as the conditional one it actually is.
