---
id: joint-distributions.formal-definition
concept_id: joint-distributions
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

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

**Independence**: Two random variables are independent if $p(x, y) = p_X(x) \cdot p_Y(y)$ (or $f(x, y) = f_X(x) \cdot f_Y(y)$ for continuous) at **every** point in their support.

**Which test to reach for.** Certify independence with the factoring test above, checked against the support region — not with $\text{Cov}(X,Y)=0$, which a GATE student reaches for because it's a single number to compute. Zero covariance only rules out *linear* association; $X$ and $Y$ can be tightly (nonlinearly) dependent — even a deterministic function of one another — and still show $\text{Cov}(X,Y)=0$. Independence forces $\text{Cov}=0$; the converse never holds.

Geometric interpretation: the joint PDF is a surface over the $(x, y)$ plane. The height at each point represents the probability density. Integrating over a region gives the probability of that region. The marginal PDF is the "shadow" of this surface projected onto the $x$-axis or $y$-axis.
