---
id: cayley-hamilton.retrieval-prompt
concept_id: cayley-hamilton
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Use Cayley-Hamilton to find $A^{-1}$ for $A = \begin{pmatrix} 1 & 2 \\ 1 & 3 \end{pmatrix}$.

- **(A)** $A^{-1} = \frac{1}{-1}(I - A) = A - I$
- **(B)** $A^{-1} = \frac{1}{-1}(4I - A) = A - 4I$
- **(C)** $A^{-1} = \frac{1}{1}(4I - A) = 4I - A$
- **(D)** $A^{-1} = \frac{1}{1}(A - I) = A - I$

<details>
<summary>Answer</summary>

**C**. Characteristic polynomial:
$\det(\lambda I - A) = \det \begin{pmatrix} \lambda - 1 & -2 \\ -1 & \lambda - 3 \end{pmatrix} = (\lambda - 1)(\lambda - 3) - 2 = \lambda^2 - 4\lambda + 3 - 2 = \lambda^2 - 4\lambda + 1$.

By Cayley-Hamilton: $A^2 - 4A + I = 0$, so $A^2 + I = 4A$.

Rearranging: $I = 4A - A^2 = A(4I - A)$.

Therefore, $A^{-1} = 4I - A = \begin{pmatrix} 4 & 0 \\ 0 & 4 \end{pmatrix} - \begin{pmatrix} 1 & 2 \\ 1 & 3 \end{pmatrix} = \begin{pmatrix} 3 & -2 \\ -1 & 1 \end{pmatrix}$.

Verify: $\det(A) = 1 \cdot 3 - 2 \cdot 1 = 1$, and $A^{-1} = \frac{1}{1}\begin{pmatrix} 3 & -2 \\ -1 & 1 \end{pmatrix}$, which matches.

</details>
