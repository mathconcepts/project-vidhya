---
id: ode-bernoulli.common-traps
concept_id: ode-bernoulli
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting to identify $n$:** Students see a nonlinear term and don't recognize it as a Bernoulli equation. Always rewrite the ODE in standard form $\frac{dy}{dx} + P(x)y = Q(x)y^n$ to identify $n$.
- **Wrong substitution formula:** Many students use $v = y^n$ instead of $v = y^{1-n}$. Remember: the exponent in the substitution is $1 - n$, not $n$ itself. For $n = 2$, use $v = y^{-1}$.
- **Incorrectly applying the chain rule after substitution:** When $v = y^{1-n}$, differentiating gives $\frac{dv}{dx} = (1-n)y^{-n} \frac{dy}{dx}$, not $(1-n)y^{n-1} \frac{dy}{dx}$. Be careful with negative exponents.
