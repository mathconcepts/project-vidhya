---
id: continuity.retrieval-prompt
concept_id: continuity
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

The function $f(x) = \begin{cases} x^2 & \text{if } x < 1 \\ ax + 2 & \text{if } x \geq 1 \end{cases}$ is continuous everywhere if $a =$

- **(A)** $-1$
- **(B)** $0$
- **(C)** $1$
- **(D)** $-2$

<details>
<summary>Answer</summary>

**A**. For the piecewise function to be continuous everywhere, it must be continuous at $x = 1$. This requires:
$$\lim_{x \to 1^-} f(x) = \lim_{x \to 1^+} f(x) = f(1)$$

Left limit:
$$\lim_{x \to 1^-} x^2 = 1$$

Right limit (and function value at $x = 1$):
$$\lim_{x \to 1^+} (ax + 2) = a(1) + 2 = a + 2$$
$$f(1) = a + 2$$

For continuity:
$$1 = a + 2$$
$$a = -1$$

</details>
