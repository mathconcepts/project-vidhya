---
id: mean-value-theorems.micro-exercise
concept_id: mean-value-theorems
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Apply Rolle's Theorem to $f(x) = x^3 - 3x$ on $[-\sqrt{3}, \sqrt{3}]$ and find the point $c$ where $f'(c) = 0$.

- **(A)** $c = 0$ only
- **(B)** $c = \pm 1$
- **(C)** $c = \pm 1$ and $c = 0$
- **(D)** Rolle's Theorem does not apply

<details>
<summary>Answer</summary>

**B**. Check Rolle's conditions:
- $f$ is continuous on $[-\sqrt{3}, \sqrt{3}]$ ✓
- $f$ is differentiable on $(-\sqrt{3}, \sqrt{3})$ ✓
- $f(-\sqrt{3}) = -3\sqrt{3} + 3\sqrt{3} = 0$ and $f(\sqrt{3}) = 3\sqrt{3} - 3\sqrt{3} = 0$ ✓

Rolle's Theorem applies. Find $c$ where $f'(c) = 0$:
$$f'(x) = 3x^2 - 3 = 3(x^2 - 1) = 0 \Rightarrow x = \pm 1$$

Both $x = -1$ and $x = 1$ are in $(-\sqrt{3}, \sqrt{3})$ ✓

</details>
