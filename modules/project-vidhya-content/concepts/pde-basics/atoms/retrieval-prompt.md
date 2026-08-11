---
id: pde-basics.retrieval-prompt
concept_id: pde-basics
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

For the wave equation $\frac{\partial^2 u}{\partial t^2} = 4\frac{\partial^2 u}{\partial x^2}$ on a string of length $L$ with boundary conditions $u(0, t) = 0$ and $u(L, t) = 0$, what are the eigenvalues $\lambda_n$?

- **(A)** $\lambda_n = \left(\frac{n\pi}{L}\right)^2$ for $n = 1, 2, 3, \ldots$
- **(B)** $\lambda_n = \frac{n\pi}{2L}$ for $n = 1, 2, 3, \ldots$
- **(C)** $\lambda_n = n\pi$ for $n = 1, 2, 3, \ldots$
- **(D)** $\lambda_n = 4n^2$ for $n = 0, 1, 2, \ldots$

<details>
<summary>Answer</summary>

**A**. The spatial equation is $X''(x) + \lambda X(x) = 0$ with boundary conditions $X(0) = 0$ and $X(L) = 0$.

**Solving (same Dirichlet case):**
General solution: $X(x) = A\cos(\sqrt{\lambda}x) + B\sin(\sqrt{\lambda}x)$

Apply $X(0) = 0$: $A = 0$, so $X(x) = B\sin(\sqrt{\lambda}x)$.

Apply $X(L) = 0$: $B\sin(\sqrt{\lambda}L) = 0$.

For non-trivial solutions: $\sqrt{\lambda}L = n\pi$ where $n = 1, 2, 3, \ldots$

**Eigenvalues:** $\lambda_n = \left(\frac{n\pi}{L}\right)^2$

These are the same eigenvalues regardless of the PDE type (heat, wave, etc.). The difference lies in how the temporal equation $T(t)$ evolves under each eigenvalue.

</details>
