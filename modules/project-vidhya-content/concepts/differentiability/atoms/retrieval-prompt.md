---
id: differentiability.retrieval-prompt
concept_id: differentiability
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

The function $f(x) = \begin{cases} x^2 & \text{if } x \leq 1 \\ ax + b & \text{if } x > 1 \end{cases}$ is differentiable everywhere if:

- **(A)** $a = 2, b = 1$
- **(B)** $a = 2, b = -1$
- **(C)** $a = 1, b = 0$
- **(D)** $a = -1, b = 2$

<details>
<summary>Answer</summary>

**B**. For differentiability everywhere, $f$ must be:
1. **Continuous at $x = 1$**
2. **Differentiable at $x = 1$** (left and right derivatives equal)

**Continuity at $x = 1$:**
- Left: $f(1^-) = 1^2 = 1$
- Right: $f(1^+) = a(1) + b = a + b$
- Require: $a + b = 1$ ... (i)

**Differentiability at $x = 1$:**
- Left derivative: $f'(x) = 2x$ for $x < 1$, so $f'(1^-) = 2$
- Right derivative: $f'(x) = a$ for $x > 1$, so $f'(1^+) = a$
- Require: $a = 2$ ... (ii)

From (ii): $a = 2$
From (i): $2 + b = 1 \Rightarrow b = -1$

</details>
