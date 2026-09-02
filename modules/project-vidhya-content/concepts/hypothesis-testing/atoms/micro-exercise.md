---
id: hypothesis-testing.micro-exercise
concept_id: hypothesis-testing
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

A manufacturer claims that the average weight of a product is 500g. A sample of 16 items has a mean weight of 495g with a standard deviation of 8g. Using a two-tailed test at $\alpha = 0.05$, what should we conclude?

- **(A)** Reject $H_0$; the claim is not well supported
- **(B)** Fail to reject $H_0$; the claim is plausible
- **(C)** The test is inconclusive
- **(D)** Reject $H_1$; accept $H_0$

<details>
<summary>Answer</summary>

**A**. Hypotheses: $H_0: \mu = 500$g, $H_1: \mu \ne 500$g (two-tailed). $\sigma$ is unknown, only the sample $s=8$g is given, so use the $t$-test:

$$t = \frac{\bar{x} - \mu_0}{s/\sqrt{n}} = \frac{495 - 500}{8/\sqrt{16}} = \frac{-5}{2} = -2.5$$

Degrees of freedom: $df = n - 1 = 15$. Critical value for a two-tailed test at $\alpha = 0.05$ with $df=15$: $t_{0.025,15} \approx 2.131$.

$$|t| = 2.5 > 2.131$$

The test statistic falls in the rejection region, so we **reject $H_0$**: the sample gives sufficient evidence the true mean is not 500g. (Cross-check: the two-tailed p-value at $t=2.5$, $df=15$ is $\approx 0.024 < 0.05$ — the same conclusion from either route.)

</details>
