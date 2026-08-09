---
id: recurrence-relations.common-traps
concept_id: recurrence-relations
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting to apply initial conditions**: Students solve the characteristic equation correctly but forget to use $a_0, a_1, \ldots$ to determine the constants $A_1, A_2, \ldots$ in the general solution. Without this step, the answer is a family of solutions, not the unique solution. **Check**: Always plug initial conditions back into the final answer.
- **Algebraic errors in the characteristic equation**: Common mistakes: writing $r^n = c_1 r^{n-1} + \cdots$ without simplifying, or incorrectly moving terms. Always **divide through by $r^{n-k}$** first to get a polynomial equation of degree $k$, not a transcendental equation.
- **Confusing repeated roots**: When the characteristic equation has a repeated root $r$ of multiplicity $m$, the solution includes terms like $(A_1 + A_2 n + A_3 n^2 + \cdots + A_m n^{m-1}) r^n$, NOT just $A \cdot r^n$. Forgetting the polynomial factor is a critical error.
