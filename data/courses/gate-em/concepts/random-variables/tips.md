# Teaching Tips: Random Variables

## Common Student Errors

- **Confusing PMF and PDF**: PMF applies to **discrete** random variables (sums to 1, evaluated at specific points), while PDF applies to **continuous** random variables (integrates to 1, evaluated over intervals). A student trying to compute $P(X = x)$ for a continuous RV gets 0 (the PDF at a single point has no area), which causes confusion.
- **Forgetting that PMF values sum to 1**: When finding the constant $c$ in a PMF like $p(x) = c \cdot x$, students sometimes forget to enforce $\sum p(x) = 1$. They just leave the answer in terms of $c$ instead of solving for it.
- **Misinterpreting CDF**: Students confuse $P(X \le x)$ with $P(X = x)$. The CDF is cumulative and monotonically non-decreasing; at a discrete point, $P(X = x) = F(x) - F(x^-)$ (the jump in the CDF).

## GATE Question Pattern

GATE tests RVs in three main ways: (1) **Defining a PMF or PDF** — "given a sample space and a mapping, find the probability distribution" or "find the constant $c$ such that $f(x)$ is a valid PDF" (~1 mark, MCQ), (2) **Computing probabilities from CDF or PDF** — "find $P(a < X \le b)$" using integration or the CDF (~1–2 marks, NAT or MCQ), and (3) **Recognizing standard distributions** — "identify whether $X$ is binomial, Poisson, normal, etc." (implicit in later topics, ~1 mark). Most GATE problems start with a clearly-stated RV definition; sloppy reading here causes cascading errors.

## Speed Tricks for MCQs

- **Use the complement for "not equal to" events**: Instead of summing $P(X = a) + P(X = b) + \cdots$, compute $1 - P(X = c)$ where $c$ is the excluded value. Faster and fewer arithmetic steps.
- **Verify that distributions sum to 1**: After solving for a constant in a PMF, always check that $\sum p(x) = 1$. This catches errors in arithmetic.
- **Remember CDF properties**: The CDF $F(x)$ always satisfies $0 \le F(x) \le 1$, is non-decreasing, $\lim_{x \to -\infty} F(x) = 0$, and $\lim_{x \to \infty} F(x) = 1$. If a problem gives you a "CDF" that violates any of these, it's wrong.

## Must-Memorize Formulas / Results

**PMF (Discrete):**
$$p(x) = P(X = x), \quad \sum_x p(x) = 1$$

**PDF (Continuous):**
$$f(x) \ge 0, \quad \int_{-\infty}^{\infty} f(x) \, dx = 1$$

**CDF (Any Type):**
$$F(x) = P(X \le x)$$

**Relationship between PDF and CDF:**
$$f(x) = \frac{d}{dx} F(x)$$
$$F(x) = \int_{-\infty}^x f(t) \, dt$$

**Probability from PDF:**
$$P(a \le X \le b) = \int_a^b f(x) \, dx = F(b) - F(a)$$

**Probability from PMF:**
$$P(a \le X \le b) = \sum_{x=a}^b p(x)$$

**Expected Value (Mean):**
- Discrete: $E[X] = \sum_x x \cdot p(x)$
- Continuous: $E[X] = \int_{-\infty}^{\infty} x \cdot f(x) \, dx$

**Variance:**
$$\text{Var}(X) = E[X^2] - (E[X])^2$$
