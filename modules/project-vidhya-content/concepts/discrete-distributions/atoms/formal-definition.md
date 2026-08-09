---
id: discrete-distributions.formal-definition
concept_id: discrete-distributions
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

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
