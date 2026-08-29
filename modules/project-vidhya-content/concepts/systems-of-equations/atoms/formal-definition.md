---
id: systems-of-equations.formal-definition
concept_id: systems-of-equations
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**System of Linear Equations**: A system of $m$ equations in $n$ unknowns:
$$
\begin{align}
a_{11}x_1 + a_{12}x_2 + \cdots + a_{1n}x_n &= b_1 \\
a_{21}x_1 + a_{22}x_2 + \cdots + a_{2n}x_n &= b_2 \\
&\vdots \\
a_{m1}x_1 + a_{m2}x_2 + \cdots + a_{mn}x_n &= b_m
\end{align}
$$

Written in matrix form: $Ax = b$, where $A \in \mathbb{R}^{m \times n}$, $x \in \mathbb{R}^n$, $b \in \mathbb{R}^m$.

**Solution Classification**:
- **Unique solution**: $\text{rank}(A) = \text{rank}(A|b) = n$ (full column rank)
- **Infinitely many solutions**: $\text{rank}(A) = \text{rank}(A|b) < n$ (underdetermined)
- **No solution**: $\text{rank}(A) < \text{rank}(A|b)$ (inconsistent)

where $(A|b)$ is the augmented matrix.
