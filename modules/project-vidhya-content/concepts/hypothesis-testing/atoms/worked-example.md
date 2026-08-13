---
id: hypothesis-testing-worked-example
concept_id: hypothesis-testing
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example — Two-Tailed z-Test (GATE Style)

## Problem

A machine fills packets with a mean weight $\mu$. Historically the population standard deviation is $\sigma = 6$ g. A quality inspector randomly selects $n = 36$ packets and finds the sample mean $\bar{x} = 52$ g.

Test $H_0: \mu = 50$ against $H_1: \mu \neq 50$ at significance level $\alpha = 0.05$.

---

## Step 1 — Identify the Test

- Population $\sigma$ is **known** $\Rightarrow$ use the **z-test**.
- $H_1: \mu \neq 50$ is **two-tailed** (we reject for very large or very small $\bar{x}$).

## Step 2 — Compute the Test Statistic

$$z = \frac{\bar{x} - \mu_0}{\sigma / \sqrt{n}} = \frac{52 - 50}{6 / \sqrt{36}} = \frac{2}{6/6} = \frac{2}{1} = 2$$

## Step 3 — Identify the Critical Value

For $\alpha = 0.05$ (two-tailed), the critical values are $z_{\alpha/2} = \pm 1.96$.

Rejection region: $|z| > 1.96$.

## Step 4 — Make the Decision

$$|z_{\text{computed}}| = 2 > 1.96$$

The test statistic falls in the rejection region.

**Conclusion:** Reject $H_0$ at the 5% significance level. There is sufficient statistical evidence that the true mean weight differs from 50 g.

---

## p-value Verification

$$p\text{-value} = 2 \times P(Z > 2) = 2 \times 0.0228 = 0.0456$$

Since $0.0456 < 0.05$, we again reject $H_0$. Both approaches agree.

---

## Common GATE Traps

- **One-tailed vs two-tailed**: A one-tailed test ($\mu > 50$) at $\alpha = 0.05$ uses critical value $z = 1.645$, not $1.96$.
- **Forgetting $\sqrt{n}$ in the denominator**: The standard error is $\sigma/\sqrt{n}$, not $\sigma$.
- **Confusing p-value with $\alpha$**: $p = 0.0456$ means "4.56% chance of seeing $|\bar{x} - 50| \geq 2$ if $H_0$ is true" — it is not the probability that $H_0$ is false.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"A sample of n=25 has x̄=103 and known σ=10. We test H₀: μ=100 vs H₁: μ≠100 at α=0.05. What is the z-statistic?","hint":"Use z = (x̄ − μ₀) / (σ/√n). The standard error is σ/√n = 10/√25 = 2.","answer":"z = (103 − 100) / 2 = 1.5"},{"prompt":"The critical value for a two-tailed test at α=0.05 is z = ±1.96. Based on z=1.5, what is the conclusion?","hint":"Compare |z| with 1.96. If |z| < 1.96, fail to reject H₀.","answer":"Since |1.5| = 1.5 < 1.96, we fail to reject H₀. There is insufficient evidence that μ ≠ 100."}]}
```
