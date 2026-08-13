---
id: ode-bernoulli-visual-analogy
concept_id: ode-bernoulli
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Taming a Wild Equation: The Domestication Analogy

## The Wild Beast

A Bernoulli ODE is like a wild animal: powerful and untamed. The $y^n$ term on the right makes it **nonlinear** — standard linear tools (integrating factor, superposition) do not apply directly.

$$\underbrace{\frac{dy}{dx} + P(x)\,y}_{\text{familiar linear part}} = \underbrace{Q(x)\,y^n}_{\text{wild nonlinear term}}$$

## The Domestication: Substitution $v = y^{1-n}$

The substitution $v = y^{1-n}$ is the "leash" that domesticates the wild equation. After dividing by $y^n$ and substituting, the Bernoulli becomes:

$$\frac{dv}{dx} + \underbrace{(1-n)P(x)}_{\text{new }P^*(x)}\,v = \underbrace{(1-n)Q(x)}_{\text{new }Q^*(x)}$$

A perfectly tame **linear ODE** in $v$ — one you already know how to solve.

## The Logistic Equation: Bernoulli in Disguise

Population growth with carrying capacity follows:

$$\frac{dP}{dt} = rP\left(1 - \frac{P}{K}\right) = rP - \frac{r}{K}P^2$$

Rearranging: $\frac{dP}{dt} - rP = -\frac{r}{K}P^2$ — a Bernoulli equation with $n = 2$.

Substituting $v = P^{-1}$ (since $1-n = -1$) yields a linear ODE in $v$, whose solution back-substituted gives the famous **logistic curve**:

$$P(t) = \frac{K}{1 + \left(\frac{K}{P_0} - 1\right)e^{-rt}}$$

```gif-scene
{
  "type": "function-trace",
  "expression": "1 / (1 + exp(-x))",
  "x_range": [-6, 6],
  "y_range": [0, 1.2],
  "label": "Logistic curve — Bernoulli ODE solution"
}
```

The logistic curve starts slow, accelerates through the midpoint, then saturates at the carrying capacity $K$ (here $K = 1$). This S-shape is the universal signature of Bernoulli $n=2$ solutions with a positive equilibrium.

## The Substitution as a Change of Variable

| Original variable | Transformed variable | Relationship |
|---|---|---|
| $y$ (nonlinear unknown) | $v$ (linear unknown) | $v = y^{1-n}$ |
| $\frac{dy}{dx}$ | $\frac{dv}{dx}$ | $\frac{dv}{dx} = (1-n)y^{-n}\frac{dy}{dx}$ |
| $y^n$ on right side | absorbed into $v$ | Division by $y^n$ kills the nonlinearity |

Think of it as a **lens change**: the nonlinear world, viewed through the $v = y^{1-n}$ lens, looks perfectly linear.

## Back-Substitution: Undomesticate Carefully

After solving for $v(x)$, recover $y$ via $y = v^{1/(1-n)}$. This is the final step where students lose marks in GATE — always state the answer in terms of the original variable $y$, not $v$.

**Common back-substitution errors:**

| $n$ | $v = y^{1-n}$ | $y$ in terms of $v$ |
|---|---|---|
| $2$ | $v = y^{-1}$ | $y = v^{-1} = 1/v$ |
| $3$ | $v = y^{-2}$ | $y = v^{-1/2} = 1/\sqrt{v}$ |
| $1/2$ | $v = y^{1/2}$ | $y = v^2$ |

Always write the final answer in $y$ and $x$ only.
