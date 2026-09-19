---
id: applications-of-derivatives.common-traps
concept_id: applications-of-derivatives
atom_type: common_traps
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

- **Sign-flip errors when factoring $f'(x)$:** getting $f'(x)=3(x-3)(x+1)$ right but reading off the increasing interval as $(-3,1)$ or $(-1,3)$ instead of checking the sign of the product directly. A parabola opening upward is positive *outside* its roots, not between them.
- **Second derivative test used when $f''(c)=0$:** declaring "no extremum" the moment $f''(c)=0$. This case is inconclusive, not a "no" — fall back to the first derivative test (check the sign of $f'$ on either side of $c$) instead of guessing.
- **Forgetting the horizontal-tangent, vertical-normal case:** at a critical point where $f'(x_0)=0$, the normal's slope formula $-\dfrac{1}{f'(x_0)}$ divides by zero. The correct pair there is the horizontal tangent $y=f(x_0)$ and the vertical normal $x=x_0$, not "undefined."
- **Skipping the differentiability check for Rolle's/LMVT:** verifying $f(a)=f(b)$ (for Rolle's) and stopping, without checking $f$ is actually differentiable on the *whole* open interval. A corner anywhere inside $(a,b)$ — even with matching endpoint values — breaks the guarantee entirely.
- **Ignoring closed-interval endpoints in optimisation:** finding critical points via $f'(x)=0$ and reporting the largest one found as the global maximum, without also checking the function's value at the interval's endpoints. On a closed interval, the true global maximum or minimum can sit at an endpoint even when it is not a critical point at all.
