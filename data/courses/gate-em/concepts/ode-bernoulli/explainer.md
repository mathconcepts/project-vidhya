# Bernoulli Equations
> GATE Engineering Mathematics | Differential Equations | medium frequency | difficulty: 0.5

## Intuition First
A Bernoulli equation looks almost linear, but has a nonlinear "twist"—a power of $y$ multiplying one term. The trick is a substitution that transforms this nonlinear problem into a disguised linear one.

## Core Definition
**Bernoulli Equation Standard Form**: An equation of the form
$$\frac{dy}{dx} + P(x)y = Q(x)y^n$$
where $n \neq 0, 1$. When $n = 0$ or $n = 1$, this reduces to a linear ODE.

**Solution Method**: Make the substitution $v = y^{1-n}$, which transforms the equation into a linear ODE in $v$:
$$\frac{dv}{dx} + (1-n)P(x)v = (1-n)Q(x)$$
Solve this linear ODE, then back-substitute to recover $y$.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider $\frac{dy}{dx} + 2xy = xy^2$ with initial condition $y(0) = 1$.

**Step 1:** Identify $n = 2$, $P(x) = 2x$, $Q(x) = x$. Make substitution $v = y^{1-2} = y^{-1}$, so $y = \frac{1}{v}$.

**Step 2:** Differentiate $y = v^{-1}$ with respect to $x$:
$$\frac{dy}{dx} = -v^{-2} \frac{dv}{dx}$$

**Step 3:** Substitute into the original equation:
$$-v^{-2} \frac{dv}{dx} + 2x \cdot v^{-1} = x \cdot v^{-2}$$

**Step 4:** Multiply through by $-v^2$:
$$\frac{dv}{dx} - 2xv = -x$$
$$\frac{dv}{dx} + (-2x)v = -x$$

This is now a linear ODE with $P(x) = -2x$ and $Q(x) = -x$.

**Step 5:** Solve using integrating factor:
$$\mu(x) = e^{\int -2x \, dx} = e^{-x^2}$$

Multiply both sides by $\mu(x)$:
$$e^{-x^2} \frac{dv}{dx} - 2xe^{-x^2} v = -x e^{-x^2}$$
$$\frac{d}{dx}(e^{-x^2} v) = -x e^{-x^2}$$

**Step 6:** Integrate both sides. Note that $\int -x e^{-x^2} dx = \frac{1}{2} e^{-x^2} + C$:
$$e^{-x^2} v = \frac{1}{2} e^{-x^2} + C$$
$$v = \frac{1}{2} + Ce^{x^2}$$

**Step 7:** Back-substitute $v = y^{-1}$:
$$y^{-1} = \frac{1}{2} + Ce^{x^2}$$
$$y = \frac{1}{\frac{1}{2} + Ce^{x^2}} = \frac{2}{1 + 2Ce^{x^2}}$$

**Step 8:** Apply initial condition $y(0) = 1$:
$$1 = \frac{2}{1 + 2C}$$
$$1 + 2C = 2$$
$$C = \frac{1}{2}$$

**Final Solution:** $y = \frac{2}{1 + e^{x^2}}$

Label: "**Why it works:**"
The substitution $v = y^{1-n}$ linearizes the Bernoulli equation because the power $y^n$ term transforms into a power of $v$ that cancels out the nonlinear coupling. The result is a recognizable linear form in $v$, which we can solve with standard techniques (integrating factor), then recover $y$ by inverting the substitution.

## GATE MA Relevance
> **Why it matters in GATE MA:** Bernoulli equations appear in ~5-7% of GATE MA questions (2-4 marks). A typical question provides a Bernoulli ODE and asks for the general solution or a particular solution via initial condition. The core skill is recognizing the Bernoulli form and applying the substitution correctly—many students miss the pattern and waste time trying to separate variables (which doesn't work for Bernoulli).
