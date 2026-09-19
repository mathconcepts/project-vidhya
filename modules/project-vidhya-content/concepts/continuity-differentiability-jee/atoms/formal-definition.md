---
id: continuity-differentiability-jee.formal-definition
concept_id: continuity-differentiability-jee
atom_type: formal_definition
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
---

**Continuity at a point**: $f$ is continuous at $x=a$ if $\displaystyle\lim_{x\to a}f(x)=f(a)$ — equivalently, the left-hand limit, the right-hand limit, and $f(a)$ all agree.

**Continuity on an interval**: $f$ is continuous on $(a,b)$ if it is continuous at every point of $(a,b)$; on a closed interval $[a,b]$, continuity at the endpoints only requires the one-sided limit that stays inside the interval.

**Differentiability at a point**: $f$ is differentiable at $x=a$ if $\displaystyle f'(a)=\lim_{h\to0}\frac{f(a+h)-f(a)}{h}$ exists — equivalently, the left-hand derivative and right-hand derivative agree and are finite.

**Key one-way implication**: differentiable at $a$ $\Rightarrow$ continuous at $a$. The converse is false — $f(x)=|x|$ is continuous at $x=0$ but not differentiable there.

**Chain rule**: for $y=f(g(x))$, $\dfrac{dy}{dx}=f'(g(x))\cdot g'(x)$ — the outer function's derivative, evaluated at $g(x)$, times the inner function's derivative.

**Implicit differentiation**: given an equation in $x$ and $y$ with no explicit $y=\ldots$ form, differentiate both sides with respect to $x$, treating $y$ as a function of $x$ (so every term containing $y$ picks up a factor of $\dfrac{dy}{dx}$ by the chain rule), then solve for $\dfrac{dy}{dx}$.

**Parametric differentiation**: if $x=x(t)$ and $y=y(t)$, then $\dfrac{dy}{dx}=\dfrac{dy/dt}{dx/dt}$, provided $\dfrac{dx}{dt}\neq0$.

**Derivative of an inverse function**: if $y=f^{-1}(x)$, then $\dfrac{dy}{dx}=\dfrac{1}{f'(y)}$, provided $f'(y)\neq0$ — the derivative is expressed in terms of $y$, the inverse function's own output, not $x$.
