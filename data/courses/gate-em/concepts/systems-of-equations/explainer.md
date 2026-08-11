# Systems of Linear Equations

> GATE Engineering Mathematics | Linear Algebra | high frequency | difficulty: 0.4

## Intuition First
A system of linear equations is a collection of constraints—each equation represents a line (or hyperplane in higher dimensions). Solving the system means finding the point where all lines intersect. Sometimes they intersect at exactly one point (unique solution), infinitely many points (infinitely many solutions), or nowhere (no solution).

## Core Definition
**System of Linear Equations**: A system of $m$ equations in $n$ unknowns:
$$\begin{align}
a_{11}x_1 + a_{12}x_2 + \cdots + a_{1n}x_n &= b_1 \\
a_{21}x_1 + a_{22}x_2 + \cdots + a_{2n}x_n &= b_2 \\
&\vdots \\
a_{m1}x_1 + a_{m2}x_2 + \cdots + a_{mn}x_n &= b_m
\end{align}$$

Written in matrix form: $Ax = b$, where $A \in \mathbb{R}^{m \times n}$, $x \in \mathbb{R}^n$, $b \in \mathbb{R}^m$.

**Solution Classification**:
- **Unique solution**: $\text{rank}(A) = \text{rank}(A|b) = n$ (full column rank)
- **Infinitely many solutions**: $\text{rank}(A) = \text{rank}(A|b) < n$ (underdetermined)
- **No solution**: $\text{rank}(A) < \text{rank}(A|b)$ (inconsistent)

where $(A|b)$ is the augmented matrix.

## What Happens (Worked Example)

Label: "**What happens:**"

Consider the system:
$$\begin{align}
2x + y &= 5 \\
x + 3y &= 5
\end{align}$$

In matrix form: $\begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 5 \\ 5 \end{pmatrix}$.

Using elimination: From row 1, $y = 5 - 2x$. Substitute into row 2: $x + 3(5 - 2x) = 5 \implies x + 15 - 6x = 5 \implies -5x = -10 \implies x = 2$.

Then $y = 5 - 2(2) = 1$.

Solution: $(x, y) = (2, 1)$.

Geometrically: The lines $2x + y = 5$ and $x + 3y = 5$ intersect at the single point $(2, 1)$.

Label: "**Why it works:**"

The rank conditions distinguish between cases: if $\text{rank}(A) = \text{rank}(A|b) = n$, the equations are consistent and determine $x$ uniquely. If ranks are equal but less than $n$, the equations are consistent but don't fully constrain $x$ (free variables exist). If ranks differ, the equations are contradictory (no solution exists).

## GATE MA Relevance
> **Why it matters in GATE MA:** Systems appear in 8–12% of Linear Algebra questions. GATE tests: (1) solving 2×2 and 3×3 systems via Gaussian elimination or Cramer's rule; (2) determining consistency via rank; (3) identifying the number of free variables; (4) applications in eigenvalue problems and network flows. Mix of MCQ and NAT.
