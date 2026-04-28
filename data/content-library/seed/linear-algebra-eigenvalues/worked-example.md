# Worked example — eigenvalues of a 2×2 matrix

## Problem

Find the eigenvalues and eigenvectors of the matrix:

$$
A = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}
$$

## Solution

**Step 1** — Set up the characteristic equation.

$$
A - \lambda I = \begin{pmatrix} 4 - \lambda & 1 \\ 2 & 3 - \lambda \end{pmatrix}
$$

$$
\det(A - \lambda I) = (4 - \lambda)(3 - \lambda) - (1)(2) = \lambda^2 - 7\lambda + 10
$$

**Step 2** — Solve $\lambda^2 - 7\lambda + 10 = 0$.

Factoring: $(\lambda - 5)(\lambda - 2) = 0$, so $\lambda_1 = 5$ and $\lambda_2 = 2$.

**Step 3** — Sanity check using properties.

- $\lambda_1 + \lambda_2 = 5 + 2 = 7$, and $\text{tr}(A) = 4 + 3 = 7$ ✓
- $\lambda_1 \lambda_2 = 5 \cdot 2 = 10$, and $\det(A) = 4 \cdot 3 - 1 \cdot 2 = 10$ ✓

**Step 4** — Find the eigenvector for $\lambda_1 = 5$.

Solve $(A - 5I)\mathbf{v} = \mathbf{0}$:

$$
\begin{pmatrix} -1 & 1 \\ 2 & -2 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix}
$$

Both rows give $-x + y = 0$, so $y = x$. Taking $x = 1$:

$$
\mathbf{v}_1 = \begin{pmatrix} 1 \\ 1 \end{pmatrix}
$$

**Step 5** — Find the eigenvector for $\lambda_2 = 2$.

Solve $(A - 2I)\mathbf{v} = \mathbf{0}$:

$$
\begin{pmatrix} 2 & 1 \\ 2 & 1 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix}
$$

Both rows give $2x + y = 0$, so $y = -2x$. Taking $x = 1$:

$$
\mathbf{v}_2 = \begin{pmatrix} 1 \\ -2 \end{pmatrix}
$$

## Answer

Eigenvalues: $\lambda_1 = 5, \lambda_2 = 2$.
Corresponding eigenvectors: $\mathbf{v}_1 = (1, 1)^T, \mathbf{v}_2 = (1, -2)^T$.

## Verification

$A\mathbf{v}_1 = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix} \begin{pmatrix} 1 \\ 1 \end{pmatrix} = \begin{pmatrix} 5 \\ 5 \end{pmatrix} = 5 \mathbf{v}_1$ ✓

$A\mathbf{v}_2 = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix} \begin{pmatrix} 1 \\ -2 \end{pmatrix} = \begin{pmatrix} 2 \\ -4 \end{pmatrix} = 2 \mathbf{v}_2$ ✓

## Why this problem

UGEE-style. The trace-and-determinant sanity check in Step 3 is the shortcut that separates students who have memorized the mechanics from students who understand the structure — it catches arithmetic errors before you commit to them.
