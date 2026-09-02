---
id: determinants.formal-definition
concept_id: determinants
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**$2\times2$**: for $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$, $\det(A) = ad - bc$.

**$3\times3$, expansion along row 1**: for $A = \begin{pmatrix} a & b & c \\ d & e & f \\ g & h & i \end{pmatrix}$,

$$\det(A) = a(ei-fh) - b(di-fg) + c(dh-eg)$$

**General property**: $\det(A) = 0$ **iff** $A$ is **singular** (non-invertible) — its rows (equivalently columns) are linearly dependent.

**Method selector.** Expand along whichever row or column already has the most zeros — that eliminates entire cofactor computations before they start. When no row or column has a zero, or the matrix is $4\times4$ or larger, row-reduce to triangular form and multiply the diagonal instead: cofactor expansion costs $O(n!)$ operations while row reduction costs $O(n^3)$, and the gap is not close once $n>3$. The tempting wrong method here is extending the $3\times3$ Sarrus rule (criss-cross diagonals) to a $4\times4$ matrix — it silently gives a wrong number, because a $4\times4$ determinant has $24$ terms, not the $8$ that diagonal criss-crossing would produce.
