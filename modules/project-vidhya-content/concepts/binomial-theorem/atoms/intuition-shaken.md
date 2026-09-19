---
id: binomial-theorem.intuition-shaken
concept_id: binomial-theorem
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
variant_of: binomial-theorem.intuition
for_stance: shaken
---

**General term formula:** $T_{r+1} = \binom{n}{r}a^{n-r}b^r$. Start counting from $r=0$: that gives the FIRST term, $a^n b^0$. So the term label is always one more than $r$. If you want the 4th term, set $r=3$, not $r=4$.

**Middle term, worked as a small case.** Take $n=6$: there are $n+1=7$ terms, an odd number, so one sits exactly in the middle — the 4th term, since $\frac{6}{2}+1=4$. Take $n=5$ instead: there are $6$ terms, an even number, so two terms share the middle — the 3rd and the 4th.

**Greatest coefficient, worked as a small case.** For $n=6$: $\binom{6}{0}=1$, $\binom{6}{1}=6$, $\binom{6}{2}=15$, $\binom{6}{3}=20$, then it falls back down: $\binom{6}{4}=15$, $\binom{6}{5}=6$, $\binom{6}{6}=1$. The peak, $20$, is at $r=3$ — the middle term. This tells you about the coefficient only, not about the size of the actual term once $a$ and $b$ are real numbers.
