---
id: continuous-distributions.formal-definition
concept_id: continuous-distributions
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

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
