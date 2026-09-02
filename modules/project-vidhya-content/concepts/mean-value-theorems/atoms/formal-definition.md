---
id: mean-value-theorems.formal-definition
concept_id: mean-value-theorems
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Rolle's Theorem**: If $f$ is continuous on $[a,b]$, differentiable on $(a,b)$, and $f(a) = f(b)$, then there exists $c \in (a,b)$ such that $f'(c) = 0$.

**Mean Value Theorem (MVT)**: If $f$ is continuous on $[a,b]$ and differentiable on $(a,b)$, then there exists $c \in (a,b)$ such that:
$$f'(c) = \frac{f(b) - f(a)}{b - a}$$

**Cauchy's Mean Value Theorem**: If $f$ and $g$ are continuous on $[a,b]$, differentiable on $(a,b)$, and $g'(x) \neq 0$ on $(a,b)$, then:
$$\frac{f'(c)}{g'(c)} = \frac{f(b) - f(a)}{g(b) - g(a)}$$

**Which one to reach for:** if $f(a) = f(b)$ is already true, Rolle's alone suffices — solve $f'(c) = 0$ directly and stop, since the average slope is automatically zero and the general MVT formula would only reproduce the same equation with extra steps. Students often set up the full Lagrange slope formula even when $f(a) = f(b)$ is staring at them from the given numbers, doing avoidable algebra to land on a conclusion Rolle's gives in one line.
