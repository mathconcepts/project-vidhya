---
id: root-finding.common-traps
concept_id: root-finding
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Sign error in Newton-Raphson**: Many students write $x_{n+1} = x_n + \frac{f(x_n)}{f'(x_n)}$ (plus instead of minus). The minus sign is critical: you move *toward* the root by subtracting the tangent intercept. Geometric check: if $f(x_n) > 0$, you move left; the formula must produce $x_{n+1} < x_n$.
- **Confusing convergence rates**: Bisection is linear (each iteration halves the interval), Newton-Raphson is quadratic (error squares each iteration—why it's faster). Students often memorize "Newton is faster" without understanding that quadratic vs. linear is a *huge* difference: after 10 iterations, bisection error is $10^{-3}$, but Newton-Raphson error is $10^{-1024}$.
- **Assuming $f'(x) \neq 0$ everywhere**: Newton-Raphson fails spectacularly at multiple roots (where $f'(r) = 0$). Question might ask "which method is safer?" and the answer is bisection (no derivative needed, no division-by-zero risk).
