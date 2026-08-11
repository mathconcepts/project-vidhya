# Matrix Inverse

> GATE Engineering Mathematics | Linear Algebra | high frequency | difficulty: 0.3

## Intuition First
A matrix inverse is like the "undo" transformation. If $A$ scales and rotates space, then $A^{-1}$ reverses those operations—scaling back and rotating in the opposite direction. Only invertible (non-singular) matrices have inverses.

## Core Definition
**Matrix Inverse**: For a square matrix $A \in \mathbb{R}^{n \times n}$, the inverse $A^{-1}$ is the unique matrix satisfying:
$$AA^{-1} = A^{-1}A = I$$

where $I$ is the $n \times n$ identity matrix.

**Condition for Invertibility**: A matrix $A$ is invertible if and only if $\det(A) \neq 0$ (i.e., $A$ is non-singular).

**Formula for 2×2 Inverse**: For $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$ with $\det(A) = ad - bc \neq 0$:
$$A^{-1} = \frac{1}{ad - bc} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$$

**General Formula (Adjugate Method)**: For any $n \times n$ matrix:
$$A^{-1} = \frac{1}{\det(A)} \text{adj}(A)$$

where $\text{adj}(A)$ is the adjugate matrix (transpose of the cofactor matrix).

## What Happens (Worked Example)

Label: "**What happens:**"

Let $A = \begin{pmatrix} 2 & 1 \\ 1 & 1 \end{pmatrix}$. First, check: $\det(A) = 2(1) - 1(1) = 1 \neq 0$, so $A$ is invertible.

$$A^{-1} = \frac{1}{1} \begin{pmatrix} 1 & -1 \\ -1 & 2 \end{pmatrix} = \begin{pmatrix} 1 & -1 \\ -1 & 2 \end{pmatrix}$$

Verify: $AA^{-1} = \begin{pmatrix} 2 & 1 \\ 1 & 1 \end{pmatrix} \begin{pmatrix} 1 & -1 \\ -1 & 2 \end{pmatrix} = \begin{pmatrix} 2(1) + 1(-1) & 2(-1) + 1(2) \\ 1(1) + 1(-1) & 1(-1) + 1(2) \end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} = I$ ✓

Geometrically: If $A$ represents a linear transformation $T: (x, y) \mapsto (2x + y, x + y)$, then $A^{-1}$ reverses it: $T^{-1}$ maps $(u, v)$ back to the original space.

Label: "**Why it works:**"

The inverse satisfies $AA^{-1} = I$ because applying a transformation followed by its reverse returns the input unchanged. The determinant appears in the denominator because only non-singular matrices (those with $\det(A) \neq 0$) can be inverted—singular matrices collapse the space and cannot recover the original vectors.

## GATE MA Relevance
> **Why it matters in GATE MA:** Matrix inverses appear in 5–8% of Linear Algebra questions, especially in solving systems via $A^{-1}b$, analyzing Cayley-Hamilton applications, and studying diagonalization. GATE tests: (1) computing 2×2 and small 3×3 inverses; (2) recognizing when a matrix is non-invertible; (3) using properties like $(AB)^{-1} = B^{-1}A^{-1}$. Mostly MCQ.
