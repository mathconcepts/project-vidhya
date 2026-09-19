---
id: statistics-jee.intuition-shaken
concept_id: statistics-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
variant_of: statistics-jee.intuition
for_stance: shaken
---

**Spread, in one sentence.** Two datasets can share the same mean and still look completely different — spread measures how far the values typically sit from that shared mean.

**Why raw deviations don't work.** Take data $2,4,6,8,10$, mean $6$. Deviations: $-4,-2,0,2,4$. Add them: $-4-2+0+2+4=0$. Always zero — the signs cancel. You must remove the signs before averaging.

**Mean deviation: use absolute value.** $\text{MD}=\dfrac{\sum|x-\bar x|}{n}$. For the data above: $|-4|+|-2|+|0|+|2|+|4|=12$, divided by $5$: $\text{MD}=2.4$.

**Variance: square instead.** $\text{Var}=\dfrac{\sum(x-\bar x)^2}{n}$. For the same data: $16+4+0+4+16=40$, divided by $5$: $\text{Var}=8$.

**Standard deviation: undo the square.** $\text{SD}=\sqrt{\text{Var}}=\sqrt8\approx2.83$. This is back in the same units as the original data.

**Coefficient of variation: turn it into a percentage.** $\text{CV}=\dfrac{\text{SD}}{\text{mean}}\times100=\dfrac{2.83}{6}\times100\approx47.1\%$.

**Grouped data:** same formulas, but use the MIDPOINT of each class interval as $x$, and weight each term by its frequency $f$, dividing by the total frequency $N$ instead of $n$.
