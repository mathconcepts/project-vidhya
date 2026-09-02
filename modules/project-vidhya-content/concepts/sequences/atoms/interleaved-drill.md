---
id: sequences.interleaved_drill
concept_id: sequences
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: sequences.micro-exercise
---

**Cross-concept check: sequences → series.**

Take the sequence $a_n = \dfrac1n$.

**Question 1 (sequences):** Does $(a_n)$ converge, and to what?

*Answer:* Yes — $a_n=\dfrac1n\to 0$ as $n\to\infty$. Decreasing and bounded below by $0$, so this also follows from the Monotone Convergence Theorem.

**Question 2 (series):** Now build the series $\sum_{n=1}^{\infty} a_n = \sum_{n=1}^{\infty}\dfrac1n$ from that same sequence. Does it converge?

*Answer:* No — this is the harmonic series, and it **diverges**, even though its own terms shrink to $0$. Partial sums grow like $\ln N$, without bound.

**Why this drill exists:** "the terms go to $0$" is the single most tempting-but-wrong justification students give for a series converging. It is a *necessary* condition (the $n$-th term test) — a series whose terms don't shrink to $0$ certainly diverges — but the harmonic series is the standard counterexample proving it is never *sufficient* on its own.
