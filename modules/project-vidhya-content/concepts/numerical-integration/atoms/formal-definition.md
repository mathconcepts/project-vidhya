---
id: numerical-integration.formal-definition
concept_id: numerical-integration
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Simpson's 1/3 rule.** For $f$ on $[a,b]$ split into an even number $n$ of equal subintervals of width $h=(b-a)/n$,

$$\int_a^b f(x)\,dx\approx\frac{h}{3}\Bigl[f(x_0)+4f(x_1)+2f(x_2)+4f(x_3)+\cdots+4f(x_{n-1})+f(x_n)\Bigr]$$

fitting a parabola through each group of three consecutive nodes. Global error is $O(h^4)$, specifically $-\frac{(b-a)h^4}{180}f^{(4)}(\xi)$ for some $\xi\in(a,b)$.

**Method Selector.** Reach for Simpson's rule whenever $n$ can be made even and $f$ behaves smoothly on $[a,b]$ — not the trapezoidal rule, which a student defaults to out of habit even though it costs the *same* function evaluations for the same $h$, yet only achieves $O(h^2)$ instead of Simpson's $O(h^4)$.
