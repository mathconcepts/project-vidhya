---
id: binomial-theorem.micro-exercise
concept_id: binomial-theorem
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
estimated_minutes: 3
---

Find the term independent of $x$ (the constant term) in the expansion of $\left(2x - \dfrac{1}{x}\right)^8$.

- **(A)** $448$
- **(B)** $1120$
- **(C)** $1792$
- **(D)** $-1120$

<details>
<summary>Answer</summary>

**B**. General term with $a=2x$, $b=-\frac1x$, $n=8$:

$$T_{r+1} = \binom{8}{r}(2x)^{8-r}\left(-\frac1x\right)^r = \binom{8}{r}2^{8-r}(-1)^r\,x^{8-2r}$$

Independent of $x$ means the exponent is $0$: $8-2r=0 \Rightarrow r=4$.

$$T_5 = \binom{8}{4}2^4(-1)^4 = 70\times16\times1 = 1120$$

</details>
