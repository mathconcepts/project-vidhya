---
id: limits.micro-exercise
concept_id: limits
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

$\lim_{x \to 0} \frac{\sin(x)}{x} = $

- **(A)** $0$
- **(B)** $1$
- **(C)** $\pi$
- **(D)** Does not exist

<details>
<summary>Answer</summary>

**B**. This is a standard indeterminate form $0/0$.

Using **L'Hôpital's rule** (differentiate numerator and denominator):
$$\lim_{x \to 0} \frac{\sin(x)}{x} = \lim_{x \to 0} \frac{\cos(x)}{1} = \frac{\cos(0)}{1} = 1$$

Alternatively, this is a **fundamental limit** that must be memorized:
$$\lim_{x \to 0} \frac{\sin(x)}{x} = 1$$

This limit is crucial in calculus and appears frequently in GATE.

</details>
