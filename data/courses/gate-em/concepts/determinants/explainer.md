# Determinants

> GATE Engineering Mathematics | Linear Algebra | high frequency | difficulty: 0.3

## Intuition First
The determinant is a single number that tells you whether a transformation "stretches" (positive det), "flips" (negative det), or "crushes" the space to zero (det = 0). It's the factor by which the transformation scales volumes.

## Core Definition
**Determinant of a 2×2 Matrix**: For $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$:
$$\det(A) = ad - bc$$

**Determinant of a 3×3 Matrix (Expansion along row 1)**: For $A = \begin{pmatrix} a & b & c \\ d & e & f \\ g & h & i \end{pmatrix}$:
$$\det(A) = a \begin{vmatrix} e & f \\ h & i \end{vmatrix} - b \begin{vmatrix} d & f \\ g & i \end{vmatrix} + c \begin{vmatrix} d & e \\ g & h \end{vmatrix}$$
$$= a(ei - fh) - b(di - fg) + c(dh - eg)$$

**General Property**: $\det(A) = 0$ if and only if the matrix is **singular** (non-invertible). The rows or columns are linearly dependent.

## What Happens (Worked Example)

Label: "**What happens:**"

Consider $A = \begin{pmatrix} 2 & 3 \\ 1 & 4 \end{pmatrix}$.

$$\det(A) = 2 \cdot 4 - 3 \cdot 1 = 8 - 3 = 5$$

For a 3×3 example, let $B = \begin{pmatrix} 1 & 2 & 3 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{pmatrix}$ (upper triangular).

$$\det(B) = 1 \cdot \begin{vmatrix} 1 & 2 \\ 0 & 1 \end{vmatrix} - 2 \cdot \begin{vmatrix} 0 & 2 \\ 0 & 1 \end{vmatrix} + 3 \cdot \begin{vmatrix} 0 & 1 \\ 0 & 0 \end{vmatrix}$$
$$= 1(1 - 0) - 2(0 - 0) + 3(0 - 0) = 1$$

Geometrically: The vectors $(1, 0, 0)$, $(2, 1, 0)$, and $(3, 2, 1)$ form a box with volume 1.

Label: "**Why it works:**"

The determinant measures signed volume. When $\det(A) = 0$, the transformation collapses at least one dimension to zero—the matrix is singular and non-invertible. When $|\det(A)| > 1$, volumes expand; when $0 < |\det(A)| < 1$, volumes shrink. The sign indicates orientation: $\det(A) < 0$ means the transformation reverses the handedness of the coordinate system.

## GATE MA Relevance
> **Why it matters in GATE MA:** Determinants appear in 8–12% of Linear Algebra questions. GATE tests: (1) direct computation for 2×2 and 3×3 matrices; (2) properties like $\det(AB) = \det(A)\det(B)$ and $\det(A^T) = \det(A)$; (3) identifying singular matrices; (4) Cramer's rule for system solutions. Most are MCQ with numerical answers.
