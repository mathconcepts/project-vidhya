---
id: complex-integration.retrieval-prompt
concept_id: complex-integration
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Evaluate $\oint_C \frac{z + 1}{z^2 - 1} \, dz$ where $C$ is the circle $|z| = 2$.

- **(A)** $\pi i$
- **(B)** $2\pi i$
- **(C)** $3\pi i$
- **(D)** $4\pi i$

<details>
<summary>Answer</summary>

**B**. Factor the denominator: $z^2 - 1 = (z-1)(z+1)$.
The poles are at $z = 1$ and $z = -1$. Both satisfy $|z| = 1 < 2$, so both are inside $C$.
Use partial fractions:
$$\frac{z+1}{(z-1)(z+1)} = \frac{z+1}{(z-1)(z+1)} = \frac{1}{z-1}$$
(The $(z+1)$ cancels in the numerator and denominator.)
Now, by Cauchy's Integral Formula:
$$\oint_C \frac{1}{z - 1} \, dz = 2\pi i \cdot f(1)$$
where $f(z) = 1$ (the constant 1 is the numerator after cancellation). So $f(1) = 1$.
Therefore, $\oint_C \frac{z+1}{z^2-1} \, dz = 2\pi i \cdot 1 = 2\pi i$.

</details>
