---
id: calculus-derivatives.formal-definition
concept_id: calculus-derivatives
atom_type: formal_definition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

The derivative of $f$ at a point $a$ is:

$$
f'(a) = \lim_{h \to 0} \frac{f(a+h) - f(a)}{h}
$$

when this limit exists. The expression $\frac{f(a+h) - f(a)}{h}$ is the slope of the secant line between $(a, f(a))$ and $(a+h, f(a+h))$; the limit as $h \to 0$ is the slope of the tangent line at $a$.

A function is **differentiable** at $a$ if this limit exists. It is **differentiable on an interval** if it is differentiable at every point in the interval.

**Core rules:**

- $\frac{d}{dx}(c) = 0$ — constants vanish
- $\frac{d}{dx}(x^n) = n \cdot x^{n-1}$ — power rule
- $(f+g)' = f' + g'$ — sum rule
- $(fg)' = f'g + fg'$ — product rule
- $(f(g(x)))' = f'(g(x)) \cdot g'(x)$ — chain rule
