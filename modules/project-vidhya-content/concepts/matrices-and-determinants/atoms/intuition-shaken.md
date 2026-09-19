---
id: matrices-and-determinants.intuition-shaken
concept_id: matrices-and-determinants
atom_type: intuition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
variant_of: matrices-and-determinants.intuition
for_stance: shaken
---

**Determinant.** One number attached to a square matrix $A$. $\det(A)\neq0$: $A$ can be inverted. $\det(A)=0$: $A$ is called singular, and it cannot be inverted, no matter how hard you try.

**Inverse from the adjoint.** $A^{-1}=\dfrac{1}{\det(A)}\text{adj}(A)$. Read this formula left to right: first compute $\det(A)$, check it is not $0$, then compute $\text{adj}(A)$ (built from cofactors, then transposed), then divide.

**Systems of equations, worked as a rule.** Write the equations as $Ax=b$. Step 1: compute $\det(A)$. Step 2: if $\det(A)\neq0$, the system has exactly one solution, $x=A^{-1}b$. Step 3: if $\det(A)=0$, stop — you cannot conclude "no solution" yet. You must check the right-hand side $b$ separately before deciding between "infinitely many solutions" and "no solution."

**Elementary row operations, one at a time.** Swap two rows: determinant flips sign. Multiply a row by $k$: determinant multiplies by $k$. Add a multiple of one row to another: determinant does not change at all — this is the one operation safe to use as often as needed.
