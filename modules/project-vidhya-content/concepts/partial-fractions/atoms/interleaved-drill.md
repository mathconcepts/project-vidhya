---
id: partial-fractions.interleaved-drill
concept_id: partial-fractions
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: partial-fractions.micro-exercise
---

**Cross-concept check: partial fractions → integration basics.**

$\dfrac1{(x+2)(x-3)}$.

**Question 1 (partial fractions):** Decompose into $\dfrac{A}{x+2}+\dfrac{B}{x-3}$.

*Answer:* Cover $(x+2)$, evaluate $\dfrac1{x-3}$ at $x=-2$: $-\dfrac15$. Cover $(x-3)$, evaluate $\dfrac1{x+2}$ at $x=3$: $\dfrac15$. So $\dfrac1{(x+2)(x-3)}=-\dfrac{1/5}{x+2}+\dfrac{1/5}{x-3}$.

**Question 2 (integration basics):** Integrate each piece using $\int\dfrac1{x+a}\,dx=\ln|x+a|+C$.

*Answer:* $-\dfrac15\ln|x+2|+\dfrac15\ln|x-3|+C$.

**Why this drill exists:** decomposition is only half the task — students sometimes decompose correctly and then stall on the second half, forgetting the basic formula $\int\frac1{x+a}\,dx=\ln|x+a|+C$ under the pressure of having just finished the harder algebraic step. The drill forces both halves back to back so neither is practiced in isolation.
