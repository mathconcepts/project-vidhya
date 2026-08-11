# Teaching Tips: Bernoulli Equations

## Common Student Errors
- **Forgetting to identify $n$:** Students see a nonlinear term and don't recognize it as a Bernoulli equation. Always rewrite the ODE in standard form $\frac{dy}{dx} + P(x)y = Q(x)y^n$ to identify $n$.
- **Wrong substitution formula:** Many students use $v = y^n$ instead of $v = y^{1-n}$. Remember: the exponent in the substitution is $1 - n$, not $n$ itself. For $n = 2$, use $v = y^{-1}$.
- **Incorrectly applying the chain rule after substitution:** When $v = y^{1-n}$, differentiating gives $\frac{dv}{dx} = (1-n)y^{-n} \frac{dy}{dx}$, not $(1-n)y^{n-1} \frac{dy}{dx}$. Be careful with negative exponents.

## GATE Question Pattern
GATE Bernoulli questions typically present the ODE in non-standard form, requiring you to first rearrange it into the recognizable Bernoulli form. Common trick: the question might ask for a particular solution using an initial condition, or ask you to identify the form of the transformed linear ODE after substitution. Traps include equations that look Bernoulli but are actually separable, or equations where $n$ is fractional (e.g., $n = \frac{1}{2}$)—the substitution method still works for these.

## Speed Tricks for MCQs
- **Quick $n$ identification:** Immediately isolate the $y$-terms on the right side to read off $n$ directly. If the original equation is $\frac{dy}{dx} + P(x)y = Q(x)y^n$, scan for the highest power of $y$ on the right.
- **Substitution pattern:** Once $n$ is found, the substitution is mechanical: $v = y^{1-n}$, then $\frac{dy}{dx} = \frac{1}{1-n} y^n \frac{dv}{dx}$. Don't derive this every time—memorize the pattern.
- **Linear equation check:** After substitution, verify that your transformed ODE is indeed linear in $v$ (no products $v \cdot \frac{dv}{dx}$, no powers $v^2$). If it isn't, you made an error in the substitution.

## Must-Memorize Formulas / Results
- **Bernoulli standard form:** $\frac{dy}{dx} + P(x)y = Q(x)y^n$
- **Substitution rule:** $v = y^{1-n}$, which implies $\frac{dy}{dx} = \frac{1}{1-n} y^{-n} \frac{dv}{dx}$
- **Transformed linear ODE:** Multiply the original equation by $y^{-n}$ to obtain:
  $$y^{-n} \frac{dy}{dx} + P(x)y^{1-n} = Q(x)$$
  Then substitute $\frac{dv}{dx} = (1-n)y^{-n} \frac{dy}{dx}$ to get:
  $$\frac{1}{1-n} \frac{dv}{dx} + P(x)v = Q(x)$$
  or equivalently:
  $$\frac{dv}{dx} + (1-n)P(x)v = (1-n)Q(x)$$
- **Common values of $n$ in GATE:** $n = 2$ (quadratic) and $n = 3$ (cubic) are most frequent. Less common: $n = \frac{1}{2}$ (square root), $n = -1$ (reciprocal).
