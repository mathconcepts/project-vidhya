---
id: conformal-mapping.micro-exercise
concept_id: conformal-mapping
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Which of the following functions is conformal everywhere in the complex plane?

- **(A)** $f(z) = z^2$
- **(B)** $f(z) = e^z$
- **(C)** $f(z) = \bar{z}$ (complex conjugate)
- **(D)** $f(z) = |z|^2$

<details>
<summary>Answer</summary>

**B**. A function is conformal at a point $z$ if it is analytic at $z$ and $f'(z) \neq 0$.
Option A: $f(z) = z^2$ has $f'(z) = 2z$. This is zero at $z = 0$, so the function is NOT conformal at the origin. ✗
Option B: $f(z) = e^z$ has $f'(z) = e^z$. Since $e^z \neq 0$ for any $z \in \mathbb{C}$, the function is analytic and has non-zero derivative everywhere. It is conformal everywhere. ✓
Option C: $f(z) = \bar{z}$ is not analytic (fails Cauchy-Riemann), so it is not conformal. ✗
Option D: $f(z) = |z|^2 = x^2 + y^2$ is not analytic (fails Cauchy-Riemann except at the origin), so it is not conformal. ✗

</details>
