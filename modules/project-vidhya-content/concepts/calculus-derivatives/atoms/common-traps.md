---
id: calculus-derivatives.common-traps
concept_id: calculus-derivatives
atom_type: common_traps
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
tested_by_atom: calculus-derivatives.micro-exercise.power-rule
---

**Trap 1 — Forgetting the chain rule on composites.** If $y = (\sin x)^3$, then $y' = 3(\sin x)^2 \cdot \cos x$, not $3(\sin x)^2$. The outer power gives the $3(\cdot)^2$; the chain rule supplies the $\cos x$.

**Trap 2 — Product rule vs chain rule.** $\sin(x)\cos(x)$ is a product; use $(fg)' = f'g + fg'$. $\sin(\cos x)$ is a composition; use $(f \circ g)' = f'(g) \cdot g'$.

**Trap 3 — Sign on $-\sin x$.** The derivative of $\cos x$ is $-\sin x$. Students drop the minus under time pressure.

**Trap 4 — $e^x$ is not a power function.** $\frac{d}{dx}e^x = e^x$, not $x \cdot e^{x-1}$.
