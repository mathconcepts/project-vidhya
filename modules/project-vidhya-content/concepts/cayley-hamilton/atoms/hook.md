---
id: cayley-hamilton.hook
concept_id: cayley-hamilton
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

Take $A = \begin{pmatrix}1&1\\0&2\end{pmatrix}$ and find its characteristic polynomial, $\lambda^2 - 3\lambda + 2$. Now do the thing that should not even typecheck: substitute the matrix itself for $\lambda$. Out comes the zero matrix. Every square matrix annihilates its own characteristic polynomial, and that single fact hands you $A^{-1}$ and every power of $A$ without a cofactor in sight.
