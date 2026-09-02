---
id: sampling-distributions.micro-exercise
concept_id: sampling-distributions
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.50
exam_ids: ["*"]
estimated_minutes: 2
---

A researcher wants a confidence interval for the mean of a normal population using a sample of size $n = 10$. The population standard deviation $\sigma$ is unknown; only the sample standard deviation $s$ is available. Which distribution should be used, and with how many degrees of freedom?

- **(A)** Standard normal ($Z$); no degrees of freedom needed
- **(B)** Student's $t$-distribution with 9 degrees of freedom
- **(C)** Student's $t$-distribution with 10 degrees of freedom
- **(D)** Chi-squared distribution with 9 degrees of freedom

<details>
<summary>Answer</summary>

**B**. Whenever $\sigma$ is unknown and estimated by $s$, the statistic $T=\frac{\bar{X}-\mu}{s/\sqrt{n}}$ follows Student's $t$-distribution, not the standard normal (rules out A). Degrees of freedom for a one-sample $t$ are always $n-1=9$ (rules out C, which uses $n$ instead). Chi-squared governs inference about variance, not the mean, so it isn't the right family here regardless of $df$ (rules out D).

</details>
