---
id: laplace-transform.micro-exercise
concept_id: laplace-transform
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Find the Laplace transform of $f(t) = 1$ (the unit step function) for $t \geq 0$.

- **(A)** $\frac{1}{s}$ for $\text{Re}(s) > 0$
- **(B)** $\frac{1}{s^2}$ for $\text{Re}(s) > 0$
- **(C)** $s$ for $\text{Re}(s) > 0$
- **(D)** $\frac{1}{s-1}$ for $\text{Re}(s) > 1$

<details>
<summary>Answer</summary>

**A**. Using the definition: $F(s) = \int_0^\infty e^{-st} \cdot 1 \, dt = \left[\frac{e^{-st}}{-s}\right]_0^\infty$. For $\text{Re}(s) > 0$, the exponential decays to 0 at the upper limit, giving $F(s) = \frac{1}{s}$. This is the most fundamental Laplace transform and appears in nearly every GATE problem.

</details>
