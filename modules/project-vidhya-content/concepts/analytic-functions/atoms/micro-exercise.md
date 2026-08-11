---
id: analytic-functions.micro-exercise
concept_id: analytic-functions
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Which of the following functions is analytic everywhere in the complex plane?

- **(A)** $f(z) = \bar{z}$ (complex conjugate)
- **(B)** $f(z) = |z|^2$
- **(C)** $f(z) = e^z$
- **(D)** $f(z) = \text{Re}(z)$ (real part)

<details>
<summary>Answer</summary>

**C**. We check the Cauchy-Riemann equations $\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y}$ and $\frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$ for each.
Option A: $f(z) = \bar{z} = x - iy$, so $u = x, v = -y$. Then $\frac{\partial u}{\partial x} = 1$ but $\frac{\partial v}{\partial y} = -1$. Cauchy-Riemann fails. ✗
Option B: $f(z) = |z|^2 = x^2 + y^2$, so $u = x^2 + y^2, v = 0$. Then $\frac{\partial u}{\partial x} = 2x$ but $\frac{\partial v}{\partial y} = 0$. Cauchy-Riemann fails except at $z = 0$. ✗
Option C: $f(z) = e^z = e^{x}(\cos y + i \sin y)$, so $u = e^x \cos y, v = e^x \sin y$. Check: $\frac{\partial u}{\partial x} = e^x \cos y = \frac{\partial v}{\partial y}$ ✓ and $\frac{\partial u}{\partial y} = -e^x \sin y = -\frac{\partial v}{\partial x}$ ✓ Cauchy-Riemann holds everywhere. ✓
Option D: $f(z) = \text{Re}(z) = x$, so $u = x, v = 0$. Then $\frac{\partial u}{\partial x} = 1$ but $\frac{\partial v}{\partial y} = 0$. Cauchy-Riemann fails. ✗

</details>
