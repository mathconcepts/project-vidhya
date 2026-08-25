---
id: sampling-distributions.intuition
concept_id: sampling-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

# Understanding Sampling Distributions: The Statistic That Has Its Own Distribution

Every time you draw a sample and compute a statistic — a mean, a variance — you get a slightly different number. If you imagine repeating that draw infinitely many times, the collection of all those statistic values forms its own probability distribution: the **sampling distribution**. The population has a distribution; so does the sample mean computed *from* it — and these two are usually not the same shape at all.

## Three Key Ideas

**The Central Limit Theorem (CLT)**: If you draw samples of size $n$ from *any* population with mean $\mu$ and finite variance $\sigma^2$, the sampling distribution of the sample mean $\bar{X}$ becomes approximately **normal** as $n$ grows — regardless of the population's original shape. It has mean $\mu$ and **standard error** $\frac{\sigma}{\sqrt{n}}$. This is the single most-used fact in inferential statistics: it's why normal-based confidence intervals and tests work even on skewed populations, as long as $n$ is reasonably large (typically $n \geq 30$).

**The $t$-distribution — when $\sigma$ is unknown**: In practice you almost never know the true population standard deviation $\sigma$; you estimate it with the sample standard deviation $s$. That extra layer of estimation adds uncertainty, so the standardized statistic $T = \frac{\bar{X}-\mu}{s/\sqrt{n}}$ no longer follows a standard normal — it follows **Student's $t$-distribution** with $n-1$ degrees of freedom. The $t$-distribution looks like the normal but with fatter tails (more room for surprise), and it converges to the normal as $n$ grows and the degrees of freedom rise.

**The chi-squared distribution — for variability**: If $Z_1, \ldots, Z_k$ are independent standard normal variables, $\chi^2 = \sum Z_i^2$ follows a **chi-squared distribution** with $k$ degrees of freedom. The sample-variance statistic $\frac{(n-1)s^2}{\sigma^2}$ follows a $\chi^2_{n-1}$ distribution, which is why chi-squared shows up whenever you're doing inference *about variance* rather than about the mean.

## Why It Matters for GATE

Confidence intervals, hypothesis tests, and quality-control problems all hinge on picking the *right* distribution for the statistic at hand — normal when $\sigma$ is known and $n$ is large, $t$ when $\sigma$ is unknown, $\chi^2$ when the target is variance. Picking the wrong one is one of the most common ways marks are lost in this topic.

---
