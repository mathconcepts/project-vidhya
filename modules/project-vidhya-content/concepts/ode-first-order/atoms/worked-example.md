---
id: ode-first-order-worked-example
concept_id: ode-first-order
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Solve $\dfrac{dy}{dx} + 2y = e^{-x}$

This is a **linear first-order ODE** — the standard GATE format.

---

## Step 1: Identify the Type and Standard Form

The equation is already in standard form:

$$\frac{dy}{dx} + \underbrace{P(x)}_{2}\,y = \underbrace{Q(x)}_{e^{-x}}$$

$P(x) = 2$ (constant), $Q(x) = e^{-x}$.

---

## Step 2: Find the Integrating Factor

$$\mu(x) = e^{\int P(x)\,dx} = e^{\int 2\,dx} = e^{2x}$$

No constant of integration is needed here (it cancels out later anyway).

---

## Step 3: Multiply Both Sides by $\mu(x)$

$$e^{2x}\frac{dy}{dx} + 2e^{2x}y = e^{2x}\cdot e^{-x} = e^x$$

The left side is now a **perfect derivative**:

$$\frac{d}{dx}\!\left(e^{2x}y\right) = e^x$$

---

## Step 4: Integrate Both Sides

$$e^{2x}\,y = \int e^x\,dx = e^x + C$$

---

## Step 5: Solve for $y$

$$y = \frac{e^x + C}{e^{2x}} = e^{-x} + Ce^{-2x}$$

$$\boxed{y(x) = e^{-x} + Ce^{-2x}}$$

---

## Step 6: Check the Answer

Substitute back into the original ODE:

$$\frac{dy}{dx} = -e^{-x} - 2Ce^{-2x}$$

$$\frac{dy}{dx} + 2y = \left(-e^{-x} - 2Ce^{-2x}\right) + 2\left(e^{-x} + Ce^{-2x}\right)$$

$$= -e^{-x} - 2Ce^{-2x} + 2e^{-x} + 2Ce^{-2x} = e^{-x} \checkmark$$

---

## GATE Variant: Apply an Initial Condition

If $y(0) = 2$, find $C$:

$$y(0) = e^0 + Ce^0 = 1 + C = 2 \implies C = 1$$

**Particular solution:** $y(x) = e^{-x} + e^{-2x}$.

---

## Bonus: Separable ODE

Solve $\frac{dy}{dx} = \frac{x}{y}$ with $y(0) = 3$.

**Separate variables:**

$$y\,dy = x\,dx$$

**Integrate:**

$$\frac{y^2}{2} = \frac{x^2}{2} + C_1 \implies y^2 = x^2 + C$$

**Apply IC** ($y(0) = 3$):

$$9 = 0 + C \implies C = 9$$

$$\boxed{y = \sqrt{x^2 + 9}} \quad (y > 0)$$

---

## GATE Traps to Avoid

| Trap | Correct approach |
|---|---|
| Using $e^{\int P\,dx}$ when equation isn't in standard form | Rearrange to $dy/dx + P(x)y = Q(x)$ **first** |
| Adding $+C$ inside the exponent when computing $\mu$ | Omit $C$ in integrating factor (it cancels) |
| Forgetting $C$ when integrating the right side | Always write $+C$ after integrating |
| Stopping at implicit form | Solve for $y$ explicitly unless told otherwise |

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"Identify $P(x)$ and $Q(x)$ for the ODE $\\\\dfrac{dy}{dx} - 3y = x^2$.","hint":"Rewrite in standard form $\\\\dfrac{dy}{dx} + P(x)y = Q(x)$ and read off the coefficients.","answer":"$P(x) = -3$ and $Q(x) = x^2$. (Note the sign: the equation has $-3y$, so $P = -3$, not $+3$.)"},{"prompt":"For $\\\\dfrac{dy}{dx} + 2y = e^{-x}$, what is the integrating factor $\\\\mu(x)$?","hint":"Compute $e^{\\\\int P(x)\\\\,dx}$ where $P(x) = 2$.","answer":"$\\\\mu(x) = e^{\\\\int 2\\\\,dx} = e^{2x}$."},{"prompt":"After multiplying by $\\\\mu = e^{2x}$, the left side becomes $\\\\dfrac{d}{dx}(e^{2x}y)$. Integrate both sides and solve for $y$.","hint":"The right side is $e^{2x}\\\\cdot e^{-x} = e^x$. Integrate $e^x$ to get $e^x + C$.","answer":"$e^{2x}y = e^x + C$, so $y = e^{-x} + Ce^{-2x}$."}]}
```
