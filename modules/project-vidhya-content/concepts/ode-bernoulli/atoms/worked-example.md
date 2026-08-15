---
id: ode-bernoulli-worked-example
concept_id: ode-bernoulli
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Solve $\dfrac{dy}{dx} - y = xy^2$

This is a classic GATE-style Bernoulli ODE with $n = 2$.

---

## Step 1: Identify the Bernoulli Structure

Write in standard form $\frac{dy}{dx} + P(x)y = Q(x)y^n$:

$$\frac{dy}{dx} + \underbrace{(-1)}_{P(x)}\,y = \underbrace{x}_{Q(x)}\,y^{\,\underbrace{2}_{n}}$$

- $P(x) = -1$, $Q(x) = x$, $n = 2$.
- Since $n \neq 0, 1$: Bernoulli substitution required.

---

## Step 2: Divide by $y^n = y^2$

$$y^{-2}\frac{dy}{dx} - y^{-1} = x$$

---

## Step 3: Substitute $v = y^{1-n} = y^{-1}$

Note that $\frac{dv}{dx} = -y^{-2}\frac{dy}{dx}$, so $y^{-2}\frac{dy}{dx} = -\frac{dv}{dx}$.

Substituting into the divided equation:

$$-\frac{dv}{dx} - v = x$$

Multiply through by $-1$:

$$\frac{dv}{dx} + v = -x$$

This is a **linear ODE in $v$** with $P^*(x) = 1$ and $Q^*(x) = -x$.

---

## Step 4: Solve the Linear ODE

**Integrating factor:** $\mu = e^{\int 1\,dx} = e^x$

**Multiply both sides by $e^x$:**

$$e^x\frac{dv}{dx} + e^x v = -xe^x$$

$$\frac{d}{dx}(e^x v) = -xe^x$$

**Integrate the right side** (integration by parts: $\int xe^x\,dx = xe^x - e^x$):

$$e^x v = -\int xe^x\,dx = -(xe^x - e^x) + C = e^x - xe^x + C$$

$$v = 1 - x + Ce^{-x}$$

---

## Step 5: Back-Substitute $v = y^{-1} = 1/y$

$$\frac{1}{y} = 1 - x + Ce^{-x}$$

$$\boxed{y(x) = \frac{1}{1 - x + Ce^{-x}}}$$

---

## Step 6: Verify

From $\frac{1}{y} = 1 - x + Ce^{-x}$, differentiate both sides with respect to $x$:

$$-\frac{1}{y^2}\frac{dy}{dx} = -1 - Ce^{-x}$$

$$\frac{dy}{dx} = y^2(1 + Ce^{-x})$$

Now check $\frac{dy}{dx} - y = xy^2$:

$$y^2(1 + Ce^{-x}) - y \stackrel{?}{=} xy^2$$

Note $1 + Ce^{-x} = (1-x+Ce^{-x}) + x = \frac{1}{y} + x$, so:

$$y^2\left(\frac{1}{y} + x\right) - y = y + xy^2 - y = xy^2 \checkmark$$

---

## GATE Variant: Apply Initial Condition $y(0) = 1$

$$\frac{1}{1} = 1 - 0 + C e^0 \implies 1 = 1 + C \implies C = 0$$

**Particular solution:** $y(x) = \dfrac{1}{1-x}$ (valid for $x < 1$).

---

## Summary: The Bernoulli Recipe

| Step | Action | Formula |
|---|---|---|
| 1 | Read off $n$ | right-side power of $y$ |
| 2 | Divide by $y^n$ | exposes $y^{-n}dy/dx$ and $y^{1-n}$ |
| 3 | Set $v = y^{1-n}$ | so $dv/dx = (1-n)y^{-n}dy/dx$ |
| 4 | Solve linear ODE | integrating factor $e^{\int(1-n)P\,dx}$ |
| 5 | Back-substitute | $y = v^{1/(1-n)}$ |

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving the Bernoulli ODE dy/dx − y = xy²","steps":[{"prompt":"For $\\\\dfrac{dy}{dx} - y = xy^2$, identify $n$, $P(x)$, and $Q(x)$.","hint":"Write in standard form $y' + P(x)y = Q(x)y^n$ and match each part.","answer":"$n = 2$, $P(x) = -1$, $Q(x) = x$. The equation is $y' + (-1)y = x \\\\cdot y^2$."},{"prompt":"What substitution do you make, and how does $y^{-2}\\\\dfrac{dy}{dx}$ transform?","hint":"Set $v = y^{1-n} = y^{-1}$. Differentiate both sides with respect to $x$.","answer":"$v = y^{-1}$, so $\\\\frac{dv}{dx} = -y^{-2}\\\\frac{dy}{dx}$, meaning $y^{-2}\\\\frac{dy}{dx} = -\\\\frac{dv}{dx}$. The Bernoulli becomes $\\\\frac{dv}{dx} + v = -x$."},{"prompt":"After solving for $v = 1 - x + Ce^{-x}$, write the final answer for $y(x)$ and then find $C$ if $y(0) = 1$.","hint":"Recall $v = 1/y$, so $y = 1/v$. Substitute $x=0$, $y=1$ into the general solution.","answer":"$y(x) = \\\\dfrac{1}{1 - x + Ce^{-x}}$. With $y(0)=1$: $1 = 1/(1+C)$, so $C = 0$ and $y = \\\\dfrac{1}{1-x}$."}]}
```
