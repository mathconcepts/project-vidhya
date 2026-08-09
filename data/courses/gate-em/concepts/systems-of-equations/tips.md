# Teaching Tips: Systems of Linear Equations

## Common Student Errors
- **Confusing rank conditions**: Students often forget to distinguish between $\text{rank}(A)$ and $\text{rank}(A|b)$. The augmented matrix rank must be checked to determine consistency. If $\text{rank}(A) = \text{rank}(A|b)$, the system is consistent; otherwise, it's inconsistent.
- **Misapplying Cramer's rule**: Cramer's rule only applies when the system is square ($m = n$) and the coefficient matrix is non-singular ($\det(A) \neq 0$). Students sometimes try to use it for rectangular systems.
- **Arithmetic errors in elimination**: Gaussian elimination requires careful row operations. A single sign error or computational mistake early on propagates to the final answer.

## GATE Question Pattern
GATE system questions test: (1) solving 2×2 and 3×3 systems using elimination or Cramer's rule; (2) analyzing consistency and the number of solutions via rank; (3) counting free variables using rank-nullity; (4) homogeneous systems (where $b = 0$). Most questions are MCQ; NAT questions ask for specific components of the solution.

## Speed Tricks for MCQs
- **Use rank arguments first**: Before solving, determine $\text{rank}(A)$ and $\text{rank}(A|b)$. This immediately tells you if there's a unique solution, infinitely many, or no solution—often the question asks only this.
- **Cramer's rule for 2×2**: For small systems, Cramer's rule is faster than elimination if you can quickly compute the two $2 \times 2$ determinants.
- **Check for dependent rows**: If row 2 is a multiple of row 1 (same on both sides of the augmented matrix), the system reduces to fewer independent equations. This is a quick visual check.

## Must-Memorize Formulas / Results
- **Matrix form**: $Ax = b$, where $A$ is the coefficient matrix
- **Consistency condition**: $\\text{rank}(A) = \\text{rank}(A|b)$ iff the system is consistent
- **Solution classification**:
  - $\\text{rank}(A) = \\text{rank}(A|b) = n$ → unique solution
  - $\\text{rank}(A) = \\text{rank}(A|b) < n$ → infinitely many solutions
  - $\\text{rank}(A) < \\text{rank}(A|b)$ → no solution
- **Rank-nullity theorem**: $\\text{rank}(A) + \\text{nullity}(A) = n$ (for $n$ columns)
- **Cramer's rule**: For square $Ax = b$ with $\\det(A) \\neq 0$: $x_i = \\frac{\\det(A_i)}{\\det(A)}$, where $A_i$ has column $i$ replaced by $b$
- **Homogeneous solution**: For $Ax = 0$ (homogeneous system), there's always at least the trivial solution $x = 0$; non-trivial solutions exist iff $\\text{rank}(A) < n$
