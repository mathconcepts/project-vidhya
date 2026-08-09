# Teaching Tips: Discrete Distributions

## Common Student Errors

- **Confusing Binomial and Poisson**: Binomial requires a **fixed number of trials** $n$, while Poisson models **rare events over an interval** with no fixed $n$. Red flag: if the problem says "in a 5-minute window" or "over a region," it's likely Poisson, not Binomial.
- **Forgetting the binomial coefficient**: Students compute $p^k(1-p)^{n-k}$ but forget to multiply by $\binom{n}{k}$, leading to massive undercounting. The binomial coefficient accounts for different orderings of $k$ successes among $n$ trials.
- **Using binomial when applying Poisson approximation**: When $n$ is large and $p$ is small (e.g., $n = 1000, p = 0.001$), the binomial becomes hard to compute directly. Poisson with $\lambda = np$ is much simpler. But students sometimes force the binomial formula anyway, computing $0.999^{999}$ by hand — impractical.

## GATE Question Pattern

GATE poses three types of discrete distribution problems: (1) **Direct calculation** — "in $n$ Bernoulli trials with success rate $p$, find $P(X = k)$" (apply binomial formula, ~1–2 marks, MCQ/NAT), (2) **Parameter inference** — "given mean and variance, find $n$ and $p$" (solve the system $E[X] = np$ and $\text{Var}(X) = np(1-p)$, ~2 marks, MCQ), and (3) **Model selection** — "identify whether the scenario is binomial or Poisson, then compute a probability" (conceptual + computational, ~2 marks). GATE often mixes discrete and continuous in the same problem (e.g., use binomial to set up a hypothesis test).

## Speed Tricks for MCQs

- **Use Poisson for rare events**: If $n$ is large and $p$ is very small (typical: $n \ge 100, p \le 0.05$), use Poisson with $\lambda = np$ instead of binomial. Calculating $(0.99)^{99}$ by hand is torture; $e^{-1}$ is much faster (and often pre-printed on formula sheets).
- **Leverage the complement for "at least one"**: $P(X \ge 1) = 1 - P(X = 0)$ is always faster than summing $P(X=1) + P(X=2) + \cdots$. This applies to both binomial and Poisson.
- **Recognize when $np(1-p)$ simplifies**: For Poisson, Var$(X) = \lambda$. For binomial with $p = 0.5$, Var$(X) = n/4$. Pre-recognizing these avoids unnecessary arithmetic.

## Must-Memorize Formulas / Results

**Bernoulli $(p)$:**
$$P(X = k) = p^k (1-p)^{1-k}, \quad k \in \{0, 1\}$$
$$E[X] = p, \quad \text{Var}(X) = p(1-p)$$

**Binomial $B(n, p)$:**
$$P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}, \quad k = 0, 1, \ldots, n$$
$$E[X] = np, \quad \text{Var}(X) = np(1-p)$$

**Poisson $\\text{Poisson}(\\lambda)$:**
$$P(X = k) = \\frac{e^{-\\lambda} \\lambda^k}{k!}, \quad k = 0, 1, 2, \\ldots$$
$$E[X] = \\lambda, \quad \\text{Var}(X) = \\lambda$$

**Binomial → Poisson Approximation:**
When $n$ is large, $p$ is small, and $\\lambda = np$ is moderate, use Poisson instead of Binomial:
$$B(n, p) \\approx \\text{Poisson}(np)$$

**Binomial → Normal Approximation:**
When $n$ is large and $p$ is not near 0 or 1 (rule of thumb: $np \\ge 5$ and $n(1-p) \\ge 5$):
$$B(n, p) \\approx N(np, np(1-p))$$

**Key Identity for Parameters:**
Given Binomial $B(n, p)$:
$$\\frac{\\text{Var}(X)}{E[X]} = \\frac{np(1-p)}{np} = 1 - p$$
