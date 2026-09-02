---
id: interpolation.common-traps
concept_id: interpolation
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

**Trap 1 — Repeated node.** The Lagrange formula divides by $(x_i-x_j)$ for every pair; a repeated $x$-value (a data-entry duplicate) divides by zero. Always check the nodes are distinct before building any basis polynomial.

**Trap 2 — Divided difference mistaken for a derivative.** $f[x_0,x_1]=\frac{f(x_1)-f(x_0)}{x_1-x_0}$ is the slope of a *secant* line through two samples, not $f'(x_0)$ — it approximates the derivative near the *midpoint* of the two nodes, not at either endpoint.

**Trap 3 — Basis arithmetic slips.** A sign flip or swapped denominator in $L_i(x)$ propagates straight through to a wrong final answer. The free check: $\sum_i L_i(x)=1$ for every $x$ — if the basis values at your evaluation point don't sum to $1$, something upstream is wrong.
