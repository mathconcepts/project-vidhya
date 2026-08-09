---
id: matrix-inverse.formal-definition
concept_id: matrix-inverse
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Matrix Inverse**: For a square matrix $A \in \mathbb{R}^{n \times n}$, the inverse $A^{-1}$ is the unique matrix satisfying:
$$AA^{-1} = A^{-1}A = I$$

where $I$ is the $n \times n$ identity matrix.

**Condition for Invertibility**: A matrix $A$ is invertible if and only if $\det(A) \neq 0$ (i.e., $A$ is non-singular).

**Formula for 2×2 Inverse**: For $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$ with $\det(A) = ad - bc \neq 0$:
$$A^{-1} = \frac{1}{ad - bc} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$$

**General Formula (Adjugate Method)**: For any $n \times n$ matrix:
$$A^{-1} = \frac{1}{\det(A)} \text{adj}(A)$$

where $\text{adj}(A)$ is the adjugate matrix (transpose of the cofactor matrix).
