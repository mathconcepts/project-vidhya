---
id: ode-first-order-intuition
concept_id: ode-first-order
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# First-Order ODEs: The Big Picture

A **first-order ODE** has the form $\frac{dy}{dx} = f(x, y)$ — it relates a function $y(x)$ to its own derivative. The solution is a **family of curves** (one per initial condition) whose slope at every point $(x, y)$ matches $f(x, y)$.

## The Three Types You Must Know for GATE

### Type 1: Separable

$$\frac{dy}{dx} = g(x)\,h(y)$$

**Strategy:** Divide both sides by $h(y)$ and integrate:

$$\int \frac{dy}{h(y)} = \int g(x)\,dx + C$$

**Identify:** The right-hand side factors into a product (or ratio) of a function of $x$ alone and a function of $y$ alone.

### Type 2: Linear First-Order

$$\frac{dy}{dx} + P(x)\,y = Q(x)$$

**Strategy:** Multiply through by the **integrating factor** $\mu(x) = e^{\int P(x)\,dx}$:

$$\frac{d}{dx}\left[\mu(x)\,y\right] = \mu(x)\,Q(x)$$

Then integrate both sides directly.

**Identify:** $y$ and $dy/dx$ appear linearly (no $y^2$, $\sin y$, etc.); right side depends only on $x$.

### Type 3: Exact

$$M(x,y)\,dx + N(x,y)\,dy = 0$$

**Strategy:** Check $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$. If exact, find $F(x,y)$ such that $\frac{\partial F}{\partial x} = M$ and $\frac{\partial F}{\partial y} = N$; solution is $F(x,y) = C$.

**Identify:** Look for a condition to check rather than a visible structure.

## The Type-First Rule

> **Always identify the type before solving.** Applying the wrong method costs GATE marks.

Decision tree:

```
Is dy/dx = g(x)·h(y)?      → Separable
Is it dy/dx + P(x)y = Q(x)?  → Linear (integrating factor)
Is ∂M/∂y = ∂N/∂x?           → Exact
Otherwise                    → Check for Bernoulli or substitution
```

## Integrating Factor at a Glance

For $\frac{dy}{dx} + P(x)y = Q(x)$:

| Step | Action |
|---|---|
| 1 | Compute $\mu = e^{\int P\,dx}$ (no constant needed here) |
| 2 | Multiply entire equation by $\mu$ |
| 3 | Left side becomes $\frac{d}{dx}(\mu y)$ |
| 4 | Integrate: $\mu y = \int \mu Q\,dx + C$ |
| 5 | Divide by $\mu$ to isolate $y$ |

## General vs Particular Solution

- **General solution:** contains arbitrary constant $C$; represents the full family.
- **Particular solution:** $C$ is fixed by an initial condition $y(x_0) = y_0$.

Always state the general solution first in GATE problems, then apply the initial condition if given.
