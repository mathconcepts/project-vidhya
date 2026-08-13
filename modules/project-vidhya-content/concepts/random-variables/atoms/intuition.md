---
id: random-variables-intuition
concept_id: random-variables
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Random Variables: Turning Outcomes into Numbers

A **random variable** $X$ is a function $X: \Omega \to \mathbb{R}$ that assigns a real number to every outcome in the sample space. It converts qualitative events into quantities we can compute with.

## Discrete vs. Continuous

**Discrete:** $X$ takes countable values (possibly infinite).

- Described by a **PMF** (probability mass function): $p(x) = P(X = x)$
- Must satisfy $p(x) \geq 0$ and $\sum_x p(x) = 1$

**Continuous:** $X$ takes uncountably many values (an interval).

- Described by a **PDF** (probability density function): $f(x) \geq 0$
- Must satisfy $\int_{-\infty}^{\infty} f(x)\,dx = 1$
- Probabilities come from integrals: $P(a \leq X \leq b) = \int_a^b f(x)\,dx$

## Cumulative Distribution Function

The **CDF** unifies both cases:

$$F(x) = P(X \leq x)$$

- Always non-decreasing, right-continuous
- $\lim_{x \to -\infty} F(x) = 0$, $\lim_{x \to \infty} F(x) = 1$
- For continuous $X$: $f(x) = F'(x)$

## Expected Value

The **expected value** (mean) is the probability-weighted average of all possible values:

$$E[X] = \sum_x x\, p(x) \quad \text{(discrete)}$$

$$E[X] = \int_{-\infty}^{\infty} x\, f(x)\,dx \quad \text{(continuous)}$$

**Linearity:** $E[aX + b] = a\,E[X] + b$ — this holds always, regardless of dependence.

## Variance and Standard Deviation

**Variance** measures spread around the mean:

$$\text{Var}(X) = E\!\left[(X - E[X])^2\right] = E[X^2] - (E[X])^2$$

The second form is the **computing formula** — almost always faster in GATE problems.

$$\text{SD}(X) = \sqrt{\text{Var}(X)}$$

**Variance rule:** $\text{Var}(aX + b) = a^2\,\text{Var}(X)$ — constants shift the mean but don't change spread; linear scaling squares.

## Key Discrete Distributions

| Distribution | PMF | Mean | Variance |
|---|---|---|---|
| Binomial $B(n,p)$ | $\binom{n}{k}p^k(1-p)^{n-k}$ | $np$ | $np(1-p)$ |
| Poisson $\text{Po}(\lambda)$ | $\frac{e^{-\lambda}\lambda^k}{k!}$ | $\lambda$ | $\lambda$ |
| Geometric $\text{Geo}(p)$ | $(1-p)^{k-1}p$ | $\frac{1}{p}$ | $\frac{1-p}{p^2}$ |

**Poisson as a limit:** When $n$ is large and $p$ is small with $\lambda = np$ fixed, $B(n,p) \approx \text{Po}(\lambda)$.

**Memoryless property:** The geometric distribution is the only discrete distribution with $P(X > m+n \mid X > m) = P(X > n)$ — past failures don't affect future probability.
