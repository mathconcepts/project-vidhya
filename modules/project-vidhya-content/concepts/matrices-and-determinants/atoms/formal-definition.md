---
id: matrices-and-determinants.formal-definition
concept_id: matrices-and-determinants
atom_type: formal_definition
bloom_level: 2
difficulty: 0.45
exam_ids: ["*"]
---

**Determinant, $2\times2$**: for $A=\begin{pmatrix}a&b\\c&d\end{pmatrix}$, $\det(A)=ad-bc$.

**Determinant properties**: $\det(A^T)=\det(A)$. $\det(AB)=\det(A)\det(B)$. $\det(kA)=k^n\det(A)$ for an $n\times n$ matrix. Swapping two rows (or columns) flips the sign of the determinant. Adding a multiple of one row to another leaves the determinant unchanged.

**Adjoint**: $\text{adj}(A)$ is the transpose of the cofactor matrix of $A$ — the cofactor matrix's $(i,j)$ entry is $C_{ij}=(-1)^{i+j}M_{ij}$, where $M_{ij}$ is the minor obtained by deleting row $i$ and column $j$.

**Inverse**: $A^{-1}=\dfrac{1}{\det(A)}\text{adj}(A)$, defined exactly when $\det(A)\neq0$.

**Consistency of $Ax=b$ (three equations, three unknowns), via Cramer's rule.** Let $\Delta=\det(A)$, and let $\Delta_x,\Delta_y,\Delta_z$ be the determinants formed by replacing the $x$-, $y$-, $z$-column of $A$ with $b$.

- $\Delta\neq0$: unique solution, $x=\Delta_x/\Delta$, $y=\Delta_y/\Delta$, $z=\Delta_z/\Delta$.
- $\Delta=0$ and $\Delta_x=\Delta_y=\Delta_z=0$: either infinitely many solutions or no solution — check the rank of the augmented matrix to decide which.
- $\Delta=0$ and at least one of $\Delta_x,\Delta_y,\Delta_z\neq0$: no solution (the system is inconsistent).

**Method selector.** Use Cramer's rule when only the SOLUTION is wanted and $n$ is small ($2$ or $3$); use row reduction (Gaussian elimination) when only the NATURE of the solution (consistent/inconsistent, unique/infinite) is wanted, since row reduction reveals rank directly without computing four separate determinants. The tempting wrong method is computing $A^{-1}$ first whenever $\det(A)=0$ — the formula is undefined there, and no amount of care rescues it; row reduction is the only route once $\Delta=0$.
