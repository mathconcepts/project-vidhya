# Teaching Tips: Continuous Distributions

## Common Student Errors

- **Forgetting to standardize before using normal tables**: Students compute $P(X \le 70)$ directly without converting to $Z = \frac{70 - \mu}{\sigma}$ first, then trying to read from a standard normal table (which won't match). Always standardize to $N(0, 1)$ before consulting tables.
- **Confusing "between" with one-sided probabilities**: $P(a \le X \le b)$ requires two CDF lookups ($F(b) - F(a)$), but students often report only $F(b)$. Similarly, for exponential, $P(X > x) = e^{-\lambda x}$ (one-sided), not $1 - e^{-\lambda x}$ (which is $F(x)$).
- **Misapplying the 68–95–99.7 rule outside its range**: The rule is precise for $\mu \pm 1\sigma$ (68.27%), $\mu \pm 2\sigma$ (95.45%), and $\mu \pm 3\sigma$ (99.73%), but students sometimes try to use it for arbitrary intervals like $\mu \pm 0.5\sigma$ (which is ~38%, not obvious from the rule).

## GATE Question Pattern

GATE tests continuous distributions in three main ways: (1) **Standardization and table lookup** — "if $X \sim N(50, 100)$, find $P(X > 60)$" (requires standardization and the 68–95–99.7 rule or normal table, ~1 mark, MCQ), (2) **Parameter inference** — "the time between arrivals has exponential distribution with mean 5 hours; find the probability of no arrival in the first hour" (identifies $\lambda = 1/5 = 0.2$, then computes $e^{-0.2}$, ~2 marks), and (3) **Mixed continuous and discrete** — "if hardware fails exponentially and you replace units when they fail, find the expected number of replacements in 10 years" (combines exponential with Poisson/binomial, ~2 marks). GATE often assumes students have access to a standard normal table (printed on the back of the answer sheet) or memorize the 68–95–99.7 rule.

## Speed Tricks for MCQs

- **Memorize the 68–95–99.7 rule cold**: It's faster than any table lookup and appears in ~50% of normal distribution GATE questions. $P(\mu - \sigma \le X \le \mu + \sigma) = 0.68$, $P(\mu - 2\sigma \le X \le \mu + 2\sigma) = 0.95$, $P(\mu - 3\sigma \le X \le \mu + 3\sigma) = 0.997$.
- **For exponential, use $P(X > x) = e^{-\lambda x}$ directly**: This memoryless property is powerful. If asked for $P(X > 10)$ with $\lambda = 0.1$, compute $e^{-1}$ instantly without the CDF formula.
- **Recognize uniform distribution questions by "equal probability"**: If the problem says "equally likely over an interval," it's uniform. Then $P = \frac{\text{favorable length}}{\text{total length}}$, no integration needed.

## Must-Memorize Formulas / Results

**Uniform $U(a, b)$:**
$$f(x) = \\frac{1}{b-a}, \\quad a \\le x \\le b$$
$$E[X] = \\frac{a+b}{2}, \\quad \\text{Var}(X) = \\frac{(b-a)^2}{12}$$
$$P(c \\le X \\le d) = \\frac{d-c}{b-a}$$

**Exponential $\\text{Exp}(\\lambda)$:**
$$f(x) = \\lambda e^{-\\lambda x}, \\quad x \\ge 0$$
$$F(x) = 1 - e^{-\\lambda x}$$
$$E[X] = \\frac{1}{\\lambda}, \\quad \\text{Var}(X) = \\frac{1}{\\lambda^2}$$
$$P(X > x) = e^{-\\lambda x} \\text{ (memoryless property)}$$

**Normal $N(\\mu, \\sigma^2)$:**
$$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$
$$E[X] = \\mu, \\quad \\text{Var}(X) = \\sigma^2$$

**Standardization (to Standard Normal $N(0, 1)$):**
$$Z = \\frac{X - \\mu}{\\sigma}$$
$$P(a \\le X \\le b) = P\\left(\\frac{a - \\mu}{\\sigma} \\le Z \\le \\frac{b - \\mu}{\\sigma}\\right) = \\Phi\\left(\\frac{b - \\mu}{\\sigma}\\right) - \\Phi\\left(\\frac{a - \\mu}{\\sigma}\\right)$$

**68–95–99.7 Rule (Empirical Rule):**
$$P(\\mu - \\sigma \\le X \\le \\mu + \\sigma) \\approx 0.68$$
$$P(\\mu - 2\\sigma \\le X \\le \\mu + 2\\sigma) \\approx 0.95$$
$$P(\\mu - 3\\sigma \\le X \\le \\mu + 3\\sigma) \\approx 0.997$$

**Standard Normal CDF Properties:**
$$\\Phi(-z) = 1 - \\Phi(z) \\text{ (symmetry)}$$
$$P(-a \\le Z \\le a) = 2\\Phi(a) - 1$$
