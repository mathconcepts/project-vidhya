---
id: sampling-distributions.retrieval-prompt
concept_id: sampling-distributions
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.65
exam_ids: ["*"]
estimated_minutes: 3
---

A population has a strongly right-skewed distribution with mean $\mu = 40$ and standard deviation $\sigma = 12$. Random samples of size $n = 100$ are repeatedly drawn and their means computed. By the Central Limit Theorem, what can be said about the sampling distribution of the sample mean?

- **(A)** It will also be strongly right-skewed, since the population itself is skewed
- **(B)** Nothing can be said for finite $n$; the CLT only applies in the exact limit $n \to \infty$
- **(C)** It will be approximately normal, with mean 40 and standard error $\frac{12}{\sqrt{100}} = 1.2$
- **(D)** It will follow a chi-squared distribution with 99 degrees of freedom

<details>
<summary>Answer</summary>

**C**. The Central Limit Theorem guarantees that, regardless of the shape of the original population, the sampling distribution of $\bar{X}$ approaches a normal distribution as $n$ grows — and $n = 100$ is comfortably in the range where this approximation is considered reliable in practice (the usual rule of thumb is $n \gtrsim 30$).

The approximating normal distribution has mean equal to the population mean, $\mu = 40$, and standard error $\frac{\sigma}{\sqrt{n}} = \frac{12}{\sqrt{100}} = \frac{12}{10} = 1.2$.

A) is the exact misconception the CLT corrects: averaging washes out the population's skewness even though individual observations remain skewed.

B) overstates the theorem's requirements — the CLT is used as a *practical approximation* well before $n$ reaches infinity; "large enough $n$" (commonly $n \geq 30$) is the operational threshold, not literal infinity.

D) confuses this with a variance-based statistic; the sample mean's sampling distribution is normal (approximately), not chi-squared — chi-squared belongs to sums of squared standardized deviations, not to sums of raw observations.

The correct answer is C.

</details>
