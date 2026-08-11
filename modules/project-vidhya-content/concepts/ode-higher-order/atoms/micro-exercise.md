---
id: ode-higher-order.micro-exercise
concept_id: ode-higher-order
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Find the characteristic roots of $\frac{d^3y}{dx^3} - 6\frac{d^2y}{dx^2} + 11\frac{dy}{dx} - 6y = 0$.

- **(A)** $r = 1, 2, 3$
- **(B)** $r = -1, -2, -3$
- **(C)** $r = 0, 1, 2$
- **(D)** $r = 1, 2, 2$ (repeated)

<details>
<summary>Answer</summary>

**A**. The characteristic equation is:
$$r^3 - 6r^2 + 11r - 6 = 0$$

Try rational root theorem: possible rational roots are $\pm 1, \pm 2, \pm 3, \pm 6$.

Test $r = 1$:
$$1 - 6 + 11 - 6 = 0 \checkmark$$

Factor out $(r - 1)$:
$$r^3 - 6r^2 + 11r - 6 = (r - 1)(r^2 - 5r + 6)$$

Factor the quadratic:
$$r^2 - 5r + 6 = (r - 2)(r - 3)$$

So:
$$r^3 - 6r^2 + 11r - 6 = (r - 1)(r - 2)(r - 3) = 0$$

Roots: $r = 1, 2, 3$ (all distinct and real).

Geometrically, these represent three independent exponential growth rates.

</details>
