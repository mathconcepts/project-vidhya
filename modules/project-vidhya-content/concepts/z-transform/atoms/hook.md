---
id: z-transform.hook
concept_id: z-transform
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

A digital filter never sees a waveform. It sees sample $n$, then $n+1$, then $n+2$ — and Laplace has nothing to grip. Swap $e^{st}$ for $z^{-n}$ and the same manoeuvre works on sequences: a recurrence relation becomes an algebraic equation, you solve it in the $z$-domain, and you transform back.
