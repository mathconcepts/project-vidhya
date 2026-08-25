---
id: sampling-distributions.worked-example
concept_id: sampling-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.62
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Confidence Interval With Unknown $\sigma$

## Problem (GATE-style)

A random sample of $n = 16$ observations is drawn from a population assumed to be normal, with unknown mean $\mu$ and unknown standard deviation. The sample gives $\bar{x} = 52$ and sample standard deviation $s = 8$. (Given: $t_{0.025, 15} = 2.131$.)

**(a)** Find the standard error of the sample mean.
**(b)** Which distribution should be used to construct a 95% confidence interval for $\mu$, and with how many degrees of freedom? Justify.
**(c)** Construct the 95% confidence interval for $\mu$.

---

## Solution

### Part (a): Standard Error

Since $\sigma$ is unknown, the standard error is estimated using the sample standard deviation:

$$SE = \frac{s}{\sqrt{n}} = \frac{8}{\sqrt{16}} = \frac{8}{4} = \boxed{2}$$

### Part (b): Which Distribution?

The population standard deviation $\sigma$ is **unknown**, and the sample size $n = 16$ is small (well below the "large sample" threshold of ~30 where the normal approximation would be safe to use with $s$ in place of $\sigma$). Whenever $\sigma$ is unknown, the standardized statistic follows **Student's $t$-distribution**, not the standard normal — using $z$ here would understate the true uncertainty, since $s$ is itself only an estimate of $\sigma$.

Degrees of freedom: $df = n - 1 = 16 - 1 = \boxed{15}$.

### Part (c): The 95% Confidence Interval

The general form is $\bar{x} \pm t_{\alpha/2, n-1} \cdot SE$. With $\alpha = 0.05$, $\alpha/2 = 0.025$, and the given $t_{0.025, 15} = 2.131$:

$$\text{Margin of error} = t_{0.025,15} \times SE = 2.131 \times 2 = 4.262$$

$$\text{CI} = 52 \pm 4.262 = (52 - 4.262,\ 52 + 4.262) = \boxed{(47.738,\ 56.262)}$$

We are 95% confident the true population mean $\mu$ lies in $(47.738, 56.262)$.

---

## Key Insights

- **The trigger for using $t$ instead of $z$ is "$\sigma$ unknown," not "$n$ is small" by itself** — but the two often travel together in GATE problems, since with a large $n$, $s \approx \sigma$ closely enough that $t_{n-1} \approx z$ anyway.
- **Degrees of freedom for the one-sample $t$ is always $n-1$** — one degree of freedom is "used up" estimating $\bar{x}$ before $s$ can be computed from the same sample.
- **The margin of error scales with $SE$, not $s$ directly** — always divide by $\sqrt{n}$ before multiplying by the critical value.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: building a t-based confidence interval","steps":[{"prompt":"With n=16, x̄=52, s=8, and σ unknown, what is the standard error SE?","hint":"SE = s / √n.","answer":"SE = 8/4 = 2"},{"prompt":"Because σ is unknown, which distribution and how many degrees of freedom should we use?","hint":"σ unknown always means Student's t, with df = n − 1.","answer":"Student's t-distribution with df = 15"},{"prompt":"Using t_{0.025,15} = 2.131, what is the 95% confidence interval for μ?","hint":"CI = x̄ ± t·SE.","answer":"(47.738, 56.262)"}],"caption":"Whenever σ is unknown, swap z for t with df = n − 1 — the fatter tails of t correctly account for the extra uncertainty from estimating σ by s."}
```
