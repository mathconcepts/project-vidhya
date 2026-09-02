---
id: ode-second-order-nonhomo.intuition
concept_id: ode-second-order-nonhomo
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

## Two Jobs, Added Together

Every solution of $ay''+by'+cy=f(x)$ splits into two separate jobs. The **homogeneous solution** $y_h$ (from setting $f(x)=0$) is the system's own free response — it carries the two arbitrary constants. The **particular solution** $y_p$ is any single function that satisfies the full equation with $f(x)$ present — no constants needed, since $y_h$ already supplies both. Add them: $y=y_h+y_p$.

Finding $y_p$ by **undetermined coefficients** means guessing a trial form that matches $f(x)$'s own "family" and solving for its coefficients:

| $f(x)$ | Trial $y_p$ |
|---|---|
| Polynomial, degree $n$ | Polynomial, degree $n$ |
| $e^{kx}$ | $Ae^{kx}$ |
| $\sin(kx)$ or $\cos(kx)$ | $A\cos(kx)+B\sin(kx)$ |

For $y''-y=x^2$: trial $y_p=Ax^2+Bx+C$. Substituting, $2A-(Ax^2+Bx+C)=x^2$ forces $A=-1,\,B=0,\,C=-2$, so $y_p=-x^2-2$ — a clean check by direct substitution, no guesswork about constants left over.

The one case the table above doesn't cover directly is when the trial form already solves the homogeneous equation — then the trial needs an extra factor of $x$ (or $x^2$ for a repeated homogeneous root), which is worth its own separate rule.
