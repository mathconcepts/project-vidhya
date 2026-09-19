---
id: statistics-jee.intuition
concept_id: statistics-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

**What "spread" even means.** The mean tells you the centre of a dataset. Spread tells you how far the individual values typically sit from that centre — a dataset can have the same mean as another and still be far more (or less) reliable, exactly like the two rainfall cities above.

**Why not just average the raw deviations $(x-\bar x)$?** Because that average is always exactly zero — positive deviations and negative deviations cancel perfectly, by the very definition of the mean. To measure spread you must first get rid of the signs.

**Mean deviation vs. variance — two different ways to kill the sign.** Mean deviation takes the ABSOLUTE VALUE of each deviation before averaging: $\text{MD}=\dfrac{\sum|x-\bar x|}{n}$. Variance SQUARES each deviation instead: $\text{Var}=\dfrac{\sum(x-\bar x)^2}{n}$. Squaring does more than remove the sign — it also punishes large deviations far more than small ones, which is why variance is the measure used almost everywhere in statistics, mean deviation being the simpler, less-used cousin.

**Standard deviation brings the units back.** Variance is measured in SQUARED units (rainfall in mm² makes no physical sense), so standard deviation, $\text{SD}=\sqrt{\text{Var}}$, undoes the squaring and returns spread to the original units.

**Coefficient of variation compares apples to oranges.** $\text{CV}=\dfrac{\text{SD}}{\text{mean}}\times100$ turns spread into a percentage, which is the only fair way to compare the variability of two datasets that don't share the same mean or the same units.

**Grouped data changes only the bookkeeping, not the idea.** With data organised into class intervals and frequencies, every formula above still applies — you just replace each raw value $x$ with its class MIDPOINT, and weight every deviation by how many observations $(f)$ fall in that class before dividing by the total frequency $N$.
