---
id: limits.retrieval-prompt
concept_id: limits
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

$\lim_{x \to 2} \frac{x^3 - 8}{x - 2} = $

- **(A)** $0$
- **(B)** $6$
- **(C)** $12$
- **(D)** $\infty$

<details>
<summary>Answer</summary>

**C**. Direct substitution gives $\frac{0}{0}$ (indeterminate). Factor using difference of cubes:
$$x^3 - 8 = x^3 - 2^3 = (x - 2)(x^2 + 2x + 4)$$

Therefore:
$$\lim_{x \to 2} \frac{x^3 - 8}{x - 2} = \lim_{x \to 2} \frac{(x-2)(x^2 + 2x + 4)}{x - 2}$$

For $x \neq 2$, cancel $(x - 2)$:
$$= \lim_{x \to 2} (x^2 + 2x + 4) = 4 + 4 + 4 = 12$$

Alternatively, use L'Hôpital's rule:
$$\lim_{x \to 2} \frac{3x^2}{1} = 3(4) = 12$$

</details>
