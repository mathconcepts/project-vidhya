---
id: ode-bernoulli.formal-definition
concept_id: ode-bernoulli
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Bernoulli Equation Standard Form**: An equation of the form
$$\frac{dy}{dx} + P(x)y = Q(x)y^n$$
where $n \neq 0, 1$. When $n = 0$ or $n = 1$, this reduces to a linear ODE.

**Solution Method**: Make the substitution $v = y^{1-n}$, which transforms the equation into a linear ODE in $v$:
$$\frac{dv}{dx} + (1-n)P(x)v = (1-n)Q(x)$$
Solve this linear ODE, then back-substitute to recover $y$.
