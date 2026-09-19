---
id: limits-jee.micro-exercise
concept_id: limits-jee
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 2
---

Evaluate $\displaystyle\lim_{x\to0}\frac{\sin 5x}{\tan 3x}$.

- **(A)** $1$
- **(B)** $\dfrac{5}{3}$
- **(C)** $\dfrac{3}{5}$
- **(D)** $15$
- **(E)** $0$

<details>
<summary>Answer</summary>

**B**. Write $\sin 5x$ and $\tan 3x$ against their own arguments:

$$
\frac{\sin 5x}{\tan 3x} = \frac{\sin 5x}{5x}\cdot\frac{3x}{\tan 3x}\cdot\frac{5x}{3x}
$$

As $x\to0$, $\dfrac{\sin 5x}{5x}\to1$ and $\dfrac{3x}{\tan 3x}\to1$, leaving only $\dfrac{5x}{3x}=\dfrac53$.

**(A)** is the reflex mistake of treating both $\sin$ and $\tan$ over "their own $x$" as $1$ without accounting for the $5$ and the $3$. **(C)** inverts the ratio. **(D)** multiplies the coefficients instead of dividing them.

</details>
