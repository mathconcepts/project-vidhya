---
id: root-finding.formal-definition
concept_id: root-finding
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Bisection**: given $f(a)f(b)<0$ and $f$ continuous, set $c=(a+b)/2$; replace $a$ or $b$ with $c$ so the sign change is retained. Converges linearly: $|e_{n+1}|\le|e_n|/2$.

**Newton-Raphson**: from a guess $x_n$,

$$x_{n+1}=x_n-\frac{f(x_n)}{f'(x_n)}$$

Converges quadratically, $|e_{n+1}|\approx C|e_n|^2$, when $x^*$ is a simple root, $f'(x^*)\neq0$, and $x_0$ is close enough.

**Method Selector.** Reach for Newton-Raphson when $f$ is differentiable, $f'$ is cheap to evaluate, and you already have a guess close to a single simple root — not the **secant method**, which a student picks to "avoid computing $f'$" but which only reaches order $\approx1.618$ and needs two starting values instead of one, converging slower for the same work whenever $f'$ was available anyway.
