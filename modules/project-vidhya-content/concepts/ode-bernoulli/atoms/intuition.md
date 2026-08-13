---
id: ode-bernoulli-intuition
concept_id: ode-bernoulli
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Bernoulli ODE: Taming Nonlinearity

## The Problem

Most first-order ODE techniques assume the equation is linear in $y$. But real equations often have terms like $y^2$ or $y^3$. The **Bernoulli equation** is one specific nonlinear form that can always be converted to a linear ODE:

$$\frac{dy}{dx} + P(x)\,y = Q(x)\,y^n$$

where $n$ is any real number, $n \neq 0$ and $n \neq 1$.

## The Special Cases

| Value of $n$ | Type | What to do |
|---|---|---|
| $n = 0$ | Linear | Already linear: $y' + Py = Q$ |
| $n = 1$ | Separable | Rewrite as $y' + (P-Q)y = 0$ |
| $n \neq 0, 1$ | Bernoulli | Apply the substitution below |

## The Magic Substitution

Divide the Bernoulli equation by $y^n$:

$$y^{-n}\frac{dy}{dx} + P(x)\,y^{1-n} = Q(x)$$

Now set $v = y^{1-n}$. Then:

$$\frac{dv}{dx} = (1-n)\,y^{-n}\,\frac{dy}{dx}$$

So $y^{-n}\frac{dy}{dx} = \frac{1}{1-n}\frac{dv}{dx}$.

Substituting:

$$\frac{1}{1-n}\frac{dv}{dx} + P(x)\,v = Q(x)$$

$$\boxed{\frac{dv}{dx} + (1-n)P(x)\,v = (1-n)Q(x)}$$

This is a **linear first-order ODE in $v$** — solve with the integrating factor method, then recover $y = v^{1/(1-n)}$.

## The Recipe (5 Steps)

1. **Identify** $n$ from the power of $y$ on the right.
2. **Divide** by $y^n$ to expose $y^{-n}\,dy/dx$ and $y^{1-n}$.
3. **Substitute** $v = y^{1-n}$, replace $y^{-n}\,dy/dx$ with $\frac{1}{1-n}\frac{dv}{dx}$.
4. **Solve** the resulting linear ODE in $v$ using the integrating factor $e^{\int (1-n)P\,dx}$.
5. **Back-substitute** $v = y^{1-n}$ to express the answer in terms of $y$.

## Why This Works

The substitution $v = y^{1-n}$ is chosen precisely so that its derivative $\frac{dv}{dx} = (1-n)y^{-n}\frac{dy}{dx}$ matches the "residual" left after dividing by $y^n$. It is an algebraic trick, not guesswork — the exponent $1-n$ is the unique choice that linearizes the equation.

## Pattern Recognition for GATE

Look for the form $y' + (\text{something})\cdot y = (\text{something})\cdot y^n$:

- $\frac{dy}{dx} - y = xy^2 \to n=2$, substitute $v = y^{-1}$
- $\frac{dy}{dx} + \frac{y}{x} = x^2 y^3 \to n=3$, substitute $v = y^{-2}$
- $x\frac{dy}{dx} + y = y^{1/2} \to$ rearrange, then $n = 1/2$, substitute $v = y^{1/2}$

**Key sign alert:** Dividing by $y^n$ when $n > 1$ reverses the inequality for $y > 0$ solutions — keep track of sign restrictions.
