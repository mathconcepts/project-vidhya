---
id: systems-of-equations-intuition
concept_id: systems-of-equations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Systems of Linear Equations

A **system of linear equations** in matrix form is $A\mathbf{x} = \mathbf{b}$, where $A$ is an $m \times n$ matrix of coefficients, $\mathbf{x}$ is the $n \times 1$ unknown vector, and $\mathbf{b}$ is the $m \times 1$ right-hand side.

## Consistency — When Does a Solution Exist?

The **fundamental consistency theorem** (Rouché–Capelli):

> The system $A\mathbf{x} = \mathbf{b}$ is **consistent** (has at least one solution) if and only if
> $$\text{rank}(A) = \text{rank}([A \mid \mathbf{b}])$$

where $[A \mid \mathbf{b}]$ is the **augmented matrix**.

## Three Possible Outcomes

| Condition | Number of solutions |
|---|---|
| $\text{rank}(A) \neq \text{rank}([A\mid\mathbf{b}])$ | **Zero** — inconsistent |
| $\text{rank}(A) = \text{rank}([A\mid\mathbf{b}]) = n$ | **Exactly one** — unique solution |
| $\text{rank}(A) = \text{rank}([A\mid\mathbf{b}]) < n$ | **Infinitely many** — free variables exist |

The number of **free variables** = $n - \text{rank}(A)$.

## Methods of Solution

**Gaussian Elimination (Row Reduction):** Convert $[A\mid\mathbf{b}]$ to **row echelon form** using three elementary row operations: swap rows, scale a row, add a multiple of one row to another. Then back-substitute.

**Cramer's Rule (square, non-singular):** For $n \times n$ systems with $\det(A) \neq 0$:

$$x_i = \frac{\det(A_i)}{\det(A)}$$

where $A_i$ is $A$ with the $i$-th column replaced by $\mathbf{b}$. Impractical for large $n$ but useful for GATE 2-variable and 3-variable problems.

## Homogeneous Systems ($\mathbf{b} = \mathbf{0}$)

$A\mathbf{x} = \mathbf{0}$ always has the **trivial solution** $\mathbf{x} = \mathbf{0}$. It has **non-trivial solutions** if and only if $\text{rank}(A) < n$, equivalently $\det(A) = 0$ when $A$ is square.

## GATE Focus Areas

- Computing $\text{rank}$ by reducing to row echelon form — the most frequent sub-step
- Deciding the number of solutions from ranks (often asked as MCQ)
- Solving $3 \times 3$ systems by Gaussian elimination within the context of a larger problem
- Eigenvalue problems: $(A - \lambda I)\mathbf{x} = \mathbf{0}$ is a homogeneous system
