---
id: product-quotient-rule.interleaved-drill
concept_id: product-quotient-rule
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: product-quotient-rule.micro-exercise
---

**Cross-concept check: product-quotient-rule → maxima-minima.**

Let $f(x) = \dfrac{x}{x^2+1}$.

**Question 1 (product-quotient-rule):** Find $f'(x)$ using the quotient rule.

*Answer:* With $u=x,\ v=x^2+1$: $f'(x) = \dfrac{u'v - uv'}{v^2} = \dfrac{(1)(x^2+1) - x(2x)}{(x^2+1)^2} = \dfrac{1-x^2}{(x^2+1)^2}$.

**Question 2 (maxima-minima):** Using $f'(x)$ from Question 1, classify $x=1$ as a local maximum, local minimum, or neither, and give $f(1)$.

*Answer:* $f'(x)=0$ at $x=\pm1$ (numerator $1-x^2=0$). Just below $x=1$ (say $x=0.9$), $1-x^2=0.19>0$; just above (say $x=1.1$), $1-x^2=-0.21<0$. The sign change from $+$ to $-$ means $f$ has a **local maximum** at $x=1$, with $f(1) = \dfrac{1}{1+1} = \dfrac{1}{2}$.

**Why this drill exists:** a correctly-computed derivative is only half of an optimization question — the other half is reading the *sign change* of that derivative, not just the location where it equals zero. Students who differentiate the quotient correctly sometimes stop at "$x=1$ is a critical point" without checking whether it is a max, a min, or neither.
