---
id: root-finding.common-traps
concept_id: root-finding
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

**Trap 1 — Sign error in Newton-Raphson.** Many students write $x_{n+1}=x_n+f(x_n)/f'(x_n)$, plus instead of minus. Geometric check: if $f(x_n)>0$ and $f'(x_n)>0$, the tangent's zero lies to the left, so $x_{n+1}$ must be less than $x_n$ — the minus sign is what makes that happen.

**Trap 2 — Confusing convergence rates.** Bisection is linear, Newton-Raphson is quadratic. Students memorize "Newton is faster" without weighing how much: after 10 iterations bisection's error is around $10^{-3}$ of the original bracket, Newton's is astronomically smaller — quadratic vs. linear is not a small edge.

**Trap 3 — Assuming $f'(x)\neq0$ always holds.** Newton-Raphson degrades to linear convergence (or fails entirely) at a repeated root, where $f'(x^*)=0$. A question asking "which method is safest with no information about multiplicity?" is pointing at bisection.
