---
id: cayley-hamilton.formal-definition
concept_id: cayley-hamilton
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Cayley-Hamilton Theorem**: For any square matrix $A \in \mathbb{R}^{n \times n}$, the characteristic polynomial $p(\lambda) = \det(\lambda I - A)$ satisfies:
$$p(A) = 0$$

Equivalently, if $p(\lambda) = \lambda^n + c_{n-1}\lambda^{n-1} + \cdots + c_1\lambda + c_0$, then:
$$A^n + c_{n-1}A^{n-1} + \cdots + c_1A + c_0I = 0$$

**Application: Matrix Powers**: From the characteristic equation, we can express $A^n$ as a linear combination of lower powers of $A$. This gives a way to compute high powers efficiently without diagonalization.

**Application: Inverse**: If $A$ is invertible, the Cayley-Hamilton equation can be rearranged to find $A^{-1}$ as a polynomial in $A$.
