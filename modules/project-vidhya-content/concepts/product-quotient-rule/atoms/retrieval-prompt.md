---
id: product-quotient-rule.retrieval-prompt
concept_id: product-quotient-rule
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Find $f'(0)$ for $f(x) = (x^2 + 1)e^x$.

- **(A)** $0$
- **(B)** $1$
- **(C)** $2$
- **(D)** $e$

<details>
<summary>Answer</summary>

**B**. Use the product rule with $u = x^2 + 1$ and $v = e^x$.

$u' = 2x$, $v' = e^x$

$$f'(x) = 2x \cdot e^x + (x^2 + 1) \cdot e^x = e^x(2x + x^2 + 1)$$

At $x = 0$:
$$f'(0) = e^0(0 + 0 + 1) = 1$$

</details>
