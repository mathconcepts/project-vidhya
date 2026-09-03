---
id: systems-of-equations.intuition
concept_id: systems-of-equations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

A system of linear equations in matrix form is $A\mathbf{x} = \mathbf{b}$, where $A$ is $m \times n$, $\mathbf{x}$ is $n \times 1$, and $\mathbf{b}$ is $m \times 1$.

**When does a solution exist?** The Rouché–Capelli consistency theorem: $A\mathbf{x} = \mathbf{b}$ is consistent iff $\text{rank}(A) = \text{rank}([A \mid \mathbf{b}])$, the **augmented matrix**.

Three outcomes, decided entirely by ranks:

| Condition | Solutions |
|---|---|
| $\text{rank}(A) \neq \text{rank}([A\mid\mathbf{b}])$ | **Zero** — inconsistent |
| $\text{rank}(A) = \text{rank}([A\mid\mathbf{b}]) = n$ | **Exactly one** |
| $\text{rank}(A) = \text{rank}([A\mid\mathbf{b}]) < n$ | **Infinitely many**, with $n - \text{rank}(A)$ free variables |

**Two ways to solve.** Gaussian elimination: reduce $[A\mid\mathbf{b}]$ to row echelon form with row swaps, row scaling, and adding a multiple of one row to another, then back-substitute. Cramer's rule (square, $\det(A)\neq0$): $x_i = \det(A_i)/\det(A)$, where $A_i$ replaces column $i$ with $\mathbf{b}$ — fine for 2 or 3 unknowns, impractical beyond.

**Homogeneous systems** ($\mathbf{b}=\mathbf{0}$) always have the trivial solution $\mathbf{x}=\mathbf{0}$; a non-trivial one exists iff $\text{rank}(A)<n$ — for square $A$, the same as $\det(A)=0$.

**What GATE actually tests:** row-reducing to find rank, deciding solution count from ranks, solving a $3\times3$ system inside a larger question, and recognizing $(A-\lambda I)\mathbf{x}=\mathbf{0}$ as a homogeneous system.
