---
id: joint-distributions.intuition
concept_id: joint-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

## Joint Distributions: Two Variables at Once

When an experiment produces two random outputs simultaneously — say, a student's exam score AND their study hours — we need a **joint distribution** to describe them together.

## Joint PMF / PDF

**Discrete:** $p(x, y) = P(X = x,\, Y = y)$, with $\sum_x \sum_y p(x,y) = 1$.

**Continuous:** $f(x, y) \geq 0$ with $\int_{-\infty}^{\infty}\!\int_{-\infty}^{\infty} f(x,y)\,dx\,dy = 1$.

For continuous: $P((X,Y) \in A) = \iint_A f(x,y)\,dx\,dy$.

## Marginal Distributions

To find the distribution of $X$ alone, **integrate (or sum) out** $Y$ — the $Y$ dimension collapses:

$$f_X(x) = \int_{-\infty}^{\infty} f(x,y)\,dy \qquad \text{(continuous)}$$

$$p_X(x) = \sum_y p(x,y) \qquad \text{(discrete)}$$

These are the "shadow" distributions on each axis.

## Conditional Distribution

Given that $Y = y$ occurred, the conditional PDF of $X$ is:

$$f_{X \mid Y}(x \mid y) = \frac{f(x,y)}{f_Y(y)}, \quad f_Y(y) > 0$$

This is Bayes-like: the joint divided by the known marginal re-normalizes probability onto the conditional slice.

## Independence of Two Variables

$X$ and $Y$ are **independent** iff their joint equals the product of marginals at every point:

$$f(x,y) = f_X(x) \cdot f_Y(y) \quad \text{for all } x, y$$

**Test:** if the joint PDF can be factored as $g(x) \cdot h(y)$ (with matching domains), the variables are independent — but check the **support domain** first. A triangular region (like $0 < x < y < 1$) cannot be independent regardless of the formula's shape, because the range of $x$ depends on $y$.

## Covariance and Correlation

$$\text{Cov}(X,Y) = E[XY] - E[X]\,E[Y]$$

**Computing formula:** evaluate $E[XY] = \int\!\int xy\,f(x,y)\,dx\,dy$, subtract the product of means.

Sign: positive covariance means $X$ and $Y$ tend to rise together; negative means one rises while the other falls.

**Correlation** normalizes to $[-1, 1]$:

$$\rho(X,Y) = \frac{\text{Cov}(X,Y)}{\sqrt{\text{Var}(X)}\,\sqrt{\text{Var}(Y)}}$$

**Important:** Independent $\Rightarrow \rho = 0$. But $\rho = 0$ does **not** imply independence (zero correlation only rules out linear dependence).

## Useful Identities

$$\text{Var}(X + Y) = \text{Var}(X) + \text{Var}(Y) + 2\,\text{Cov}(X,Y)$$

$$\text{Var}(X - Y) = \text{Var}(X) + \text{Var}(Y) - 2\,\text{Cov}(X,Y)$$

When $X$ and $Y$ are independent, $\text{Cov}(X,Y)=0$, so variances simply add for both sums and differences.
