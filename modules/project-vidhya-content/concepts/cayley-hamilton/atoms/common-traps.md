---
id: cayley-hamilton.common-traps
concept_id: cayley-hamilton
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Sign mix-up in the characteristic polynomial.** The characteristic polynomial comes from $\det(A - \lambda I)$ — solving it gives you the eigenvalues, the special numbers that tell you how the matrix stretches or shrinks vectors. Students often write $\det(A - \lambda I)$ in one step and $\det(\lambda I - A)$ in another. Both give the same roots, but the signs of the coefficients flip between the two forms. Pick one and stay consistent all the way through.
- **Forgetting to swap in the matrix for $\lambda$.** Cayley-Hamilton says a matrix satisfies its own characteristic polynomial. So every $\lambda$ term becomes an $A$ term, and every plain number (a constant with no $\lambda$) becomes that number times $I$, the identity matrix — the matrix version of the number 1. Students often remember to replace $\lambda$ with $A$ but forget the $I$ on a lone constant. Skip that $I$, and you're adding a number straight to a matrix, which is meaningless.
- **Mixing up the two different equations.** Cayley-Hamilton says $p(A) = 0$: plug the matrix $A$ itself into the characteristic polynomial $p$, and you land on the zero matrix. That's a different statement from $\det(A - \lambda I) = 0$, which is how you found the eigenvalues to begin with. Once $A$ replaces $\lambda$, there's no determinant left to compute — so writing $\det(A - \lambda I) = 0$ "with $A$ plugged in" is circular. It doesn't actually say anything.
