---
id: continuity.micro-exercise
concept_id: continuity
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

At $x = 2$, the function $f(x) = \frac{x^2 - 4}{x - 2}$ is:

- **(A)** Continuous
- **(B)** Discontinuous with a removable discontinuity
- **(C)** Discontinuous with a jump discontinuity
- **(D)** Discontinuous with an infinite discontinuity

<details>
<summary>Answer</summary>

**B**. At $x = 2$, the function is undefined (gives $0/0$). However:
$$\lim_{x \to 2} \frac{x^2 - 4}{x - 2} = \lim_{x \to 2} \frac{(x-2)(x+2)}{x-2} = \lim_{x \to 2} (x+2) = 4$$

The limit exists and equals $4$. This is a **removable discontinuity** because we can redefine $f(2) = 4$ to make the function continuous.

Note: The original function $f(2)$ is undefined, so the three conditions for continuity are not satisfied. But the discontinuity can be removed by redefining the function.

</details>
