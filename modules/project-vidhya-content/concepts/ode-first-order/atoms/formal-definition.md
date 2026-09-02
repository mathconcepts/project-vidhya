---
id: ode-first-order.formal-definition
concept_id: ode-first-order
atom_type: formal_definition
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
---

**Standard First-Order ODE Form**: An equation of the form $\frac{dy}{dx} = f(x, y)$ where the derivative of $y$ with respect to $x$ depends on both $x$ and $y$. The solution $y(x)$ is a family of curves, each determined by an initial condition $y(x_0) = y_0$.

**Separable ODE** (most common): If the equation can be written as $\frac{dy}{dx} = g(x) h(y)$, separate variables:
$$\frac{dy}{h(y)} = g(x) \, dx$$
Integrate both sides to find the solution.

```interactive-spec
{
  "v": 1,
  "kind": "simulation",
  "title": "Solution curve: y' = −y  →  y(t) = e^(−t)",
  "x_expr": "t",
  "y_expr": "exp(-t)",
  "t_min": 0,
  "t_max": 4,
  "duration_sec": 5,
  "view_box": {"x_min": -0.2, "x_max": 4.2, "y_min": -0.05, "y_max": 1.1},
  "caption": "Watch the solution to dy/dt = −y trace out exponential decay. Changing the initial condition y(0) = C scales the curve up or down — the shape never changes."
}
```

**Method selector.** Reach for the integrating factor $\mu(x)=e^{\int P(x)\,dx}$ once the equation is confirmed linear ($y' + P(x)y = Q(x)$), not before. A tempting-but-wrong move is forcing separation of variables onto every first-order equation on sight: separation only works when the right side factors as $g(x)h(y)$, and $\frac{dy}{dx} + 2y = e^{-x}$ has no such factorization — the $-2y$ term never splits cleanly from the rest — so separation stalls while the integrating factor solves it in one pass.
