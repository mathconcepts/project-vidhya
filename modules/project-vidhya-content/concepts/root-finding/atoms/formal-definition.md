---
id: root-finding.formal-definition
concept_id: root-finding
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Newton-Raphson Method**: Given a differentiable function $f(x)$, the iterative formula is:

$$x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}$$

Starting from an initial guess $x_0$, this sequence converges to a root $r$ where $f(r) = 0$, provided $f'(r) \neq 0$ and $x_0$ is sufficiently close to $r$. The convergence is **quadratic**: error at step $n+1$ is proportional to the square of error at step $n$.
