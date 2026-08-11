# Teaching Tips: Joint Distributions

## Common Student Errors

- **Confusing joint and marginal**: Students read off a joint probability table and report $p(x, y)$ directly instead of summing over the other variable to get the marginal $p_X(x) = \sum_y p(x, y)$. The marginal is a column/row sum, not a cell value.
- **Forgetting to divide by the marginal for conditional probability**: The conditional PMF is $p(y|x) = \frac{p(x,y)}{p_X(x)}$, but students sometimes report $p(x, y)$ as the conditional (which is missing the denominator).
- **Thinking independence means covariance is always zero**: While independence ⟹ Cov = 0, the converse is false. Cov = 0 does NOT guarantee independence. This is a subtle point GATE loves to test via "false implies" style questions.

## GATE Question Pattern

GATE tests joint distributions in three main forms: (1) **Table extraction** — given a PMF table, find a marginal or conditional probability (~1–2 marks, MCQ), (2) **Covariance and correlation** — compute Cov$(X, Y)$ or $\rho$ from given distributions or data (~2 marks, NAT or MCQ), and (3) **Independence checks** — determine if two variables are independent given their joint distribution (~1–2 marks, logical reasoning). Questions often embed joint distributions inside regression or hypothesis testing problems, so foundational understanding here prevents cascading errors.

## Speed Tricks for MCQs

- **Use the independence property immediately**: If the problem says "independent," you can assume $E[XY] = E[X]E[Y]$ and Cov$(X, Y) = 0$ without computing. This cuts calculation time dramatically.
- **Recognize factorization**: If you can write $f(x, y) = g(x) h(y)$ (the joint PDF factors), then the variables are independent. No integration needed beyond that recognition.
- **For normal bivariate distributions**: If $X \sim N(\mu_X, \sigma_X^2)$ and $Y \sim N(\mu_Y, \sigma_Y^2)$ are jointly normal, the correlation coefficient $\rho$ fully determines their dependence. Any $|\rho| < 1$ means non-zero covariance; $\rho = 0$ means independence (special property of the normal distribution).

## Must-Memorize Formulas / Results

**Joint PMF (Discrete):**
$$p(x, y) = P(X = x, Y = y), \\quad \\sum_x \\sum_y p(x, y) = 1$$

**Marginal PMF:**
$$p_X(x) = \\sum_y p(x, y), \\quad p_Y(y) = \\sum_x p(x, y)$$

**Conditional PMF:**
$$p(y|x) = \\frac{p(x, y)}{p_X(x)}, \\quad p_X(x) > 0$$

**Joint PDF (Continuous):**
$$f(x, y) \\ge 0, \\quad \\int_{-\\infty}^{\\infty} \\int_{-\\infty}^{\\infty} f(x, y) \\, dx \\, dy = 1$$

**Marginal PDF:**
$$f_X(x) = \\int_{-\\infty}^{\\infty} f(x, y) \\, dy, \\quad f_Y(y) = \\int_{-\\infty}^{\\infty} f(x, y) \\, dx$$

**Conditional PDF:**
$$f(y|x) = \\frac{f(x, y)}{f_X(x)}, \\quad f_X(x) > 0$$

**Covariance:**
$$\\text{Cov}(X, Y) = E[(X - \\mu_X)(Y - \\mu_Y)] = E[XY] - E[X]E[Y]$$

**Correlation Coefficient:**
$$\\rho = \\rho_{X,Y} = \\frac{\\text{Cov}(X, Y)}{\\sigma_X \\sigma_Y}, \\quad -1 \\le \\rho \\le 1$$

**Independence:**
$$\\text{Independent} \\Longleftrightarrow f(x, y) = f_X(x) \\cdot f_Y(y) \\Longleftrightarrow \\text{Cov}(X, Y) = 0 \\text{ (for normal)}$$

**Linearity of Expectation (always true, independence or not):**
$$E[aX + bY] = aE[X] + bE[Y]$$

**Variance of Sum (depends on covariance):**
$$\\text{Var}(X + Y) = \\text{Var}(X) + \\text{Var}(Y) + 2\\text{Cov}(X, Y)$$
$$\\text{If independent: } \\text{Var}(X + Y) = \\text{Var}(X) + \\text{Var}(Y)$$
