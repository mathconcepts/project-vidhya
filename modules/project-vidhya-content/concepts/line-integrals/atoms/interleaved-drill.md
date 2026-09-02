---
id: line-integrals.interleaved_drill
concept_id: line-integrals
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: vector-fields → line-integrals.**

**Question 1 (vector-fields):** Is $\mathbf F(x,y)=(2xy,\ x^2+3y^2)$ conservative? If so, find its scalar potential $\phi$.

*Answer:* With $P=2xy$, $Q=x^2+3y^2$: $\partial Q/\partial x = 2x$ and $\partial P/\partial y = 2x$ — equal, so $\mathbf F$ is conservative. Integrating $P$ in $x$: $\phi = x^2y + g(y)$. Matching $\partial\phi/\partial y = x^2+g'(y)$ to $Q$ gives $g'(y)=3y^2$, so $g(y)=y^3$. Thus $\phi(x,y)=x^2y+y^3$.

**Question 2 (line-integrals):** Using the potential from Question 1, evaluate $\int_C \mathbf F\cdot d\mathbf r$ from $(0,0)$ to $(1,2)$ along *any* path $C$.

*Answer:* Since $\mathbf F$ is conservative, the Fundamental Theorem of Line Integrals applies directly: $\int_C \mathbf F\cdot d\mathbf r = \phi(1,2)-\phi(0,0) = (1\cdot2+2^3) - 0 = 2+8 = 10$. No parametrization, no $\mathbf r'(t)$, no dot product — the work from Question 1 already did the hard part.

**Why this drill exists:** finding a potential (vector-fields) and *using* it to skip a line-integral computation (line-integrals) are taught as separate skills, so students who correctly identify $\mathbf F$ as conservative in isolation still default to picking a path, parametrizing it, and grinding through the full PDDI sequence anyway — paying the cost the conservativeness test was supposed to save them.
