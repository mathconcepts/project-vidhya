---
id: interpolation.formal-definition
concept_id: interpolation
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Lagrange Interpolation Polynomial**: Given $n+1$ distinct points $(x_0, y_0), (x_1, y_1), \ldots, (x_n, y_n)$, there exists a unique polynomial $P_n(x)$ of degree at most $n$ such that $P_n(x_i) = y_i$ for all $i$. The Lagrange form is:

$$P_n(x) = \sum_{i=0}^{n} y_i L_i(x), \quad L_i(x) = \prod_{j=0, j \neq i}^{n} \frac{x - x_j}{x_i - x_j}$$

Each Lagrange basis polynomial $L_i(x)$ equals 1 at $x_i$ and 0 at all other nodes, ensuring $P_n$ passes through every data point. The interpolant is unique; different formulas (Lagrange, Newton, Hermite) are algebraically equivalent.
