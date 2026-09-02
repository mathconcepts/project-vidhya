---
id: maxima-minima.interleaved-drill
concept_id: maxima-minima
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: maxima-minima.micro-exercise
---

**Cross-concept check: maxima-minima → product-quotient-rule.**

Let $f(x) = \dfrac{x}{x^2+4}$.

**Question 1 (product-quotient-rule):** Find $f'(x)$ using the quotient rule.

*Answer:* With $u=x,\ v=x^2+4$: $f'(x) = \dfrac{(1)(x^2+4) - x(2x)}{(x^2+4)^2} = \dfrac{4-x^2}{(x^2+4)^2}$.

**Question 2 (maxima-minima):** Using $f'(x)$ from Question 1, classify $x=2$ as a local maximum, local minimum, or neither, and give $f(2)$.

*Answer:* $f'(x)=0$ at $x=\pm2$ (numerator $4-x^2=0$). Just below $x=2$ (say $x=1.9$), $4-x^2>0$; just above ($x=2.1$), $4-x^2<0$. The sign change from $+$ to $-$ means $f$ has a **local maximum** at $x=2$, with $f(2) = \dfrac{2}{4+4} = \dfrac{1}{4}$.

**Why this drill exists:** finding where $f'(x)=0$ is only the entry point to a maxima-minima question — the classification step depends entirely on correctly differentiating $f$ in the first place. A sign error anywhere in the quotient rule's numerator silently flips which side of the critical point counts as "increasing," and produces a confidently wrong max/min label.
