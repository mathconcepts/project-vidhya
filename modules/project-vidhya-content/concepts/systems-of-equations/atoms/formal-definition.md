---
id: systems-of-equations.formal-definition
concept_id: systems-of-equations
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**System of linear equations**: $m$ equations in $n$ unknowns, written in matrix form as $Ax = b$, where $A \in \mathbb{R}^{m \times n}$, $x \in \mathbb{R}^n$, $b \in \mathbb{R}^m$.

**Solution classification**, via $(A\mid b)$ the augmented matrix:

- **Unique solution**: $\text{rank}(A) = \text{rank}(A\mid b) = n$
- **Infinitely many solutions**: $\text{rank}(A) = \text{rank}(A\mid b) < n$
- **No solution**: $\text{rank}(A) < \text{rank}(A\mid b)$

**Method selector.** Row-reduce $(A\mid b)$ once, for any system — the ranks fall out of the same elimination that would solve it, so there is never a reason to solve first and check consistency after. Reach for Cramer's rule ($x_i = \det(A_i)/\det(A)$) only for a square system with $n \le 3$ and a known-nonzero $\det(A)$; the tempting wrong move is applying Cramer's rule to a rectangular system or to one where $\det(A)=0$ is suspected — the rule is undefined the moment $A$ isn't square and nonsingular, while row reduction handles every case, singular or not, without special-casing.
