# Teaching Tips: Matrix Inverse

## Common Student Errors
- **Forgetting the determinant condition**: Students sometimes try to invert a singular matrix (one with $\det(A) = 0$). Always check $\det(A) \neq 0$ first.
- **Sign errors in the 2×2 formula**: In $A^{-1} = \frac{1}{ad - bc} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$, the signs on $b$ and $c$ are negated—students often get this wrong and compute $\begin{pmatrix} d & b \\ c & a \end{pmatrix}$ instead.
- **Order matters in $(AB)^{-1}$**: Students confuse $(AB)^{-1} = B^{-1}A^{-1}$ (order reversed) with $(AB)^{-1} = A^{-1}B^{-1}$ (order unchanged). The reversal is critical—matrix multiplication doesn't commute.

## GATE Question Pattern
GATE inverse questions test: (1) direct computation of 2×2 inverses; (2) recognizing non-invertible matrices; (3) properties like $\det(A^{-1}) = \frac{1}{\det(A)}$ and $(AB)^{-1} = B^{-1}A^{-1}$; (4) using $A^{-1}$ to solve $Ax = b$ systems. Most are MCQ; NAT questions on specific entries of $A^{-1}$ appear occasionally.

## Speed Tricks for MCQs
- **Use the 2×2 formula**: For $2 \times 2$ matrices, memorize the formula and apply it directly. This is faster than any other method.
- **Check determinant first**: Before attempting to compute an inverse, calculate $\det(A)$ quickly. If it's zero, the inverse doesn't exist—eliminate those answer choices.
- **Verify with $AA^{-1} = I$**: If you've computed $A^{-1}$, multiply it back by $A$ to check. Only verify the first row or first column if short on time.

## Must-Memorize Formulas / Results
- **2×2 inverse formula**: $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$ (where $ad - bc \\neq 0$)
- **Invertibility condition**: $A$ is invertible iff $\\det(A) \\neq 0$
- **Determinant of inverse**: $\\det(A^{-1}) = \\frac{1}{\\det(A)}$
- **Product inverse property**: $(AB)^{-1} = B^{-1}A^{-1}$ (order reversed)
- **Transpose of inverse**: $(A^{-1})^T = (A^T)^{-1}$
- **Identity property**: $AA^{-1} = A^{-1}A = I$
- **Double inverse**: $(A^{-1})^{-1} = A$
- **Scalar multiple inverse**: $(cA)^{-1} = \\frac{1}{c} A^{-1}$ (for non-zero scalar $c$)
