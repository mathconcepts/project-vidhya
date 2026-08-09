---
id: determinants.formal-definition
concept_id: determinants
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Determinant of a 2×2 Matrix**: For $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$:
$$\det(A) = ad - bc$$

**Determinant of a 3×3 Matrix (Expansion along row 1)**: For $A = \begin{pmatrix} a & b & c \\ d & e & f \\ g & h & i \end{pmatrix}$:
$$\det(A) = a \begin{vmatrix} e & f \\ h & i \end{vmatrix} - b \begin{vmatrix} d & f \\ g & i \end{vmatrix} + c \begin{vmatrix} d & e \\ g & h \end{vmatrix}$$
$$= a(ei - fh) - b(di - fg) + c(dh - eg)$$

**General Property**: $\det(A) = 0$ if and only if the matrix is **singular** (non-invertible). The rows or columns are linearly dependent.
