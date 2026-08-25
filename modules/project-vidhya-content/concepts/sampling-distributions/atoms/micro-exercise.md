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

**B**. Whenever the population standard deviation $\sigma$ is unknown and must be estimated by the sample standard deviation $s$, the standardized statistic $T = \frac{\bar{X}-\mu}{s/\sqrt{n}}$ follows **Student's $t$-distribution**, not the standard normal — option A ignores the extra uncertainty that comes from estimating $\sigma$.

The degrees of freedom for a one-sample $t$-statistic are always $n - 1$: here $n = 10$, so $df = 9$. Option C uses $n$ instead of $n-1$ — a very common off-by-one error.

Option D is wrong for a different reason: the chi-squared distribution governs inference **about variance**, not about the mean — it isn't the right family here at all, regardless of degrees of freedom.

The correct answer is B.

</details>
