---
id: recurrence-relations.common-traps
concept_id: recurrence-relations
atom_type: common_traps
bloom_level: 3
difficulty: 0.6
exam_ids: ["*"]
---

**Trap 1 — Repeated root, single term.** A repeated characteristic root $r$ does NOT give $a_n=(A+B)r^n$ (which collapses to one constant); the second independent solution is $n\cdot r^n$, giving $a_n=(A+Bn)r^n$.

**Trap 2 — Ignoring the forcing term.** For $a_n=c_1a_{n-1}+c_2a_{n-2}+f(n)$ with $f(n)\ne0$, the homogeneous solution alone won't satisfy the recurrence for $n\ge2$ — a particular solution matching $f(n)$'s form must be added.

**Trap 3 — Off-by-one indexing.** Confusing $a_0,a_1$ as "the first two terms" versus $a_1,a_2$ shifts every later index; re-derive $a_2$ from the stated recurrence and initial conditions as a check rather than assuming a convention.

**Trap 4 — Resonance in the particular-solution guess.** If the guessed particular-solution form already matches part of the homogeneous solution, it must be multiplied by $n$ (or $n^2$) before solving — the un-multiplied guess gives an inconsistent system.
