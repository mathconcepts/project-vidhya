---
id: sampling-distributions.formal-definition
concept_id: sampling-distributions
atom_type: formal_definition
bloom_level: 2
difficulty: 0.50
exam_ids: ["*"]
---

**Sampling distribution of the mean**: For i.i.d. random variables $X_1, \ldots, X_n$ with $E[X_i] = \mu$ and $\mathrm{Var}(X_i) = \sigma^2$, the sample mean $\bar{X} = \frac{1}{n}\sum X_i$ satisfies $E[\bar{X}] = \mu$ and $\mathrm{Var}(\bar{X}) = \dfrac{\sigma^2}{n}$. The **standard error** of the mean is $SE = \dfrac{\sigma}{\sqrt{n}}$ (or $\dfrac{s}{\sqrt{n}}$ when $\sigma$ is estimated by the sample standard deviation $s$).

**Central Limit Theorem (CLT)**: As $n \to \infty$,
$$\frac{\bar{X} - \mu}{\sigma/\sqrt{n}} \xrightarrow{d} N(0, 1)$$
regardless of the shape of the population distribution of $X_i$, provided $\sigma^2 < \infty$. In practice, the normal approximation for $\bar X$ is treated as adequate once $n \gtrsim 30$.

**Student's $t$-distribution**: If $X_1, \ldots, X_n$ are drawn from a $N(\mu, \sigma^2)$ population and $\sigma$ is **unknown**, estimated by the sample standard deviation $s$, then
$$T = \frac{\bar{X} - \mu}{s/\sqrt{n}} \sim t_{n-1}$$
a $t$-distribution with $n-1$ degrees of freedom. The $t$-distribution is symmetric about 0 like the standard normal but has heavier tails; as $n-1 \to \infty$, $t_{n-1} \to N(0,1)$.

**Chi-squared ($\chi^2$) distribution**: If $Z_1, \ldots, Z_k$ are i.i.d. $N(0,1)$, then $\chi^2_k = \sum_{i=1}^{k} Z_i^2$ follows a chi-squared distribution with $k$ degrees of freedom, with $E[\chi^2_k] = k$ and $\mathrm{Var}(\chi^2_k) = 2k$. For a sample of size $n$ from $N(\mu, \sigma^2)$,
$$\frac{(n-1)s^2}{\sigma^2} \sim \chi^2_{n-1}$$
which underlies confidence intervals and hypothesis tests **about the population variance**.

**Which distribution to reach for.** Use $\chi^2_{n-1}$ when the target of inference is the population **variance** — not Student's $t$, which a GATE student often reaches for on autopilot any time a problem mentions "unknown parameter" and a small sample, even though $t$ is built specifically for inference about the **mean**. A question asking for a confidence interval "for $\sigma^2$" or testing a claimed variance value needs $\chi^2_{n-1}=(n-1)s^2/\sigma^2$; a question about $\mu$ with $\sigma$ unknown needs $t_{n-1}$. The two are never interchangeable, whatever the sample size.
