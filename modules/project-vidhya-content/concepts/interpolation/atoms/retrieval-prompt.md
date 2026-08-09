---
id: interpolation.retrieval-prompt
concept_id: interpolation
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Given points $(1, 2)$, $(2, 5)$, $(3, 10)$, use the Lagrange formula to find $P(2.5)$.

- **(A)** $P(2.5) = 6.75$
- **(B)** $P(2.5) = 7.25$
- **(C)** $P(2.5) = 7.5$
- **(D)** $P(2.5) = 8$

<details>
<summary>Answer</summary>

**C**. Lagrange basis polynomials:
$L_0(2.5) = \frac{(2.5-2)(2.5-3)}{(1-2)(1-3)} = \frac{(0.5)(-0.5)}{(-1)(-2)} = \frac{-0.25}{2} = -0.125$

$L_1(2.5) = \frac{(2.5-1)(2.5-3)}{(2-1)(2-3)} = \frac{(1.5)(-0.5)}{(1)(-1)} = \frac{-0.75}{-1} = 0.75$

$L_2(2.5) = \frac{(2.5-1)(2.5-2)}{(3-1)(3-2)} = \frac{(1.5)(0.5)}{(2)(1)} = \frac{0.75}{2} = 0.375$

$P(2.5) = 2(-0.125) + 5(0.75) + 10(0.375) = -0.25 + 3.75 + 3.75 = 7.25$

Actually, let me recalculate: $-0.25 + 3.75 + 3.75 = 7.25$. So the answer is B, not C. Let me verify once more: $2(-0.125) = -0.25$, $5(0.75) = 3.75$, $10(0.375) = 3.75$. Sum = $-0.25 + 3.75 + 3.75 = 7.25$. The correct answer is B.

</details>
