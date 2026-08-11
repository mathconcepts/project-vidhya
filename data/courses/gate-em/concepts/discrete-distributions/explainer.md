# Discrete Distributions

> GATE Engineering Mathematics | Probability & Statistics | high frequency | difficulty: 0.4

## Intuition First
Count the number of heads in 100 coin flips — that count follows a binomial distribution. Count how many cars pass through an intersection in a 5-minute window — that follows a Poisson distribution. Different scenarios lead to different probability patterns, and these patterns are captured by named discrete distributions.

## Core Definition

**Bernoulli Distribution**: A single trial with two outcomes (success/failure), each with fixed probability.
$$P(X = k) = p^k (1-p)^{1-k}, \quad k \in \{0, 1\}$$
Mean: $E[X] = p$; Variance: $\text{Var}(X) = p(1-p)$.

**Binomial Distribution** $B(n, p)$: The number of successes in $n$ independent Bernoulli trials.
$$P(X = k) = \binom{n}{k} p^k (1-p)^{n-k}, \quad k = 0, 1, \ldots, n$$
Mean: $E[X] = np$; Variance: $\text{Var}(X) = np(1-p)$.

Geometric interpretation: the binomial coefficient $\binom{n}{k}$ counts the number of ways to arrange $k$ successes among $n$ trials; each arrangement has probability $p^k(1-p)^{n-k}$.

**Poisson Distribution** $\text{Poisson}(\lambda)$: Models the count of rare events in a fixed interval (time, space, etc.), with rate $\lambda$ (expected count).
$$P(X = k) = \frac{e^{-\lambda} \lambda^k}{k!}, \quad k = 0, 1, 2, \ldots$$
Mean: $E[X] = \lambda$; Variance: $\text{Var}(X) = \lambda$.

Poisson is the limit of Binomial as $n \to \infty$ and $p \to 0$ such that $np = \lambda$ remains constant.

## What Happens (Worked Example)

Label: "**What happens:**"

**Problem**: A quality control inspector examines 20 items from a production line. Each item has a 5% defect rate. Find:
(a) The probability of exactly 2 defective items.
(b) The expected number of defective items and the standard deviation.

(a) This is binomial with $n = 20$ and $p = 0.05$:
$$P(X = 2) = \binom{20}{2} (0.05)^2 (0.95)^{18}$$

$$= \frac{20 \times 19}{2 \times 1} \times 0.0025 \times (0.95)^{18}$$

$$= 190 \times 0.0025 \times 0.3585 \approx 0.1887$$

(b) For binomial $B(20, 0.05)$:
$$E[X] = np = 20 \times 0.05 = 1$$
$$\text{Var}(X) = np(1-p) = 20 \times 0.05 \times 0.95 = 0.95$$
$$\text{SD}(X) = \sqrt{0.95} \approx 0.975$$

Label: "**Why it works:**"

Each item independently has a 5% chance of being defective. We count successes (defects) across 20 trials, so this is binomial. The coefficient $\binom{20}{2}$ accounts for the different orderings in which 2 defects can appear among 20 items. The variance formula $np(1-p)$ balances two competing effects: more trials increase variance (higher $n$), but less uncertainty in each trial (extreme $p$) decreases it.

## GATE MA Relevance
> **Why it matters in GATE MA:** Binomial and Poisson distributions appear in ~25% of probability & statistics GATE questions. GATE tests recognition (when to use which), exact calculation (with small $n$ and $p$), and asymptotic approximation (binomial → normal for large $n$). Often paired with hypothesis testing and estimation problems. Mastery here is prerequisite for Bayesian inference.
