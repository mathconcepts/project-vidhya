---
id: continuous-distributions-intuition
concept_id: continuous-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Continuous Distributions

When the random variable $X$ can take any value in an interval, probability is described by a **probability density function** (PDF) $f(x)$. The probability of landing in an interval is the area under $f$:

$$P(a \leq X \leq b) = \int_a^b f(x)\,dx$$

Because any single point has zero width (zero area), $P(X = c) = 0$ for every specific value $c$.

## Normal Distribution $N(\mu, \sigma^2)$

The most important distribution in applied probability. Its PDF is the symmetric bell curve:

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}}\,\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)$$

**Key parameters:** $\mu$ is the center (mean), $\sigma^2$ is the spread (variance).

**68–95–99.7 rule** (memorize this):
- $P(\mu - \sigma \leq X \leq \mu + \sigma) \approx 0.6827$
- $P(\mu - 2\sigma \leq X \leq \mu + 2\sigma) \approx 0.9545$
- $P(\mu - 3\sigma \leq X \leq \mu + 3\sigma) \approx 0.9973$

**Standardization:** Any $N(\mu,\sigma^2)$ question reduces to the standard normal $Z \sim N(0,1)$ via:

$$Z = \frac{X - \mu}{\sigma}$$

Then $P(a < X < b) = P\!\left(\frac{a-\mu}{\sigma} < Z < \frac{b-\mu}{\sigma}\right) = \Phi\!\left(\frac{b-\mu}{\sigma}\right) - \Phi\!\left(\frac{a-\mu}{\sigma}\right)$

where $\Phi$ is the standard normal CDF (look up in tables or recall key values).

## Uniform Distribution $U(a, b)$

Every value in $[a, b]$ is equally likely:

$$f(x) = \frac{1}{b-a}, \quad a \leq x \leq b, \qquad E[X] = \frac{a+b}{2}, \quad \text{Var}(X) = \frac{(b-a)^2}{12}$$

## Exponential Distribution $\text{Exp}(\lambda)$

Models time between events in a Poisson process:

$$f(x) = \lambda e^{-\lambda x}, \; x \geq 0, \qquad E[X] = \frac{1}{\lambda}, \quad \text{Var}(X) = \frac{1}{\lambda^2}$$

**Memoryless property:** $P(X > s + t \mid X > s) = P(X > t)$ — the component is "as good as new" given it has survived to time $s$.

## Chi-Squared, $t$, and $F$ Distributions

These arise from transformations of normal random variables — essential for hypothesis testing:

- $\chi^2_k$: sum of $k$ independent squared standard normals. $E[\chi^2_k] = k$, $\text{Var}(\chi^2_k) = 2k$.
- $t_k = \frac{Z}{\sqrt{\chi^2_k / k}}$: used for mean testing when population variance is unknown.
- $F_{m,n} = \frac{\chi^2_m/m}{\chi^2_n/n}$: used for comparing two variances.

## Moment Generating Functions

The **MGF** of $X$ is $M_X(t) = E[e^{tX}]$. Taking derivatives recovers moments:

$$E[X^n] = M_X^{(n)}(0)$$

MGFs are unique — if two distributions share an MGF, they are identical. The MGF of $N(\mu,\sigma^2)$ is $\exp(\mu t + \frac{1}{2}\sigma^2 t^2)$, confirming that sums of independent normals are again normal.
