---
id: matrices-and-determinants.exam-pattern
concept_id: matrices-and-determinants
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How JEE actually asks this.**

- **MCQ/MSQ: the property table.** Know these cold: $\det(A^T)=\det(A)$, $\det(AB)=\det(A)\det(B)$, $\det(kA)=k^n\det(A)$ for an $n\times n$ matrix, $\det(A^{-1})=1/\det(A)$.

- **NAT: find the inverse of a $2\times2$ or $3\times3$ matrix,** using the "swap, sign, split" shortcut for $2\times2$, or the full adjoint-over-determinant formula for $3\times3$.

- **NAT: for what value of a parameter does the system have a unique / no / infinite solution.** Compute $\Delta$ as a function of the parameter, and check where it equals zero — but do not stop there for the no-solution vs. infinite-solutions call.

- **Trap: $\Delta=0$ alone never decides between "no solution" and "infinitely many."** Check $\Delta_x,\Delta_y,\Delta_z$ (all zero: infinite or none, needs rank; any nonzero: no solution) — this exact trap is a favourite of JEE Main.

- **NAT: a determinant with a variable, "find $x$ such that $\det=0$."** Expand symbolically, set to zero, and solve — this is an algebra problem wearing a determinant's clothes.

- **Time budget:** under $90$ seconds for a $3\times3$ NAT determinant or inverse; up to $2$ minutes for a consistency question, since it needs the extra $\Delta_x,\Delta_y,\Delta_z$ check.
