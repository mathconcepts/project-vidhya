---
id: sampling-distributions.retrieval-prompt
concept_id: sampling-distributions
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.65
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["CLT", "standard-error"]
---

Before checking: a population has a strongly right-skewed distribution with mean $\mu = 40$ and standard deviation $\sigma = 12$. Random samples of size $n = 100$ are repeatedly drawn and their means computed. From memory, what does the Central Limit Theorem say about the sampling distribution of the sample mean?

- **(A)** It will also be strongly right-skewed, since the population itself is skewed
- **(B)** Nothing can be said for finite $n$; the CLT only applies in the exact limit $n \to \infty$
- **(C)** It will be approximately normal, with mean 40 and standard error $\frac{12}{\sqrt{100}} = 1.2$
- **(D)** It will follow a chi-squared distribution with 99 degrees of freedom

<details>
<summary>Answer</summary>

**C**. Regardless of the population's shape, the sampling distribution of $\bar{X}$ approaches normal as $n$ grows, and $n=100$ is comfortably past the usual $n\gtrsim30$ threshold. Mean $=\mu=40$; standard error $=\sigma/\sqrt{n}=12/10=1.2$.

(A) is the exact misconception the CLT corrects — averaging washes out skewness. (B) overstates the requirement; "large enough $n$" is the practical threshold, not literal infinity. (D) confuses this with a variance-based statistic.

</details>
