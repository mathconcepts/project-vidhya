---
id: matrix-inverse.formal-definition
concept_id: matrix-inverse
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Matrix inverse**: for $A \in \mathbb{R}^{n \times n}$, $A^{-1}$ is the unique matrix satisfying

$$AA^{-1} = A^{-1}A = I$$

**Condition for invertibility**: $A$ is invertible iff $\det(A) \neq 0$ (non-singular).

**Formula, $2\times2$**: for $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$ with $\det(A) = ad-bc \neq 0$,

$$A^{-1} = \frac{1}{ad-bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$$

**General formula (adjugate method)**: $A^{-1} = \frac{1}{\det(A)}\text{adj}(A)$, where $\text{adj}(A)$ is the transpose of the cofactor matrix.

**Method selector.** Use the $2\times2$ shortcut or the adjugate formula only up to $3\times3$ — beyond that, Gauss-Jordan elimination on $[A \mid I]$ is the practical method, since the adjugate needs $n^2$ cofactor determinants and cofactor cost itself grows as $O(n!)$. The tempting wrong method for solving $Ax=b$ is computing $A^{-1}$ first and multiplying: for a single right-hand side this is slower and drops more signs than row-reducing $[A \mid b]$ directly — building $A^{-1}$ only pays off when the same $A$ is reused across several different $b$'s.
