---
id: analytic-functions-worked-example
concept_id: analytic-functions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example — Verifying Analyticity of $f(z) = z^2$ (GATE Style)

## Problem

Show that $f(z) = z^2$ is analytic everywhere, and verify the Cauchy-Riemann equations.

---

## Step 1 — Write $f$ in Terms of $u$ and $v$

Let $z = x + iy$. Then:

$$f(z) = z^2 = (x + iy)^2 = x^2 - y^2 + 2ixy$$

So:

$$u(x,y) = x^2 - y^2, \qquad v(x,y) = 2xy$$

## Step 2 — Compute the Partial Derivatives

$$\frac{\partial u}{\partial x} = 2x, \qquad \frac{\partial v}{\partial y} = 2x$$

$$\frac{\partial u}{\partial y} = -2y, \qquad \frac{\partial v}{\partial x} = 2y$$

## Step 3 — Check the Cauchy-Riemann Equations

**First CR equation:**
$$\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y} \implies 2x = 2x \checkmark$$

**Second CR equation:**
$$\frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x} \implies -2y = -(2y) = -2y \checkmark$$

Both equations hold for **all** $(x, y) \in \mathbb{R}^2$, and the partial derivatives are continuous everywhere.

**Conclusion:** $f(z) = z^2$ is analytic everywhere — it is an entire function.

---

## Step 4 — Find the Derivative

Since the CR equations hold:

$$f'(z) = \frac{\partial u}{\partial x} + i\frac{\partial v}{\partial x} = 2x + i(2y) = 2(x + iy) = 2z$$

This matches the result from direct complex differentiation: $\dfrac{d}{dz}z^2 = 2z$. Consistent.

---

## Contrast: $g(z) = |z|^2$ is NOT Analytic

For $g = x^2 + y^2 + i\cdot 0$, we have $u = x^2 + y^2$, $v = 0$.

$$\frac{\partial u}{\partial x} = 2x, \quad \frac{\partial v}{\partial y} = 0$$

The first CR equation $2x = 0$ holds only on the line $x = 0$. So $g$ is not analytic at any point — it is **nowhere analytic**, even though it is continuous and real-differentiable everywhere.

---

## GATE Tip

When the problem says "find the analytic function $f = u + iv$ given $u$," use the CR equations to reconstruct $v$: integrate $\partial v/\partial y = \partial u/\partial x$ with respect to $y$, then fix the constant using $\partial v/\partial x = -\partial u/\partial y$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"For f(z) = e^z, write u and v in terms of x and y, then state ∂u/∂x.","hint":"e^z = e^(x+iy) = e^x · e^(iy) = e^x(cos y + i sin y). So u = e^x cos y and v = e^x sin y. Differentiate u with respect to x.","answer":"∂u/∂x = e^x cos y"},{"prompt":"Now verify the first Cauchy-Riemann equation ∂u/∂x = ∂v/∂y for e^z.","hint":"Compute ∂v/∂y = ∂(e^x sin y)/∂y = e^x cos y.","answer":"∂u/∂x = e^x cos y = ∂v/∂y ✓. The CR equation holds for all (x,y), confirming e^z is entire."}]}
```
