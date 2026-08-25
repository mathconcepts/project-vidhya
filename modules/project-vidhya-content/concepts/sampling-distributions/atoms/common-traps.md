---
id: sampling-distributions.common-traps
concept_id: sampling-distributions
atom_type: common_traps
bloom_level: 2
difficulty: 0.50
exam_ids: ["*"]
---

- **Using $z$ instead of $t$ when $\sigma$ is unknown:** this is the single most common error in this topic. If the problem gives you a *sample* standard deviation $s$ (not the true population $\sigma$) and the sample isn't very large, you must use the $t$-distribution with $n-1$ degrees of freedom — not the standard normal table.
- **Confusing standard deviation with standard error:** $\sigma$ (or $s$) describes spread in a single observation; the standard error $\sigma/\sqrt{n}$ describes spread in the *sample mean*. Forgetting to divide by $\sqrt{n}$ silently produces a confidence interval that's far too wide.
- **Wrong degrees of freedom:** using $n$ instead of $n-1$ for a one-sample $t$-statistic, or misapplying $n-1$ when a chi-squared problem calls for a different count (e.g., in two-sample or goodness-of-fit settings, the correct $df$ isn't always simply "sample size minus one").
- **Mixing up when to use $t$ vs. $\chi^2$:** the $t$-distribution is for inference **about the mean** when $\sigma$ is unknown; the chi-squared distribution is for inference **about the variance**. They are not interchangeable, and a problem asking about spread/variability needs $\chi^2$, not $t$.
- **Assuming CLT requires the population to already be normal:** it doesn't — CLT applies to *any* population with finite variance as $n$ grows large. What normality of the population *does* buy you is an exact (not just approximate) sampling distribution for small $n$, which is precisely the assumption behind using the $t$-distribution with small samples.
