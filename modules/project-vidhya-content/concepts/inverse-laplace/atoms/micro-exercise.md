---
id: inverse-laplace.micro-exercise
concept_id: inverse-laplace
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Find the inverse Laplace transform of $F(s) = \frac{1}{s+2}$.

- **(A)** $e^{-2t}$
- **(B)** $e^{2t}$
- **(C)** $te^{-2t}$
- **(D)** $\cos(2t)$

<details>
<summary>Answer</summary>

**A**. This is the fundamental inverse-transform pair: $\mathcal{L}^{-1}\left\{\frac{1}{s+a}\right\} = e^{-at}$. Here $a=2$, so $f(t) = e^{-2t}$. The pole location at $s=-2$ encodes the decay rate of 2 in the time domain.

</details>
