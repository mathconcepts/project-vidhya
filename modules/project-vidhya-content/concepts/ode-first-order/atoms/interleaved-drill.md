---
id: ode-first-order.interleaved-drill
concept_id: ode-first-order
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: ode-first-order → ode-bernoulli.**

$\dfrac{dy}{dx} + \dfrac{y}{x} = x\,y^2$.

**Question 1 (first-order recognition):** is this a linear first-order ODE as it stands?

*Answer:* No. Rewritten as $y' + \frac{1}{x}y = xy^2$, the right side carries $y^2$ — a power of the dependent variable multiplying an otherwise-linear left side. That's the Bernoulli signature ($Q(x)y^n$ with $n=2$), not the plain linear form $y'+Py=Q$; the ordinary integrating factor $e^{\int P\,dx}$ won't linearize it.

**Question 2 (Bernoulli method):** solve it.

*Answer:* Substitute $v = y^{1-n} = y^{-1}$, so $\frac{dv}{dx} = -y^{-2}\frac{dy}{dx}$. Dividing the original equation by $y^2$: $y^{-2}y' + \frac{1}{x}y^{-1} = x$, i.e. $-\frac{dv}{dx} + \frac{v}{x} = x$, so $\frac{dv}{dx} - \frac{v}{x} = -x$ — linear in $v$. Integrating factor $\mu = e^{\int -1/x\,dx} = \frac{1}{x}$ gives $\frac{d}{dx}\!\left(\frac{v}{x}\right) = -1$, so $\frac{v}{x} = -x + C$, i.e. $v = -x^2 + Cx$. Back-substituting $v = 1/y$: $y = \dfrac{1}{x(C-x)}$.

**Why this drill exists:** students often try to force the plain linear-ODE integrating factor onto any equation that "looks close" to $y'+Py=Q$, without first checking whether a power of $y$ sits on the right — that check is exactly what routes you to Bernoulli instead of a dead end.
