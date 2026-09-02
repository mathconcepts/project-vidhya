---
id: ode-classification.interleaved-drill
concept_id: ode-classification
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: ode-classification → ode-first-order.**

$\dfrac{dy}{dx} - \dfrac{y}{x} = x^2$.

**Question 1 (classification):** classify this equation before touching a solving method.

*Answer:* Order $=1$ (only $y'$ appears). It's already polynomial in $y'$, and the highest-order derivative appears to the power $1$, so degree $=1$. Rewritten as $\frac{dy}{dx} + \left(-\frac{1}{x}\right)y = x^2$, it matches $y' + P(x)y = Q(x)$ with every coefficient a function of $x$ alone and $y$, $y'$ each to the first power — **linear**.

**Question 2 (first-order method):** now solve it.

*Answer:* Linear first-order, so use the integrating factor $\mu(x) = e^{\int -\frac{1}{x}\,dx} = e^{-\ln x} = \frac{1}{x}$. Multiplying through: $\frac{d}{dx}\!\left(\frac{y}{x}\right) = x$, so $\frac{y}{x} = \frac{x^2}{2} + C$, giving $y = \frac{x^3}{2} + Cx$.

**Why this drill exists:** classification isn't a separate, disposable step — the linearity verdict from Question 1 is *exactly* what licenses the integrating-factor method in Question 2. Skip classification, and you can't justify which first-order technique even applies.
