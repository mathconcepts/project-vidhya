---
id: chain-rule.interleaved-drill
concept_id: chain-rule
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: chain-rule.micro-exercise
---

**Cross-concept check: chain-rule → product-quotient-rule.**

**Question 1 (chain-rule):** Find $f'(1)$ for $f(x) = (2x+1)^3$.

*Answer:* $f'(x) = 3(2x+1)^2 \cdot 2 = 6(2x+1)^2$. At $x=1$: $2x+1=3$, so $f'(1) = 6 \cdot 9 = 54$.

**Question 2 (product-quotient-rule):** Now let $g(x) = x \cdot (2x+1)^3$. Find $g'(1)$, reusing the chain-rule work from Question 1.

*Answer:* By the product rule, $g'(x) = (1)\cdot(2x+1)^3 + x \cdot \dfrac{d}{dx}\!\left[(2x+1)^3\right]$. The second term's derivative was already found above: $\dfrac{d}{dx}(2x+1)^3 = 6(2x+1)^2$. At $x=1$: $g'(1) = 1 \cdot 3^3 + 1 \cdot 6\cdot 9 = 27 + 54 = 81$.

**Why this drill exists:** the product rule requires the derivative of *each* factor, and when one factor is itself a composite, students often stop at the outer power rule for that factor and forget to fold in its own inner derivative — the exact chain-rule step Question 1 already isolated. This checks that a chain-rule result is carried forward as one piece of a larger product-rule computation, not recomputed incorrectly or dropped.
