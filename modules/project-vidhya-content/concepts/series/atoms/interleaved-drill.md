---
id: series.interleaved_drill
concept_id: series
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: series.micro-exercise
---

**Cross-concept check: series → limits.**

Consider $\sum_{n=1}^{\infty} \dfrac{n^2}{3^n}$.

**Question 1 (series):** Apply the ratio test. What limit do you need to compute?

*Answer:* $L=\lim_{n\to\infty}\left|\dfrac{a_{n+1}}{a_n}\right|=\lim_{n\to\infty}\dfrac{(n+1)^2}{3n^2}$ — the ratio test doesn't finish the problem, it *hands you* a limit to evaluate.

**Question 2 (limits):** Evaluate $\displaystyle\lim_{n\to\infty}\dfrac{(n+1)^2}{3n^2}$.

*Answer:* Divide numerator and denominator by $n^2$: $\dfrac{(1+1/n)^2}{3}\to\dfrac{1}{3}$ as $n\to\infty$. Since $\dfrac13<1$, the series converges.

**Why this drill exists:** every ratio/root test question is secretly two questions stapled together — set up the ratio (series), then actually take the limit (limits). Students who can state the ratio test correctly still lose the mark by mishandling the limit itself, most often by not dividing through by the highest power of $n$ first.
