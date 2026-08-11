# Joint Distributions

> GATE Engineering Mathematics | Probability & Statistics | medium frequency | difficulty: 0.6

## Intuition First
A student's exam performance depends on two factors: study hours and sleep quality. Both vary randomly, and we want to understand how they vary **together**. A joint distribution describes the simultaneous behavior of two or more random variables.

## Core Definition

**Joint Probability Mass Function (Discrete)**: For discrete random variables $X$ and $Y$,
$$p(x, y) = P(X = x, Y = y)$$
with the constraint $\sum_x \sum_y p(x, y) = 1$.

**Joint Probability Density Function (Continuous)**: For continuous random variables,
$$f(x, y) \ge 0, \quad \int_{-\infty}^{\infty} \int_{-\infty}^{\infty} f(x, y) \, dx \, dy = 1$$

**Marginal Distribution**: The distribution of a single variable, summing/integrating over the other.
$$p_X(x) = \sum_y p(x, y), \quad f_X(x) = \int_{-\infty}^{\infty} f(x, y) \, dy$$

**Conditional Distribution**: The distribution of one variable, given the value of another.
$$p(y|x) = \frac{p(x, y)}{p_X(x)}, \quad f(y|x) = \frac{f(x, y)}{f_X(x)}$$

**Covariance**: A measure of linear association between two variables.
$$\text{Cov}(X, Y) = E[(X - \mu_X)(Y - \mu_Y)] = E[XY] - E[X]E[Y]$$

**Correlation Coefficient**: Covariance standardized to the range $[-1, 1]$.
$$\rho = \frac{\text{Cov}(X, Y)}{\sigma_X \sigma_Y}$$

**Independence**: Two random variables are independent if $p(x, y) = p_X(x) \cdot p_Y(y)$ (or $f(x, y) = f_X(x) \cdot f_Y(y)$ for continuous), equivalently $\text{Cov}(X, Y) = 0$.

Geometric interpretation: the joint PDF is a surface over the $(x, y)$ plane. The height at each point represents the probability density. Integrating over a region gives the probability of that region. The marginal PDF is the "shadow" of this surface projected onto the $x$-axis or $y$-axis.

## What Happens (Worked Example)

Label: "**What happens:**"

**Problem**: Two dice are rolled. Let $X$ = value of first die, $Y$ = value of second die. Find (a) the joint PMF, and (b) $P(X + Y = 7)$.

**(a) Joint PMF:**

Since each die independently shows 1–6 with equal probability:
$$p(x, y) = P(X = x, Y = y) = P(X = x) \cdot P(Y = y) = \frac{1}{6} \times \frac{1}{6} = \frac{1}{36}$$
for all $x, y \in \{1, 2, 3, 4, 5, 6\}$, and $p(x, y) = 0$ otherwise.

**(b) $P(X + Y = 7)$:**

Favorable pairs: $(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)$ — that's 6 pairs.

$$P(X + Y = 7) = \sum_{(x,y): x+y=7} p(x, y) = 6 \times \frac{1}{36} = \frac{1}{6}$$

Label: "**Why it works:**"

Since the two dice rolls are independent, the joint PMF factors into the product of marginals. The sum $X + Y = 7$ occurs at exactly 6 of the 36 equally-likely outcomes, so the probability is $6/36 = 1/6$. This is consistent with our earlier counting-based calculation of $P(\text{sum} = 7)$ for a single roll of two dice.

## GATE MA Relevance
> **Why it matters in GATE MA:** Joint distributions appear in ~15% of probability & statistics GATE questions, often in the context of bivariate data analysis and hypothesis testing. GATE tests extraction of marginal and conditional distributions, computation of covariance, and identification of independence. Understanding joint distributions is essential for regression, correlation, and Bayesian inference problems.
