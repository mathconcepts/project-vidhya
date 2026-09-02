---
id: random-variables.interleaved-drill
concept_id: random-variables
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: random-variables → discrete-distributions.**

$X$ has PMF $P(X=1)=0.2,\ P(X=2)=0.3,\ P(X=3)=0.5$, with $E[X]=2.3$.

**Question 1 (random-variables):** Is this PMF consistent with $X$ being Binomial for some $n,p$?

*Answer:* No — a Binomial PMF over 3 values would need support $\{0,1,2\}$ and a specific shape governed by a single $p$; this PMF's three arbitrary weights aren't forced by any single-parameter formula, so $X$ here is a general discrete variable, not a named distribution.

**Question 2 (discrete-distributions):** If instead $X\sim\text{Binomial}(n=2,\ p=0.5)$, what is the PMF over $X=0,1,2$, and does it match?

*Answer:* $P(X=0)=0.25,\ P(X=1)=0.5,\ P(X=2)=0.25$ — symmetric, unlike the original table. Confirms they're different distributions with different means ($E[X]=1$ for this Binomial vs. $2.3$ above).

**Why this drill exists:** students sometimes assume any 3-value PMF must secretly be one of the named distributions from the next concept — this drill shows a PMF can be perfectly valid (sums to 1, non-negative) while matching no standard family at all.
