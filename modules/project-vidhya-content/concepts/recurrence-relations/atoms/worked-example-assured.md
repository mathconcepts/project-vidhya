---
# Alternative body for recurrence-relations.worked-example, stance `assured`.
id: recurrence-relations.worked-example.assured
concept_id: recurrence-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
scaffold_fade: true
variant_of: recurrence-relations.worked-example
for_stance: assured
---

**Problem:** Solve $a_n=5a_{n-1}-6a_{n-2}$, $a_0=2,\ a_1=5$; evaluate $a_4$.

Characteristic equation $x^2-5x+6=(x-2)(x-3)=0$: roots $2,3$, distinct — go straight to $a_n=A\cdot2^n+B\cdot3^n$.

Fit: $A+B=2,\ 2A+3B=5 \Rightarrow A=1,B=1$.

$$\boxed{a_n=2^n+3^n,\quad a_4=2^4+3^4=97}$$

**Worth knowing:** had the discriminant been zero (a repeated root $r$), the ansatz $A\cdot r^n+B\cdot r^n$ collapses to one constant and can't satisfy two independent initial conditions — the correct form there is $a_n=(A+Bn)r^n$, the extra factor of $n$ carrying the second degree of freedom.
