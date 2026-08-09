# Numerical Linear Algebra

> GATE Engineering Mathematics | Numerical Methods | medium frequency | difficulty: 0.6

## Intuition First

Solving $Ax = b$ for huge matrices (thousands of rows) is impractical with pencil-and-paper Gaussian elimination. Numerical linear algebra exploits sparsity, iterates cleverly, and uses matrix decompositions (like LU) to solve systems faster and more stably. The key insight: by decomposing $A = LU$ (lower × upper triangle), you trade one expensive factorization for many cheap forward-backward solves.

## Core Definition

**LU Decomposition**: Every square matrix $A$ (with nonzero pivots) can be factored as:

$$A = LU$$

where $L$ is lower triangular (1s on diagonal) and $U$ is upper triangular. Once computed, solving $Ax = b$ becomes two triangular solves:
1. **Forward substitution**: Solve $Ly = b$ for $y$
2. **Backward substitution**: Solve $Ux = y$ for $x$

Each triangular solve costs $O(n^2)$ operations instead of the original $O(n^3)$ for Gaussian elimination. If you solve multiple systems with the same $A$ but different $b$, you factor once ($O(n^3)$) then solve cheaply ($O(n^2)$ each).

The factorization is equivalent to Gaussian elimination: $U$ is the reduced form after all pivots, and $L$ records the multipliers used.

## What Happens (Worked Example)

**Problem**: Factor $A = \begin{pmatrix} 2 & 1 & -1 \\ -4 & -3 & 2 \\ 2 & 1 & 0 \end{pmatrix}$ into $LU$ form.

**Computation** (row operations):
- Row 2: $-4 = 2 \times (-2)$, so multiplier $m_{21} = -2$. New Row 2 = Row 2 $- (-2) \times$ Row 1 = $(-4, -3, 2) - (-2)(2, 1, -1) = (0, -1, 4)$
- Row 3: $2 = 2 \times 1$, so multiplier $m_{31} = 1$. New Row 3 = Row 3 $- 1 \times$ Row 1 = $(2, 1, 0) - (2, 1, -1) = (0, 0, 1)$

After first pivot:
$\begin{pmatrix} 2 & 1 & -1 \\ 0 & -1 & 4 \\ 0 & 0 & 1 \end{pmatrix}$ (this is $U$)

- Row 3 (second pivot): $0 = -1 \times 0$, so no operation needed.

Final factors:
$$L = \begin{pmatrix} 1 & 0 & 0 \\ -2 & 1 & 0 \\ 1 & 0 & 1 \end{pmatrix}, \quad U = \begin{pmatrix} 2 & 1 & -1 \\ 0 & -1 & 4 \\ 0 & 0 & 1 \end{pmatrix}$$

**Verification**: $LU = \begin{pmatrix} 1 & 0 & 0 \\ -2 & 1 & 0 \\ 1 & 0 & 1 \end{pmatrix} \begin{pmatrix} 2 & 1 & -1 \\ 0 & -1 & 4 \\ 0 & 0 & 1 \end{pmatrix} = A$ ✓

**Why it works**: LU captures the essence of Gaussian elimination. Each multiplier $m_{ij}$ in $L$ records "how much of row $i$ did we subtract from row $j$?" The upper factor $U$ is what remains after all eliminations. Geometrically: $A$ describes a linear transformation; $LU$ describes the elimination process and the final triangular form side-by-side.

## GATE MA Relevance

> **Why it matters in GATE MA:** Numerical linear algebra appears in 2–3% of GATE papers. Topics tested: (1) "Perform Gaussian elimination with/without partial pivoting"; (2) "Factor a 3×3 matrix into $LU$"; (3) "Solve $Ax = b$ using LU decomposition"; (4) "Compute matrix norm or condition number"; (5) "Compare Gauss-Seidel vs. Jacobi iteration." Questions are computational (arithmetic-heavy) but straightforward. Medium frequency, medium-to-high difficulty due to arithmetic load.
