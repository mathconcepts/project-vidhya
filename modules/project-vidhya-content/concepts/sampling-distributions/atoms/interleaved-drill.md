---
id: sampling-distributions.interleaved-drill
concept_id: sampling-distributions
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: sampling-distributions.micro-exercise
---

**Cross-concept check: sampling distributions → hypothesis testing.**

A machine fills packets with mean weight $\mu$; the population standard deviation is known, $\sigma=6$g. A sample of $n=36$ packets gives $\bar{x}=52$g.

**Question 1 (sampling distributions):** Since $\sigma$ is known, which distribution governs $\bar{X}$'s standardized statistic here, and what is the standard error?

*Answer:* $\sigma$ is known, so $\dfrac{\bar{X}-\mu}{\sigma/\sqrt{n}}\sim N(0,1)$ — the standard normal $Z$, not Student's $t$ (that distinction only matters when $\sigma$ is unknown). $SE=\sigma/\sqrt{n}=6/\sqrt{36}=6/6=1$.

**Question 2 (hypothesis testing):** Test $H_0:\mu=50$ against $H_1:\mu\ne50$ at $\alpha=0.05$ using this sample. What is the decision?

*Answer:* $z=\dfrac{\bar{x}-\mu_0}{SE}=\dfrac{52-50}{1}=2$. Two-tailed critical value at $\alpha=0.05$ is $1.96$; since $|2|>1.96$, **reject $H_0$** — the data are inconsistent with $\mu=50$ at the 5% level.

**Why this drill exists:** students often reach for Student's $t$ reflexively whenever a hypothesis test appears, forgetting to first check whether $\sigma$ is stated as known — as it is here. Confirming the sampling distribution BEFORE building the test statistic is the discipline this drill enforces.
