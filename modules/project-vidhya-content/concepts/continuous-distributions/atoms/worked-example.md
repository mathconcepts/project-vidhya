---
id: continuous-distributions-worked-example
concept_id: continuous-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# GATE Problem: Normal and Exponential Distributions

## Part A — Normal Distribution

Let $X \sim N(\mu = 50,\, \sigma^2 = 16)$, so $\sigma = 4$.

**Find $P(46 < X < 58)$.**

### Step 1 — Standardize the Bounds

Convert $X$ values to $Z$ scores using $Z = \dfrac{X - \mu}{\sigma} = \dfrac{X - 50}{4}$:

$$x = 46: \quad Z = \frac{46 - 50}{4} = -1$$

$$x = 58: \quad Z = \frac{58 - 50}{4} = +2$$

### Step 2 — Express in Terms of $\Phi$

$$P(46 < X < 58) = P(-1 < Z < 2) = \Phi(2) - \Phi(-1)$$

### Step 3 — Use Standard Normal Values

$$\Phi(2) \approx 0.9772, \qquad \Phi(-1) = 1 - \Phi(1) \approx 1 - 0.8413 = 0.1587$$

### Step 4 — Compute

$$\boxed{P(46 < X < 58) = 0.9772 - 0.1587 = 0.8185}$$

**Interpretation:** About 81.85% of observations lie between 46 and 58. This is almost the entire 68–95 band on one side plus the full band on the other.

---

## Part B — Exponential Distribution

A light bulb has a lifetime $T \sim \text{Exp}(\lambda)$ with mean 500 hours.

**Find the probability it fails before 300 hours.**

### Step 1 — Identify $\lambda$

$$E[T] = \frac{1}{\lambda} = 500 \implies \lambda = \frac{1}{500} = 0.002$$

### Step 2 — CDF of the Exponential

$$P(T \leq t) = 1 - e^{-\lambda t}$$

### Step 3 — Evaluate at $t = 300$

$$P(T \leq 300) = 1 - e^{-0.002 \times 300} = 1 - e^{-0.6}$$

$$e^{-0.6} \approx 0.5488$$

$$\boxed{P(T \leq 300) = 1 - 0.5488 = 0.4512}$$

**Interpretation:** Even though the mean lifetime is 500 hours, there is a 45% chance of failure before 300 hours — the exponential distribution has a heavy left tail.

---

## Standard Normal Table (Key Values)

| $z$ | $\Phi(z)$ |
|---|---|
| 0.0 | 0.5000 |
| 1.0 | 0.8413 |
| 1.5 | 0.9332 |
| 1.96 | 0.9750 |
| 2.0 | 0.9772 |
| 2.5 | 0.9938 |
| 3.0 | 0.9987 |

**GATE tip:** The symmetry relation $\Phi(-z) = 1 - \Phi(z)$ means you only need the right-half table.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: normal and exponential distribution probabilities","steps":[{"prompt":"X ~ N(100, 25) (so σ = 5). Find P(X > 110).","hint":"Standardize: Z = (110 − 100) / 5 = 2. Then P(X > 110) = P(Z > 2) = 1 − Φ(2). Use Φ(2) ≈ 0.9772.","answer":"Z = (110 − 100) / 5 = 2. P(X > 110) = 1 − Φ(2) = 1 − 0.9772 = 0.0228. About 2.28% of values exceed 110."},{"prompt":"A component has exponential lifetime with mean 200 hours. What is the probability it survives beyond 400 hours?","hint":"λ = 1/200. P(T > t) = e^{−λt}. Substitute t = 400. Note that 400 = 2 × mean.","answer":"λ = 1/200. P(T > 400) = e^{−(1/200)·400} = e^{−2} ≈ 0.1353. Only about 13.5% of components last twice their mean lifetime — the exponential distribution decays quickly."}]}
```
