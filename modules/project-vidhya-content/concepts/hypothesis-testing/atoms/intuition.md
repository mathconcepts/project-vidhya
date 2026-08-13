---
id: hypothesis-testing-intuition
concept_id: hypothesis-testing
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Hypothesis Testing — What Is It?

Statistical hypothesis testing is a formal procedure to decide whether sample data provides enough evidence to reject a stated claim about a population.

## The Two Hypotheses

Every test frames a competition between two statements:

- **Null hypothesis $H_0$**: The default claim (e.g., $\mu = 50$). We assume it is true unless evidence forces us to reject it.
- **Alternative hypothesis $H_1$**: The rival claim (e.g., $\mu \neq 50$, $\mu > 50$, or $\mu < 50$). We accept it only when data is compelling.

The burden of proof is always on the alternative — just like a court of law.

## Two Types of Error

Even a perfect procedure can be wrong because samples are random:

| | $H_0$ is actually TRUE | $H_0$ is actually FALSE |
|---|---|---|
| **Reject $H_0$** | Type I Error (probability $= \alpha$) | Correct decision |
| **Do not reject $H_0$** | Correct decision | Type II Error (probability $= \beta$) |

- **Type I error ($\alpha$)**: Rejecting a true null — a false alarm. $\alpha$ is the *significance level*, typically 0.05.
- **Type II error ($\beta$)**: Failing to detect a real effect. Power $= 1 - \beta$.

## Common Test Statistics

| Situation | Test statistic |
|---|---|
| Known population $\sigma$ | $z = \dfrac{\bar{x} - \mu_0}{\sigma/\sqrt{n}}$ |
| Unknown $\sigma$ (small $n$) | $t = \dfrac{\bar{x} - \mu_0}{s/\sqrt{n}}$, degrees of freedom $= n-1$ |
| Goodness of fit / independence | $\chi^2 = \sum \dfrac{(O-E)^2}{E}$ |

## p-value and Critical Region

- The **p-value** is the probability of observing a test statistic at least as extreme as the one computed, *assuming $H_0$ is true*.
- If $p\text{-value} < \alpha$, reject $H_0$.
- The **critical region** is the set of test-statistic values that lead to rejection. For a two-tailed $z$-test at $\alpha = 0.05$, the critical values are $\pm 1.96$.

## Key Insight

Hypothesis testing never *proves* $H_0$ true. A large p-value only says "the data are consistent with $H_0$," not that $H_0$ is correct. In GATE problems, read the significance level $\alpha$ and the test direction ($=$, $>$, $<$) carefully before computing anything.
