---
id: z-transform.micro-exercise
concept_id: z-transform
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Find the Z-transform of the unit step sequence $u[n] = \begin{cases} 1 & n \geq 0 \\ 0 & n < 0 \end{cases}$.

- **(A)** $X(z) = \frac{z}{z-1}$, $|z| > 1$
- **(B)** $X(z) = \frac{1}{z-1}$, $|z| > 1$
- **(C)** $X(z) = \frac{1}{1-z^{-1}}$, $|z| > 1$
- **(D)** $X(z) = \frac{z}{z+1}$, $|z| > 1$

<details>
<summary>Answer</summary>

**A**. The unit step is $u[n] = 1$ for $n \geq 0$. Its Z-transform is: $X(z) = \sum_{n=0}^\infty z^{-n} = \frac{1}{1-z^{-1}} = \frac{z}{z-1}$ for $|z| > 1$. Options A and C are equivalent (multiply numerator and denominator by $z$); the standard form is A. The pole at $z=1$ (on the unit circle) indicates marginal stability, consistent with a constant sequence that neither decays nor grows.

</details>
