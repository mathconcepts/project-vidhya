# Continuous Distributions

> GATE Engineering Mathematics | Probability & Statistics | high frequency | difficulty: 0.5

## Intuition First
Measure the lifetime of a light bulb (could be 100.5 hours, or 100.523 hours — infinitely many possibilities). The probability of any exact value is zero, so we talk about intervals: "probability the bulb lasts between 100 and 110 hours." The normal distribution describes this spread.

## Core Definition

**Uniform Distribution** $U(a, b)$: Equal probability density over an interval $[a, b]$.
$$f(x) = \frac{1}{b-a}, \quad a \le x \le b$$
Mean: $E[X] = \frac{a+b}{2}$; Variance: $\text{Var}(X) = \frac{(b-a)^2}{12}$.

**Exponential Distribution** $\text{Exp}(\lambda)$: Models the time until the next event in a Poisson process.
$$f(x) = \lambda e^{-\lambda x}, \quad x \ge 0$$
Mean: $E[X] = \frac{1}{\lambda}$; Variance: $\text{Var}(X) = \frac{1}{\lambda^2}$.

**Normal (Gaussian) Distribution** $N(\mu, \sigma^2)$: The "bell curve," symmetric around mean $\mu$ with standard deviation $\sigma$.
$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}, \quad x \in \mathbb{R}$$
Mean: $E[X] = \mu$; Variance: $\text{Var}(X) = \sigma^2$.

**Standard Normal** $Z \sim N(0, 1)$: A normal distribution with $\mu = 0$ and $\sigma = 1$. Any normal RV can be standardized: $Z = \frac{X - \mu}{\sigma}$.

Geometric interpretation: the PDF is the height of the bell curve at each point $x$. The area under the curve between $a$ and $b$ equals the probability $P(a \le X \le b)$. For the normal distribution, about 68% of the area lies within 1 standard deviation of the mean, 95% within 2, and 99.7% within 3 (the 68–95–99.7 rule).

## What Happens (Worked Example)

Label: "**What happens:**"

**Problem**: The lifetime of a component follows $N(1000, 100^2)$ hours (mean 1000 hours, std dev 100 hours). Find the probability that a component lasts between 900 and 1100 hours.

**Standardize** the bounds:
$$Z_1 = \frac{900 - 1000}{100} = \frac{-100}{100} = -1$$
$$Z_2 = \frac{1100 - 1000}{100} = \frac{100}{100} = 1$$

**Use the standard normal table** (or the 68–95–99.7 rule):
$$P(900 \le X \le 1100) = P(-1 \le Z \le 1) \approx 0.68$$

(The 68–95–99.7 rule tells us that approximately 68% of a normal distribution lies within $\mu \pm 1\sigma$.)

If we use the CDF notation:
$$P(900 \le X \le 1100) = \Phi(1) - \Phi(-1) = 0.8413 - 0.1587 = 0.6826 \approx 0.68$$

Label: "**Why it works:**"

The standardization converts any normal RV into a standard normal, for which we have precomputed probability tables ($\Phi$, the standard normal CDF). The symmetry of the normal distribution ($\Phi(-z) = 1 - \Phi(z)$) simplifies calculations. The 68–95–99.7 rule is a mnemonic consequence of the bell curve's mathematical form.

## GATE MA Relevance
> **Why it matters in GATE MA:** Continuous distributions (especially the normal distribution) appear in ~20% of GATE questions. GATE tests standardization, use of normal tables (or the 68–95–99.7 rule), and connections to hypothesis testing and confidence intervals. The normal distribution is the foundation for many statistical inference techniques. Understanding exponential distribution is crucial for reliability engineering questions.
