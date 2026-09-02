---
id: derivatives-basic.interleaved-drill
concept_id: derivatives-basic
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: derivatives-basic.micro-exercise.power-rule
---

**Cross-concept check: derivatives-basic → chain-rule.**

Let $h(x) = 5x^3 - 2x$.

**Question 1 (derivatives-basic):** Find $h'(1)$ using the power and sum rules directly.

*Answer:* $h'(x) = 15x^2 - 2$, so $h'(1) = 15 - 2 = 13$.

**Question 2 (chain-rule):** Let $H(x) = \left(h(x)\right)^2 = (5x^3-2x)^2$. Find $H'(1)$ without expanding the square first.

*Answer:* By the chain rule, $H'(x) = 2\,h(x)\,h'(x)$. At $x=1$: $h(1) = 5-2=3$ and $h'(1)=13$ from Question 1, so $H'(1) = 2 \cdot 3 \cdot 13 = 78$.

**Why this drill exists:** students who can differentiate $h(x)$ correctly on its own sometimes reach for the wrong rule the moment the same expression is squared — expanding $(5x^3-2x)^2$ term by term instead of reusing $h(1)$ and $h'(1)$ inside the chain rule. This checks that a basic-derivative result is recognized as the *inner function* of a composite, not thrown away and recomputed from scratch.
