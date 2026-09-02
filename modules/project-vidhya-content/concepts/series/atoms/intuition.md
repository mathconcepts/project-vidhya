---
id: series.intuition
concept_id: series
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

A series $\sum a_n$ is really a disguise. Strip the disguise off and what's underneath is the sequence of **partial sums** $S_N = a_1+a_2+\cdots+a_N$ — one new number per $N$, exactly the kind of sequence already studied. "The series converges" means nothing more or less than "the sequence $(S_N)$ converges." Every convergence test for series is secretly a shortcut for predicting the fate of that hidden sequence without writing out every partial sum by hand.

That reframing explains a fact that otherwise looks contradictory: infinitely many *positive* numbers can add to a *finite* total. $\sum \frac{1}{2^n}$ never overshoots $1$ because each new partial sum climbs by a smaller amount than the one before — the increments themselves shrink fast enough that the running total's climb tapers off before it can escape any fixed ceiling.

Contrast $\sum \frac1n$. Its terms shrink too, just not fast enough — the partial sums keep climbing without ever tapering off, drifting past every ceiling however slowly. Same shape of "terms getting smaller," two entirely different fates for the running total. The rate the terms shrink at, not merely that they shrink, is what a convergence test is really measuring.
