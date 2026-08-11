---
id: differentiability.micro-exercise
concept_id: differentiability
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Which function is NOT differentiable at $x = 0$?

- **(A)** $f(x) = x^2$
- **(B)** $f(x) = x^3$
- **(C)** $f(x) = |x|$
- **(D)** $f(x) = \sin(x)$

<details>
<summary>Answer</summary>

**C**. Check each function:

A) $f(x) = x^2$: $f'(x) = 2x$, so $f'(0) = 0$ exists. Differentiable.

B) $f(x) = x^3$: $f'(x) = 3x^2$, so $f'(0) = 0$ exists. Differentiable.

C) $f(x) = |x|$: 
- Right derivative: $\lim_{h \to 0^+} \frac{|h|}{h} = \lim_{h \to 0^+} \frac{h}{h} = 1$
- Left derivative: $\lim_{h \to 0^-} \frac{|h|}{h} = \lim_{h \to 0^-} \frac{-h}{h} = -1$
- One-sided derivatives exist but are different. NOT differentiable at $x = 0$.

D) $f(x) = \sin(x)$: $f'(x) = \cos(x)$, so $f'(0) = \cos(0) = 1$ exists. Differentiable.

</details>
