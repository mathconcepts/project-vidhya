# Teaching Tips: Regression & Correlation

## Common Student Errors

- **Confusing correlation with regression**: Correlation ($r$) is symmetric and measures association; regression (slope $b$) is directional and predicts $Y$ from $X$. Computing $r$ when asked for the regression slope (or vice versa) is a category error.
- **Forgetting that $R^2 = r^2$, not $R^2 = r$**: Students sometimes report $R^2 = 0.8$ when $r = 0.8$, which is wrong. The squared relationship is fundamental: $R^2 = r^2$.
- **Misinterpreting slope causation**: A strong regression slope does NOT imply causation. Correlation and regression describe association only. GATE occasionally tests this conceptual point via "does this regression prove that X causes Y?" type questions (answer: no, not without additional experimental design).

## GATE Question Pattern

GATE tests regression and correlation in three main ways: (1) **Computation** — given raw data or summary statistics ($\bar{x}, \bar{y}, s_x, s_y, r$), compute the regression line or $R^2$ (~1–2 marks, MCQ/NAT), (2) **Interpretation** — explain what $r = 0.9$ means, distinguish between strong/weak correlations, interpret $R^2$ as "proportion of variance explained" (~1 mark, MCQ), and (3) **Inference** — hypothesis test on the slope ($H_0: b = 0$), confidence intervals for predictions, ANOVA table for regression (~2 marks, comprehensive). GATE often pairs regression with hypothesis testing to test integrated understanding.

## Speed Tricks for MCQs

- **Use the $R^2 = r^2$ identity**: If you see a correlation coefficient, square it immediately to get the proportion of variance explained. This avoids confusion with other quantities.
- **Recognize the slope formula $b = r \times \frac{s_y}{s_x}$**: Memorize this over the "sum of products over sum of squares" version; it's faster to compute given standard deviations.
- **The regression line always passes through $(\bar{x}, \bar{y})$**: Use this to check your work. After computing the slope $b$, verify that $a = \bar{y} - b\bar{x}$ produces a sensible intercept.

## Must-Memorize Formulas / Results

**Correlation Coefficient (Sample):**
$$r = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum (x_i - \\bar{x})^2 \\sum (y_i - \\bar{y})^2}}$$

**Properties of $r$:**
$$-1 \\le r \\le 1$$
$$r = 1 \\text{ iff perfect positive relationship}$$
$$r = -1 \\text{ iff perfect negative relationship}$$
$$r = 0 \\text{ iff no linear relationship}$$

**Coefficient of Determination:**
$$R^2 = r^2 = \\frac{SS_R}{SS_T}$$
$$\\text{Interpretation: proportion of variance in } Y \\text{ explained by } X$$

**Simple Linear Regression:**
$$\\hat{y} = a + bx$$

**Regression Slope:**
$$b = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sum (x_i - \\bar{x})^2} = r \\times \\frac{s_y}{s_x}$$

**Regression Intercept:**
$$a = \\bar{y} - b\\bar{x}$$

**Sum of Squares Decomposition:**
$$SS_T = SS_R + SS_E$$

- $SS_T$ = Total sum of squares = $\\sum (y_i - \\bar{y})^2$
- $SS_R$ = Regression sum of squares = $\\sum (\\hat{y}_i - \\bar{y})^2$
- $SS_E$ = Residual sum of squares = $\\sum (y_i - \\hat{y}_i)^2$

**Mean Square Error (MSE, Residual Mean Square):**
$$MSE = \\frac{SS_E}{n - p}$$
where $n$ = number of observations, $p$ = number of parameters (including intercept)

**Test for Significance of Slope:**
$$H_0: b = 0 \\ (\\text{no linear relationship})$$
$$t = \\frac{b}{SE(b)}, \\quad df = n - 2$$
Reject $H_0$ if $|t| > t_{\\alpha/2, n-2}$

**F-Test for Regression:**
$$F = \\frac{MS_R}{MS_E} = \\frac{SS_R / 1}{SS_E / (n-2)}, \\quad df_1 = 1, df_2 = n - 2$$
Reject $H_0$ if $F > F_{\\alpha, 1, n-2}$
