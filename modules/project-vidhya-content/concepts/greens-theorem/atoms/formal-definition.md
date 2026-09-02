---
id: greens-theorem.formal-definition
concept_id: greens-theorem
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Green's Theorem (Circulation-Curl Form)**: For a positively oriented (counterclockwise) simple closed curve $C$ bounding a region $D$ in the plane:
$$\oint_C P \, dx + Q \, dy = \iint_D \left(\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}\right) dA$$

The right-hand side is the integral of the $z$-component of curl (the "swirl density").

**Green's Theorem (Divergence-Flux Form)**: For the same curve and region:
$$\oint_C P \, dy - Q \, dx = \iint_D \left(\frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y}\right) dA$$

The right-hand side is the integral of divergence (the "expansion density"). Here, the line integral is taken with outward normal.

**Method selector.** Reach for Green's Theorem the moment $C$ is a simple closed curve bounding a planar region $D$ — trading the line integral for $\iint_D(\partial_xQ-\partial_yP)\,dA$ is almost always less arithmetic than parametrizing $C$ piece by piece, especially once $C$ has corners. Direct parametrization is the tempting alternative when $C$ looks easy (a circle, an ellipse), but it re-derives the whole integral by hand where Green's Theorem needs only two partial derivatives — and it is the only option left the instant $C$ is not simple (self-intersecting) or not closed, cases where Green's Theorem does not apply at all.
