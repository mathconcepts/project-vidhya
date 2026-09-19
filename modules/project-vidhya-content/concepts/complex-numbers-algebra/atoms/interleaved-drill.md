---
id: complex-numbers-algebra.interleaved-drill
concept_id: complex-numbers-algebra
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
tested_by_atom: complex-numbers-algebra.micro-exercise
---

**Cross-concept check: complex-numbers-algebra → sequences-series.**

**Question 1 (cube roots of unity as a geometric progression):** $1, \omega, \omega^2$ form a geometric progression with first term $1$ and common ratio $\omega$. Use the GP sum formula to re-derive $1+\omega+\omega^2=0$, instead of adding the coordinates directly.

*Answer:* The sum of $n$ terms of a GP with first term $a$ and ratio $r \ne 1$ is $S_n = \dfrac{a(r^n-1)}{r-1}$. Here $a=1$, $r=\omega$, $n=3$: $S_3 = \dfrac{\omega^3-1}{\omega-1}$. Since $\omega^3=1$, the numerator is $1-1=0$, and $\omega \ne 1$ so the denominator is safely nonzero. So $S_3=0$ — the same identity, reached through the sequences-series formula instead of adding coordinates by hand.

**Question 2 (why this only works because $\omega \ne 1$):** Would the same GP-sum argument work if the ratio were $1$ instead of $\omega$?

*Answer:* No — the GP sum formula $\dfrac{a(r^n-1)}{r-1}$ divides by $r-1$, which is exactly zero when $r=1$. A GP with ratio $1$ is just the constant sequence $1,1,1$, whose sum is trivially $3$, not $0$ — a completely different formula applies (sum $=na$) whenever $r=1$. The fact that $\omega \ne 1$ is not a minor detail; it is what keeps the division valid.

**Why this drill exists:** treating "sum of the cube roots of unity" as a purely complex-numbers fact hides that it is secretly a finite geometric series in disguise — the same GP-sum formula from sequences-series, applied to a ratio that happens to be a complex number instead of a real one.
