---
id: analytic-functions.formal-definition
concept_id: analytic-functions
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

A complex function $f(z) = u(x, y) + iv(x, y)$ is **analytic** in a region $D$ if it is differentiable at every point in $D$. This is equivalent to the **Cauchy-Riemann equations** holding:

$$\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y} \quad \text{and} \quad \frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$$

When these hold and all partial derivatives are continuous, the complex derivative exists and equals:
$$f'(z) = \frac{\partial u}{\partial x} + i\frac{\partial v}{\partial x}$$

**Which test applies.** Use the Cauchy-Riemann equations, with continuity of the partials, whenever you're asked to confirm analyticity of an explicit $u+iv$ split — not the tempting shortcut "$u$ and $v$ are each individually smooth everywhere, so $f$ must be analytic." That shortcut fails: $g(z)=|z|^2$ has $u=x^2+y^2$, $v=0$, both continuously differentiable at every point of $\mathbb{R}^2$, yet CR forces $u_x=2x=v_y=0$, true only at the origin — $g$ is analytic nowhere despite both real pieces being perfectly smooth. Smoothness of $u,v$ separately says nothing about the relationship CR demands between them.
