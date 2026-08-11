---
id: cayley-hamilton.common-traps
concept_id: cayley-hamilton
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Sign mistakes in the characteristic polynomial**: Students often write $\det(A - \lambda I)$ instead of $\det(\lambda I - A)$. Both have the same roots, but the signs of coefficients differ. Be consistent.
- **Forgetting to substitute the matrix for $\lambda$**: When substituting $A$ into the characteristic polynomial, replace $\lambda$ with $A$ and scalars with scalar multiples of $I$. Students sometimes forget the identity matrices.
- **Confusing the relation**: Cayley-Hamilton says $p(A) = 0$ where $p$ is the characteristic polynomial. It doesn't say $\det(A - \lambda I) = 0$ when you substitute $A$—that's circular and nonsensical.
