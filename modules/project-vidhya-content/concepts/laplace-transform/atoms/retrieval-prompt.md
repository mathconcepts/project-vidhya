---
id: laplace-transform.retrieval-prompt
concept_id: laplace-transform
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Find the Laplace transform of $f(t) = t^2 e^{-3t}$ for $t \geq 0$.

- **(A)** $\frac{2}{(s+3)^3}$ for $\text{Re}(s) > -3$
- **(B)** $\frac{2}{(s-3)^3}$ for $\text{Re}(s) > 3$
- **(C)** $\frac{1}{(s+3)^2}$ for $\text{Re}(s) > -3$
- **(D)** $\frac{6}{(s+3)^3}$ for $\text{Re}(s) > -3$

<details>
<summary>Answer</summary>

**A**. Using the shifting property: if $\mathcal{L}\{t^n\} = \frac{n!}{s^{n+1}}$, then $\mathcal{L}\{t^n e^{-at}\} = \frac{n!}{(s+a)^{n+1}}$. For $n=2, a=3$: $F(s) = \frac{2!}{(s+3)^3} = \frac{2}{(s+3)^3}$. The pole at $s=-3$ has multiplicity 3, corresponding to the cubic decay structure of $t^2 e^{-3t}$ in the time domain.

</details>
