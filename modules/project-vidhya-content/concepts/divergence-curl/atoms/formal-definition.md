---
id: divergence-curl.formal-definition
concept_id: divergence-curl
atom_type: formal_definition
bloom_level: 2
difficulty: 0.45
exam_ids: ["*"]
---

For $\mathbf F=(P,Q,R)$:

$$\operatorname{div}\mathbf F=\frac{\partial P}{\partial x}+\frac{\partial Q}{\partial y}+\frac{\partial R}{\partial z}$$

$$\operatorname{curl}\mathbf F=\left(\frac{\partial R}{\partial y}-\frac{\partial Q}{\partial z},\ \frac{\partial P}{\partial z}-\frac{\partial R}{\partial x},\ \frac{\partial Q}{\partial x}-\frac{\partial P}{\partial y}\right)$$

The **Laplacian** of a scalar field is $\nabla^2\phi=\operatorname{div}(\nabla\phi)$. Two identities hold for every sufficiently smooth $\phi$ and $\mathbf F$:

$$\operatorname{curl}(\nabla\phi)=\mathbf 0, \qquad \operatorname{div}(\operatorname{curl}\mathbf F)=0.$$

**Method selector.** Use $\operatorname{curl}\mathbf F=\mathbf 0$ to conclude $\mathbf F$ is conservative only when the domain is simply connected — no missing points inside it. Students reach for the curl test alone even when the field is undefined at a point the region surrounds: $\mathbf F=(-y/(x^2{+}y^2),\ x/(x^2{+}y^2),0)$ has $\operatorname{curl}\mathbf F=\mathbf 0$ everywhere it is defined, yet its circulation around the unit circle is $2\pi$, not zero — the domain excludes the origin, so curl-zero alone proves nothing there.
