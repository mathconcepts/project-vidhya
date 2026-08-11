---
id: interpolation.common-traps
concept_id: interpolation
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting to check node distinctness**: The Lagrange formula assumes all $x_i$ are distinct. A question might give you a table with a repeated $x$-value (a data entry error), and a careless student might proceed anyway, dividing by zero when computing $L_i$. Always verify: "Are the points distinct?"
- **Confusing divided differences with derivatives**: Students often write $f[x_0, x_1] = f'(x_0)$, which is wrong. Divided differences are slopes of *secant* lines, not tangents. The first divided difference $f[x_0, x_1]$ approximates the derivative at the *midpoint*, not at $x_0$.
- **Arithmetic mistakes in basis polynomials**: Computing Lagrange basis $L_i(x)$ requires careful fraction arithmetic. A sign flip or denominator swap will give a completely wrong answer. Always double-check: $L_i(x_i) = 1$ and $L_i(x_j) = 0$ for $j \neq i$.
