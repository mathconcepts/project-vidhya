---
id: divergence-curl.common-traps
concept_id: divergence-curl
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Curl zero, assumed conservative everywhere.** $\operatorname{curl}\mathbf F=\mathbf 0$ guarantees $\mathbf F$ is conservative only on a simply connected domain. A field undefined at one interior point (like $(-y,x)/(x^2+y^2)$) can have zero curl and still nonzero circulation around a loop enclosing that point.

**Trap 2 — Silently flipping the orientation sign.** 2D curl's sign depends on calling counterclockwise positive; writing the same rotation the other way around flips the sign of the answer without changing the physical spin at all.

**Trap 3 — Treating 2D curl as a vector.** $\partial Q/\partial x-\partial P/\partial y$ is a single scalar (the $z$-component of the full 3D curl), not a two-component vector — pairing it with an $x$- or $y$-component that doesn't exist is a unit-mismatch error.

**Trap 4 — Laplacian sign slip.** $\nabla^2\phi=\operatorname{div}(\nabla\phi)$, computed by differentiating $\phi$ **twice** in each variable and summing — not by squaring the gradient's components, which is a different, unrelated quantity.
